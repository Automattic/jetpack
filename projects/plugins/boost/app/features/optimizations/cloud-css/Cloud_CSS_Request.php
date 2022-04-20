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
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;

/**
 * Cloud CSS State
 */
class Cloud_CSS_Request {

	/**
	 * @var Critical_CSS_State
	 */
	private $state;

	public function __construct( $state ) {
		$this->state = $state;
	}

	public function request_generate() {
		$sources   = $this->state->get_provider_urls();
		$providers = $this->get_css_generate_providers( $sources );

		$client               = Boost_API::get_client();
		$payload              = array( 'providers' => $providers );
		$payload['requestId'] = md5( wp_json_encode( $payload ) );

		$this->reset_existing_css();
		return $client->post( 'cloud-css', $payload );
	}

	private function get_css_generate_providers( $providers ) {
		$formatted = array();
		foreach ( $providers as $key => $urls ) {
			$generate_urls = array();
			foreach ( $urls as $url ) {
				$generate_urls[] = add_query_arg( 'jb-generate-critical-css', 'true', $url );
			}
			$formatted[ $key ] = $generate_urls;
		}
		return $formatted;
	}

	private function reset_existing_css() {
		$storage = new Critical_CSS_Storage();
		$storage->clear();
	}
}
