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

/**
 * Cloud CSS Request
 */
class Cloud_CSS_Request {
	public function request_generate( $providers ) {
		$client               = Boost_API::get_client();
		$payload              = array( 'providers' => $providers );
		$payload['requestId'] = md5( wp_json_encode( $payload ) . time() );

		$this->reset_existing_css();
		return $client->post( 'cloud-css', $payload );
	}

	private function reset_existing_css() {
		$storage = new Critical_CSS_Storage();
		$storage->clear();
	}
}
