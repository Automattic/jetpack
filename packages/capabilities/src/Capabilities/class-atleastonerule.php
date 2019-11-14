<?php
/**
 * A named rule composed of other rules that represents a high-level user capability, e.g. restoring backups
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// TODO: should this be called "AggregateRule"?
// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class AtLeastOneRule extends AggregateRule {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		foreach ( $this->rules as $rule ) {
			$permission = $rule->check();
			if ( $permission->granted() ) {
				return $permission;
			}
		}
		// TODO: this should be an aggregate permission with all the permission denied reasons available.
		return new PermissionDenied( __( 'All aggregate checks failed', 'jetpack' ) );
	}
}
