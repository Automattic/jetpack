<?php
/**
 * Not Compromised Rule
 *
 * This rule checks if the password is compromised.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Not Compromised Rule
 *
 * This rule checks if the password is compromised.
 */
class Not_Compromised_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'not_compromised';

	/**
	 * Constructor for the Not_Compromised_Rule class.
	 *
	 * @param Validation_Service $validation_service The validation service instance.
	 */
	public function __construct( Validation_Service $validation_service ) {
		$this->validation_service = $validation_service;
	}

	/**
	 * Get the label of the rule.
	 *
	 * @return string The label of the rule.
	 */
	public function get_label(): string {
		return __( 'Not a leaked password', 'jetpack-account-protection' );
	}

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_description(): string {
		return __( 'If found in a public breach, this password may already be known to attackers.', 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( '<strong>Error:</strong> The password was found in a public leak.', 'jetpack-account-protection' );
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
		return ! $this->validation_service->is_compromised_password( $password );
	}
}
