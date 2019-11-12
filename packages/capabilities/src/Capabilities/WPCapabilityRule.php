<?php

namespace Automattic\Jetpack\Capabilities;

class WPCapabilityRule implements Rule {
	private $wp_capability;

	function __construct( $wp_capability ) {
		$this->wp_capability = $wp_capability;
	}

	function check( ...$args ) : bool {
		$object_id = isset( $args['object_id'] ) ? $args['object_id'] : null;
		return current_user_can( $this->wp_capability, $object_id );
	}
}
