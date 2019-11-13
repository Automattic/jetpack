<?php
/**
 * Interface that describes a rule object which, when checked, returns a permission that indicates if the rule passed or failed
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

interface Rule {
	// phpcs:ignore Squiz.Commenting.FunctionComment.MissingParamTag
	/**
	 * Check if permission is granted or denied by this rule
	 *
	 * @return Permission
	 */
	public function check( ...$args );
}
