<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the WooCommerce section and the package's widget types.
 *
 * The package decides nothing about who gets them: the plugin that bundles it calls `init()`, and
 * both register when the dashboard's registries hydrate.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Namespaced section identifier. Its slug, `woocommerce`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'woocommerce-analytics/woocommerce';

	/**
	 * Widget type names the package builds, from `widgets/*\/widget.json`.
	 */
	const NET_SALES_OVER_TIME_TYPE = 'woocommerce-analytics/net-sales-over-time';

	/**
	 * Registry actions of the dashboard package.
	 */
	const REGISTER_SECTIONS_ACTION     = 'jetpack_premium_analytics_register_dashboard_sections';
	const REGISTER_WIDGET_TYPES_ACTION = 'jetpack_premium_analytics_register_widget_types';

	/**
	 * Text domain of the widget metadata and of the built widget bundles.
	 */
	const TEXTDOMAIN = 'jetpack-woocommerce-stats-pkg';

	/**
	 * Oldest widget contract the widgets run on: the one whose SDK added `useReport`.
	 */
	const MIN_WIDGET_API_VERSION = '1.4.0';

	/**
	 * Hook both registrants on the dashboard's registry actions, and the reports proxy on REST
	 * requests.
	 *
	 * Priority 20, after the dashboard package's own registrants: an older package that still
	 * registers the section itself is found by slug and left alone.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );
		add_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ), 20 );

		add_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		add_filter( 'jetpack_stats_transient_cleanup_prefixes', array( Api_Proxy_Controller::class, 'register_transient_cleanup_prefix' ) );
	}

	/**
	 * Register the WooCommerce section unless `woocommerce` or the older `store` slug is taken.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( self::section_slug_is_taken( $registry ) ) {
			return;
		}

		$is_available = function_exists( 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available' )
			? 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available'
			: '__return_false';

		register_dashboard_section(
			DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'          => __( 'WooCommerce', 'jetpack-woocommerce-stats-pkg' ),
				'order'          => 40,
				'is_available'   => $is_available,
				// Nothing backfills historical orders to WordPress.com but the analytics full sync.
				'requires_sync'  => true,
				'default_layout' => array( __CLASS__, 'get_default_layout' ),
			)
		);
	}

	/**
	 * The default layout of the WooCommerce tab, which is also what the inserter offers there.
	 *
	 * A new composition, built up as the widgets land in the package.
	 *
	 * @return array[] Widget instances, as `get_dashboard_default_widget_instance()` builds them.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'default-net-sales-over-time-widget-instance', self::NET_SALES_OVER_TIME_TYPE, 0, 1, 2 ),
		);
	}

	/**
	 * Register the widget types from the package's build manifest.
	 *
	 * Loads the generated build first: after `init` it registers the widget script modules on the
	 * spot, so they reach the page import map the same request.
	 *
	 * @param object $registry The widget type registry being hydrated.
	 * @return void
	 */
	public static function register_widget_types( $registry ) {
		if ( ! self::supports_widget_contract() ) {
			return;
		}

		self::load_build();
		if ( ! function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
			return;
		}

		register_widget_types_from_manifest(
			jetpack_woocommerce_stats_get_registered_widget_modules(),
			array(
				'textdomain'    => self::TEXTDOMAIN,
				'i18n_manifest' => add_query_arg( 'ver', self::PACKAGE_VERSION, plugins_url( 'i18n-manifest.json', self::build_dir() . '/build.php' ) ),
			),
			$registry
		);
	}

	/**
	 * Whether the dashboard's widget contract is one the widgets were built against.
	 *
	 * On an older contract the SDK module lacks a name the widgets import, and they fail to load.
	 *
	 * @return bool
	 */
	private static function supports_widget_contract() {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) ) {
			return false;
		}

		$version = \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION;

		return version_compare( $version, self::MIN_WIDGET_API_VERSION, '>=' ) && version_compare( $version, '2', '<' );
	}

	/**
	 * Load the generated build once. Guarded by symbol, not by path: two copies of the package
	 * can share a request.
	 *
	 * @return void
	 */
	private static function load_build() {
		if ( function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
			return;
		}
		$loader = self::build_dir() . '/build.php';
		if ( file_exists( $loader ) ) {
			require_once $loader;
		}
	}

	/**
	 * Directory of the wp-build output.
	 *
	 * @return string
	 */
	private static function build_dir() {
		return dirname( __DIR__ ) . '/build';
	}

	/**
	 * Whether this tab's slug, or the `store` slug an older package still registers, is taken.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return bool
	 */
	private static function section_slug_is_taken( $registry ) {
		foreach ( array( 'woocommerce', 'store' ) as $slug ) {
			if ( self::dashboard_has_section_slug( $registry, DASHBOARD_NAME, $slug ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether a section with the slug is registered on the dashboard.
	 *
	 * Reads the registry through the slug lookup when the package offers it, and through the full
	 * list otherwise: the package and this one ship on different cadences.
	 *
	 * @param object $registry       The registry being hydrated.
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $slug           Section slug.
	 * @return bool
	 */
	private static function dashboard_has_section_slug( $registry, $dashboard_name, $slug ) {
		if ( method_exists( $registry, 'get_registered_by_slug' ) ) {
			return null !== $registry->get_registered_by_slug( $dashboard_name, $slug );
		}

		foreach ( $registry->get_all_registered( $dashboard_name ) as $section ) {
			if ( $section->slug === $slug ) {
				return true;
			}
		}

		return false;
	}
}
