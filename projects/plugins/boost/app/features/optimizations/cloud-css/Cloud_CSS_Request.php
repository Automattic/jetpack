<?php
/**
 * Cloud CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;

/**
 * Cloud CSS Request
 */
class Cloud_CSS_Request {
	public function request_generate() {
		// Provide the Cloud with URLs to generate CSS for.
		$source_providers = new Source_Providers();
		$providers        = $source_providers->get_provider_sources();
		$state            = new Cloud_CSS_State();

		// @TODO:
		// Now implement JS to read these providers instead of critical css providers
		// Or refactor critical css provider shape, because it too has `providers`
		// that should probably fix the state.

		$state->prepare_request()
				->set_pending_providers( $providers )
				->save();
		$grouped_urls = array();
		foreach ( $providers as $source ) {
			$provider                  = $source['key'];
			$grouped_urls[ $provider ] = $source['urls'];
		}

		// Reset existing CSS.
		$this->reset_existing_css();

		// Send the request to the Cloud.
		$client               = Boost_API::get_client();
		$payload              = array( 'providers' => $grouped_urls );
		$payload['requestId'] = md5( wp_json_encode( $payload ) . time() );
		return $client->post( 'cloud-css', $payload );
	}

	private function reset_existing_css() {
		$storage = new Critical_CSS_Storage();
		$storage->clear();
	}
}
