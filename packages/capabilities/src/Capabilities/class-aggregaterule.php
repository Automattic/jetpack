<?php
/**
 * Interface that describes a rule object which, when checked, returns a permission that indicates if the rule passed or failed
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

use Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
abstract class AggregateRule implements Rule {
	/**
	 * The set of rules used to evaluate if permission is granted
	 *
	 * @var array rules
	 */
	protected $rules;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct() {
		$this->rules = [];
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function add_rule( $rule ) {
		$this->rules[] = $rule;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function register( $name ) {
		Capabilities::register( $this, $name );
	}
}
