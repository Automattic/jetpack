<?php
/**
 * External Storage utilities for Jetpack Connection.
 *
 * Provides centralized logic for external storage implementations
 * across different environments (WoA, VIP, other).
 *
 * Usage Example:
 *
 *     // 1. Create a storage provider class implementing the interface:
 *     class My_Storage_Provider implements Storage_Provider_Interface {
 *         public function is_available() { return true; }
 *         public function should_handle( $option_name ) {
 *             return in_array( $option_name, array( 'blog_token', 'id' ), true );
 *         }
 *         public function get( $option_name ) {
 *             // Return value from your external storage or null
 *         }
 *         public function get_environment_id() { return 'my_env'; }
 *     }
 *
 *     // 2. Register the provider:
 *     if ( class_exists( 'Automattic\Jetpack\Connection\External_Storage' ) ) {
 *         \Automattic\Jetpack\Connection\External_Storage::register_provider( new My_Storage_Provider() );
 *     }
 *
 *     // 3. External storage is now automatically used by Jetpack_Options::get_option()
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

require_once __DIR__ . '/interface-storage-provider.php';

/**
 * External Storage utilities class.
 *
 * @since 6.18.0
 */
class External_Storage {

	/**
	 * Registered storage provider.
	 *
	 * @since 6.18.0
	 *
	 * @var Storage_Provider_Interface|null
	 */
	private static $provider = null;

	/**
	 * Static cache to prevent logging same event multiple times in single request.
	 *
	 * @since 7.0.0
	 *
	 * @var array
	 */
	private static $logged_events = array();

	/**
	 * Maximum delay threshold for empty state reporting (in seconds).
	 * This also determines the transient expiry for tracking first empty state.
	 * Provider custom thresholds must not exceed this value.
	 *
	 * @since 7.0.0
	 */
	private const EMPTY_STATE_TRANSIENT_EXPIRY = 15 * MINUTE_IN_SECONDS;

	/**
	 * Register a storage provider for external storage.
	 *
	 * @since 6.18.0
	 *
	 * @param Storage_Provider_Interface $provider Storage provider implementing the interface.
	 * @return bool True if provider was registered successfully, false otherwise.
	 */
	public static function register_provider( Storage_Provider_Interface $provider ) {
		self::$provider = $provider;
		return true;
	}

	/**
	 * Get value from external storage provider.
	 *
	 * Returns null if no provider is registered or if the provider can't provide the value (triggers database fallback).
	 *
	 * @since 6.18.0
	 *
	 * @param string $key The key to retrieve.
	 * @return mixed The value from external storage, or null for database fallback.
	 */
	public static function get_value( $key ) {
		$provider = self::$provider;

		// Check if we have a registered provider
		if ( null === $provider ) {
			return null; // No provider registered, use database
		}

		$environment = $provider->get_environment_id();

		// Check if provider is available in current environment
		if ( ! $provider->is_available() ) {
			self::log_event( 'unavailable', $key, 'External storage not available', $environment );
			return null;
		}

		// Check if provider should handle this option
		if ( ! $provider->should_handle( $key ) ) {
			return null;
		}

		// Try to get value from the provider
		try {
			$value = $provider->get( $key );

			// Check if we got a valid value
			if ( null !== $value && false !== $value && '' !== $value && 0 !== $value ) {
				return $value;
			}

			// Empty value - log it
			self::log_event( 'empty', $key, '', $environment );

		} catch ( \Exception $e ) {
			// Provider threw an exception
			self::log_event( 'error', $key, $e->getMessage(), $environment );
		}

		// Provider couldn't provide value, return null for database fallback
		return null;
	}

	/**
	 * Log events if WP_DEBUG is enabled and delegate to provider for error reporting.
	 * Includes rate limiting to prevent log spam from noisy events.
	 *
	 * Storage providers can optionally implement handle_error_event() method to receive
	 * notifications about storage errors and empty states for their own error reporting.
	 *
	 * @since 6.18.0
	 *
	 * @param string $event_type  The event type (error, empty, unavailable).
	 * @param string $key         The key that triggered the event.
	 * @param string $details     Additional details about the event.
	 * @param string $environment The environment identifier (atomic, vip, etc.).
	 */
	public static function log_event( $event_type, $key, $details = '', $environment = 'unknown' ) {
		// Only process 'error' and 'empty' events for provider error reporting
		if ( 'error' !== $event_type && 'empty' !== $event_type ) {
			// For non-reportable events, just do debug logging with rate limiting
			if ( self::should_log_event( $key, $event_type ) && defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					sprintf(
						'Jetpack External Storage %s: %s in %s%s',
						$event_type,
						$key,
						$environment,
						$details ? ' - ' . $details : ''
					)
				);
			}
			return;
		}

