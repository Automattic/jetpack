<?php
/**
 * A rule composed of other rules that must all be true
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// TODO: should this be called "AggregateRule"?
// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class AllRule extends AggregateRule {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		$permission = new AggregatePermission();
		foreach ( $this->rules as $rule ) {
			$permission->add_permission( $rule->check() );
		}
		return $permission;
	}
}
