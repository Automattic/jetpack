<?php
/**
 * Registration failure state for the Jetpack connection.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Tracking;
use WP_Error;

/**
 * Remembers why the last registration attempt failed, and decides whether another
 * attempt is worth making.
 *
 * Registration is triggered by unattended code paths (plugin update hooks, admin
 * page loads), so a site whose environment can never register - for example one
 * that WordPress.com cannot reach - would otherwise retry forever. This class
 * records the failure, blocks automatic retries of errors that cannot resolve on
 * their own, and backs off exponentially on the ones that can.
 *
 * @since $$next-version$$
 */
class Registration_Failure {

	/**
	 * Name of the option holding the failure state.
	 */
	const OPTION = 'jetpack_register_failure';

	/**
	 * Name of the transient used to rate-limit the "retry suppressed" Tracks event.
	 */
	const SUPPRESSION_TRACKED_TRANSIENT = 'jetpack_register_suppression_tracked';

	/**
	 * Longest delay between two automatic attempts.
	 */
	const MAX_BACKOFF = DAY_IN_SECONDS;

	/**
	 * Error codes that cannot be resolved by trying again.
	 *
	 * These describe the site's environment or a rejected request, so an automatic
	 * retry would fail identically. They are cleared by an explicit user action, by
	 * a successful registration, or by the site URL changing.
	 */
	const TERMINAL_ERROR_CODES = array(
		'siteurl_private_ip',
		'home_private_ip',
		'site_inaccessible_403',
		'site_requires_authorization',
		'request_cancelled',
	);

	/**
	 * Error code suffixes marking a malformed request, which is also not retryable.
	 */
	const TERMINAL_ERROR_SUFFIXES = array( '_missing', '_malformed' );

	/**
	 * Delay before each successive automatic attempt, in seconds.
	 *
	 * Attempts past the end of the list reuse the last value.
	 *
	 * @return int[]
	 */
	private static function backoff_schedule() {
		return array(
			MINUTE_IN_SECONDS,
			5 * MINUTE_IN_SECONDS,
			30 * MINUTE_IN_SECONDS,
			2 * HOUR_IN_SECONDS,
			self::MAX_BACKOFF,
		);
	}

	/**
	 * Register the hooks that discard the state when the site's address changes.
	 *
	 * @return void
	 */
	public static function init_hooks() {
		add_action( 'update_option_siteurl', array( __CLASS__, 'clear' ) );
		add_action( 'update_option_home', array( __CLASS__, 'clear' ) );
	}

	/**
	 * Get the stored failure state.
	 *
	 * @return array|null The state, or null if there is none or it no longer applies.
	 */
	public static function get() {
		$state = get_option( self::OPTION );

		if ( ! is_array( $state ) || empty( $state['error_code'] ) ) {
			return null;
		}

		// A site that moved to a different address deserves a fresh attempt: the
		// previous failure was about the previous address.
		if ( ! isset( $state['fingerprint'] ) || self::fingerprint() !== $state['fingerprint'] ) {
			self::clear();
			return null;
		}

		return $state;
	}

	/**
	 * Get the error to return instead of attempting registration again, if the
	 * previous failure still stands.
	 *
	 * The code and message are copied from the original failure so that callers
	 * handling specific error codes keep working; the `suppressed` data flag tells
	 * apart a remembered failure from a fresh one.
	 *
	 * @return WP_Error|null Null when an attempt should be made.
	 */
	public static function get_blocking_error() {
		$state = self::get();

		if ( null === $state ) {
			return null;
		}

		$next_retry_after = $state['next_retry_after'] ?? null;

		if ( null !== $next_retry_after && time() >= (int) $next_retry_after ) {
			return null;
		}

		return new WP_Error(
			$state['error_code'],
			$state['error_message'] ?? '',
			array(
				'suppressed'       => true,
				'status'           => $state['http_status'] ?? null,
				'next_retry_after' => $next_retry_after,
			)
		);
	}

	/**
	 * Record a failed registration attempt.
	 *
	 * @param WP_Error            $error    The error the attempt failed with.
	 * @param array|WP_Error|null $response The raw HTTP response, when there was one. Used to read the `Retry-After` header.
	 * @param string|null         $plugin_slug Slug of the plugin that triggered the attempt, for tracking.
	 *
	 * @return void
	 */
	public static function record( WP_Error $error, $response = null, $plugin_slug = null ) {
		$previous = self::get();
		$attempts = null === $previous ? 1 : (int) $previous['attempts'] + 1;

		$error_code  = (string) $error->get_error_code();
		$http_status = self::extract_http_status( $error, $response );
		$is_terminal = self::is_terminal( $error_code );

		$state = array(
			'error_code'       => $error_code,
			'error_message'    => (string) $error->get_error_message(),
			'http_status'      => $http_status,
			'attempts'         => $attempts,
			'last_attempt_at'  => time(),
			'next_retry_after' => $is_terminal ? null : time() + self::backoff_delay( $attempts, $response, $http_status ),
			'terminal'         => $is_terminal,
			'fingerprint'      => self::fingerprint(),
		);

		update_option( self::OPTION, $state, false );

		$is_new_terminal_failure = $is_terminal && ( null === $previous || empty( $previous['terminal'] ) );

		if ( $is_new_terminal_failure ) {
			self::track(
				'jpc_register_terminal_failure',
				array(
					'error_code'  => $error_code,
					'http_status' => $http_status,
					'attempts'    => $attempts,
				),
				$plugin_slug
			);
		}
	}

