<?php
/**
 * Signal WordPress recovery-mode state to WPcom via a dedicated endpoint so the
 * WordPress.com dashboard can surface "needs recovery" / "in recovery" states
 * to site admins.
 *
 * Three timestamps are POSTed to `/sites/{blog_id}/recovery-mode-status`:
 *
 *   - `recovery_mode_email_last_sent`  — written by WP core each time a fatal
 *     triggers a recovery email (rate-limited to ~1/day).
 *   - `recovery_session_entered_at`    — wpcomsh-managed; updated on any write
 *     to `{session_id}_paused_extensions`, i.e. when the admin enters a
 *     recovery session by clicking the email link.
 *   - `recovery_session_exited_at`     — wpcomsh-managed; updated on deletion
 *     of `{session_id}_paused_extensions`, i.e. when the admin exits recovery.
 *
 * The POST runs from a PHP shutdown function so the signal reaches WPcom even
 * on fatal-error requests, matching the pattern used by migrate-guru-canary.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Client as Jetpack_Connection_Client;

/**
 * Captures recovery-mode option writes and forwards a state snapshot to WPcom
 * on PHP shutdown.
 */
class WPCOMSH_Recovery_Mode_Sync {

	private const EMAIL_LAST_SENT_OPTION          = 'recovery_mode_email_last_sent';
	private const ENTERED_AT_OPTION               = 'wpcomsh_recovery_session_entered_at';
	private const EXITED_AT_OPTION                = 'wpcomsh_recovery_session_exited_at';
	private const PAUSED_EXTENSIONS_OPTION_SUFFIX = '_paused_extensions';

	/**
	 * Pending state snapshot. Null until the first observed change this
	 * request — its non-null-ness doubles as the "send needed" flag.
	 *
	 * @var array<string,int>|null
	 */
	private static $payload = null;

	/**
	 * Whether the PHP shutdown callback has been registered this request.
	 *
	 * @var bool
	 */
	private static $shutdown_registered = false;

	/**
	 * Register option-change listeners.
	 */
	public static function init() {
		add_action( 'add_option_' . self::EMAIL_LAST_SENT_OPTION, array( __CLASS__, 'capture_email_last_sent' ) );
		add_action( 'update_option_' . self::EMAIL_LAST_SENT_OPTION, array( __CLASS__, 'capture_email_last_sent' ) );

		add_action( 'added_option', array( __CLASS__, 'capture_session_start' ), 10, 1 );
		add_action( 'updated_option', array( __CLASS__, 'capture_session_start' ), 10, 1 );
		add_action( 'deleted_option', array( __CLASS__, 'capture_session_end' ), 10, 1 );
	}

	/**
	 * Listener for the recovery-mode email timestamp.
	 */
	public static function capture_email_last_sent() {
		self::snapshot();
		self::$payload['recovery_mode_email_last_sent'] = (int) get_option( self::EMAIL_LAST_SENT_OPTION, 0 );
		self::register_shutdown();
	}

	/**
	 * Listener for option writes that may represent entering a recovery session.
	 *
	 * @param string $option Option name.
	 */
	public static function capture_session_start( $option ) {
		if ( ! self::is_paused_extensions_option( $option ) ) {
			return;
		}
		$now = time();
		update_option( self::ENTERED_AT_OPTION, $now, false );
		self::snapshot();
		self::$payload['recovery_session_entered_at'] = $now;
		self::register_shutdown();
	}

	/**
	 * Listener for option deletions that represent exiting a recovery session.
	 *
	 * @param string $option Option name.
	 */
	public static function capture_session_end( $option ) {
		if ( ! self::is_paused_extensions_option( $option ) ) {
			return;
		}
		$now = time();
		update_option( self::EXITED_AT_OPTION, $now, false );
		self::snapshot();
		self::$payload['recovery_session_exited_at'] = $now;
		self::register_shutdown();
	}

	/**
	 * PHP-shutdown callback: POST the current state snapshot to WPcom so the
	 * signal reaches the dashboard even when this request is dying from a fatal.
	 */
	public static function send() {
		if ( self::$payload === null ) {
			return;
		}
		if ( ! class_exists( Jetpack_Connection_Client::class ) ) {
			return;
		}
		if ( ! function_exists( '_wpcom_get_current_blog_id' ) ) {
			return;
		}

		try {
			$wpcom_blog_id = _wpcom_get_current_blog_id();
			if ( ! $wpcom_blog_id ) {
				return;
			}

			Jetpack_Connection_Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%s/recovery-mode-status', $wpcom_blog_id ),
				'v2',
				array( 'method' => 'POST' ),
				self::$payload,
				'wpcom'
			);
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Mid-shutdown there is nothing actionable; the next observable
			// state change will trigger another send.
		}
	}

	/**
	 * Populate the in-memory state snapshot once per request.
	 */
	private static function snapshot() {
		if ( self::$payload !== null ) {
			return;
		}
		self::$payload = array(
			'recovery_mode_email_last_sent' => (int) get_option( self::EMAIL_LAST_SENT_OPTION, 0 ),
			'recovery_session_entered_at'   => (int) get_option( self::ENTERED_AT_OPTION, 0 ),
			'recovery_session_exited_at'    => (int) get_option( self::EXITED_AT_OPTION, 0 ),
		);
	}

	/**
	 * Register the PHP-level shutdown callback once per request.
	 */
	private static function register_shutdown() {
		if ( self::$shutdown_registered ) {
			return;
		}
		self::$shutdown_registered = true;
		register_shutdown_function( array( __CLASS__, 'send' ) );
	}

	/**
	 * Whether the given option name is a recovery-session paused-extensions
	 * option (session-scoped, dynamically named).
	 *
	 * @param string $option Option name.
	 * @return bool
	 */
	private static function is_paused_extensions_option( $option ) {
		return is_string( $option ) && str_ends_with( $option, self::PAUSED_EXTENSIONS_OPTION_SUFFIX );
	}
}

WPCOMSH_Recovery_Mode_Sync::init();
