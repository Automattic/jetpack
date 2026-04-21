<?php
/**
 * Report WordPress recovery-mode state to wpcom via a dedicated endpoint so
 * wpcom-side consumers can surface "needs recovery" / "in recovery" states
 * for the site.
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
 * The POST runs from a PHP shutdown function so the signal reaches wpcom even
 * on fatal-error requests, matching the pattern used by migrate-guru-canary.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Client as Jetpack_Connection_Client;

/**
 * Captures recovery-mode option writes and forwards a state snapshot to wpcom
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
	 * Register option-change listeners and the PHP shutdown callback.
	 *
	 * The shutdown function is registered up front (not lazily) because the
	 * option writes that trigger a capture often happen from *within* WP's
	 * own fatal-handler shutdown callback — and `register_shutdown_function`
	 * called from inside a shutdown callback isn't reliably executed.
	 * Registering during `init()` guarantees our callback is queued before
	 * WP's fatal handler runs and so fires after it.
	 */
	public static function init() {
		add_action( 'add_option_' . self::EMAIL_LAST_SENT_OPTION, array( __CLASS__, 'capture_email_last_sent' ) );
		add_action( 'update_option_' . self::EMAIL_LAST_SENT_OPTION, array( __CLASS__, 'capture_email_last_sent' ) );

		// Only `added_option` signals a new recovery session. `updated_option`
		// fires for in-session extension additions and — crucially — during
		// exit unwinding when `WP_Paused_Extensions_Storage::delete_all()` of
		// one type rewrites the session option with remaining entries of the
		// other type; treating that as a new entry would clobber entered_at.
		add_action( 'added_option', array( __CLASS__, 'capture_session_start' ), 10, 1 );
		add_action( 'deleted_option', array( __CLASS__, 'capture_session_end' ), 10, 1 );

		register_shutdown_function( array( __CLASS__, 'send' ) );
	}

	/**
	 * Listener for the recovery-mode email timestamp.
	 */
	public static function capture_email_last_sent() {
		self::snapshot();
		self::$payload['recovery_mode_email_last_sent'] = (int) get_option( self::EMAIL_LAST_SENT_OPTION, 0 );
		self::trace(
			'captured email_last_sent',
			array( 'value' => self::$payload['recovery_mode_email_last_sent'] )
		);
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
		self::trace(
			'captured session_start',
			array(
				'option'     => $option,
				'entered_at' => $now,
			)
		);
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
		self::trace(
			'captured session_end',
			array(
				'option'    => $option,
				'exited_at' => $now,
			)
		);
	}

	/**
	 * PHP-shutdown callback: POST the current state snapshot to wpcom so the
	 * signal reaches wpcom even when this request is dying from a fatal.
	 */
	public static function send() {
		self::trace( 'send() entered' );

		if ( self::$payload === null ) {
			self::trace( 'send() aborting: null payload' );
			return;
		}
		if ( ! class_exists( Jetpack_Connection_Client::class ) ) {
			self::trace( 'send() aborting: Jetpack Connection Client class missing' );
			return;
		}
		if ( ! function_exists( '_wpcom_get_current_blog_id' ) ) {
			self::trace( 'send() aborting: _wpcom_get_current_blog_id() not defined' );
			return;
		}

		try {
			$wpcom_blog_id = _wpcom_get_current_blog_id();
			if ( ! $wpcom_blog_id ) {
				self::trace( 'send() aborting: blog_id is falsy', array( 'value' => $wpcom_blog_id ) );
				return;
			}

			self::trace(
				'posting state',
				array(
					'blog_id' => $wpcom_blog_id,
					'payload' => self::$payload,
				)
			);

			$response = Jetpack_Connection_Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%s/recovery-mode-status', $wpcom_blog_id ),
				'v2',
				array( 'method' => 'POST' ),
				self::$payload,
				'wpcom'
			);

			if ( is_wp_error( $response ) ) {
				WPCOMSH_Log::unsafe_direct_log(
					'recovery-mode-sync: post returned WP_Error',
					array( 'error' => $response->get_error_message() )
				);
			} else {
				$code = (int) wp_remote_retrieve_response_code( $response );
				if ( $code < 200 || $code >= 300 ) {
					WPCOMSH_Log::unsafe_direct_log(
						'recovery-mode-sync: post returned non-2xx',
						array( 'code' => $code )
					);
				}
			}
		} catch ( \Throwable $e ) {
			WPCOMSH_Log::unsafe_direct_log(
				'recovery-mode-sync: post threw',
				array( 'exception' => $e->getMessage() )
			);
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
	 * Whether the given option name is a recovery-session paused-extensions
	 * option (session-scoped, dynamically named).
	 *
	 * @param string $option Option name.
	 * @return bool
	 */
	private static function is_paused_extensions_option( $option ) {
		return is_string( $option ) && str_ends_with( $option, self::PAUSED_EXTENSIONS_OPTION_SUFFIX );
	}

	/**
	 * Emit a trace log to error_log when opted in via filter. Default is off.
	 *
	 * Enable on a specific site with:
	 *   add_filter( 'wpcomsh_recovery_mode_sync_logging_enabled', '__return_true' );
	 *
	 * @param string $message Trace message.
	 * @param array  $extra   Optional structured context.
	 */
	private static function trace( $message, $extra = array() ) {
		/**
		 * Whether to emit recovery-mode-sync trace logs to error_log.
		 *
		 * @param bool $enabled Defaults to false.
		 */
		if ( ! apply_filters( 'wpcomsh_recovery_mode_sync_logging_enabled', false ) ) {
			return;
		}
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'wpcomsh_recovery_mode_sync: ' . $message . ' ' . wp_json_encode( $extra, JSON_UNESCAPED_SLASHES ) );
	}
}

WPCOMSH_Recovery_Mode_Sync::init();
