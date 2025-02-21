<?php
/**
 * Not Recent Rule
 *
 * This rule checks if the password was used recently.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Not Recent Rule
 *
 * This rule checks if the password was used recently.
 */
class Not_Recent_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'not_recent';

	/**
	 * Get the label of the rule.
	 *
	 * @return string The label of the rule.
	 */
	public function get_label(): string {
		return __( 'Not used recently', 'jetpack-account-protection' );
	}

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_description(): string {
		return __( 'Reusing old passwords may increase security risks. A fresh password improves protection.', 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' );
	}

	/**
	 * Validate the password.
	 *
	 * @param string $password The password to validate.
	 * @param array  $userdata (Optional) The user data.
	 *
	 * @return bool True if the password is valid, false otherwise.
	 */
	public function callback( string $password, ?array $userdata = null ): bool {
		return ! $this->validation_service->is_recent_password( $password, $userdata );
	}
}
