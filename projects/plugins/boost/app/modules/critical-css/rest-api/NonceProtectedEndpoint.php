<?php
/**
 * Nonce protected endpoint base class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

/**
 * Class NonceProtectedEndpoint.
 *
 * @return string
 */
class NonceProtectedEndpoint {

	/**
	 * Endpoint instance.
	 *
	 * @var BoostEndpoint Boost Endpoint instance.
	 */
	protected $endpoint;

	/**
	 * Constructor.
	 *
	 * @param BoostEndpoint $endpoint Endpoint instance.
	 */
	public function __construct( $endpoint ) {
		$this->endpoint = $endpoint;
	}

	/**
	 * Permission callback.
	 *
	 * @param  \WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function permission_callback( $request ) {
		$nonce_key    = $this->endpoint->name();
		$nonce_status = wp_verify_nonce( $request['nonce'], $nonce_key );

		if ( false === $nonce_status ) {
			return false;
		}

		return $this->endpoint->permission_callback( $request );
	}
}
