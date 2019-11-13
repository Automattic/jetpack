<?php
/**
 * A class that can be used to build capability objects composed of many rules
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

use \Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class Builder {
	/**
	 * The capability object under construction
	 *
	 * @var Capability capability
	 */
	public $capability;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function create( $name ) {
		$this->capability = new Capability( $name );
		return $this;
	}

	/**
	 * Register a capability globally
	 */
	public function register() {
		$this->capability->register();
		return $this;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function get() {
		return $this->capability;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function add_rule( Rule $rule ) {
		$this->capability->add_rule( $rule );
		return $this;
	}

	/**
	 * The following functions are basically just shortcuts to the above ->add_rule method
	 */

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function require_wp_role( $wp_role ) {
		return $this->add_rule( new WPRoleRule( $wp_role ) );
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function require_wp_capability( $wp_capability ) {
		return $this->add_rule( new WPCapabilityRule( $wp_capability ) );
	}

	/**
	 * For traditional Jetpack plans (free, personal, premium, professional ) this
	 * specifies the minimum plan required in required to perform the action
	 *
	 * @param string $jetpack_plan_level The Jetpack plan level.
	 */
	public function require_minimum_jetpack_plan( $jetpack_plan_level ) {
		return $this->add_rule( new JetpackPlanRule( $jetpack_plan_level ) );
	}
}
