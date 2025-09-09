<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Executors\User;

use Automattic\Jetpack\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\Jetpack\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use WP_Error;

/**
 * User Security Executor Class
 *
 * Handles user security operations including 2FA, sessions, and security status
 */
class UserSecurityExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user security ability.
	 *
	 * @param array $input The input parameters.
	 * @return WP_Error|array The security data or error.
	 */
	public function execute( array $input = array() ) {
		try {
			$action = ValidationHelper::validate_action(
				$input['action'] ?? 'get_status',
				array( 'get_status', 'list_sessions', 'get_2fa_methods', 'list_app_passwords', 'get_login_history' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			switch ( $action ) {
				case 'get_status':
					return $this->get_security_status();
				case 'list_sessions':
					return $this->list_active_sessions( $input['limit'] ?? 10 );
				case 'get_2fa_methods':
					return $this->get_two_factor_methods();
				case 'list_app_passwords':
					return $this->list_application_passwords( $input['limit'] ?? 10 );
				case 'get_login_history':
					return $this->get_login_history( $input['days'] ?? 30, $input['limit'] ?? 10 );
				default:
					return $this->create_error( 'invalid_action', 'Invalid action specified' );
			}
		} catch ( Exception $e ) {
			return $this->create_error(
				'security_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user security ability.
	 *
	 * @param array $input The input parameters.
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

	/**
	 * Get overall security status
	 *
	 * @return WP_Error|array Security status or error.
	 */
	private function get_security_status() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$current_user    = get_user_by( 'ID', $current_user_id );

		if ( ! $current_user ) {
			return $this->create_error( 'user_not_found', 'User not found' );
		}

		// Check if TwoStepAuthenticator class is available.
		$two_factor_enabled  = false;
		$enhanced_security   = false;
		$app_passwords_count = 0;

		if ( class_exists( 'TwoStepAuthenticator' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$authenticator = \TwoStepAuthenticator::get_instance();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$two_factor_enabled = $authenticator->is_enabled_for_user( $current_user_id );
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$enhanced_security = $authenticator->is_enhanced_security_enabled( $current_user_id );

			$app_passwords       = $authenticator->get_application_passwords( $current_user_id );
			$app_passwords_count = is_array( $app_passwords ) ? count( $app_passwords ) : 0;
		}

		// Calculate account age.
		$account_age_days = 0;
		if ( $current_user->user_registered ) {
			$account_age_days = floor( ( time() - strtotime( $current_user->user_registered ) ) / DAY_IN_SECONDS );
		}

		// Calculate security score (simplified).
		$security_score = $this->calculate_security_score( $two_factor_enabled, $enhanced_security, $account_age_days );

		// Get last login info.
		$last_login = get_user_meta( $current_user_id, 'last_login', true );
		if ( ! $last_login ) {
			$last_login = $current_user->user_registered;
		}

		return array(
			'success'         => true,
			'security_status' => array(
				'two_factor_enabled'    => $two_factor_enabled,
				'enhanced_security'     => $enhanced_security,
				'application_passwords' => $app_passwords_count,
				'active_sessions'       => 1, // Simplified - at least current session.
				'last_login'            => $last_login,
				'account_age_days'      => $account_age_days,
				'security_score'        => $security_score,
			),
		);
	}

	/**
	 * Get two-factor authentication methods
	 *
	 * @return WP_Error|array 2FA methods or error.
	 */
	private function get_two_factor_methods() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id   = $this->get_current_user_id();
		$methods           = array();
		$enabled           = false;
		$backup_codes      = 0;
		$enhanced_security = false;

		if ( class_exists( 'TwoStepAuthenticator' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$authenticator = \TwoStepAuthenticator::get_instance();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$enabled = $authenticator->is_enabled_for_user( $current_user_id );
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$enhanced_security = $authenticator->is_enhanced_security_enabled( $current_user_id );

			if ( $enabled ) {
				$methods[] = array(
					'type'    => 'authenticator',
					'name'    => 'Authenticator App',
					'enabled' => true,
					'primary' => true,
				);

				// Check for SMS if available.
				if ( $authenticator->sms_enabled( $current_user_id ) ) {
					$sms_number = $authenticator->get_sms_number( $current_user_id );
					if ( $sms_number ) {
						$methods[] = array(
							'type'        => 'sms',
							'name'        => 'SMS',
							'enabled'     => true,
							'phone_last4' => substr( $sms_number, -4 ),
						);
					}
				}

				// Check for WebAuthn/Passkeys.
				if ( $authenticator->webauthn_enabled( $current_user_id ) ) {
					$webauthn_registrations = $authenticator->get_webauthn_registrations( $current_user_id );
					$methods[]              = array(
						'type'          => 'webauthn',
						'name'          => 'Passkeys/WebAuthn',
						'enabled'       => true,
						'registrations' => count( $webauthn_registrations ),
					);
				}

				// Get backup codes count (simplified).
				$backup_codes = 10; // Default assumption.
			}
		}

		return array(
			'success'    => true,
			'two_factor' => array(
				'enabled'           => $enabled,
				'methods'           => $methods,
				'backup_codes'      => $backup_codes,
				'enhanced_security' => $enhanced_security,
			),
		);
	}

	/**
	 * List active sessions (placeholder implementation)
	 *
	 * @param int $limit Number of sessions to return.
	 * @return WP_Error|array Sessions list or error.
	 */
	private function list_active_sessions( int $limit ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		// This is a placeholder implementation
		// In a real environment, this would query active sessions from the database.
		$sessions = array(
			array(
				'session_id' => 'current',
				'ip_address' => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '127.0.0.1',
				'user_agent' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : 'Unknown',
				'location'   => 'Current Location',
				'last_seen'  => gmdate( 'c' ),
				'is_current' => true,
			),
		);

		return array(
			'success'  => true,
			'sessions' => array_slice( $sessions, 0, $limit ),
			'total'    => count( $sessions ),
		);
	}

	/**
	 * List application passwords
	 *
	 * @param int $limit Number of passwords to return.
	 * @return WP_Error|array Application passwords or error.
	 */
	private function list_application_passwords( int $limit ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$app_passwords   = array();

		if ( class_exists( 'TwoStepAuthenticator' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$authenticator = \TwoStepAuthenticator::get_instance();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$passwords = $authenticator->get_application_passwords( $current_user_id );

			if ( is_array( $passwords ) ) {
				foreach ( $passwords as $app_id => $password_data ) {
					$app_passwords[] = array(
						'uuid'      => $app_id,
						'app_id'    => $app_id,
						'name'      => $password_data['name'] ?? 'Unknown App',
						'created'   => $password_data['created'] ?? '',
						'last_used' => $password_data['last_used'] ?? '',
						'last_ip'   => $password_data['last_ip'] ?? '',
					);
				}
			}
		}

		return array(
			'success'       => true,
			'app_passwords' => array_slice( $app_passwords, 0, $limit ),
			'total'         => count( $app_passwords ),
		);
	}

	/**
	 * Get login history (placeholder implementation)
	 *
	 * @param int $days  Number of days to look back.
	 * @param int $limit Number of entries to return.
	 * @return WP_Error|array Login history or error.
	 */
	private function get_login_history( int $days, int $limit ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		// This is a placeholder implementation
		// In a real environment, this would query login logs from the database.
		$history = array(
			array(
				'timestamp'  => gmdate( 'c' ),
				'ip_address' => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '127.0.0.1',
				'user_agent' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : 'Unknown',
				'location'   => 'Current Location',
				'method'     => 'password',
				'status'     => 'success',
			),
		);

		return array(
			'success'       => true,
			'login_history' => array_slice( $history, 0, $limit ),
			'total'         => count( $history ),
			'days_covered'  => $days,
		);
	}

	/**
	 * Calculate security score
	 *
	 * @param bool $two_factor_enabled Two-factor authentication enabled.
	 * @param bool $enhanced_security  Enhanced security enabled.
	 * @param int  $account_age_days   Account age in days.
	 * @return int Security score (0-100).
	 */
	private function calculate_security_score( bool $two_factor_enabled, bool $enhanced_security, int $account_age_days ): int {
		$score = 30; // Base score.

		if ( $two_factor_enabled ) {
			$score += 40;
		}

		if ( $enhanced_security ) {
			$score += 20;
		}

		// Account age bonus (up to 10 points).
		if ( $account_age_days > 365 ) {
			$score += 10;
		} elseif ( $account_age_days > 90 ) {
			$score += 5;
		}

		return min( 100, $score );
	}
}