	/**
	 * Record that an attempt was blocked by the stored state.
	 *
	 * Rate-limited to once per backoff window so that a site retrying on every admin
	 * request does not trade a request storm for an event storm.
	 *
	 * @param WP_Error    $error       The error returned in place of the attempt.
	 * @param string|null $plugin_slug Slug of the plugin that triggered the attempt.
	 *
	 * @return void
	 */
	public static function record_suppressed_attempt( WP_Error $error, $plugin_slug = null ) {
		if ( get_transient( self::SUPPRESSION_TRACKED_TRANSIENT ) ) {
			return;
		}

		$data             = $error->get_error_data();
		$next_retry_after = is_array( $data ) && isset( $data['next_retry_after'] ) ? (int) $data['next_retry_after'] : 0;
		$window           = $next_retry_after > time() ? $next_retry_after - time() : self::MAX_BACKOFF;

		set_transient( self::SUPPRESSION_TRACKED_TRANSIENT, 1, min( $window, self::MAX_BACKOFF ) );

		self::track(
			'jpc_register_retry_suppressed',
			array(
				'error_code' => (string) $error->get_error_code(),
			),
			$plugin_slug
		);
	}

	/**
	 * Forget the stored failure.
	 *
	 * @return void
	 */
	public static function clear() {
		delete_option( self::OPTION );
		delete_transient( self::SUPPRESSION_TRACKED_TRANSIENT );
	}

	/**
	 * Whether an error code can ever be resolved by trying again.
	 *
	 * Unrecognized codes are treated as transient, so a new server-side error does
	 * not silently become permanent.
	 *
	 * @param string $error_code The error code.
	 *
	 * @return bool
	 */
	public static function is_terminal( $error_code ) {
		if ( in_array( $error_code, self::TERMINAL_ERROR_CODES, true ) ) {
			return true;
		}

		foreach ( self::TERMINAL_ERROR_SUFFIXES as $suffix ) {
			if ( substr( $error_code, -strlen( $suffix ) ) === $suffix ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Work out how long to wait before the next automatic attempt.
	 *
	 * @param int                 $attempts    Number of consecutive failures, including this one.
	 * @param array|WP_Error|null $response    The raw HTTP response, when there was one.
	 * @param int|null            $http_status The HTTP status code of the response.
	 *
	 * @return int Delay in seconds.
	 */
	private static function backoff_delay( $attempts, $response, $http_status ) {
		$schedule = self::backoff_schedule();
		$index    = min( max( $attempts, 1 ), count( $schedule ) ) - 1;
		$delay    = $schedule[ $index ];

		// When the server asks us to wait, that is a floor rather than a suggestion:
		// it reports the window actually in effect, which can be far longer than the
		// default one.
		if ( 429 === $http_status ) {
			$delay = max( $delay, self::retry_after_seconds( $response ) );
		}

		$delay = min( $delay, self::MAX_BACKOFF );

		// Spread out sites that failed at the same moment.
		return $delay + wp_rand( 0, (int) ceil( $delay * 0.1 ) );
	}

	/**
	 * Read the `Retry-After` response header.
	 *
	 * @param array|WP_Error|null $response The raw HTTP response.
	 *
	 * @return int Seconds to wait, or 0 if the header is absent or unusable.
	 */
	private static function retry_after_seconds( $response ) {
		if ( ! is_array( $response ) ) {
			return 0;
		}

		$retry_after = wp_remote_retrieve_header( $response, 'retry-after' );

		if ( is_array( $retry_after ) ) {
			$retry_after = reset( $retry_after );
		}

		if ( ! is_string( $retry_after ) && ! is_numeric( $retry_after ) ) {
			return 0;
		}

		$retry_after = trim( (string) $retry_after );

		if ( is_numeric( $retry_after ) ) {
			return max( 0, (int) $retry_after );
		}

		// The header may also be an HTTP date.
		$timestamp = strtotime( $retry_after );

		return $timestamp ? max( 0, $timestamp - time() ) : 0;
	}

	/**
	 * Determine the HTTP status the attempt failed with.
	 *
	 * @param WP_Error            $error    The error the attempt failed with.
	 * @param array|WP_Error|null $response The raw HTTP response, when there was one.
	 *
	 * @return int|null
	 */
	private static function extract_http_status( WP_Error $error, $response ) {
		if ( is_array( $response ) ) {
			$code = wp_remote_retrieve_response_code( $response );
			if ( $code ) {
				return (int) $code;
			}
		}

		// Most registration errors carry the status code as their error data.
		$data = $error->get_error_data();

		return is_numeric( $data ) ? (int) $data : null;
	}

	/**
	 * Fingerprint of the site addresses the stored failure refers to.
	 *
	 * @return string
	 */
	private static function fingerprint() {
		return md5( (string) get_option( 'siteurl' ) . '|' . (string) get_option( 'home' ) );
	}

	/**
	 * Send a Tracks event.
	 *
	 * @param string      $event_type  Event name, without the `jetpack_` prefix.
	 * @param array       $data        Event properties.
	 * @param string|null $plugin_slug Slug of the plugin that triggered the attempt.
	 *
	 * @return void
	 */
	private static function track( $event_type, array $data, $plugin_slug ) {
		if ( null !== $plugin_slug ) {
			$data['plugin_slug'] = $plugin_slug;
		}

		( new Tracking() )->record_user_event( $event_type, $data );
	}
}
