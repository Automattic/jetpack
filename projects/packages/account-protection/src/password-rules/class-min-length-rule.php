<?php
/**
 * Min Length Rule
 *
 * This rule checks if the password is between 6 and 150 characters.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Min Length Rule
 *
 * This rule checks if the password is between 6 and 150 characters.
 */
class Min_Length_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'min_length';

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
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
		return __( 'Between 6 and 150 characters', 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( '<strong>Error:</strong> The password must be between 6 and 150 characters.', 'jetpack-account-protection' );
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
		if ( strlen( $password ) < Config::VALIDATION_SERVICE_MIN_LENGTH ) {
			return false;
		}

		if ( strlen( $password ) > Config::VALIDATION_SERVICE_MAX_LENGTH ) {
			return false;
		}

		return true;
	}
}
