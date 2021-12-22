<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;

abstract class Boost_API {

	abstract public function methods();

	abstract public function response( $request );

	abstract public function permissions();

	abstract protected function endpoint();

	public function register() {


		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			if ( '/' === substr( $this->endpoint(), 0, 1 ) ) {
				error_log( "Endpoint method shouldn't start with a slash" );
			}
		}
		// Store and retrieve critical css status.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/' . $this->endpoint(),
			array(
				'methods'             => $this->methods(),
				'callback'            => array( $this, 'response' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);
	}
}