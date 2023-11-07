<?php

namespace Automattic\Jetpack_Inspect\REST_API;

class Route {

	/**
	 * @var \Automattic\Jetpack_Inspect\REST_API\Contracts\Endpoint
	 */
	protected $endpoint;

	protected $permissions;

	public function __construct( $endpoint ) {
		$this->endpoint    = new $endpoint();
		$this->permissions = $this->endpoint->permissions();
	}

	public function register_rest_route() {
		register_rest_route(
			'jetpack-inspect',
			$this->endpoint->name(),
			array(
				'methods'             => $this->endpoint->request_methods(),
				'callback'            => array( $this->endpoint, 'response' ),
				'permission_callback' => array( $this, 'verify_permissions' ),
			)
		);
	}

	/**
	 * This method is going to run and try to verify that
	 * all the permission callbacks are successful.
	 *
	 * If any of them fail - return false immediately.
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function verify_permissions( $request ) {

		if (
			defined( 'WP_ENVIRONMENT_TYPE' )
			&& 'development' === WP_ENVIRONMENT_TYPE
			&& defined( 'JETPACK_INSPECT_DEBUG' )
			&& JETPACK_INSPECT_DEBUG
		) {
			return true;
		}

		if ( is_bool( $this->permissions ) ) {
			return $this->permissions;
		}

		foreach ( $this->permissions as $permission ) {

			if ( true !== $permission->verify( $request ) ) {
				return false;
			}
		}
		return true;
	}
}
