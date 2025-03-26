<?php
/**
 * Class used to define Password Strength Meter.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;

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
	 * Wrapper method for nonce verification.
	 *
	 * @param string $nonce  Nonce value.
	 * @param string $action Nonce action.
	 *
	 * @return bool
	 */
	protected function verify_nonce( string $nonce, string $action ): bool {
		return wp_verify_nonce( $nonce, $action );
	}

	/**
	 * Wrapper method for sending a JSON error response.
	 *
	 * @param string $message The error message.
	 *
	 * @return void
	 */
	protected function send_json_error( string $message ): void {
		wp_send_json_error( array( 'message' => $message ) );
	}

	/**
	 * Wrapper method for sending a JSON success response.
	 *
	 * @param array $data The data to send.
	 *
	 * @return void
	 */
	protected function send_json_success( array $data ): void {
		wp_send_json_success( $data );
	}

	/**
	 * AJAX endpoint for password validation.
	 *
	 * @return void
	 */
	public function validate_password_ajax(): void {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( ! isset( $_POST['password'] ) ) {
			$this->send_json_error( __( 'No password provided.', 'jetpack-account-protection' ) );
			return;
		}

		if ( ! isset( $_POST['nonce'] ) || ! $this->verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'validate_password_nonce' ) ) {
			$this->send_json_error( __( 'Invalid nonce.', 'jetpack-account-protection' ) );
			return;
		}

		$user_specific = false;
		if ( isset( $_POST['user_specific'] ) ) {
			$user_specific = filter_var( sanitize_text_field( wp_unslash( $_POST['user_specific'] ) ), FILTER_VALIDATE_BOOLEAN );
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$password = wp_unslash( $_POST['password'] );
		// phpcs:enable WordPress.Security.NonceVerification
		$state = $this->validation_service->get_validation_state( $password, $user_specific );

		$this->send_json_success( array( 'state' => $state ) );
	}

	/**
	 * Enqueue the password strength meter script on the profile page.
	 *
	 * @return void
	 */
	public function enqueue_jetpack_password_strength_meter_profile_script(): void {
		global $pagenow;

		if ( ! isset( $pagenow ) || ! in_array( $pagenow, array( 'profile.php', 'user-new.php', 'user-edit.php' ), true ) ) {
			return;
		}

		$this->enqueue_script();
		$this->enqueue_styles();

		// Only profile page should run user specific checks.
		$this->localize_jetpack_data( 'profile.php' === $pagenow );
	}

	/**
	 * Enqueue the password strength meter script on the reset password page.
	 *
	 * @return void
	 */
	public function enqueue_jetpack_password_strength_meter_reset_script(): void {
		// No nonce verification necessary as the action includes a robust verification process
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_GET['action'] ) && ( 'rp' === $_GET['action'] || 'resetpass' === $_GET['action'] ) ) {
			$this->enqueue_script();
			$this->enqueue_styles();
			$this->localize_jetpack_data();
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
		$jetpack_logo = new Jetpack_Logo();

		wp_localize_script(
			'jetpack-password-strength-meter',
			'jetpackData',
			array(
				'ajaxurl'                => admin_url( 'admin-ajax.php' ),
				'nonce'                  => wp_create_nonce( 'validate_password_nonce' ),
				'userSpecific'           => $user_specific,
				'logo'                   => htmlspecialchars( $jetpack_logo->get_jp_emblem( true ), ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ),
				'validationInitialState' => $this->validation_service->get_validation_initial_state( $user_specific ),
			)
		);
	}

	/**
	 * Enqueue the password strength meter script.
	 *
	 * @return void
	 */
	public function enqueue_script(): void {
		wp_enqueue_script(
			'jetpack-password-strength-meter',
			plugin_dir_url( __FILE__ ) . 'js/jetpack-password-strength-meter.js',
			array( 'jquery' ),
			Account_Protection::PACKAGE_VERSION,
			true
		);
	}

	/**
	 * Enqueue the password strength meter styles.
	 *
	 * @return void
	 */
	public function enqueue_styles(): void {
		wp_enqueue_style(
			'strength-meter-styles',
			plugin_dir_url( __FILE__ ) . 'css/strength-meter.css',
			array(),
			Account_Protection::PACKAGE_VERSION
		);
	}
}
