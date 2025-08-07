<?php
/**
 * External Storage utilities for Jetpack Connection.
 *
 * Provides centralized logic for external storage implementations
 * across different environments (WoA, VIP, other).
 *
 * Usage Example:
 *
 *     // 1. Create a storage provider class with required methods:
 *     class My_Storage_Provider {
 *         public function is_available() { return true; }
 *         public function should_handle( $option_name ) {
 *             return in_array( $option_name, array( 'blog_token', 'id' ), true );
 *         }
 *         public function get( $option_name ) {
 *             // Return value from your external storage or null
 *         }
 *         public function get_environment_id() { return 'my_env'; } // Optional but recommended
 *     }
 *
 *     // 2. Register the provider:
 *     External_Storage::register_provider( new My_Storage_Provider() );
 *
 *     // 3. External storage is now automatically used by Jetpack_Options::get_option()
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * External Storage utilities class.
 *
 * @since $$next-version$$
 */
class External_Storage {

	/**
	 * Registered storage provider.
	 *
	 * @since $$next-version$$
	 *
	 * @var object|null
	 */
	private static $provider = null;

	/**
	 * Register a storage provider for external storage.
	 *
	 * @since $$next-version$$
	 *
	 * @param object $provider Storage provider object with required methods.
	 * @return bool True if provider was registered successfully, false otherwise.
	 */
	public static function register_provider( $provider ) {
		if ( ! self::validate_provider( $provider ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Invalid storage provider registered: missing required methods' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
			return false;
		}
		self::$provider = $provider;
		return true;
	}

	/**
	 * Validate that a storage provider has all required methods.
	 *
	 * @since $$next-version$$
	 *
	 * @param object $provider The storage provider to validate.
	 * @return bool True if provider has all required methods, false otherwise.
	 */
	private static function validate_provider( $provider ) {
		$required_methods = array( 'is_available', 'should_handle', 'get' );
		foreach ( $required_methods as $method ) {
			if ( ! method_exists( $provider, $method ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get option value from external storage provider.
	 *
	 * Returns null if no provider is registered or if the provider can't provide the value (triggers database fallback).
	 *
	 * @since $$next-version$$
	 *
	 * @param string $option_name The option name to retrieve.
	 * @return mixed The option value from external storage, or null for database fallback.
	 */
	public static function get_option( $option_name ) {
		$provider = self::$provider;

		// Check if we have a registered provider
		if ( null === $provider ) {
			return null; // No provider registered, use database
		}

		// Get environment ID from provider
		$environment = method_exists( $provider, 'get_environment_id' ) ? $provider->get_environment_id() : 'unknown';

		// Check if provider is available in current environment
		if ( ! $provider->is_available() ) {
			self::log_event( 'unavailable', $option_name, 'External storage not available', $environment );
			return null;
		}

		// Check if provider should handle this option
		if ( ! $provider->should_handle( $option_name ) ) {
			return null;
		}

		// Try to get value from the provider
		try {
			$value = $provider->get( $option_name );

			// Check if we got a valid value (excluding null, false, empty string, and zero)
			if ( null !== $value && false !== $value && '' !== $value && 0 !== $value ) {
				return $value;
			}

			// Empty value - log it
			self::log_event( 'empty', $option_name, '', $environment );

		} catch ( \Exception $e ) {
			// Provider threw an exception
			self::log_event( 'error', $option_name, $e->getMessage(), $environment );
		}

		// Provider couldn't provide value, return null for database fallback
		return null;
	}

	/**
	 * Log external storage events to the Jetpack Connection Error_Handler.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $event_type  The event type (error, empty, unavailable).
	 * @param string $option_name The option name that triggered the event.
	 * @param string $details     Additional details about the event.
	 * @param string $environment The environment identifier (atomic, vip, etc.).
	 */
	public static function log_event( $event_type, $option_name, $details = '', $environment = 'unknown' ) {
		$should_log = false;

		if ( 'error' === $event_type ) {
			// Report external storage errors for supported environments
			$should_log = self::should_report_for_environment();
		} elseif ( 'empty' === $event_type ) {
			// Use delay mechanism to distinguish disconnection from a delay
			$should_log = self::should_report_for_environment() && self::should_report_empty_state( $option_name );
		} elseif ( 'unavailable' === $event_type ) {
			// Log locally but don't report to WordPress.com
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( sprintf( 'External storage unavailable: %s in %s%s', $option_name, $environment, $details ? ' - ' . $details : '' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
			return;
		}

		if ( ! $should_log || ! class_exists( 'Automattic\Jetpack\Connection\Error_Handler' ) ) {
			return;
		}

		// Create and report error
		$error_code    = 'external_storage_' . $event_type;
		$error_message = sprintf(
			'External storage %s for option "%s"%s',
			str_replace( '_', ' ', $event_type ),
			$option_name,
			$details ? ': ' . $details : ''
		);

		$error_data = array(
			'option_name' => $option_name,
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
	 * Determine if the current environment should report external storage errors.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool True if this environment should report external storage errors.
	 */
	private static function should_report_for_environment() {
		if ( defined( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED' ) && constant( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Determine if we should report an empty state based on delay mechanism.
	 * We need this due to delays in writing in external storage vs writing into the database.
	 * On first encounter of empty state, sets a transient. On subsequent encounters
	 * after 10 minutes, allows reporting (indicating likely disconnection, not sync delay).
	 *
	 * @since $$next-version$$
	 *
	 * @param string $option_name The option name that was empty.
	 * @return bool True if we should report this empty state, false otherwise.
	 */
	private static function should_report_empty_state( $option_name ) {
		$delay_key        = 'jetpack_external_storage_empty_delay_' . $option_name;
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
}
