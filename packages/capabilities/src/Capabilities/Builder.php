<?php

namespace Automattic\Jetpack\Capabilities;

use \Automattic\Jetpack\Capabilities;

class Builder {
	// public $name;
	// public $available;

	function __construct() {
		$this->capabilities = new Capabilities();
	}
	static function create() {
		return new Builder();
	}

	function require_wp_role( $wp_role ) {
		$this->capabilities->add_rule( new WPRoleRule( $wp_role ) );
		return $this;
	}

	function require_wp_capability( $wp_capability ) {
		$this->capabilities->add_rule( new WPCapabilityRule( $wp_capability ) );
		return $this;
	}

	/**
	 * For traditional Jetpack plans (free, personal, premium, professional ) this
	 * specifies the minimum plan required in required to perform the action
	 */
	function require_minimum_jetpack_plan( $jetpack_plan_level ) {
		// $this->capabilities->add_rule( new PlanRule( $wp_role ) );
		return $this;
	}
}
