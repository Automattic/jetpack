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
	 * @param string $event_type  The event type (fallback_empty, fallback_error, unavailable).
	 * @param string $option_name The option name that triggered the event.
	 * @param string $details     Additional details about the event.
	 * @param string $environment The environment identifier (atomic, vip, etc.).
	 */
	public static function log_event( $event_type, $option_name, $details = '', $environment = 'unknown' ) {
		// Only log meaningful events
		$should_log = false;

		if ( 'fallback_error' === $event_type ) {
			$should_log = true; // Always log errors
		} elseif ( 'fallback_empty' === $event_type ) {
			$should_log = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) || self::is_critical_option( $option_name );
		} elseif ( 'unavailable' === $event_type ) {
			$should_log = ( defined( 'WP_DEBUG' ) && WP_DEBUG );
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
	 * Check if an option is critical and should always be logged.
	 *
	 * Critical options are essential for Jetpack connection functionality.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $option_name The option name.
	 * @return bool True if critical, false otherwise.
	 */
	public static function is_critical_option( $option_name ) {
		/**
		 * Filter the list of critical external storage options.
		 *
		 * Critical options have their fallback events logged even when not in debug mode.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $critical_options Array of critical option names.
		 */
		$critical_options = apply_filters(
			'jetpack_external_storage_critical_options',
			array( 'blog_token', 'id' )
		);

		return in_array( $option_name, $critical_options, true );
	}
}
