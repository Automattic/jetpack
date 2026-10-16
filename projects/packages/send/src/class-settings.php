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
	 * Settings merged over defaults.
	 *
	 * @return array{enabled: bool, from_name: string, from_local_part: string, fallback: bool}
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );
		return array_merge(
			array(
				'enabled'         => false,
				'from_name'       => '',
				'from_local_part' => 'wordpress',
				'fallback'        => true,
			),
			is_array( $stored ) ? $stored : array()
		);
	}

	/**
	 * Update known keys and return the result.
	 *
	 * @param array $changes Keys to change.
	 * @return array The updated settings.
	 */
	public static function update( array $changes ) {
		$settings = self::get();
		foreach ( array( 'enabled', 'fallback' ) as $key ) {
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

		update_option( self::OPTION, $settings, false );
		return $settings;
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
