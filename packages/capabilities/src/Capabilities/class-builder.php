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
	 * The aggregate object under construction
	 *
	 * @var AggregateRule aggregate_rule
	 */
	public $aggregate_rule;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function create() {
		$this->aggregate_rule = new AllRule();
		return $this;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function create_any() {
		$this->aggregate_rule = new AtLeastOneRule();
		return $this;
	}

	/**
	 * Register a capability globally
	 *
	 * @param string $name the name used to register and look up the capability.
	 */
	public function register( $name ) {
		$this->aggregate_rule->register( $name );
		return $this;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function get() {
		return $this->aggregate_rule;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function add_rule( Rule $rule ) {
		$this->aggregate_rule->add_rule( $rule );
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

	/**
	 * Adapter for legacy 'supports' API
	 *
	 * @param string $jetpack_plan_supports The slug of the feature we are checking support for.
	 */
	public function require_jetpack_plan_supports( $jetpack_plan_supports ) {
		return $this->add_rule( new JetpackPlanSupportsRule( $jetpack_plan_supports ) );
	}

	/**
	 * Requires that the output of running a certain filter is a certain value
	 *
	 * @param string $filter_name The name of the filter to apply.
	 * @param mixed  $required_value The value that is required for the rule to pass.
	 */
	public function require_filter( $filter_name, $required_value ) {
		return $this->add_rule( new WPFilterRule( $filter_name, $required_value ) );
	}

	/**
	 * Requires that Jetpack is connected
	 */
	public function require_jetpack_is_active() {
		return $this->add_rule( new JetpackActiveRule() );
	}

	public function require_any_blog_sticker( $stickers ) {
		return $this->add_rule( new BlogStickersRule( $stickers ) );
	}

	/**
	 * Allows chaining optional inner dependencies together
	 *
	 * @param function $callback A function reference to call back with the nested builder.
	 */
	public function require_any( $callback ) {
		$builder = new Builder();
		$this->add_rule( $builder->create_any()->get() );
		// the callback adds nested rules to the object created above.
		$callback( $builder );
		return $this;
	}
}
