<?php
/**
 * The Stats settings the dashboard's settings drawer edits.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats\Settings as Stats_Package_Settings;
use Automattic\Jetpack\Status\Host;

/**
 * Exposes the Stats settings through core's `wp/v2/settings` route, and the role list the drawer offers through script data.
 */
class Stats_Settings {

	/**
	 * Settings group the options register under.
	 *
	 * @var string
	 */
	const GROUP = 'jetpack_premium_analytics';

	/**
	 * Site option holding whether the WordPress.com Reader shows post views.
	 *
	 * @var string
	 */
	const READER_VIEWS_OPTION = 'wpcom_reader_views_enabled';

	/**
	 * The `stats_options` fields the drawer edits. The option also holds internal state, which the route never exposes.
	 *
	 * @var string[]
	 */
	const FIELDS = array( 'admin_bar', 'roles', 'count_roles' );

	/**
	 * Hook the settings up, except on Simple sites, where WordPress.com owns the Stats settings.
	 *
	 * @return void
	 */
	public static function configure() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		add_action( 'rest_api_init', array( __CLASS__, 'register' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Declare the settings so core's settings route exposes them.
	 *
	 * @return void
	 */
	public static function register() {
		$role = array(
			'type' => 'string',
			'enum' => self::get_role_slugs(),
		);

		register_setting(
			self::GROUP,
			Stats_Options::OPTION_NAME,
			array(
				'type'         => 'object',
				'show_in_rest' => array(
					'schema' => array(
						'type'                 => 'object',
						'properties'           => array(
							'admin_bar'   => array( 'type' => 'boolean' ),
							'roles'       => array(
								'type'     => 'array',
								'items'    => $role,
								'minItems' => 1,
							),
							'count_roles' => array(
								'type'  => 'array',
								'items' => $role,
							),
						),
						'additionalProperties' => false,
					),
				),
				'description'  => __( 'Jetpack Stats settings.', 'jetpack-premium-analytics-pkg' ),
			)
		);
		register_setting(
			self::GROUP,
			self::READER_VIEWS_OPTION,
			array(
				'type'              => 'boolean',
				'default'           => true,
				'show_in_rest'      => true,
				'sanitize_callback' => array( __CLASS__, 'sanitize_reader_views' ),
				'description'       => __( 'Whether the WordPress.com Reader shows post views for this site.', 'jetpack-premium-analytics-pkg' ),
			)
		);
		add_filter( 'rest_pre_get_setting', array( __CLASS__, 'get_stats_options' ), 10, 2 );
		add_filter( 'rest_pre_update_setting', array( __CLASS__, 'update_stats_options' ), 10, 3 );
	}

	/**
	 * The role slugs the role fields accept: the site's roles, plus any already stored, so a removed role still reads back.
	 *
	 * @return string[]
	 */
	private static function get_role_slugs() {
		$stored = get_option( Stats_Options::OPTION_NAME, array() );
		$slugs  = array_keys( wp_roles()->roles );

		foreach ( array( 'roles', 'count_roles' ) as $field ) {
			if ( is_array( $stored ) && isset( $stored[ $field ] ) && is_array( $stored[ $field ] ) ) {
				$slugs = array_merge( $slugs, array_filter( $stored[ $field ], 'is_string' ) );
			}
		}

		return array_values( array_unique( $slugs ) );
	}

	/**
	 * Answer the settings route with the editable fields only, defaults included.
	 *
	 * @param mixed  $value The value another filter supplied, or null.
	 * @param string $name  The setting's name on the route.
	 * @return mixed The editable fields for `stats_options`, otherwise `$value`.
	 */
	public static function get_stats_options( $value, $name ) {
		if ( Stats_Options::OPTION_NAME !== $name ) {
			return $value;
		}

		return Stats_Package_Settings::get( self::FIELDS );
	}

	/**
	 * Save a write to `stats_options` from the settings route through the Stats package, which keeps the option's internal state and administrators' access.
	 *
	 * The schema has already refused unknown roles, so a refusal here, which core cannot report, is not expected.
	 *
	 * @param bool   $updated Whether another filter saved the setting.
	 * @param string $name    The setting's name on the route.
	 * @param mixed  $value   The value sent.
	 * @return bool Whether the setting was handled.
	 */
	public static function update_stats_options( $updated, $name, $value ) {
		if ( Stats_Options::OPTION_NAME !== $name ) {
			return $updated;
		}

		Stats_Package_Settings::update( is_array( $value ) ? $value : array(), self::FIELDS );

		return true;
	}

	/**
	 * Store the Reader setting as 0 or 1: a bare `false` would reach the options table as `''`, which the schema does not read back as a boolean.
	 *
	 * @param mixed $value The value being written.
	 * @return int
	 */
	public static function sanitize_reader_views( $value ) {
		return (int) rest_sanitize_boolean( $value );
	}

	/**
	 * Give the drawer the roles it lists and the screen that switches the Stats module on and off.
	 *
	 * @param array $data The script data.
	 * @return array The script data with the Stats settings context added.
	 */
	public static function add_script_data( $data ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return $data;
		}

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

		if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
			$data['premium_analytics'] = array();
		}

		$data['premium_analytics']['stats_settings'] = array(
			'roles'       => $roles,
			'modules_url' => class_exists( 'Jetpack' ) ? admin_url( 'admin.php?page=jetpack_modules' ) : null,
		);

		return $data;
	}
}
