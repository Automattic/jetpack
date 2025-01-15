<?php
/**
 * Helper class to make proxy requests to wpcom.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;

/**
 * Helper class to make proxy requests to wpcom.
 */
class Proxy_Requests {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 *
	 * @param string $rest_base The rest base.
	 * @param string $base_api_path The base API path.
	 * @param string $version The API version.
	 */
	public function __construct( $rest_base, $base_api_path = 'wpcom', $version = 'v2' ) {
		$this->rest_base     = $rest_base;
		$this->base_api_path = $base_api_path;
		$this->version       = $version;
	}
}