		// For 'empty' events, check delay mechanism first to avoid false positives
		// during sync between external storage and the database.
		// This is checked BEFORE rate limiting so we don't block legitimate reports.
		if ( 'empty' === $event_type && ! self::should_report_empty_state( $key ) ) {
			return;
		}

		// Apply rate limiting only for events that will trigger provider notification
		if ( ! self::should_log_event( $key, $event_type ) ) {
			return;
		}

		// Local debug logging (only when WP_DEBUG is enabled)
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				sprintf(
					'Jetpack External Storage %s: %s in %s%s',
					$event_type,
					$key,
					$environment,
					$details ? ' - ' . $details : ''
				)
			);
		}

		// Delegate to provider if it implements error handling
		if ( null !== self::$provider && method_exists( self::$provider, 'handle_error_event' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- Optional method, checked via method_exists()
			self::$provider->handle_error_event( $event_type, $key, $details, $environment );
		}
	}

	/**
	 * Determine if we should report an empty state based on delay mechanism.
	 *
	 * This prevents false positives during storage sync delays. On first encounter
	 * of empty state, sets a transient. On subsequent encounters after the delay
	 * threshold, allows reporting (indicating likely disconnection, not sync delay).
	 *
	 * Providers can customize the delay threshold by implementing get_empty_state_delay_threshold().
	 *
	 * @since 6.18.0
	 *
	 * @param string $key The key that was empty.
	 * @return bool True if we should report this empty state, false otherwise.
	 */
	private static function should_report_empty_state( $key ) {
		$delay_key        = 'jetpack_external_storage_empty_delay_' . $key;
		$first_empty_time = get_transient( $delay_key );

		if ( false === $first_empty_time ) {
			// First time encountering empty state - set delay transient and don't report yet
			set_transient( $delay_key, time(), self::EMPTY_STATE_TRANSIENT_EXPIRY );
			return false;
		}

		// Default delay threshold (5 minutes)
		$delay_threshold = 5 * MINUTE_IN_SECONDS;

		// Allow provider to customize delay threshold
		// A threshold of 0 is valid for providers where external storage is written first
		if ( null !== self::$provider && method_exists( self::$provider, 'get_empty_state_delay_threshold' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- Optional method, checked via method_exists()
			$custom_threshold = self::$provider->get_empty_state_delay_threshold();
			if ( is_int( $custom_threshold ) && $custom_threshold >= 0 && $custom_threshold <= self::EMPTY_STATE_TRANSIENT_EXPIRY ) {
				$delay_threshold = $custom_threshold;
			}
		}

		if ( ( time() - $first_empty_time ) >= $delay_threshold ) {
			// Delay threshold passed - likely disconnection, report it
			delete_transient( $delay_key );
			return true;
		}

		return false;
	}

	/**
	 * Determine if an event should be logged based on rate limiting rules.
	 *
	 * This prevents log spam from noisy events by applying a simple one-hour
	 * rate limit per key and event type combination. Also uses a static cache
	 * to prevent duplicate logs within the same request.
	 *
	 * @since 6.18.0
	 *
	 * @param string $key        The key that triggered the event.
	 * @param string $event_type The event type (error, empty, unavailable).
	 * @return bool True if the event should be logged, false if rate limited.
	 */
	private static function should_log_event( $key, $event_type = '' ) {
		// Combine event type and key for unique tracking
		$event_cache_key = $event_type . '_' . $key;

		// Check static cache first (prevents multiple logs in same request)
		if ( isset( self::$logged_events[ $event_cache_key ] ) ) {
			return false;
		}

		$rate_limit_key = 'jetpack_ext_storage_rate_limit_' . $event_cache_key;

		// Check if we're still within the rate limit period
		if ( get_transient( $rate_limit_key ) ) {
			return false;
		}

		// Mark as logged in both caches
		self::$logged_events[ $event_cache_key ] = true;
		set_transient( $rate_limit_key, true, HOUR_IN_SECONDS );

		return true;
	}
}
