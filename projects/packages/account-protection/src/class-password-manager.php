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
	 * Verify the nonce for password update.
	 *
	 * @param string $key The nonce key.
	 *
	 * @return bool True if the nonce is valid, false otherwise.
	 */
	private function verify_password_update_nonce( $key ) {
		if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), $key ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Verify the nonce for profile update.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return bool True if the nonce is valid, false otherwise.
	 */
	public function verify_profile_update_nonce( $user_id ) {
		return $this->verify_password_update_nonce( 'update-user_' . $user_id );
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
		if ( empty( $_POST['pass1'] ) ) {
			return;
		}

		if ( ( ! $update && ( ! isset( $_POST['_wpnonce_create-user'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_create-user'] ) ), 'create-user' ) ) )
			|| ( $update && ! $this->verify_profile_update_nonce( $user->ID ) ) ) {
			$errors->add( 'nonce_error', __( '<strong>Error:</strong> Nonce verification failed.', 'jetpack-account-protection' ) );
			return;
		}

		$password = sanitize_text_field( wp_unslash( $_POST['pass1'] ) );

		if ( $update ) {
			$old_user_data = $this->get_old_user_data( $user->ID );
			if ( $this->validation_service->is_current_password( $old_user_data, $password ) ) {
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
	 * Get the old user data.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return \WP_User|false The old user data, or false if the user does not exist.
	 */
	public function get_old_user_data( $user_id ) {
		return get_userdata( $user_id );
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

		// No nonce verification necessary - action hooks in after a robust verification process
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
			$password = sanitize_text_field( wp_unslash( $_POST['pass1'] ) );
			if ( $this->validation_service->is_current_password( $user, $password ) ) {
				$errors->add( 'password_error', __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' ) );
				return;
			}

			$error = $this->validation_service->return_first_validation_error( $user, $password, 'reset' );
			if ( ! empty( $error ) ) {
				$errors->add( 'password_error', $error );
				return;
			}
		}
	}

	/**
	 * Handle the profile update.
	 *
	 * @param int      $user_id The user ID.
	 * @param \WP_User $old_user_data The old user data.
	 * @param array    $userdata The user data.
	 *
	 * @return void
	 */
	public function on_profile_update( int $user_id, \WP_User $old_user_data, array $userdata ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( isset( $_POST['action'] ) && $_POST['action'] === 'update' ) {
			if ( $this->verify_profile_update_nonce( $user_id ) ) {
				if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
					$this->save_recent_password( $user_id, $old_user_data->user_pass );
				}
			}
		}
	}

	/**
	 * Handle the password reset.
	 *
	 * @param \WP_User $user The user.
	 * @param string   $new_password The new password.
	 *
	 * @return void
	 */
	public function on_password_reset( $user, $new_password ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
