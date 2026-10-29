<?php
/**
 * The Stats settings the dashboard's Settings tab edits.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats\Settings as Stats_Package_Settings;

/**
 * Exposes the Stats settings through core's `wp/v2/settings` route, and the role list the Settings tab offers through script data.
 */
final class Stats_Settings {

	/**
	 * Filter for the settings the site offers, so a host can leave out the ones its Stats does not honor.
	 *
	 * @var string
	 */
	public const FIELDS_FILTER = 'jetpack_premium_analytics_stats_settings_fields';

	/**
	 * Settings group the options register under.
	 *
	 * @var string
	 */
	private const GROUP = 'jetpack_premium_analytics';

	/**
	 * Site option holding whether the WordPress.com Reader shows post views.
	 *
	 * @var string
	 */
	private const READER_VIEWS_OPTION = 'wpcom_reader_views_enabled';

	/**
	 * The `stats_options` fields the Settings tab edits. The option also holds internal state, which the route never exposes.
	 *
	 * @var string[]
	 */
	private const FIELDS = array( 'admin_bar', 'roles', 'count_roles' );

	/**
	 * Cookie banner plugins that support the WP Consent API, by plugin directory: the WordPress.org ones the WP Consent API readme lists.
	 *
	 * @var string[]
	 */
	private const BANNER_PLUGINS = array(
		'arqam360-consent-privacy-pdplgdpr'       => 'Arqam360 Cookie Consent Banner',
		'beautiful-and-responsive-cookie-consent' => 'Beautiful Cookie Consent Banner',
		'clickio-consent'                         => 'Clickio Consent',
		'complianz-gdpr'                          => 'Complianz',
		'complianz-gdpr-premium'                  => 'Complianz',
		'consent-manager'                         => 'consentmanager',
		'cookie-law-info'                         => 'CookieYes',
		'cookiebot'                               => 'Cookiebot',
		'cookiefirst-gdpr-cookie-consent-banner'  => 'CookieFirst',
		'cookiehub'                               => 'CookieHub',
		'cookietractor'                           => 'CookieTractor',
		'gdpr-cookie-compliance'                  => 'GDPR Cookie Compliance',
		'ibamu'                                   => 'Lawwwing',
		'iubenda-cookie-law-solution'             => 'iubenda',
		'pressidium-cookie-consent'               => 'Pressidium Cookie Consent',
		'sirdata-cmp'                             => 'Abconsent Sirdata CMP',
		'trustarc-cookie-consent-manager'         => 'TrustArc Cookie Consent Manager',
	);

	/**
	 * The banner plugins the card suggests, by WordPress.org slug.
	 *
	 * @var string[]
	 */
	private const RECOMMENDED_BANNERS = array( 'complianz-gdpr', 'cookiebot', 'cookie-law-info' );

	/**
	 * The Stats package's refusal of the current write, held until the route answers.
	 *
	 * @var \WP_Error|null
	 */
	private static $update_error = null;

	/**
	 * Hook the settings up. The host that serves the site's REST API calls this before `rest_api_init`.
	 *
	 * @return void
	 */
	public static function configure() {
		add_action( 'rest_api_init', array( __CLASS__, 'register' ) );
		// Counting users per role costs a query, so only the dashboard pays for it.
		if ( Analytics::is_dashboard_request() ) {
			add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
		}
	}

