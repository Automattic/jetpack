<?php

namespace Automattic\Jetpack\Capabilities;

use \Automattic\Jetpack\Capabilities;

class Builder {
	public $capability;

	function create_capability( $name ) {
		$this->capability = new Capability( $name );
		return $this;
	}

	function get_capability() {
		return $this->capability;
	}

	function require_wp_role( $wp_role ) {
		$this->capability->add_rule( new WPRoleRule( $wp_role ) );
		return $this;
	}

	function require_wp_capability( $wp_capability ) {
		$this->capability->add_rule( new WPCapabilityRule( $wp_capability ) );
		return $this;
	}

	/**
	 * For traditional Jetpack plans (free, personal, premium, professional ) this
	 * specifies the minimum plan required in required to perform the action
	 */
	function require_minimum_jetpack_plan( $jetpack_plan_level ) {
		$this->capability->add_rule( new PlanRule( $wp_role ) );
		return $this;
	}

	/**
	 * Register a capability globally
	 */
	function register() {
		Capabilities::register( $capability );
	}
}
