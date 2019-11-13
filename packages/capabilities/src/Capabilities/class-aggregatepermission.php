<?php
/**
 * A permission object that aggregates the output of other permissions
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class AggregatePermission implements Permission {
	/**
	 * The set of permissions that must all be true for aggregate permission to be granted
	 *
	 * @var array permissions
	 */
	private $permissions;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct() {
		$this->permissions = [];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function add_permission( $permission ) {
		$this->permissions[] = $permission;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function granted() {
		foreach ( $this->permissions as $permission ) {
			if ( ! $permission->granted() ) {
				return false;
			}
		}
		return true;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function message() {
		// for now, just return the first message for a negative grant?
		foreach ( $this->permissions as $permission ) {
			if ( ! $permission->granted() ) {
				return $permission->message();
			}
		}
		return null;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function data() {
		// TODO: aggregate the data of the permissions.
		return null;
	}
}