	/**
	 * Declare the settings so core's settings route exposes them.
	 *
	 * @return void
	 */
	public static function register() {
		$stats_fields = self::get_stats_option_fields();
		if ( array() !== $stats_fields ) {
			$role       = array(
				'type' => 'string',
				'enum' => self::get_role_slugs(),
			);
			$properties = array(
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
			);

			register_setting(
				self::GROUP,
				Stats_Options::OPTION_NAME,
				array(
					'type'         => 'object',
					'show_in_rest' => array(
						'schema' => array(
							'type'                 => 'object',
							'properties'           => array_intersect_key( $properties, array_flip( $stats_fields ) ),
							'additionalProperties' => false,
						),
					),
					'description'  => __( 'Jetpack Stats settings.', 'jetpack-premium-analytics-pkg' ),
				)
			);
		}
		if ( in_array( self::READER_VIEWS_OPTION, self::get_fields(), true ) ) {
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
		}
		add_filter( 'rest_pre_get_setting', array( __CLASS__, 'get_stats_options' ), 10, 2 );
		add_filter( 'rest_pre_update_setting', array( __CLASS__, 'update_stats_options' ), 10, 3 );
		add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'report_update_error' ) );
	}

	/**
	 * The settings the site offers: the `stats_options` fields and the Reader setting, less any the host leaves out.
	 *
	 * @return string[]
	 */
	private static function get_fields() {
		$fields = array_merge( self::FIELDS, array( self::READER_VIEWS_OPTION ) );

		/**
		 * Filters the Stats settings the dashboard's Settings tab and the settings route offer.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $fields `admin_bar`, `roles`, `count_roles` and `wpcom_reader_views_enabled`.
		 */
		$kept = apply_filters( self::FIELDS_FILTER, $fields );

		return array_values( array_intersect( $fields, is_array( $kept ) ? $kept : array() ) );
	}

	/**
	 * The `stats_options` fields the site offers.
	 *
	 * @return string[]
	 */
	private static function get_stats_option_fields() {
		return array_values( array_intersect( self::FIELDS, self::get_fields() ) );
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

		return Stats_Package_Settings::get( self::get_stats_option_fields() );
	}

	/**
	 * Save a write to `stats_options` through the Stats package, which keeps the option's internal state and administrators' access, and check that the Reader setting was stored.
	 *
	 * Core ignores an error from this filter, so a refusal is held for `report_update_error()`.
	 *
	 * @param bool   $updated Whether another filter saved the setting.
	 * @param string $name    The setting's name on the route.
	 * @param mixed  $value   The value sent.
	 * @return bool Whether the setting was handled.
	 */
	public static function update_stats_options( $updated, $name, $value ) {
		if ( self::READER_VIEWS_OPTION === $name ) {
			$result = Stats_Package_Settings::update_reader_views( rest_sanitize_boolean( $value ) );
		} elseif ( Stats_Options::OPTION_NAME === $name ) {
			$result = Stats_Package_Settings::update( is_array( $value ) ? $value : array(), self::get_stats_option_fields() );
		} else {
			return $updated;
		}

		if ( is_wp_error( $result ) ) {
			self::$update_error = $result;
		}

		return true;
	}

	/**
	 * Answer the settings route with the Stats package's refusal, when it refused the write.
	 *
	 * @param mixed $response The route's response.
	 * @return mixed The refusal, otherwise `$response`.
	 */
	public static function report_update_error( $response ) {
		if ( null === self::$update_error ) {
			return $response;
		}

		$error              = self::$update_error;
		self::$update_error = null;

		return $error;
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
	 * Give the Settings tab the settings it shows, the roles it lists with how many users hold each, the screen that switches the Stats module on and off, and the visitor consent setup.
	 *
	 * @param array $data The script data.
	 * @return array The script data with the Stats settings context added.
	 */
	public static function add_script_data( $data ) {
		$fields = self::get_fields();
		if ( array() === $fields || ! current_user_can( 'manage_options' ) ) {
			return $data;
		}

		if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
			$data['premium_analytics'] = array();
		}

		$data['premium_analytics']['stats_settings'] = array(
			'fields'       => $fields,
			'roles'        => array_intersect( array( 'roles', 'count_roles' ), $fields ) ? self::get_roles_with_counts() : array(),
			// Jetpack can be active without My Jetpack's screen, for example on Atomic, where wpcomsh skips it.
			'features_url' => class_exists( 'Jetpack' ) && '' !== menu_page_url( 'my-jetpack', false ) ? admin_url( 'admin.php?page=my-jetpack#/features?search=stats' ) : null,
			'consent'      => self::get_consent_status(),
		);

		return $data;
	}

	/**
	 * The site's editable roles, with how many users hold each.
	 *
	 * @return array[]
	 */
	private static function get_roles_with_counts() {
		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}

		// Counting users is a slow query on large sites, so their roles come without counts.
		$counts = wp_is_large_user_count() ? null : count_users()['avail_roles'];
		$roles  = array();
		foreach ( get_editable_roles() as $slug => $role ) {
			$roles[] = array(
				'slug'  => $slug,
				'name'  => translate_user_role( $role['name'] ),
				'count' => null === $counts ? null : (int) ( $counts[ $slug ] ?? 0 ),
			);
		}

		return $roles;
	}

	/**
	 * Whether visitor consent can reach Stats: the WP Consent API bridge, and a cookie banner plugin behind it.
	 *
	 * @return array{api_active: bool, api_installed: bool, consent_type_declared: bool, banner_plugin: string|null, banner_blocks_stats: bool, recommended_banners: list<array{name: string, url: string}>, can_install: bool, can_activate: bool, file_mods_allowed: bool}
	 */
	private static function get_consent_status() {
		$plugin_file    = 'wp-consent-api/wp-consent-api.php';
		$active_plugins = (array) get_option( 'active_plugins', array() );
		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
		}
		$banner_plugin = null;
		foreach ( $active_plugins as $active ) {
			$dir = strtok( $active, '/' );
			if ( isset( self::BANNER_PLUGINS[ $dir ] ) ) {
				$banner_plugin = self::BANNER_PLUGINS[ $dir ];
				break;
			}
		}

		$recommended_banners = array();
		foreach ( self::RECOMMENDED_BANNERS as $slug ) {
			$recommended_banners[] = array(
				'name' => self::BANNER_PLUGINS[ $slug ],
				'url'  => 'https://wordpress.org/plugins/' . $slug . '/',
			);
		}

		return array(
			'api_active'            => function_exists( 'wp_has_consent' ),
			'api_installed'         => file_exists( WP_PLUGIN_DIR . '/' . $plugin_file ),
			// Some banners answer this filter even before the WP Consent API is active; others set the type only in the browser, hence `banner_plugin`.
			'consent_type_declared' => (bool) apply_filters( 'wp_get_consent_type', '' ), // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- The WP Consent API's filter, which banner plugins answer.
			'banner_plugin'         => $banner_plugin,
			'banner_blocks_stats'   => self::banner_blocks_stats(),
			'recommended_banners'   => $recommended_banners,
			// What core's `wp/v2/plugins` route checks before it installs or activates.
			'can_install'           => current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ),
			'can_activate'          => current_user_can( 'activate_plugin', $plugin_file ),
			// The check core's `install_plugins` capability makes first, so the card can say why it cannot install.
			'file_mods_allowed'     => wp_is_file_mod_allowed( 'capability_update_core' ),
		);
	}

	/**
	 * Whether Complianz's Jetpack integration holds the Stats script until visitors allow statistics, with or without the WP Consent API.
	 *
	 * @return bool
	 */
	private static function banner_blocks_stats() {
		if ( ! function_exists( 'cmplz_integration_plugin_is_enabled' ) || ! function_exists( 'cmplz_can_run_cookie_blocker' ) ) {
			return false;
		}

		// `true` asks whether the blocker runs on the front end, since it never runs in wp-admin.
		// @phan-suppress-next-line PhanUndeclaredFunction -- Defined by Complianz, checked just before.
		return cmplz_integration_plugin_is_enabled( 'jetpack' ) && cmplz_can_run_cookie_blocker( true );
	}
}
