<?php
/**
 * Class used to define Password Validation.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Validation
 */
class Password_Validation {
	/**
	 * Password validation.
	 *
	 * @param string $password The password to validate.
	 * @return bool True if the password is valid, false otherwise.
	 */
	public function validate_password( string $password ): bool {
		// TODO: Uncomment out once endpoint is live
		// Check compromised and common passwords
		// $weak_password = self::check_weak_passwords( $password );

		return $password ? false : true;
	}
}
