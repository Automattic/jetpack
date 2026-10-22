<?php
/**
 * Tests for the WooCommerce registrants of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-policy.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/widget-modules.php';

/**
 * The package registers the section and its widget types when the dashboard hydrates.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard
 */
#[CoversClass( Analytics_Dashboard::class )]
class Analytics_Dashboard_Test extends BaseTestCase {

	/**
	 * Reset the dashboard registries and the hooks between tests.
	 */
	public function tear_down() {
		remove_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ), 20 );
		remove_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ), 20 );
		remove_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		remove_filter( 'jetpack_stats_transient_cleanup_prefixes', array( Api_Proxy_Controller::class, 'register_transient_cleanup_prefix' ) );
		remove_action( Sync_Status_Tracker::MILESTONE_ACTION, array( Api_Proxy_Controller::class, 'clear_cache' ) );
		remove_filter( 'jetpack_admin_js_script_data', array( Store_Currency::class, 'add_script_data' ), 20 );
		remove_action( Analytics_Dashboard::DASHBOARD_PAGE_INIT_ACTION, array( Analytics_Dashboard::class, 'enqueue_store_performance_bookings' ) );
		delete_option( 'active_plugins' );
		wp_dequeue_script_module( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE );
		wp_deregister_script_module( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE );

		foreach ( array( Dashboard_Section_Registry::class, Widget_Type_Registry::class ) as $class ) {
			$instance = new \ReflectionProperty( $class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$instance->setAccessible( true );
			}
			$instance->setValue( null, null );
		}

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Both registrants hook after the dashboard package's own, which run at priority 10.
	 */
	public function test_init_hooks_both_registrants_after_the_dashboard_ones() {
		Analytics_Dashboard::init();

		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ) ) );
		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ) ) );
	}

	/**
	 * The store currency lands after the sync status tracker, which replaces `premium_analytics` at 10.
	 */
	public function test_init_hooks_the_store_currency_after_the_sync_status_tracker() {
		Analytics_Dashboard::init();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', array( Store_Currency::class, 'add_script_data' ) ) );
	}

	/**
	 * The reports proxy registers with the REST API, its cache with the Stats cleanup, and its cache
	 * reset with the end of the initial sync.
	 */
	public function test_init_hooks_the_reports_proxy() {
		Analytics_Dashboard::init();

		$this->assertSame( 10, has_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) ) );
		$this->assertSame( 10, has_action( Sync_Status_Tracker::MILESTONE_ACTION, array( Api_Proxy_Controller::class, 'clear_cache' ) ) );
		$this->assertSame(
			array( Api_Proxy_Controller::CACHE_PREFIX ),
			apply_filters( 'jetpack_stats_transient_cleanup_prefixes', array() )
		);
	}

	/**
	 * The section carries the WooCommerce label, the woocommerce slug and the package's layout.
	 */
	public function test_registers_the_woocommerce_section() {
		$this->enable_store();
		Analytics_Dashboard::init();

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertSame( 'woocommerce', $section->slug );
		$this->assertSame( 'WooCommerce', $section->label );
		$this->assertSame( 5, $section->order );
		$this->assertTrue( $section->requires_sync );
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array(
				Analytics_Dashboard::STORE_PERFORMANCE_TYPE,
				Analytics_Dashboard::TOP_PERFORMING_PRODUCTS_TYPE,
				Analytics_Dashboard::AVERAGE_ORDER_VALUE_TYPE,
				Analytics_Dashboard::AVERAGE_ITEMS_PER_ORDER_TYPE,
				Analytics_Dashboard::CONVERSION_RATE_TYPE,
				Analytics_Dashboard::VISITORS_BY_LOCATION_TYPE,
				Analytics_Dashboard::NEW_VS_RETURNING_CUSTOMER_TYPE,
				Analytics_Dashboard::REVENUE_BY_CUSTOMER_TYPE_TYPE,
				Analytics_Dashboard::TOTAL_RETURNS_TYPE,
				Analytics_Dashboard::SALES_BY_UTM_CHANNEL_TYPE,
				Analytics_Dashboard::SALES_BY_UTM_SOURCE_TYPE,
				Analytics_Dashboard::SALES_BY_UTM_CAMPAIGN_TYPE,
				Analytics_Dashboard::ORDERS_FULFILLMENT_TYPE,
				Analytics_Dashboard::SALES_BY_COUPON_TYPE,
				Analytics_Dashboard::COUPON_USAGE_OVER_TIME_TYPE,
				Analytics_Dashboard::PAYMENT_STATUS_TYPE,
				Analytics_Dashboard::SESSIONS_BY_DEVICE_TYPE,
				Analytics_Dashboard::SALES_BY_DEVICE_TYPE,
			),
			array_column( $section->get_default_layout(), 'type' )
		);
		$this->assertSame(
			array(
				Analytics_Dashboard::NET_SALES_OVER_TIME_TYPE,
				Analytics_Dashboard::TOTAL_SALES_OVER_TIME_TYPE,
				Analytics_Dashboard::GROSS_SALES_OVER_TIME_TYPE,
				Analytics_Dashboard::ORDERS_OVER_TIME_TYPE,
				Analytics_Dashboard::VISITORS_OVER_TIME_TYPE,
			),
			$section->get_insertable_widget_types()
		);
	}

	/**
	 * A layout type the package does not build is dropped before it reaches the tab, so a typo empties it.
	 */
	public function test_the_default_layout_places_only_types_the_package_builds() {
		$built = array_column( jetpack_woocommerce_stats_get_registered_widget_modules(), 'name' );

		foreach ( Analytics_Dashboard::get_default_layout() as $instance ) {
			$this->assertContains( $instance['type'], $built );
		}
	}

	/**
	 * An insertable type the package does not build is never offered, so a typo hides the widget
	 * silently; one the default layout places is offered without the list.
	 */
	public function test_the_insertable_widget_types_are_built_and_outside_the_default_layout() {
		$built  = array_column( jetpack_woocommerce_stats_get_registered_widget_modules(), 'name' );
		$placed = array_column( Analytics_Dashboard::get_default_layout(), 'type' );

		foreach ( Analytics_Dashboard::INSERTABLE_WIDGET_TYPES as $type ) {
			$this->assertContains( $type, $built );
			$this->assertNotContains( $type, $placed );
		}
	}

	/**
	 * Without the Bookings extension the dashboard page loads no Bookings metric.
	 */
	public function test_leaves_the_bookings_metric_off_the_dashboard_without_the_extension() {
		$this->enable_store();

		Analytics_Dashboard::enqueue_store_performance_bookings();

		$this->assertNotContains( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE, wp_script_modules()->get_queue() );
	}

	/**
	 * With the extension the Bookings metric loads with the dashboard, registered before it is named.
	 */
	public function test_loads_the_bookings_metric_with_the_dashboard_with_the_extension() {
		$this->enable_store();
		$this->activate_bookings();

		Analytics_Dashboard::enqueue_store_performance_bookings();

		$this->assertNotNull( wp_script_modules()->get_registered( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE ) );
		$this->assertContains( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE, wp_script_modules()->get_queue() );
	}

	/**
	 * The dashboard page enqueues its scripts before anything reads the widget registry, so the
	 * contract constant is not loaded yet; the Bookings metric must load all the same.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_loads_the_bookings_metric_before_the_widget_registry_is_read() {
		$this->assertFalse( defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ), 'The contract file must be unloaded, as on the dashboard page.' );
		$this->enable_store();
		$this->activate_bookings();

		Analytics_Dashboard::enqueue_store_performance_bookings();

		$this->assertContains( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE, wp_script_modules()->get_queue() );
	}

	/**
	 * A reader who cannot see store reports gets no Bookings metric either, extension or not.
	 */
	public function test_leaves_the_bookings_metric_off_the_dashboard_without_the_store_reports_capability() {
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_true' );
		$this->activate_bookings();

		Analytics_Dashboard::enqueue_store_performance_bookings();

		$this->assertNotContains( Analytics_Dashboard::STORE_PERFORMANCE_BOOKINGS_MODULE, wp_script_modules()->get_queue() );
	}

	/**
	 * Without WooCommerce the section stays registered and unavailable.
	 */
	public function test_section_stays_unavailable_without_woocommerce() {
		wp_set_current_user( $this->create_admin() );
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_false' );
		Analytics_Dashboard::init();

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertFalse( $section->is_available() );
	}

	/**
	 * A reader who can open the dashboard but not store reports does not get the section.
	 */
	public function test_section_stays_unavailable_without_the_store_reports_capability() {
		$this->enable_store();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'store_editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		Analytics_Dashboard::init();

		$this->assertFalse( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID )->is_available() );
	}

	/**
	 * Another owner of the `woocommerce` slug is left alone.
	 */
	public function test_skips_the_section_when_the_woocommerce_slug_is_taken() {
		register_dashboard_section( DASHBOARD_NAME, 'other/woocommerce', array( 'label' => 'Other WooCommerce' ) );
		Analytics_Dashboard::init();

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNotNull( get_registered_dashboard_section( DASHBOARD_NAME, 'other/woocommerce' ) );
	}

	/**
	 * An older dashboard package still registers this tab under the `store` slug.
	 */
	public function test_skips_the_section_when_an_older_package_holds_the_store_slug() {
		register_dashboard_section( DASHBOARD_NAME, 'woocommerce/store', array( 'label' => 'Store' ) );
		Analytics_Dashboard::init();

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNotNull( get_registered_dashboard_section( DASHBOARD_NAME, 'woocommerce/store' ) );
	}

	/**
	 * The manifest types register with the package's text domain and catalog location.
	 */
	public function test_registers_the_widget_types_from_the_manifest_with_the_catalog_location() {
		$this->enable_store();
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$net_sales = $registry->get_registered( 'woocommerce-analytics/net-sales-over-time' );
		$this->assertNotNull( $net_sales );
		$this->assertSame( 'jetpack-woocommerce-stats/widgets/net-sales-over-time/render', $net_sales->render_module );
		$this->assertSame( Analytics_Dashboard::TEXTDOMAIN, $net_sales->textdomain );
		$this->assertStringContainsString( 'build/i18n-manifest.json?ver=' . Analytics_Dashboard::PACKAGE_VERSION, $net_sales->i18n_manifest );
	}

	/**
	 * The bookings widgets are built but stay out of the registry, so neither a layout nor the inserter reaches them.
	 */
	public function test_holds_the_bookings_widget_types_back() {
		$this->enable_store();
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$registered = array_keys( $registry->get_all_registered() );
		$this->assertContains( Analytics_Dashboard::VISITORS_OVER_TIME_TYPE, $registered );
		foreach ( array( Analytics_Dashboard::BOOKINGS_OVER_TIME_TYPE, Analytics_Dashboard::BOOKINGS_BY_STATUS_TYPE, Analytics_Dashboard::TOP_PERFORMING_BOOKINGS_TYPE ) as $type ) {
			$this->assertNotContains( $type, $registered );
		}
	}

	/**
	 * Without WooCommerce no type registers, so neither a layout nor the inserter reaches them.
	 */
	public function test_registers_no_widget_types_without_woocommerce() {
		wp_set_current_user( $this->create_admin() );
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_false' );
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	/**
	 * A reader who cannot see store reports gets no type either: the widgets would only collect 403s.
	 */
	public function test_registers_no_widget_types_without_the_store_reports_capability() {
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_true' );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'store_reader_' . wp_rand(),
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	/**
	 * The WooCommerce Bookings extension is listed as active, which `is_plugin_active()` reads.
	 */
	private function activate_bookings() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		update_option( 'active_plugins', array( 'woocommerce-bookings/woocommerce-bookings.php' ) );
	}

	/**
	 * WooCommerce is treated as present, and the current user can read store reports.
	 */
	private function enable_store() {
		wp_set_current_user( $this->create_admin() );
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_true' );
	}

	/**
	 * An administrator, the role that can view store reports.
	 *
	 * @return int
	 */
	private function create_admin() {
		return wp_insert_user(
			array(
				'user_login' => 'store_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
	}
}
