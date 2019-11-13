<?php
/**
 * A named rule composed of other rules that represents a high-level user capability, e.g. restoring backups
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

use Automattic\Jetpack\Capabilities;

// TODO: should this be called "AggregateRule"?
// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class Capability implements Rule {
	/**
	 * The name of the capability, e.g. jetpack.backups.restore
	 *
	 * @var string name
	 */
	public $name;

	/**
	 * The set of rules used to evaluate if permission is granted
	 *
	 * @var array rules
	 */
	private $rules;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $name ) {
		$this->name  = $name;
		$this->rules = [];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function add_rule( $rule ) {
		$this->rules[] = $rule;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		$permission = new AggregatePermission();
		foreach ( $this->rules as $rule ) {
			$permission->add_permission( $rule->check() );
		}
		return $permission;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function register() {
		Capabilities::register( $this );
	}
}
