<?php
/**
 * External Storage utilities for Jetpack Connection.
 *
 * Provides centralized logging for external storage implementations
 * across different environments (Atomic, VIP, custom).
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
	 * Check if empty state should be reported for this option.
	 *
	 * Only certain connection options (like blog_token, id) trigger empty state
	 * reporting with the 10-minute delay mechanism. Other options are ignored.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $option_name The option name.
	 * @return bool True if empty state should be reported for this option.
	 */
	public static function should_report_empty_for_option( $option_name ) {
		/**
		 * Filter the list of options that trigger empty state reporting.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $reportable_options Array of option names that should trigger empty state reporting.
		 */
		$reportable_options = apply_filters(
			'jetpack_external_storage_reportable_empty_options',
			array( 'blog_token', 'id' )
		);

		return in_array( $option_name, $reportable_options, true );
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
		// Only report empty state for monitored options
		if ( ! self::should_report_empty_for_option( $option_name ) ) {
			return false;
		}

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
