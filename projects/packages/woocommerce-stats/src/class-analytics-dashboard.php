<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the WooCommerce section and the package's widget types.
 *
 * The plugin that bundles it calls `init()`; both register when the dashboard's registries hydrate,
 * gated here on WooCommerce and on the reader's store reports capability.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.3.1';

	/**
	 * Namespaced section identifier. Its slug, `woocommerce`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'woocommerce-analytics/woocommerce';

	/**
	 * Widget type names the package builds, from `widgets/*\/widget.json`.
	 */
	const STORE_PERFORMANCE_TYPE         = 'woocommerce-analytics/store-performance';
	const NET_SALES_OVER_TIME_TYPE       = 'woocommerce-analytics/net-sales-over-time';
	const TOTAL_SALES_OVER_TIME_TYPE     = 'woocommerce-analytics/total-sales-over-time';
	const GROSS_SALES_OVER_TIME_TYPE     = 'woocommerce-analytics/gross-sales-over-time';
	const ORDERS_OVER_TIME_TYPE          = 'woocommerce-analytics/orders-over-time';
	const AVERAGE_ORDER_VALUE_TYPE       = 'woocommerce-analytics/average-order-value';
	const AVERAGE_ITEMS_PER_ORDER_TYPE   = 'woocommerce-analytics/average-items-per-order';
	const BOOKINGS_OVER_TIME_TYPE        = 'woocommerce-analytics/bookings-over-time';
	const VISITORS_OVER_TIME_TYPE        = 'woocommerce-analytics/visitors-over-time';
	const NEW_VS_RETURNING_CUSTOMER_TYPE = 'woocommerce-analytics/new-vs-returning-customer';
	const PAYMENT_STATUS_TYPE            = 'woocommerce-analytics/payment-status';
	const ORDERS_FULFILLMENT_TYPE        = 'woocommerce-analytics/orders-fulfillment';
	const COUPON_USAGE_OVER_TIME_TYPE    = 'woocommerce-analytics/coupon-usage-over-time';
	const BOOKINGS_BY_STATUS_TYPE        = 'woocommerce-analytics/bookings-by-status';
	const SESSIONS_BY_DEVICE_TYPE        = 'woocommerce-analytics/sessions-by-device';

	/**
	 * The columns family, with the bookings variants of the first two.
	 */
	const REVENUE_BY_CUSTOMER_TYPE_TYPE          = 'woocommerce-analytics/revenue-by-customer-type';
	const BOOKINGS_REVENUE_BY_CUSTOMER_TYPE_TYPE = 'woocommerce-analytics/bookings-revenue-by-customer-type';
	const SALES_BY_DEVICE_TYPE                   = 'woocommerce-analytics/sales-by-device';
	const BOOKINGS_BY_DEVICE_TYPE                = 'woocommerce-analytics/bookings-by-device';
	const TOTAL_RETURNS_TYPE                     = 'woocommerce-analytics/total-returns';
	const SALES_BY_COUPON_TYPE                   = 'woocommerce-analytics/sales-by-coupon';
	const TOP_PERFORMING_PRODUCTS_TYPE           = 'woocommerce-analytics/top-performing-products';
	const TOP_PERFORMING_BOOKINGS_TYPE           = 'woocommerce-analytics/top-performing-bookings';
	const SALES_BY_UTM_SOURCE_TYPE               = 'woocommerce-analytics/sales-by-utm-source';
	const SALES_BY_UTM_CHANNEL_TYPE              = 'woocommerce-analytics/sales-by-utm-channel';
	const SALES_BY_UTM_CAMPAIGN_TYPE             = 'woocommerce-analytics/sales-by-utm-campaign';
	const VISITORS_BY_LOCATION_TYPE              = 'woocommerce-analytics/visitors-by-location';

	/**
	 * The conversion funnel, for every product and for bookings.
	 */
	const CONVERSION_RATE_TYPE                = 'woocommerce-analytics/conversion-rate';
	const STORE_CONVERSION_RATE_BOOKINGS_TYPE = 'woocommerce-analytics/store-conversion-rate-bookings';

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
	 * Lowest widget contract the build works against: 2.0.0, the start of the major it is built for.
	 */
	const MIN_WIDGET_API_VERSION = '2.0.0';

	/**
	 * Widget categories the package builds but holds back from the tab for now: the bookings
	 * reports answer 500 on a store without a synced booking (WOOA7S-2287).
	 */
	const HELD_BACK_WIDGET_CATEGORIES = array( 'bookings' );

	/**
	 * Ahead of Traffic (10), so a store's dashboard opens on this tab.
	 */
	const SECTION_ORDER = 5;

	/**
	 * Widget types the tab offers in the inserter on top of its default layout: the over-time
	 * charts a store owner may prefer over Store performance.
	 */
	const INSERTABLE_WIDGET_TYPES = array(
		self::NET_SALES_OVER_TIME_TYPE,
		self::TOTAL_SALES_OVER_TIME_TYPE,
		self::GROSS_SALES_OVER_TIME_TYPE,
		self::ORDERS_OVER_TIME_TYPE,
		self::VISITORS_OVER_TIME_TYPE,
		// Report execution prototype.
		'woocommerce-analytics/prototype-orders-local',
		'woocommerce-analytics/prototype-orders-remote',
		'woocommerce-analytics/prototype-sessions-remote',
		'woocommerce-analytics/prototype-stock-local',
	);

	/**
	 * Filter through which WooCommerce detection is resolved, for hosts and tests without the plugin.
	 */
	const WOOCOMMERCE_AVAILABLE_FILTER = 'jetpack_woocommerce_stats_woocommerce_available';

	/**
	 * Widget categories that also need the WooCommerce Bookings extension.
	 */
	const BOOKINGS_WIDGET_CATEGORIES = array( 'bookings' );

	/**
	 * The module that offers the Bookings metric to Store performance.
	 */
	const STORE_PERFORMANCE_BOOKINGS_MODULE = '@jetpack-woocommerce-stats/store-performance-bookings';

	/**
	 * Action the dashboard page fires as it enqueues its scripts: its menu slug,
	 * `Analytics::MENU_PAGE_SLUG`, under wp-build's `_init` suffix.
	 */
	const DASHBOARD_PAGE_INIT_ACTION = 'jetpack-premium-analytics-wp-admin_init';

	/**
	 * Register the sync opt-in, then hook both registrants on the dashboard's registry actions, the Bookings metric on the dashboard
	 * page, the reports proxy on REST requests and its cache reset on the end of the initial sync,
	 * and the store currency on the script data.
	 *
	 * Priority 20, after the dashboard package's own registrants: an older package that still
	 * registers the section itself is found by slug and left alone.
	 *
	 * Call it before plugins_loaded completes, for the sync opt-in ({@see Sync_Configuration::register()}).
	 *
	 * @return void
	 */
	public static function init() {
		Sync_Configuration::register();

		add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );
		add_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ), 20 );
		add_action( self::DASHBOARD_PAGE_INIT_ACTION, array( __CLASS__, 'enqueue_store_performance_bookings' ) );

		add_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		add_action( Report_Execution\Report_Registry::REGISTER_ACTION, array( Report_Execution\Default_Reports::class, 'register' ) );
		add_filter( 'jetpack_stats_transient_cleanup_prefixes', array( Api_Proxy_Controller::class, 'register_transient_cleanup_prefix' ) );
		add_action( Sync_Status_Tracker::MILESTONE_ACTION, array( Api_Proxy_Controller::class, 'clear_cache' ) );

		Store_Currency::init();
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

		register_dashboard_section(
			DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'                   => __( 'WooCommerce', 'jetpack-woocommerce-stats-pkg' ),
				'order'                   => self::SECTION_ORDER,
				'is_available'            => array( __CLASS__, 'is_section_available' ),
				// Nothing backfills historical orders to WordPress.com but the analytics full sync.
				'requires_sync'           => true,
				'notice'                  => array( __CLASS__, 'get_no_orders_notice' ),
				'default_layout'          => array( __CLASS__, 'get_default_layout' ),
				'insertable_widget_types' => self::INSERTABLE_WIDGET_TYPES,
			)
		);
	}

	/**
	 * The message above the tab while the store has never had an order.
	 *
	 * @return string|null The message, or null once the store has an order or without WooCommerce.
	 */
	public static function get_no_orders_notice() {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return null;
		}

		// The registered statuses, so an abandoned checkout draft is not mistaken for a first order.
		$orders = wc_get_orders(
			array(
				'type'   => 'shop_order',
				'status' => array_keys( wc_get_order_statuses() ),
				'limit'  => 1,
				'return' => 'ids',
			)
		);

		if ( ! empty( $orders ) ) {
			return null;
		}

		return __( 'Your store has no orders yet. Your sales, orders and customers will show here after your first order.', 'jetpack-woocommerce-stats-pkg' );
	}

	/**
	 * The default layout of the WooCommerce tab; the inserter offers its types plus
	 * `INSERTABLE_WIDGET_TYPES`.
	 *
	 * Each group below fills one row of the dashboard grid.
	 *
	 * @return array[] Widget instances, as `get_dashboard_default_widget_instance()` builds them.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'default-store-performance-widget-instance', self::STORE_PERFORMANCE_TYPE, 0, 'full', 2 ),

			get_dashboard_default_widget_instance( 'default-top-performing-products-widget-instance', self::TOP_PERFORMING_PRODUCTS_TYPE, 10, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-average-order-value-widget-instance', self::AVERAGE_ORDER_VALUE_TYPE, 20, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-average-items-per-order-widget-instance', self::AVERAGE_ITEMS_PER_ORDER_TYPE, 30, 1, 2 ),

			get_dashboard_default_widget_instance( 'default-conversion-rate-widget-instance', self::CONVERSION_RATE_TYPE, 40, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-visitors-by-location-widget-instance', self::VISITORS_BY_LOCATION_TYPE, 50, 2, 2 ),

			get_dashboard_default_widget_instance( 'default-new-vs-returning-customer-widget-instance', self::NEW_VS_RETURNING_CUSTOMER_TYPE, 60, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-revenue-by-customer-type-widget-instance', self::REVENUE_BY_CUSTOMER_TYPE_TYPE, 70, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-total-returns-widget-instance', self::TOTAL_RETURNS_TYPE, 80, 1, 2 ),

			get_dashboard_default_widget_instance( 'default-sales-by-utm-channel-widget-instance', self::SALES_BY_UTM_CHANNEL_TYPE, 90, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-sales-by-utm-source-widget-instance', self::SALES_BY_UTM_SOURCE_TYPE, 100, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-sales-by-utm-campaign-widget-instance', self::SALES_BY_UTM_CAMPAIGN_TYPE, 110, 1, 2 ),

			get_dashboard_default_widget_instance( 'default-orders-fulfillment-widget-instance', self::ORDERS_FULFILLMENT_TYPE, 120, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-sales-by-coupon-widget-instance', self::SALES_BY_COUPON_TYPE, 130, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-coupon-usage-over-time-widget-instance', self::COUPON_USAGE_OVER_TIME_TYPE, 140, 1, 2 ),

			get_dashboard_default_widget_instance( 'default-payment-status-widget-instance', self::PAYMENT_STATUS_TYPE, 150, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-sessions-by-device-widget-instance', self::SESSIONS_BY_DEVICE_TYPE, 160, 1, 2 ),
			get_dashboard_default_widget_instance( 'default-sales-by-device-widget-instance', self::SALES_BY_DEVICE_TYPE, 170, 1, 2 ),
		);
	}

	/**
	 * Load the Bookings metric with the dashboard on a store running the Bookings extension.
	 *
	 * Enqueued as a module of its own: the page's boot runs only the init modules its build names,
	 * and a boot dependency is preloaded, not run. The build's own registrant hooks
	 * `wp_default_scripts`, already fired on this page hook, so it runs here.
	 *
	 * @return void
	 */
	public static function enqueue_store_performance_bookings() {
		if ( ! self::is_bookings_plugin_active() || ! self::supports_widget_contract() || ! self::is_woocommerce_available() || ! self::current_user_can_view_store_reports() ) {
			return;
		}

		self::load_build();
		if ( ! function_exists( 'jetpack_woocommerce_stats_register_script_modules' ) ) {
			return;
		}
		jetpack_woocommerce_stats_register_script_modules();

		wp_enqueue_script_module( self::STORE_PERFORMANCE_BOOKINGS_MODULE );
	}

	/**
	 * The manifest minus the categories held back from the tab and the bookings categories
	 * without their extension.
	 *
	 * @param array[] $widget_modules     Widget module records of the build manifest.
	 * @param bool    $bookings_available Whether the WooCommerce Bookings extension is active.
	 * @return array[] The records the package registers.
	 */
	private static function remove_unavailable_widget_types( $widget_modules, $bookings_available ) {
		return array_values(
			array_filter(
				$widget_modules,
				static function ( $widget_module ) use ( $bookings_available ) {
					$category = $widget_module['category'] ?? '';

					if ( in_array( $category, self::HELD_BACK_WIDGET_CATEGORIES, true ) ) {
						return false;
					}

					return $bookings_available || ! in_array( $category, self::BOOKINGS_WIDGET_CATEGORIES, true );
				}
			)
		);
	}

	/**
	 * Register the widget types from the package's build manifest.
	 *
	 * Loads the generated build first: after `init` it registers the widget script modules on the
	 * spot, so they reach the page import map the same request.
	 *
	 * Registers nothing without WooCommerce or for a reader who cannot see store reports: the types
	 * would only collect 403s from the proxy.
	 *
	 * @param object $registry The widget type registry being hydrated.
	 * @return void
	 */
	public static function register_widget_types( $registry ) {
		if ( ! self::supports_widget_contract() || ! self::is_woocommerce_available() || ! self::current_user_can_view_store_reports() ) {
			return;
		}

		self::load_build();
		if ( ! function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
			return;
		}

		register_widget_types_from_manifest(
			self::remove_unavailable_widget_types( jetpack_woocommerce_stats_get_registered_widget_modules(), self::is_bookings_plugin_active() ),
			array(
				'textdomain'    => self::TEXTDOMAIN,
				'i18n_manifest' => add_query_arg( 'ver', self::PACKAGE_VERSION, plugins_url( 'i18n-manifest.json', self::build_dir() . '/build.php' ) ),
			),
			$registry
		);
	}

	/**
	 * Whether the WooCommerce tab is available: WooCommerce is active and the reader may see store
	 * reports.
	 *
	 * @return bool
	 */
	public static function is_section_available() {
		return self::is_woocommerce_available() && self::current_user_can_view_store_reports();
	}

	/**
	 * Whether WooCommerce is active.
	 *
	 * @return bool
	 */
	public static function is_woocommerce_available() {
		$is_available = class_exists( 'WooCommerce' ) || function_exists( 'WC' );

		/**
		 * Filters whether WooCommerce was detected.
		 *
		 * @since 0.2.0
		 *
		 * @param bool $is_available Whether WooCommerce was detected in the current request.
		 */
		return (bool) apply_filters( self::WOOCOMMERCE_AVAILABLE_FILTER, $is_available );
	}

	/**
	 * Whether the current user may read the store reports, the rule the reports proxy enforces.
	 *
	 * @return bool
	 */
	public static function current_user_can_view_store_reports() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce registers this capability.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_woocommerce_reports' );
	}

	/**
	 * Whether the WooCommerce Bookings extension is active; `is_plugin_active()` only exists in
	 * admin contexts, hence the guard.
	 *
	 * @return bool
	 */
	private static function is_bookings_plugin_active() {
		return class_exists( 'WC_Bookings' )
			|| ( function_exists( 'is_plugin_active' ) && \is_plugin_active( 'woocommerce-bookings/woocommerce-bookings.php' ) );
	}

	/**
	 * Whether the dashboard's widget contract is one the widgets were built against.
	 *
	 * On an older contract the SDK module lacks a name the widgets import, and they fail to load.
	 *
	 * @return bool
	 */
	private static function supports_widget_contract() {
		// The dashboard loads the file naming its contract when its widget registry is first read,
		// which has not happened yet when the dashboard page enqueues its scripts.
		if (
			! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' )
			&& function_exists( 'Automattic\\Jetpack\\PremiumAnalytics\\ensure_widget_registry_ready' )
		) {
			\Automattic\Jetpack\PremiumAnalytics\ensure_widget_registry_ready();
		}

		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) ) {
			return false;
		}

		$version = \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION;

		return version_compare( $version, self::MIN_WIDGET_API_VERSION, '>=' ) && version_compare( $version, '3', '<' );
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
