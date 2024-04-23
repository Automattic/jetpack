<?php
/**
 * Scheduled Updates Health Paths class
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

use WP_Error;

/**
 * Scheduled_Updates_Health_Paths class
 *
 * This class provides static methods to get/save health paths for scheduled updates.
 */
class Scheduled_Updates_Health_Paths {

	/**
	 * The name of the WordPress option where the health check paths are stored.
	 */
	const PATHS_OPTION_NAME = 'jetpack_scheduled_update_health_check_paths';

	/**
	 * Get the health check paths for a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @return array List of health check paths.
	 */
	public static function get( $schedule_id ) {
		$option = get_option( self::PATHS_OPTION_NAME, array() );

		return $option[ $schedule_id ] ?? array();
	}

	/**
	 * Update the health check paths for a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @param array  $paths       List of paths to save.
	 * @return bool
	 */
	public static function update( $schedule_id, $paths ) {
		$option       = get_option( self::PATHS_OPTION_NAME, array() );
		$parsed_paths = array();

		foreach ( $paths as $path ) {
			$parsed = wp_parse_url( trim( $path ), PHP_URL_PATH );

			if ( is_string( $parsed ) ) {
				$parsed_paths[] = $parsed;
			}
		}

		$parsed_paths = array_values( array_unique( $parsed_paths ) );

		if ( count( $parsed_paths ) ) {
			$option[ $schedule_id ] = $parsed_paths;
		}

		return update_option( self::PATHS_OPTION_NAME, $option );
	}

	/**
	 * Clear the health check paths for a scheduled update.
	 *
	 * @param string|null $schedule_id Request ID.
	 * @return bool
	 */
	public static function clear( $schedule_id ) {
		$option = get_option( self::PATHS_OPTION_NAME, array() );

		if ( isset( $option[ $schedule_id ] ) ) {
			unset( $option[ $schedule_id ] );
		}

		if ( count( $option ) ) {
			return update_option( self::PATHS_OPTION_NAME, $option );
		} else {
			return delete_option( self::PATHS_OPTION_NAME );
		}
	}

	/**
	 * Validate a path.
	 *
	 * @param string $path An health path.
	 * @return true|WP_Error
	 */
	public static function validate( $path ) {
		if ( ! is_string( $path ) ) {
			return new WP_Error( 'rest_invalid_path', __( 'The path must be a string.', 'jetpack-scheduled-updates' ), array( 'status' => 400 ) );
		}

		$parsed = wp_parse_url( $path, PHP_URL_PATH );

		if ( false === $parsed || '' === $parsed['path'] ) {
			return new WP_Error( 'rest_invalid_path', __( 'The path must be a valid URL.', 'jetpack-scheduled-updates' ), array( 'status' => 400 ) );
		}

		return true;
	}
}
