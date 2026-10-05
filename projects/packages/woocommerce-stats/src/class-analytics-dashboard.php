<?php
/**
 * The WooCommerce section and widgets of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the WooCommerce section, its default layout and its widget types.
 *
 * The package decides nothing about who gets the section: the Jetpack plugin calls `init()`
 * outside the WordPress.com platform, jetpack-mu-wpcom calls the registrants on Simple and
 * Atomic. Everything registers when the dashboard's registries hydrate.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Namespaced section identifier. Its slug, `store`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'woocommerce-analytics/store';

	/**
	 * Widget type this package builds. The other layout instances still name dashboard-package types.
	 */
	const ORDERS_OVER_TIME_TYPE = 'woocommerce-analytics/orders-over-time';

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
	 * Lowest widget contract this build imports: generic report access and the report metric kind.
	 */
	const MIN_WIDGET_API_VERSION = '1.4.0';

	/**
	 * Hook both registrants on the dashboard's registry actions.
	 *
	 * Priority 20, after the dashboard package's own registrants: an older package that still
	 * registers the section itself is found by slug and left alone.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );
		add_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ), 20 );
	}

	/**
	 * Register the WooCommerce section unless another owner already holds the `store` slug.
	 *
	 * Also skipped when the dashboard's widget contract moved past this build.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( self::widget_contract_moved_on() || self::dashboard_has_section_slug( $registry, DASHBOARD_NAME, 'store' ) ) {
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
	 * The default layout of the WooCommerce section.
	 *
	 * Orders over time is this package's type. The other instances still name types the dashboard
	 * package builds, until those widgets move here.
	 *
	 * @return array[] Widget instances, as `get_dashboard_default_widget_instance()` builds them.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'default-store-performance-widget-instance', 'jpa/store-performance', 0, 2, 1 ),
			get_dashboard_default_widget_instance( 'default-total-sales-over-time-widget-instance', 'jpa/total-sales-over-time', 1, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-conversion-rate-widget-instance', 'jpa/conversion-rate', 2, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-orders-over-time-widget-instance', self::ORDERS_OVER_TIME_TYPE, 3, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-average-order-value-widget-instance', 'jpa/average-order-value', 4, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-top-performing-products-widget-instance', 'jpa/top-performing-products', 5, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-new-vs-returning-customer-widget-instance', 'jpa/new-vs-returning-customer', 6, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-payment-status-widget-instance', 'jpa/payment-status', 7, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-orders-fulfillment-widget-instance', 'jpa/orders-fulfillment', 8, 1, 1 ),
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
		if ( ! self::widget_contract_is_supported() ) {
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
	 * Whether the dashboard's widget contract is one this build works against.
	 *
	 * Undefined is a request that never loaded the dashboard's widget types, such as the sections
	 * REST route: the widgets wait for one that does.
	 *
	 * @return bool
	 */
	private static function widget_contract_is_supported() {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) ) {
			return false;
		}

		$version = \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION;

		return version_compare( $version, self::MIN_WIDGET_API_VERSION, '>=' ) && version_compare( $version, '2', '<' );
	}

	/**
	 * Whether the dashboard's widget contract moved to a major this package was not built against.
	 *
	 * Undefined is not a mismatch: the sections REST route hydrates the section registry before
	 * the dashboard loads the file that defines the version.
	 *
	 * @return bool
	 */
	private static function widget_contract_moved_on() {
		return defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' )
			&& version_compare( \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION, '2', '>=' );
	}

	/**
	 * Load the generated build once. Guarded by symbol, not by path: on WordPress.com two copies of
	 * the package can share a request.
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
