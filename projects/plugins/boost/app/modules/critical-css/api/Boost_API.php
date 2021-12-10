<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;

abstract class Boost_API {

	abstract public function methods();

	abstract public function response();

	abstract public function perrmisions();

	public static function register() {

		$instance   = new static();
		$class_name = ( new \ReflectionClass( $instance ) )->getShortName();

		// Store and retrieve critical css status.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/' . strtolower( $class_name ),
			array(
				'methods'             => $instance->methods(),
				'callback'            => array( $instance, 'response' ),
				'permission_callback' => array( $instance, 'perrmisions' ),
			)
		);
	}
}