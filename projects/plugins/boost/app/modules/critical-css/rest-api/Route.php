<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

class Route {

	/**
	 * @var \Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Contracts\Endpoint
	 */
	protected $endpoint;

	protected $permissions;

	protected $enabled = false;



	public function __construct( $endpoint ) {
		$this->endpoint    = new $endpoint();
		$this->permissions = $this->endpoint->permissions();

		// @TODO: Move this out of the constructor.
		// Actions shouldn't be registered on the constructor.
		// This will be probably auto-fixed when Boost_API is moved out of Critical_CSS Realm
		add_action( 'rest_api_init', array( $this, 'register_rest_route' ) );
	}

	public function register_rest_route() {
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/' . $this->endpoint->name(),
			array(
				'methods'             => $this->endpoint->request_methods(),
				'callback'            => array( $this, 'response' ),
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
		foreach ( $this->permissions as $permission ) {
			if ( true !== $permission->verify( $request ) ) {
				return false;
			}
		}
		return true;
	}

	public function response( $request ) {
		if ( $this->enabled === true ) {
			return $this->endpoint->response( $request );
		}

		return $this->response_endpoint_disabled();

	}

	public function response_endpoint_disabled() {
		return rest_ensure_response(
			new \WP_HTTP_Response(
				array(
					'status' => 'module-unavailable',
				),
				200
			) );
	}

	public function enable() {
		$this->enabled = true;
	}


}