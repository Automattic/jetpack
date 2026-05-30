<?php
/**
 * Report WordPress recovery-mode state to wpcom via a dedicated endpoint so
 * wpcom-side consumers can surface "needs recovery" / "in recovery" states
 * for the site.
 *
 * Three timestamps + a per-extension error list are POSTed to
 * `/sites/{blog_id}/recovery-mode-status`:
 *
 *   - `recovery_mode_email_last_sent`  — written by WP core each time a fatal
 *     triggers a recovery email (rate-limited to ~1/day).
 *   - `recovery_session_entered_at`    — wpcomsh-managed; updated on any write
 *     to `{session_id}_paused_extensions`, i.e. when the admin enters a
 *     recovery session by clicking the email link.
 *   - `recovery_session_exited_at`     — wpcomsh-managed; updated on deletion
 *     of `{session_id}_paused_extensions`, i.e. when the admin exits recovery.
 *   - `recovery_session_errors`        — a list of `{kind, slug, version,
 *     errno, message, file, line}` records, so wpcom can surface what fataled
 *     rather than just that something fataled. Sourced from the live
 *     `*_paused_extensions` option once the admin enters recovery; on the
 *     fatal request itself (before the admin clicks the email link) the list
 *     is populated from `error_get_last()` so the very first POST already
 *     carries the error info. Empty once the admin exits recovery.
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
	 * Pending state snapshot. Empty until the first capture this request —
	 * its non-emptiness doubles as the "send needed" flag.
	 *
	 * @var array<string,mixed>
	 */
	private static $payload = array();

	/**
	 * Error record captured from `error_get_last()` at email-send time so the
	 * fatal-request POST carries error info before the admin enters recovery
	 * and `*_paused_extensions` exists. Null when no fatal has been captured
	 * (or when the fatal didn't come from a known plugin/theme).
	 *
	 * @var array<string,mixed>|null
	 */
	private static $transient_fatal = null;

	/**
	 * Register option-change listeners.
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
	}

	/**
	 * Listener for the recovery-mode email timestamp.
	 */
	public static function capture_email_last_sent() {
		// We're called inside WP's fatal-handler shutdown stack, so
		// `error_get_last()` still holds the original fatal that caused WP to
		// send the email. Snapshot it now so the snapshot below picks it up.
		self::capture_current_fatal();
		self::snapshot();
		self::trace(
			'captured email_last_sent',
			array( 'value' => self::$payload['recovery_mode_email_last_sent'] )
		);
		self::send();
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
		self::trace(
			'captured session_start',
			array(
				'option'     => $option,
				'entered_at' => $now,
				'errors'     => self::$payload['recovery_session_errors'] ?? array(),
			)
		);
		self::send();
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
		self::trace(
			'captured session_end',
			array(
				'option'    => $option,
				'exited_at' => $now,
			)
		);
		self::send();
	}

	/**
	 * POST the current state snapshot to wpcom. Called synchronously from each
	 * capture listener — we deliberately do *not* defer to a PHP shutdown
	 * function because option writes that trigger a capture often happen from
	 * inside WP's own fatal-handler shutdown callback, and shutdown callbacks
	 * registered at that point (or even earlier) are not reliably invoked on
	 * the dying request.
	 */
	public static function send() {
		if ( empty( self::$payload ) ) {
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

		// The Connection Client signs requests with wp_rand() / wp_generate_password(),
		// both defined in pluggable.php. That file is loaded late in WP's bootstrap and
		// is often not yet available when we're called from inside WP's fatal-handler
		// shutdown path (the exact case this feature exists to handle). Load it here.
		if ( ! function_exists( 'wp_rand' ) && defined( 'ABSPATH' ) ) {
			$pluggable_path = ABSPATH . 'wp-includes/pluggable.php';
			if ( file_exists( $pluggable_path ) ) {
				require_once $pluggable_path;
			}
		}
		if ( ! function_exists( 'wp_rand' ) ) {
			self::trace( 'send() aborting: wp_rand() unavailable' );
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
				self::trace(
					'post returned WP_Error',
					array( 'error' => $response->get_error_message() )
				);
			} else {
				$code = (int) wp_remote_retrieve_response_code( $response );
				if ( $code < 200 || $code >= 300 ) {
					self::trace(
						'post returned non-2xx',
						array( 'code' => $code )
					);
				}
			}
		} catch ( \Throwable $e ) {
			self::trace(
				'post threw',
				array( 'exception' => $e->getMessage() )
			);
		}
	}

	/**
	 * Populate the in-memory state snapshot once per request. Errors are read
	 * from the live `*_paused_extensions` option so every capture path (email,
	 * start, end) emits a complete state — no persistence of our own needed.
	 */
	private static function snapshot() {
		if ( ! empty( self::$payload ) ) {
			return;
		}
		self::$payload = array(
			'recovery_mode_email_last_sent' => (int) get_option( self::EMAIL_LAST_SENT_OPTION, 0 ),
			'recovery_session_entered_at'   => (int) get_option( self::ENTERED_AT_OPTION, 0 ),
			'recovery_session_exited_at'    => (int) get_option( self::EXITED_AT_OPTION, 0 ),
			'recovery_session_errors'       => self::current_session_errors(),
		);
	}

	/**
	 * Read the active recovery session's `*_paused_extensions` option and
	 * normalize it into transportable error records. Returns an empty array
	 * when the session is gone (e.g. after admin exits) so wpcom sees the
	 * state cleared rather than stale errors.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private static function current_session_errors() {
		if ( function_exists( 'wp_recovery_mode' ) ) {
			$session_id = wp_recovery_mode()->get_session_id();
			if ( ! empty( $session_id ) ) {
				$errors = self::extract_errors(
					get_option( $session_id . self::PAUSED_EXTENSIONS_OPTION_SUFFIX )
				);
				if ( ! empty( $errors ) ) {
					return $errors;
				}
			}
		}
		// No active session yet (fatal request, before admin clicks the email
		// link) — fall back to the fatal we captured from `error_get_last()`.
		return null !== self::$transient_fatal ? array( self::$transient_fatal ) : array();
	}

	/**
	 * Snapshot the currently-pending PHP fatal (if any) into a transportable
	 * record. Called from `capture_email_last_sent()` so we run inside WP's
	 * fatal-handler shutdown, when `error_get_last()` still holds the fatal
	 * that triggered the recovery email. No-op when there's no fatal pending
	 * or the fatal didn't originate from a known plugin/theme path.
	 */
	private static function capture_current_fatal() {
		if ( null !== self::$transient_fatal ) {
			return;
		}
		$err = error_get_last();
		if ( ! is_array( $err ) ) {
			return;
		}
		$fatal_mask = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;
		if ( ! ( (int) ( $err['type'] ?? 0 ) & $fatal_mask ) ) {
			return;
		}
		$file     = (string) ( $err['file'] ?? '' );
		$resolved = self::resolve_extension_for_file( $file );
		if ( null === $resolved ) {
			return;
		}
		list( $kind, $slug ) = $resolved;

		if ( ! function_exists( 'get_plugins' ) && defined( 'ABSPATH' ) ) {
			$plugin_admin = ABSPATH . 'wp-admin/includes/plugin.php';
			if ( file_exists( $plugin_admin ) ) {
				require_once $plugin_admin;
			}
		}
		$plugins = function_exists( 'get_plugins' ) ? get_plugins() : array();

		self::$transient_fatal = array(
			'kind'    => $kind,
			'slug'    => $slug,
			'version' => self::resolve_extension_version( $kind, $slug, $plugins ),
			'errno'   => (int) $err['type'],
			'message' => (string) ( $err['message'] ?? '' ),
			'file'    => '' !== $file ? basename( $file ) : '',
			'line'    => (int) ( $err['line'] ?? 0 ),
		);
	}

	/**
	 * Identify the plugin or theme a fatal originated from by matching the
	 * file path against the plugin and active theme directories. Returns
	 * `[kind, slug]` matching the shape WP's own recovery storage uses — the
	 * plugin slug is the first path segment under `WP_PLUGIN_DIR` (mirroring
	 * core's `WP_Recovery_Mode::get_extension_for_error()`), and the theme
	 * slug is the stylesheet/template directory name. Returns null when the
	 * file doesn't live under a known extension (core, mu-plugins, drop-ins).
	 *
	 * @param string $file Absolute path to the file that fataled.
	 * @return array{0:string,1:string}|null
	 */
	private static function resolve_extension_for_file( $file ) {
		if ( '' === $file || ! function_exists( 'wp_normalize_path' ) ) {
			return null;
		}
		$normalized = wp_normalize_path( $file );

		if ( defined( 'WP_PLUGIN_DIR' ) ) {
			$plugin_dir = wp_normalize_path( WP_PLUGIN_DIR ) . '/';
			if ( str_starts_with( $normalized, $plugin_dir ) ) {
				$rel   = substr( $normalized, strlen( $plugin_dir ) );
				$parts = explode( '/', $rel );
				if ( '' !== $parts[0] ) {
					return array( 'plugin', $parts[0] );
				}
			}
		}

		if ( function_exists( 'get_stylesheet' ) && function_exists( 'get_stylesheet_directory' ) ) {
			$candidates = array();
			$stylesheet = (string) get_stylesheet();
			if ( '' !== $stylesheet ) {
				$candidates[ $stylesheet ] = wp_normalize_path( get_stylesheet_directory() ) . '/';
			}
			if ( function_exists( 'get_template' ) && function_exists( 'get_template_directory' ) ) {
				$template = (string) get_template();
				if ( '' !== $template && $template !== $stylesheet ) {
					$candidates[ $template ] = wp_normalize_path( get_template_directory() ) . '/';
				}
			}
			foreach ( $candidates as $slug => $dir ) {
				if ( str_starts_with( $normalized, $dir ) ) {
					return array( 'theme', $slug );
				}
			}
		}

		return null;
	}

	/**
	 * Normalize WP's `*_paused_extensions` option into a flat list of records
	 * suitable for transport. The option is shaped as
	 * `[ 'plugin' => [ slug => {type,file,line,message} ], 'theme' => [ ... ] ]`.
	 *
	 * Each output record carries the kind/slug/version + the captured error
	 * (file is reduced to its basename so server paths don't leak).
	 *
	 * @param mixed $paused_extensions Raw option value.
	 * @return array<int,array<string,mixed>>
	 */
	private static function extract_errors( $paused_extensions ) {
		if ( ! is_array( $paused_extensions ) ) {
			return array();
		}

		// `get_plugins()` lives in wp-admin/includes/plugin.php — not loaded on
		// front-end requests, but recovery emails fire there.
		if ( ! function_exists( 'get_plugins' ) && defined( 'ABSPATH' ) ) {
			$plugin_admin = ABSPATH . 'wp-admin/includes/plugin.php';
			if ( file_exists( $plugin_admin ) ) {
				require_once $plugin_admin;
			}
		}
		$plugins = function_exists( 'get_plugins' ) ? get_plugins() : array();

		$out = array();
		foreach ( array( 'plugin', 'theme' ) as $kind ) {
			if ( empty( $paused_extensions[ $kind ] ) || ! is_array( $paused_extensions[ $kind ] ) ) {
				continue;
			}
			foreach ( $paused_extensions[ $kind ] as $slug => $error ) {
				if ( ! is_string( $slug ) || '' === $slug || ! is_array( $error ) ) {
					continue;
				}
				$out[] = array(
					'kind'    => $kind,
					'slug'    => $slug,
					'version' => self::resolve_extension_version( $kind, $slug, $plugins ),
					'errno'   => isset( $error['type'] ) ? (int) $error['type'] : 0,
					'message' => isset( $error['message'] ) ? (string) $error['message'] : '',
					'file'    => isset( $error['file'] ) ? basename( (string) $error['file'] ) : '',
					'line'    => isset( $error['line'] ) ? (int) $error['line'] : 0,
				);
			}
		}
		return $out;
	}

	/**
	 * Resolve the installed version string for a paused extension.
	 *
	 * For plugins, WP keys the paused entry by the plugin's main-file path (or
	 * its dirname); we match against `get_plugins()` output. For themes,
	 * `wp_get_theme()` looks up by stylesheet directory name.
	 *
	 * @param string $kind    `plugin` or `theme`.
	 * @param string $slug    Extension slug as recorded by WP recovery mode.
	 * @param array  $plugins Cached `get_plugins()` output (plugins only).
	 * @return string Version string, or empty when not resolvable.
	 */
	private static function resolve_extension_version( $kind, $slug, $plugins ) {
		if ( 'plugin' === $kind ) {
			foreach ( $plugins as $file => $data ) {
				if ( $slug === $file || $slug === dirname( $file ) ) {
					return isset( $data['Version'] ) ? (string) $data['Version'] : '';
				}
			}
			return '';
		}
		if ( 'theme' === $kind && function_exists( 'wp_get_theme' ) ) {
			$theme = wp_get_theme( $slug );
			if ( $theme && $theme->exists() ) {
				return (string) $theme->get( 'Version' );
			}
		}
		return '';
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
		static $request_id = null;
		if ( $request_id === null ) {
			$request_id = substr( md5( uniqid( '', true ) ), 0, 8 );
		}
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'wpcomsh_recovery_mode_sync[' . $request_id . ']: ' . $message . ' ' . wp_json_encode( $extra, JSON_UNESCAPED_SLASHES ) );
	}
}

WPCOMSH_Recovery_Mode_Sync::init();
