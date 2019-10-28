<?php

namespace Automattic\Jetpack\Capabilities;

class WPRoleRule {
	private $wp_role;

	function __construct( $wp_role ) {
		$this->wp_role = $wp_role;
	}

	function check() {
		$user = wp_get_current_user();
		return in_array( $this->wp_role, $user->roles );
	}
}
