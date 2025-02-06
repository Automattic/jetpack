<?php
/**
 * Class used to define Password Strength Meter.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Strength_Meter
 */
class Password_Strength_Meter {
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
	 * AJAX endpoint for password validation.
	 *
	 * @return void
	 */
	public function validate_password_ajax(): void {
		if ( ! isset( $_POST['password'] ) ) {
			wp_send_json_error( array( 'message' => __( 'No password provided.', 'jetpack-account-protection' ) ) );
		}

		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'validate_password_nonce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'jetpack-account-protection' ) ) );
		}

		$user_specific = false;
		if ( isset( $_POST['user_specific'] ) ) {
			$user_specific = filter_var( sanitize_text_field( wp_unslash( $_POST['user_specific'] ) ), FILTER_VALIDATE_BOOLEAN );
		}

		$password = sanitize_text_field( wp_unslash( $_POST['password'] ) );
		$state    = $this->validation_service->get_validation_state( $password, $user_specific );

		wp_send_json_success( array( 'state' => $state ) );
	}

	/**
	 * Enqueue the password strength meter script on the profile page.
	 *
	 * @return void
	 */
	public function enqueue_jetpack_password_strength_meter_profile_script(): void {
		if ( ! wp_script_is( 'jetpack-password-strength-meter', 'enqueued' ) ) {
			wp_enqueue_script(
				'jetpack-password-strength-meter',
				plugin_dir_url( __FILE__ ) . 'js/jetpack-password-strength-meter.js',
				array( 'jquery' ),
				Account_Protection::PACKAGE_VERSION,
				true
			);

			$this->localize_jetpack_data( true );
		}
	}

	/**
	 * Enqueue the password strength meter script on the reset password page.
	 *
	 * @return void
	 */
	public function enqueue_jetpack_password_strength_meter_reset_script(): void {
		// No nonce verification necessary as the action includes a robust verification process
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_GET['action'] ) && ( $_GET['action'] === 'rp' || $_GET['action'] === 'resetpass' ) ) {
			if ( ! wp_script_is( 'jetpack-password-strength-meter', 'enqueued' ) ) {
				wp_enqueue_script(
					'jetpack-password-strength-meter',
					plugin_dir_url( __FILE__ ) . 'js/jetpack-password-strength-meter.js',
					array( 'jquery' ),
					Account_Protection::PACKAGE_VERSION,
					true
				);

				$this->localize_jetpack_data();
			}
		}
	}

	/**
	 * Localize the Jetpack data for the password strength meter.
	 *
	 * @param bool $user_specific Whether or not to run user specific checks.
	 *
	 * @return void
	 */
	public function localize_jetpack_data( bool $user_specific = false ): void {
		wp_localize_script(
			'jetpack-password-strength-meter',
			'jetpackData',
			array(
				'ajaxurl'                => admin_url( 'admin-ajax.php' ),
				'nonce'                  => wp_create_nonce( 'validate_password_nonce' ),
				'userSpecific'           => $user_specific,
				'logo'                   => plugin_dir_url( __FILE__ ) . 'assets/jetpack-logo.svg',
				'checkIcon'              => plugin_dir_url( __FILE__ ) . 'assets/check.svg',
				'crossIcon'              => plugin_dir_url( __FILE__ ) . 'assets/cross.svg',
				'loadingIcon'            => plugin_dir_url( __FILE__ ) . 'assets/loading.svg',
				'validationInitialState' => $this->validation_service->get_validation_initial_state( $user_specific ),
			)
		);
	}
}
