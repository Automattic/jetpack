<?php
/**
 * Server-side onboarding state.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Reads and writes the `jetpack_send_onboarding` option, and turns sending on when the checks pass.
 */
class Onboarding {

	/**
	 * Option name.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_send_onboarding';

	/**
	 * The steps, in order.
	 *
	 * @var string[]
	 */
	const STEPS = array( 'sender', 'connect', 'finish' );

	/**
	 * Keys a client may change through POST /settings `onboarding`; the rest are server-only.
	 * `closed` and `verified_seen` are booleans the server turns into timestamps.
	 *
	 * @var string[]
	 */
	const CLIENT_KEYS = array( 'step', 'dns_provider', 'closed', 'verified_seen' );

	/**
	 * Most tests a site may send per window.
	 *
	 * @var int
	 */
	const TEST_LIMIT = 5;

	/**
	 * Length of the test rate-limit window, in seconds.
	 *
	 * @var int
	 */
	const TEST_WINDOW = HOUR_IN_SECONDS;

	/**
	 * Test send times, kept apart from onboarding so a reset doesn't refill the allowance.
	 *
	 * @var string
	 */
	const TEST_TIMES_OPTION = 'jetpack_send_test_times';

	/**
	 * Short lock around claiming a test, so parallel requests can't both get the last one.
	 *
	 * @var string
	 */
	const TEST_LOCK_OPTION = 'jetpack_send_test_lock';

	/**
	 * Keys only the server sets.
	 *
	 * @var string[]
	 */
	const SERVER_KEYS = array( 'test_to', 'test_sent_at', 'auto_test_log_id' );

	/**
	 * The state merged over defaults.
	 *
	 * @return array{closed_at: string|null, step: string|null, dns_provider: string|null, test_to: string|null, test_sent_at: string|null, auto_test_log_id: string|null, verified_seen_at: string|null}
	 */
	public static function state() {
		$stored = self::stored();
		$state  = self::defaults();
		foreach ( array_keys( $state ) as $key ) {
			if ( isset( $stored[ $key ] ) && is_scalar( $stored[ $key ] ) && '' !== (string) $stored[ $key ] ) {
				$state[ $key ] = (string) $stored[ $key ];
			}
		}
		return $state;
	}

