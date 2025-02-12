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
		if ( isset( $_POST['pw_weak'] ) && 'on' === $_POST['pw_weak'] ) { // phpcs:disable 
			return;
		}

		$password = sanitize_text_field( wp_unslash( $user->user_pass ) );

		if ( $update ) {
			if ( $this->validation_service->is_current_password( $user->ID, $password ) ) {
				$errors->add( 'password_error', __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' ) );
				return;
			}
		}

		$context = $update ? 'update' : 'create-user';
		$error   = $this->validation_service->return_first_validation_error( $user, $password, $context );

		if ( ! empty( $error ) ) {
			$errors->add( 'password_error', $error );
			return;
		}
	}

	/**
	 * Validate the password reset.
	 *
	 * No nonce verification necessary - action hooks in after a robust verification process
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

		// phpcs:disable WordPress.Security.NonceVerification
		if ( empty( $_POST['pass1'] ) ) {
			return;
		}

		// If bypass is enabled, do not validate the password
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_POST['pw_weak'] ) && 'on' === $_POST['pw_weak'] ) {
			return;
		}

		$password = sanitize_text_field( wp_unslash( $_POST['pass1'] ) );
		if ( $this->validation_service->is_current_password( $user->ID, $password ) ) {
			$errors->add( 'password_error', __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' ) );
			return;
		}

		$error = $this->validation_service->return_first_validation_error( $user, $password, 'reset' );
		if ( ! empty( $error ) ) {
			$errors->add( 'password_error', $error );
			return;
		}
	}

	/**
	 * Handle the profile update.
	 *
	 * @param int      $user_id       User ID.
	 * @param \WP_User $old_user_data Object containing user’s data prior to update.
	 * @param array    $userdata      The raw array of data passed to wp_insert_user().
	 *
	 * @return void
	 */
	public function on_profile_update( int $user_id, \WP_User $old_user_data, array $userdata ): void {
		if ( $userdata['user_pass'] !== $old_user_data->user_pass ) {
			$this->save_recent_password( $user_id, $old_user_data->user_pass );
		}
	}

	/**
	 * Handle the password reset.
	 *
	 * @param \WP_User $user The user.
	 *
	 * @return void
	 */
	public function on_password_reset( $user ): void {
		$this->save_recent_password( $user->ID, $user->user_pass );
	}

	/**
	 * Save the new password hash to the user's recent passwords list.
	 *
	 * @param int    $user_id  The user ID.
	 * @param string $password_hash The password hash to store.
	 *
	 * @return void
	 */
	public function save_recent_password( int $user_id, string $password_hash ): void {
		$recent_passwords = get_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, true );

		if ( ! is_array( $recent_passwords ) ) {
			$recent_passwords = array();
		}

		if ( in_array( $password_hash, $recent_passwords, true ) ) {
			return;
		}

		// Add the new hashed password and keep only the last 10
		array_unshift( $recent_passwords, $password_hash );
		$recent_passwords = array_slice( $recent_passwords, 0, 10 );

		update_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, $recent_passwords );
	}
}
