<?php
/**
 * A mockable version of the Email_verification class.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Mocked static function call for email verification tests.
 */
class Email_Verification {

	/**
	 * Value that will be returned by mocked method.
	 *
	 * @var bool|null
	 */
	public static $mock_is_unverified = null;

	/**
	 * Faux checking if the email is unverified.
	 *
	 * @return bool
	 */
	public static function is_email_unverified() {
		if ( self::$mock_is_unverified === null ) {
			die( 'Email_Verification::is_email_unverified was not mocked before call' );
		}
		return self::$mock_is_unverified;
	}

	/**
	 * Reset the mock state.
	 */
	public static function mock_reset() {
		self::$mock_is_unverified = null;
	}

	/**
	 * Set the value that will be returned by is_email_unverified.
	 *
	 * @param bool $is_unverified Value to return.
	 */
	public static function mock_is_unverified( $is_unverified ) {
		self::$mock_is_unverified = $is_unverified;
	}
}
