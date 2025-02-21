<?php
/**
 * Not Empty Rule
 *
 * This rule checks if the password is not empty.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Not Empty Rule
 *
 * This rule checks if the password is not empty.
 */
class Not_Empty_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'empty';

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_label(): string {
		return __( 'Not empty or blank', 'jetpack-account-protection' );
	}

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_description(): string {
		return __( 'The password cannot be a space or all spaces', 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( '<strong>Error:</strong> The password cannot be a space or all spaces', 'jetpack-account-protection' );
	}

	/**
	 * Validate the password.
	 *
	 * @param string $password The password to validate.
	 * @param array  $userdata (Optional) The user data.
	 *
	 * @return bool True if the password is valid, false otherwise.
	 */
	public function callback( string $password, ?array $userdata = null ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return ! empty( $password );
	}
}
