<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;

abstract class Boost_API {

	abstract public function methods();

	abstract public function response( $request );

	abstract public function perrmisions();

	abstract protected function endpoint();

	public function register() {

		// Store and retrieve critical css status.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/' . $this->endpoint(),
			array(
				'methods'             => $this->methods(),
				'callback'            => array( $this, 'response' ),
				'permission_callback' => array( $this, 'perrmisions' ),
			)
		);
	}
}