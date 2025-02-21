<?php
/**
 * No Backslash Rule
 *
 * This rule checks if the password contains a backslash (\\) character.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * No Backslash Rule
 *
 * This rule checks if the password contains a backslash (\\) character.
 */
class No_Backslash_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'no_backslash';

	/**
	 * Get the label of the rule.
	 *
	 * @return string The label of the rule.
	 */
	public function get_label(): string {
		return '';
	}

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_description(): string {
		return __( "Doesn't contain a backslash (\\) character", 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( "Doesn't contain a backslash (\\) character", 'jetpack-account-protection' );
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
		return ! strpos( $password, '\\' );
	}
}
