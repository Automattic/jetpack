<?php
/**
 * Boost REST API Endpoint.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

interface BoostEndpoint {
	/**
	 * Route endpoint name.
	 *
	 * @return string
	 */
	public function name();

	/**
	 * Request methods.
	 *
	 * @return mixed
	 */
	public function request_methods();

	/**
	 * Response.
	 *
	 * @param \WP_REST_Request $request Request object.
	 */
	public function response( $request );

	/**
	 * Permission callback.
	 */
	public function permission_callback();
}
