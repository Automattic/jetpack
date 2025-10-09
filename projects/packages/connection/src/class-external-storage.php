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

		// Get environment ID from provider
		$environment = method_exists( $provider, 'get_environment_id' ) ? $provider->get_environment_id() : 'unknown';

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
	 * Log events if WP_DEBUG is enabled.
	 * Report external storage events through Jetpack Connection Error_Handler.
	 * Includes rate limiting to prevent log spam from noisy events.
	 *
	 * @since 6.18.0
	 *
	 * @param string $event_type  The event type (error, empty, unavailable).
	 * @param string $key         The key that triggered the event.
	 * @param string $details     Additional details about the event.
	 * @param string $environment The environment identifier (atomic, vip, etc.).
	 */
	public static function log_event( $event_type, $key, $details = '', $environment = 'unknown' ) {
		// Apply rate limiting to prevent log spam
		if ( ! self::should_log_event( $key ) ) {
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

		// Only report 'error' and 'empty' events to WordPress.com
		if ( 'error' !== $event_type && 'empty' !== $event_type ) {
			return;
		}

		$should_report_remote = false;

		if ( 'error' === $event_type ) {
			// Report external storage errors for supported environments
			$should_report_remote = self::should_report_for_environment( $key );
		} elseif ( 'empty' === $event_type ) {
			// Use delay mechanism to distinguish disconnection from a delay
			$should_report_remote = self::should_report_for_environment( $key ) && self::should_report_empty_state( $key );
		}

		if ( ! $should_report_remote || ! class_exists( 'Automattic\Jetpack\Connection\Error_Handler' ) ) {
			return;
		}

		// Create and report error
		$error_code    = 'external_storage_' . $event_type;
		$error_message = sprintf(
			'External storage %s for key "%s"%s',
			str_replace( '_', ' ', $event_type ),
			$key,
			$details ? ': ' . $details : ''
		);

		$error_data = array(
			'key'         => $key,
			'event_type'  => $event_type,
			'details'     => $details,
			'environment' => $environment,
			'timestamp'   => time(),
			'site_url'    => home_url(),
		);

		$error = new \WP_Error( $error_code, $error_message, $error_data );
		Error_Handler::get_instance()->report_error( $error, false, true );
	}

	/**
	 * Determine if the current environment should report external storage errors to WordPress.com.
	 * Allows providers to control remote error reporting per-option via optional should_report_errors_for() method.
	 *
	 * @since 6.18.0
	 *
	 * @param string $key The option key being accessed.
	 * @return bool True if this environment should report external storage errors to WordPress.com.
	 */
	private static function should_report_for_environment( $key = '' ) {
		$provider = self::$provider;

		// Check if provider implements per-option reporting (optional method not defined in interface).
		// Providers can optionally implement: public function should_report_errors_for( $option_name )
		if ( null !== $provider && method_exists( $provider, 'should_report_errors_for' ) && ! empty( $key ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethodInCallable - Optional method, checked via method_exists()
			return call_user_func( array( $provider, 'should_report_errors_for' ), $key );
		}

		// Deprecated: JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED constant
		// @deprecated 6.18.13 Use should_report_errors_for() method in your Storage Provider instead.
		if ( defined( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED' ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				trigger_error(
					'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED constant is deprecated. Implement should_report_errors_for() method in your Storage Provider instead.',
					E_USER_DEPRECATED
				);
			}
			return (bool) constant( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED' );
		}

		return false;
	}

	/**
	 * Determine if we should report an empty state based on delay mechanism.
	 * We need this due to delays in writing in external storage vs writing into the database.
	 * On first encounter of empty state, sets a transient. On subsequent encounters
	 * after 10 minutes, allows reporting (indicating likely disconnection, not sync delay).
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
			set_transient( $delay_key, time(), 15 * MINUTE_IN_SECONDS ); // Keep for 15 minutes
			return false;
		}

		// Check if 10 minutes have passed since first empty encounter
		$delay_threshold = 10 * MINUTE_IN_SECONDS;
		if ( ( time() - $first_empty_time ) >= $delay_threshold ) {
			// 10+ minutes of empty state - likely disconnection, report it
			delete_transient( $delay_key );
			return true;
		}

		return false;
	}

	/**
	 * Determine if an event should be logged based on rate limiting rules.
	 *
	 * This prevents log spam from noisy events by applying a simple one-hour
	 * rate limit per key, regardless of event type.
	 *
	 * @since 6.18.0
	 *
	 * @param string $key        The key that triggered the event.
	 * @return bool True if the event should be logged, false if rate limited.
	 */
	private static function should_log_event( $key ) {
		$rate_limit_key = 'jetpack_ext_storage_rate_limit_' . $key;

		// Check if we're still within the rate limit period
		if ( get_transient( $rate_limit_key ) ) {
			return false;
		}

		set_transient( $rate_limit_key, true, HOUR_IN_SECONDS );

		return true;
	}
}
