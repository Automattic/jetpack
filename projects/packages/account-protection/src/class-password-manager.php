<?php
/**
 * Class used to define Password Manager.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Manager
 */
class Password_Manager {
	/**
	 * Validaton service instance
	 *
	 * @var Validation_Service
	 */
	private $validation_service;

	/**
	 * Validation_Service constructor.
	 *
	 * @param ?Validation_Service $validation_service Password manager instance.
	 */
	public function __construct( ?Validation_Service $validation_service = null ) {
		$this->validation_service = $validation_service ?? new Validation_Service();
	}

	/**
	 * Validate the profile update.
	 *
	 * @param \WP_Error $errors The error object.
	 * @param bool      $update Whether the user is being updated.
	 * @param \stdClass $user A copy of the new user object.
	 *
	 * @return void
	 */
	public function validate_profile_update( \WP_Error $errors, bool $update, \stdClass $user ): void {
		if ( empty( $user->user_pass ) ) {
			return;
		}

		// If bypass is enabled, do not validate the password
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_POST['pw_weak'] ) && 'on' === $_POST['pw_weak'] ) {
			return;
		}

		$core_validation_errors    = $errors->get_error_messages( 'pass' );
		$jetpack_validation_errors = $this->validation_service->get_validation_errors( $user->user_pass, true, $user );
		$validation_errors         = array_diff( $jetpack_validation_errors, $core_validation_errors );

		foreach ( $validation_errors as $validation_error ) {
			$errors->add( 'pass', $validation_error, array( 'form-field' => 'pass1' ) );
		}
	}

	/**
	 * Validate the password reset.
	 *
	 * @param \WP_Error          $errors The error object.
	 * @param \WP_User|\WP_Error $user The user object.
	 *
	 * @return void
	 */
	public function validate_password_reset( \WP_Error $errors, $user ): void {
		if ( is_wp_error( $user ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification
		if ( empty( $_POST['pass1'] ) ) {
			return;
		}

		// If bypass is enabled, do not validate the password
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_POST['pw_weak'] ) && 'on' === $_POST['pw_weak'] ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$password = wp_unslash( $_POST['pass1'] );

		$core_validation_errors    = $errors->get_error_messages( 'pass' );
		$jetpack_validation_errors = $this->validation_service->get_validation_errors( $password );
		$validation_errors         = array_diff( $jetpack_validation_errors, $core_validation_errors );

		foreach ( $validation_errors as $validation_error ) {
			$errors->add( 'pass', $validation_error, array( 'form-field' => 'pass1' ) );
		}
	}

	/**
	 * Handle the profile update.
	 *
	 * @param int      $user_id The user ID.
	 * @param \WP_User $old_user_data Object containing user data prior to update.
	 *
	 * @return void
	 */
	public function on_profile_update( int $user_id, \WP_User $old_user_data ): void {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_POST['action'] ) && $_POST['action'] === 'update' ) {
			$this->save_recent_password_hash( $user_id, $old_user_data->user_pass );
		}
	}

	/**
	 * Handle the password reset.
	 *
	 * @param \WP_User $user The user.
	 *
	 * @return void
	 */
	public function on_password_reset( \WP_User $user ): void {
		$this->save_recent_password_hash( $user->ID, $user->user_pass );
	}

	/**
	 * Save the new password hash to the user's recent passwords list.
	 *
	 * @param int    $user_id  The user ID.
	 * @param string $password_hash The password hash to store.
	 *
	 * @return void
	 */
	public function save_recent_password_hash( int $user_id, string $password_hash ): void {
		$recent_passwords = get_user_meta( $user_id, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, true );

		if ( ! is_array( $recent_passwords ) ) {
			$recent_passwords = array();
		}

		if ( in_array( $password_hash, $recent_passwords, true ) ) {
			return;
		}

		// Add the new hashed password and keep only the last 10
		array_unshift( $recent_passwords, $password_hash );
		$recent_passwords = array_slice( $recent_passwords, 0, Config::PASSWORD_MANAGER_RECENT_PASSWORDS_LIMIT );

		update_user_meta( $user_id, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, $recent_passwords );
	}
}
