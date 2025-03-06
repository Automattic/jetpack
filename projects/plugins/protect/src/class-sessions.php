<?php
/**
 * Class file for managing the user sessions.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Sessions
 */
class Sessions {

	/**
	 * Hooks into WordPress authentication events to monitor session activity.
	 */
	public static function init() {
		$monitored_actions = array(
			'auth_cookie_expired',
			'auth_cookie_bad_username',
			'auth_cookie_bad_hash',
			'auth_cookie_bad_session_token',
			'auth_cookie_valid',
			'set_logged_in_cookie',
		);

		foreach ( $monitored_actions as $action ) {
			add_action( $action, array( __CLASS__, 'monitor_' . $action ) );
		}
	}

	/**
	 * Hooks into authentication failures and marks affected sessions as suspicious.
	 */
	public static function monitor_auth_cookie_expired( $cookie_elements ) {
		self::flag_suspicious_session( $cookie_elements, 'auth_cookie_expired' );
	}

	public static function monitor_auth_cookie_bad_username( $cookie_elements ) {
		self::flag_suspicious_session( $cookie_elements, 'auth_cookie_bad_username' );
	}

	public static function monitor_auth_cookie_bad_hash( $cookie_elements ) {
		self::flag_suspicious_session( $cookie_elements, 'auth_cookie_bad_hash' );
	}

	public static function monitor_auth_cookie_bad_session_token( $cookie_elements ) {
		self::flag_suspicious_session( $cookie_elements, 'auth_cookie_bad_session_token' );
	}

	public static function monitor_auth_cookie_valid( $cookie_elements ) {
		self::flag_suspicious_session( $cookie_elements, 'auth_cookie_valid' );
	}

	public static function monitor_set_logged_in_cookie( $cookie ) {
		self::flag_suspicious_session( array( 'token' => $cookie ), 'set_logged_in_cookie' );
	}

	/**
	 * Flags a session as suspicious based on authentication events.
	 *
	 * @param array  $cookie_elements The authentication cookie data.
	 * @param string $action The action being monitored.
	 */
	protected static function flag_suspicious_session( $cookie_elements, $action ) {
		$username = $cookie_elements['username'] ?? '';
		$token    = $cookie_elements['token'] ?? '';

		if ( empty( $username ) || empty( $token ) ) {
			return;
		}

		$user = get_user_by( 'login', $username );
		if ( ! $user ) {
			return;
		}

		$hashed_token = self::hash_token( $token );
		$sessions     = get_user_meta( $user->ID, 'session_tokens', true ) ?: array();

		if ( isset( $sessions[ $hashed_token ] ) ) {
			$sessions[ $hashed_token ]['last_action']   = $action;
			$sessions[ $hashed_token ]['is_suspicious'] = self::is_suspicious_activity( $sessions[ $hashed_token ] );
			update_user_meta( $user->ID, 'session_tokens', $sessions );
		}
	}

	/**
	 * Hashes a session token for security.
	 *
	 * @param string $token The session token.
	 * @return string Hashed token.
	 */
	public static function hash_token( $token ) {
		return function_exists( 'hash' ) ? hash( 'sha256', $token ) : sha1( $token );
	}

	/**
	 * Retrieves all active user sessions and flags suspicious ones.
	 *
	 * @param int|null $user_id Retrieve sessions for a specific user, or all users if null.
	 * @return array List of session data with `is_suspicious` flag.
	 */
	public static function get_all( $user_id = null ) {
		global $wpdb;

		$query = "SELECT * FROM {$wpdb->usermeta} WHERE meta_key = 'session_tokens'";
		if ( $user_id !== null ) {
			$query .= $wpdb->prepare( ' AND user_id = %d', $user_id );
		}
		$query .= ' ORDER BY user_id DESC';

		$records  = $wpdb->get_results( $query, ARRAY_A );
		$sessions = array();

		foreach ( $records as &$record ) {
			if ( ! is_array( $record['meta_value'] ) && is_string( $record['meta_value'] ) ) {
				$record['meta_value'] = maybe_unserialize( $record['meta_value'] );
			}

			$user = get_userdata( $record['user_id'] );

			foreach ( $record['meta_value'] as $session_token => $session_data ) {
				$session_data['user_id']       = $record['user_id'];
				$session_data['user_login']    = $user->user_login ?? '';
				$session_data['user_roles']    = $user->roles ?? array();
				$session_data['token']         = $session_token;
				$session_data['is_suspicious'] = self::is_suspicious_activity( $session_data );

				$sessions[] = $session_data;
			}
		}

		return $sessions;
	}

	/**
	 * Retrieves a specific session by username and token.
	 *
	 * @param string $username The user's login name.
	 * @param string $token The session token.
	 * @return array|null The session data or null if not found.
	 */
	public static function get_by_username_and_token( $username, $token ) {
		$user = get_user_by( 'login', $username );
		if ( ! $user ) {
			return null;
		}

		$hashed_token = self::hash_token( $token );
		$sessions     = get_user_meta( $user->ID, 'session_tokens', true ) ?: array();

		return isset( $sessions[ $hashed_token ] ) ? $sessions[ $hashed_token ] : null;
	}

	/**
	 * Determines if a session is suspicious based on security checks.
	 *
	 * @param array $session_data The session data.
	 * @return bool True if the session is suspicious.
	 */
	public static function is_suspicious_activity( $session_data ) {
		$current_ip = $_SERVER['REMOTE_ADDR'] ?? '';
		$current_ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

		if ( empty( $session_data['user_login'] ) || empty( $session_data['token'] ) ) {
			return false;
		}

		$user_login = $session_data['user_login'];
		$token      = $session_data['token'];

		$auth_failure_actions = array( 'auth_cookie_bad_username', 'auth_cookie_bad_hash', 'auth_cookie_bad_session_token' );
		if ( isset( $session_data['last_action'] ) && in_array( $session_data['last_action'], $auth_failure_actions ) ) {
			return true;
		}

		$stored_session = self::get_by_username_and_token( $user_login, $token );

		if ( ! $stored_session ) {
			return false;
		}

		return ( $stored_session['ip'] !== $current_ip || $stored_session['ua'] !== $current_ua );
	}

	/**
	 * Terminates multiple user sessions.
	 *
	 * @param array $session_data An array of user session tokens.
	 * @return bool True if all sessions were cleared, false if not found.
	 */
	public static function terminate_sessions( $session_data ) {
		if ( empty( $session_data ) || ! is_array( $session_data ) ) {
			return false;
		}

		$failure_count = 0;

		foreach ( $session_data as $session ) {
			if ( ! isset( $session['userId'] ) || ! isset( $session['tokens'] ) || ! is_array( $session['tokens'] ) ) {
				++$failure_count;
				continue;
			}

			$user_id      = (int) $session['userId'];
			$all_sessions = get_user_meta( $user_id, 'session_tokens', true );
			$modified     = false;

			foreach ( $session['tokens'] as $token ) {

				if ( isset( $all_sessions[ $token ] ) ) {
					unset( $all_sessions[ $token ] );
					$modified = true;
				}
			}

			if ( $modified ) {
				if ( empty( $all_sessions ) ) {
					delete_user_meta( $user_id, 'session_tokens' );
				} else {
					update_user_meta( $user_id, 'session_tokens', $all_sessions );
				}
			}

			// Clear auth cookies if the current user's active session was deleted
			if ( get_current_user_id() === $user_id && ! isset( $all_sessions[ self::hash_token( wp_get_session_token() ) ] ) ) {
				wp_clear_auth_cookie();
			}
		}

		return $failure_count === 0;
	}
}
