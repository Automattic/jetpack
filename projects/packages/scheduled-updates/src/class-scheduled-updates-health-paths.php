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
	const OPTION_NAME = 'jetpack_scheduled_update_health_check_paths';

	/**
	 * Get the health check paths for a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @return array List of health check paths.
	 */
	public static function get( $schedule_id ) {
		$option = get_option( self::OPTION_NAME, array() );

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
		$option       = get_option( self::OPTION_NAME, array() );
		$parsed_paths = array();

		foreach ( $paths as $path ) {
			$parsed = self::validate( $path );

			if ( is_string( $parsed ) ) {
				$parsed_paths[] = $parsed;
			}
		}

		$parsed_paths = array_values( array_unique( $parsed_paths ) );

		if ( count( $parsed_paths ) ) {
			$option[ $schedule_id ] = $parsed_paths;
		}

		return update_option( self::OPTION_NAME, $option );
	}

	/**
	 * Clear the health check paths for a scheduled update.
	 *
	 * @param string|null $schedule_id Request ID.
	 * @return bool
	 */
	public static function clear( $schedule_id ) {
		$option = get_option( self::OPTION_NAME, array() );

		if ( isset( $option[ $schedule_id ] ) ) {
			unset( $option[ $schedule_id ] );
		}

		if ( count( $option ) ) {
			return update_option( self::OPTION_NAME, $option );
		} else {
			return delete_option( self::OPTION_NAME );
		}
	}

	/**
	 * Validate a path.
	 *
	 * @param string $path Path to validate.
	 * @return string|WP_Error
	 */
	public static function validate( $path ) {
		if ( ! is_string( $path ) ) {
			return new WP_Error( 'rest_invalid_path', __( 'The path must be a string.', 'jetpack-scheduled-updates' ) );
		}

		$site_url = wp_parse_url( get_site_url() );
		$path     = trim( $path );

		if (
			! str_starts_with( $path, $site_url['host'] ) &&
			! str_starts_with( $path, $site_url['scheme'] . '://' . $site_url['host'] )
		) {
			// The user sent 'test/test.php' instead of '/test/test.php' and not
			// 'http://example.com/test/test.php' or 'example.com/test/test.php'.
			$path = '/' . ltrim( $path, '/\\' );
		}

		$path   = esc_url_raw( trim( $path ) );
		$parsed = wp_parse_url( $path );

		if ( false === $parsed ) {
			return new WP_Error( 'rest_invalid_path', __( 'The path must be a valid URL.', 'jetpack-scheduled-updates' ) );
		}

		if ( array_key_exists( 'host', $parsed ) ) {
			if ( $site_url['host'] !== $parsed['host'] ) {
				return new WP_Error( 'rest_invalid_path', __( 'The URL is not from the current site.', 'jetpack-scheduled-updates' ) );
			}

			if ( array_key_exists( 'scheme', $parsed ) && $site_url['scheme'] !== $parsed['scheme'] ) {
				return new WP_Error( 'rest_invalid_path', __( 'The URL scheme must match the current site.', 'jetpack-scheduled-updates' ) );
			}
		}

		if ( ! array_key_exists( 'path', $parsed ) ) {
			$parsed['path'] = '';
		} else {
			$parsed['path'] = trim( $parsed['path'] );
		}

		$ret = '/' . ltrim( $parsed['path'], '/\\' );

		if ( array_key_exists( 'query', $parsed ) ) {
			$ret .= '?' . trim( $parsed['query'] );
		}

		return $ret;
	}

	/**
	 * Registers the health_check_paths field for the update-schedule REST API.
	 */
	public static function add_health_check_paths_field() {
		register_rest_field(
			'update-schedule',
			'health_check_paths',
			array(
				/**
				 * Populates the health_check_paths field.
				 *
				 * @param array $item Prepared response array.
				 * @return array List of health check paths.
				 */
				'get_callback'    => function ( $item ) {
					return static::get( $item['schedule_id'] );
				},

				/**
				 * Updates the health_check_paths field.
				 *
				 * @param array  $paths List of health check paths.
				 * @param object $event Event object.
				 * @return bool
				 */
				'update_callback' => function ( $paths, $event ) {
					return static::update( $event->schedule_id, $paths );
				},
				'schema'          => array(
					'description' => 'List of paths to check for site health after the update.',
					'type'        => 'array',
					'maxItems'    => 5,
					'items'       => array(
						'type'        => 'string',
						'arg_options' => array(
							'validate_callback' => array( __CLASS__, 'validate' ),
						),
					),
				),
			)
		);
	}
}
