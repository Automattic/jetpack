<?php
/**
 * Critical CSS Generator Status.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;

/**
 * Class Generator_Status.
 */
class Generator_Status implements Boost_Endpoint {

	/**
	 * Status request methods.
	 *
	 * @return string
	 */
	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	/**
	 * Generator status response.
	 *
	 * @param  \WP_REST_Request $request Request object.
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	// phpcs:ignore
	public function response( $request ) {
		$generator = new Generator();
		return rest_ensure_response( $generator->get_critical_css_status() );
	}

	/**
	 * Request permission callback.
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Generator API name.
	 *
	 * @return string
	 */
	public function name() {
		return 'status';
	}
}
