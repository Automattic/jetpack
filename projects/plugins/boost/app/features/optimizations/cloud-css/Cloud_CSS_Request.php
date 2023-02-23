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
		$providers    = new Source_Providers();
		$sources      = $providers->get_sources();
		$grouped_urls = array();
		foreach ( $sources as $provider => $source ) {
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
