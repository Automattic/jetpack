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
 * automatic attempt is worth making yet.
 *
 * Unattended callers would otherwise retry a site that can never register forever.
 *
 * @internal Use Manager::get_registration_failure() and Manager::clear_registration_failure().
 *
 * @since 9.11.0
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
	 * Error codes that describe the site's environment rather than a passing condition.
	 *
	 * Not `site_inaccessible_403` or `site_requires_authorization`: WordPress.com returns those
	 * from its XML-RPC fallback after any failed REST verify, so a passing glitch can cause them.
	 */
	const TERMINAL_ERROR_CODES = array(
		'siteurl_private_ip',
		'home_private_ip',
		// Request parameters the server validates; the `verify_*` codes are a separate, transient family.
		'siteurl_missing',
		'siteurl_malformed',
		'secret_1_missing',
		'secret_1_malformed',
		'secret_2_missing',
		'secret_2_malformed',
		'site_name_malformed',
		'timezone_string_malformed',
		'gmt_offset_malformed',
	);

	/**
	 * Error code WordPress.com returns when the site hit the hourly registration rate limit.
	 *
	 * Waits a flat hour and is never terminal: the limit resets hourly, and its counter is
	 * shared by every site registering under the same URL.
	 */
	const RATE_LIMITED_ERROR_CODE = 'request_cancelled';

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
	 * Get the stored failure state.
	 *
	 * @return array|null The state, or null if there is none or it no longer applies.
	 */
	public static function get() {
		$state = get_option( self::OPTION );

		if ( ! is_array( $state ) || empty( $state['error_code'] ) ) {
			return null;
		}

		// A failure recorded under a different site address no longer applies.
		if ( ! isset( $state['fingerprint'] ) || self::fingerprint() !== $state['fingerprint'] ) {
			return null;
		}

		return $state;
	}

	/**
	 * Get the error to return instead of attempting registration again, if the
	 * previous failure still stands.
	 *
	 * It carries the original code and message so callers handling specific codes
	 * keep working; the `suppressed` data flag tells it apart from a fresh failure.
	 *
	 * @return WP_Error|null Null when an attempt should be made.
	 */
	public static function get_suppressed_error() {
		$state = self::get();

		if ( null === $state ) {
			return null;
		}

		$next_retry_after = (int) ( $state['next_retry_after'] ?? 0 );

		if ( time() >= $next_retry_after ) {
			return null;
		}

		// A failure can arrive on a 200 response, which REST would send as a success.
		$http_status = (int) ( $state['http_status'] ?? 0 );

		return new WP_Error(
			$state['error_code'],
			$state['error_message'] ?? '',
			array(
				'suppressed'       => true,
				'status'           => $http_status >= 400 ? $http_status : 400,
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

		$error_code      = (string) $error->get_error_code();
		$error_message   = Utils::get_registration_error_description( $error_code, (string) $error->get_error_message() );
		$http_status     = self::extract_http_status( $error, $response );
		$is_terminal     = self::is_terminal( $error_code );
		$is_rate_limited = self::RATE_LIMITED_ERROR_CODE === $error_code;

		$attempts = 1;

		if ( null !== $previous ) {
			// A failure inside an open window overlapped, or was forced past, the attempt
			// that opened it, so it is not another step up the schedule. Nor is the rate limit.
			$window_open = time() < (int) ( $previous['next_retry_after'] ?? 0 );
			$attempts    = (int) $previous['attempts'] + ( $window_open || $is_rate_limited ? 0 : 1 );

			// Leaving a terminal error means the owner changed something: start the schedule over.
			if ( ! empty( $previous['terminal'] ) && ! $is_terminal && ! $is_rate_limited ) {
				$attempts = 1;
			}
		}

		// A rate-limited response usually masks a reason WordPress.com has already
		// returned; keep showing a terminal one, but still push the next attempt out.
		// A transient one is left to be replaced: by then it is stale, and "too many
		// attempts" is the accurate message for the user who caused the limit.
		if ( $is_rate_limited && null !== $previous && ! empty( $previous['terminal'] ) ) {
			$error_code    = $previous['error_code'];
			$error_message = $previous['error_message'] ?? '';
			$http_status   = $previous['http_status'] ?? null;
			$is_terminal   = true;
		}

		$state = array(
			'error_code'       => $error_code,
			'error_message'    => $error_message,
			'http_status'      => $http_status,
			'attempts'         => $attempts,
			'last_attempt_at'  => time(),
			'next_retry_after' => time() + self::backoff_delay( $attempts, $is_terminal, $response, $http_status, $error_code ),
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
		return in_array( $error_code, self::TERMINAL_ERROR_CODES, true );
	}

	/**
	 * Work out how long to wait before the next automatic attempt.
	 *
	 * @param int                 $attempts    Number of steps up the backoff schedule, including this one.
	 * @param bool                $is_terminal Whether the error describes the site's environment.
	 * @param array|WP_Error|null $response    The raw HTTP response, when there was one.
	 * @param int|null            $http_status The HTTP status code of the response.
	 * @param string              $error_code  The error code of the failure.
	 *
	 * @return int Delay in seconds.
	 */
	private static function backoff_delay( $attempts, $is_terminal, $response, $http_status, $error_code = '' ) {
		if ( $is_terminal ) {
			$delay = self::MAX_BACKOFF;
		} elseif ( self::RATE_LIMITED_ERROR_CODE === $error_code ) {
			// The response carries no Retry-After header, so assume the hourly window.
			$delay = HOUR_IN_SECONDS;
		} else {
			$schedule = self::backoff_schedule();
			$delay    = $schedule[ min( max( $attempts, 1 ), count( $schedule ) ) - 1 ];
		}

		// Retry-After is a floor: the server knows the window actually in effect.
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
	 * Not Urls::site_url(): it follows the current request's scheme and writes its scheme
	 * history on every call, so HTTP and HTTPS requests would disagree.
	 *
	 * @return string
	 */
	private static function fingerprint() {
		$without_scheme = static function ( $url ) {
			return preg_replace( '#^[a-z][a-z0-9+.\-]*://#i', '', untrailingslashit( (string) $url ) );
		};

		return md5( $without_scheme( Urls::get_raw_url( 'siteurl' ) ) . '|' . $without_scheme( Urls::get_raw_url( 'home' ) ) );
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
