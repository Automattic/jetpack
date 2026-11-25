<?php
/**
 * Send settings storage.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Reads and writes the `jetpack_send_settings` option.
 */
class Settings {

	/**
	 * Option name.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_send_settings';

	/**
	 * How long the log can keep emails, in days; 0 keeps them until they're deleted.
	 *
	 * @var int[]
	 */
	const RETENTION_DAYS = array( 0, 1, 7, 30, 90, 180, 365 );

	/**
	 * How long the debug log can record, in days.
	 *
	 * @var int[]
	 */
	const DEBUG_DAYS = array( 1, 7, 30 );

	/**
	 * Settings merged over defaults.
	 *
	 * @return array{enabled: bool, from_name: string, from_local_part: string, fallback: bool, reply_to: string, auto_enable: bool, log_retention_days: int, debug_log: bool, debug_log_days: int, debug_log_until: string}
	 */
	public static function get() {
		return array_merge(
			array(
				'enabled'            => false,
				'from_name'          => '',
				'from_local_part'    => 'wordpress',
				'fallback'           => true,
				'reply_to'           => '',
				'auto_enable'        => true,
				'log_retention_days' => 7,
				'debug_log'          => false,
				'debug_log_days'     => 7,
				// When the debug log turns itself off, ISO 8601 UTC; set by the server only.
				'debug_log_until'    => '',
			),
			self::stored()
		);
	}

	/**
	 * The option as stored, without defaults.
	 *
	 * @return array
	 */
	public static function stored() {
		$stored = get_option( self::OPTION, array() );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Update known keys and return the result. Only the stored keys and the changed ones are saved,
	 * never the defaults, so a default can change later and the upgrade can tell a key was never set.
	 *
	 * @param array $changes Keys to change.
	 * @return array The updated settings.
	 */
	public static function update( array $changes ) {
		$settings = self::stored();
		foreach ( array( 'enabled', 'fallback', 'auto_enable', 'debug_log' ) as $key ) {
			if ( array_key_exists( $key, $changes ) ) {
				$settings[ $key ] = (bool) $changes[ $key ];
			}
		}
		if ( array_key_exists( 'from_name', $changes ) ) {
			$settings['from_name'] = sanitize_text_field( (string) $changes['from_name'] );
		}
		if ( array_key_exists( 'from_local_part', $changes ) ) {
			$settings['from_local_part'] = strtolower( trim( (string) $changes['from_local_part'] ) );
		}
		if ( array_key_exists( 'reply_to', $changes ) ) {
			$reply_to             = trim( (string) $changes['reply_to'] );
			$settings['reply_to'] = is_email( $reply_to ) ? sanitize_email( $reply_to ) : '';
		}
		if ( array_key_exists( 'log_retention_days', $changes ) && in_array( (int) $changes['log_retention_days'], self::RETENTION_DAYS, true ) ) {
			$settings['log_retention_days'] = (int) $changes['log_retention_days'];
		}
		if ( array_key_exists( 'debug_log_days', $changes ) && in_array( (int) $changes['debug_log_days'], self::DEBUG_DAYS, true ) ) {
			$settings['debug_log_days'] = (int) $changes['debug_log_days'];
		}
		if ( array_key_exists( 'debug_log_until', $changes ) ) {
			$settings['debug_log_until'] = (string) $changes['debug_log_until'];
		}

		update_option( self::OPTION, $settings, false );
		return self::get();
	}

	/**
	 * Delete the option.
	 *
	 * @return void
	 */
	public static function delete() {
		delete_option( self::OPTION );
	}
}
