<?php

namespace Automattic\Jetpack\Capabilities;

class WPCapabilityRule {
	private $wp_capability;

	function __construct( $wp_capability ) {
		$this->wp_capability = $wp_capability;
	}

	function check( $object_id = null ) {
		return current_user_can( $this->wp_capability, $object_id );
	}
}