	/**
	 * Every state key with its empty value.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'closed_at'        => null,
			'step'             => null,
			'dns_provider'     => null,
			'test_to'          => null,
			'test_sent_at'     => null,
			'auto_test_log_id' => null,
			'verified_seen_at' => null,
		);
	}

	/**
	 * Why client changes can't be saved, or null when they can. Unknown keys are ignored.
	 *
	 * @param mixed $changes The `onboarding` value from POST /settings.
	 * @return WP_Error|null
	 */
	public static function validate_client( $changes ) {
		$invalid = new WP_Error( 'jetpack_send_invalid_onboarding', __( 'That setup step could not be saved.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		if ( ! is_array( $changes ) ) {
			return $invalid;
		}
		if ( array_key_exists( 'step', $changes ) && ! in_array( $changes['step'], self::STEPS, true ) ) {
			return $invalid;
		}
		if ( array_key_exists( 'dns_provider', $changes ) && null !== $changes['dns_provider'] && ( ! is_string( $changes['dns_provider'] ) || ! Dns_Providers::is_known( $changes['dns_provider'] ) ) ) {
			return $invalid;
		}
		foreach ( array( 'closed', 'verified_seen' ) as $key ) {
			if ( array_key_exists( $key, $changes ) && ! rest_is_boolean( $changes[ $key ] ) ) {
				return $invalid;
			}
		}
		return null;
	}

	/**
	 * Apply client changes (CLIENT_KEYS only) and return the new state. Invalid values are skipped;
	 * call validate_client() first to reject them.
	 *
	 * @param array $changes `{step?, dns_provider?, closed?, verified_seen?}`.
	 * @return array The updated state.
	 */
	public static function update_from_client( array $changes ) {
		$stored = self::stored();
		if ( array_key_exists( 'step', $changes ) && in_array( $changes['step'], self::STEPS, true ) ) {
			$stored['step'] = $changes['step'];
		}
		if ( array_key_exists( 'dns_provider', $changes ) ) {
			$provider = $changes['dns_provider'];
			if ( null === $provider || '' === $provider ) {
				$stored['dns_provider'] = null;
			} elseif ( is_string( $provider ) && Dns_Providers::is_known( $provider ) ) {
				$stored['dns_provider'] = $provider;
			}
		}
		foreach ( array(
			'closed'        => 'closed_at',
			'verified_seen' => 'verified_seen_at',
		) as $flag => $key ) {
			if ( array_key_exists( $flag, $changes ) ) {
				$stored[ $key ] = rest_sanitize_boolean( $changes[ $flag ] ) ? self::now() : null;
			}
		}

		self::save( $stored );
		return self::state();
	}

	/**
	 * Set server-only keys (`test_to`, `test_sent_at`, `auto_test_log_id`) and return the new state.
	 *
	 * @param array $changes State keys to set; null clears one.
	 * @return array The updated state.
	 */
	public static function record( array $changes ) {
		$stored = self::stored();
		foreach ( self::SERVER_KEYS as $key ) {
			if ( array_key_exists( $key, $changes ) ) {
				$stored[ $key ] = null === $changes[ $key ] ? null : (string) $changes[ $key ];
			}
		}

		self::save( $stored );
		return self::state();
	}

	/**
	 * Start over for a newly set-up domain: forget what belonged to the old one, so setup shows again.
	 *
	 * @param string $test_to Email of the user who ran setup, for the automatic test.
	 * @return array The updated state.
	 */
	public static function restart( $test_to ) {
		$stored = self::stored();
		foreach ( array( 'closed_at', 'step', 'dns_provider', 'test_sent_at', 'auto_test_log_id', 'verified_seen_at', 'enabled_once' ) as $key ) {
			unset( $stored[ $key ] );
		}
		$stored['test_to'] = '' === (string) $test_to ? null : (string) $test_to;

		self::save( $stored );
		return self::state();
	}

	/**
	 * Turn sending on if the checks pass and `auto_enable` is on. Safe to call repeatedly.
	 *
	 * Only the first time for each setup, so sending a site owner paused stays paused.
	 *
	 * @return bool True when this call turned sending on.
	 */
	public static function maybe_auto_enable() {
		$settings = Settings::get();
		if ( ! empty( $settings['enabled'] ) || empty( $settings['auto_enable'] ) || ! empty( self::stored()['enabled_once'] ) ) {
			return false;
		}
		if ( array() !== REST_Controller::enable_blockers( Account::get() ) ) {
			return false;
		}

		Settings::update( array( 'enabled' => true ) );
		self::note_enabled();
		return true;
	}

	/**
	 * Remember that sending has been on for this setup, so it isn't switched on by itself again.
	 *
	 * @return void
	 */
	public static function note_enabled() {
		$stored                 = self::stored();
		$stored['enabled_once'] = true;
		self::save( $stored );
	}

	/**
	 * Whether the site has used up its test emails for the current window.
	 *
	 * @return bool
	 */
	public static function test_rate_limited() {
		return count( self::recent_tests() ) >= self::TEST_LIMIT;
	}

	/**
	 * Count one test email against the rate limit.
	 *
	 * @return void
	 */
	public static function count_test() {
		$times   = self::recent_tests();
		$times[] = time();
		update_option( self::TEST_TIMES_OPTION, $times, false );
	}

	/**
	 * Check the rate limit and count one test in one step.
	 *
	 * @return bool False when the limit is reached, or another request is claiming one right now.
	 */
	public static function claim_test() {
		if ( ! add_option( self::TEST_LOCK_OPTION, time(), '', false ) ) {
			// A lock older than a minute was left by a request that died; take it over.
			if ( time() - (int) get_option( self::TEST_LOCK_OPTION ) < MINUTE_IN_SECONDS ) {
				return false;
			}
			update_option( self::TEST_LOCK_OPTION, time(), false );
		}
		try {
			if ( self::test_rate_limited() ) {
				return false;
			}
			self::count_test();
			return true;
		} finally {
			delete_option( self::TEST_LOCK_OPTION );
		}
	}

	/**
	 * Seconds until the oldest test in the window expires, for a Retry-After hint.
	 *
	 * @return int
	 */
	public static function test_retry_after() {
		$times = self::recent_tests();
		return $times ? max( 1, min( $times ) + self::TEST_WINDOW - time() ) : 0;
	}

	/**
	 * Times of the tests sent inside the window.
	 *
	 * @return int[]
	 */
	private static function recent_tests() {
		$since = time() - self::TEST_WINDOW;
		$times = array_map( 'intval', (array) get_option( self::TEST_TIMES_OPTION, array() ) );
		return array_values( array_filter( $times, fn( $time ) => $time > $since ) );
	}

	/**
	 * The raw option, including server bookkeeping not exposed by state().
	 *
	 * @return array
	 */
	private static function stored() {
		$stored = get_option( self::OPTION, array() );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Store the raw option, not autoloaded.
	 *
	 * @param array $stored Option value.
	 * @return void
	 */
	private static function save( array $stored ) {
		update_option( self::OPTION, $stored, false );
	}

	/**
	 * The current time as ISO 8601 UTC.
	 *
	 * @return string
	 */
	private static function now() {
		return gmdate( 'Y-m-d\\TH:i:s\\Z' );
	}

	/**
	 * Delete the onboarding state (reset and uninstall). The test history stays.
	 *
	 * @return void
	 */
	public static function delete() {
		delete_option( self::OPTION );
	}

	/**
	 * Delete the test history and its lock (uninstall).
	 *
	 * @return void
	 */
	public static function delete_test_history() {
		delete_option( self::TEST_TIMES_OPTION );
		delete_option( self::TEST_LOCK_OPTION );
	}
}
