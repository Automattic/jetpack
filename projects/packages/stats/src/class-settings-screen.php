<?php
/**
 * The settings a Stats settings screen shows and saves.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use WP_Error;

/**
 * Reads and saves the Stats settings a screen offers: the owner-facing `stats_options` keys, the Reader views option, and the roles the toggles list.
 */
class Settings_Screen {
	const READER_VIEWS_OPTION = 'wpcom_reader_views_enabled';

	/**
	 * The REST arguments a route that saves these settings accepts.
	 *
	 * @return array
	 */
	public static function get_rest_args(): array {
		return array(
			'admin_bar'               => array(
				'description' => 'Show a chart of the last 48 hours of views in the admin bar',
				'type'        => 'boolean',
			),
			'roles'                   => array(
				'description' => 'Roles that can view Stats. `administrator` is always kept.',
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
				'minItems'    => 1,
			),
			'count_roles'             => array(
				'description' => 'Roles whose logged-in page views are counted',
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			self::READER_VIEWS_OPTION => array(
				'description' => 'Show post views in the WordPress.com Reader',
				'type'        => 'boolean',
			),
		);
	}

	/**
	 * The current values, the roles the screen lists, and where Stats is switched off, if anywhere.
	 *
	 * @return array
	 */
	public static function get(): array {
		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}

		$roles = array();
		foreach ( get_editable_roles() as $slug => $role ) {
			$roles[] = array(
				'slug' => $slug,
				'name' => translate_user_role( $role['name'] ),
			);
		}

		return array(
			'settings'    => array_merge(
				Settings::get( self::get_keys() ),
				array( self::READER_VIEWS_OPTION => (bool) get_option( self::READER_VIEWS_OPTION, true ) )
			),
			'roles'       => $roles,
			// The Jetpack plugin owns the modules screen that switches Stats on and off.
			'modules_url' => class_exists( 'Jetpack' ) ? admin_url( 'admin.php?page=jetpack_modules' ) : null,
		);
	}

	/**
	 * Validate and save new values.
	 *
	 * @param array $params New values, keyed by setting.
	 * @return array|WP_Error The response of `get()` after the save, or why the values were refused.
	 */
	public static function update( array $params ) {
		$keys = self::get_keys();

		$stats_values = array_intersect_key( $params, array_flip( $keys ) );
		if ( empty( $stats_values ) && ! isset( $params[ self::READER_VIEWS_OPTION ] ) ) {
			return new WP_Error(
				Settings::ERROR_PREFIX . 'missing_setting_field',
				sprintf(
					/* translators: %s: comma-separated list of the settings that can be changed. */
					__( 'Provide at least one of: %s.', 'jetpack-stats-pkg' ),
					implode( ', ', array_merge( $keys, array( self::READER_VIEWS_OPTION ) ) )
				),
				array( 'status' => 400 )
			);
		}

		if ( ! empty( $stats_values ) ) {
			$result = Settings::update( $stats_values, $keys );
			if ( is_wp_error( $result ) ) {
				$result->add_data( array( 'status' => 400 ) );
				return $result;
			}
		}

		if ( isset( $params[ self::READER_VIEWS_OPTION ] ) ) {
			$reader_views = (int) $params[ self::READER_VIEWS_OPTION ];
			update_option( self::READER_VIEWS_OPTION, $reader_views );
			// update_option() also returns false for an unchanged value, so read the option back.
			if ( (int) get_option( self::READER_VIEWS_OPTION, 1 ) !== $reader_views ) {
				return new WP_Error(
					Settings::ERROR_PREFIX . 'save_failed',
					__( 'The Stats settings could not be saved.', 'jetpack-stats-pkg' ),
					array( 'status' => 400 )
				);
			}
		}

		return self::get();
	}

	/**
	 * The `stats_options` keys the screen offers.
	 *
	 * @return string[]
	 */
	private static function get_keys(): array {
		// Nothing reads `do_not_track`, so the screen does not offer it.
		return array_values( array_diff( Settings::KEYS, array( 'do_not_track' ) ) );
	}
}
