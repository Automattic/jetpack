<?php
/**
 * Tests for the WooCommerce registrants of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Enablement_Setting;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_STORE_SECTION_FLAG;
use const Automattic\Jetpack\PremiumAnalytics\WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER;

require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-policy.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';

/**
 * The package registers the section when the dashboard hydrates.
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
		remove_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		remove_filter( 'jetpack_stats_transient_cleanup_prefixes', array( Api_Proxy_Controller::class, 'register_transient_cleanup_prefix' ) );

		$instance = new \ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * The registrant hooks after the dashboard package's own, which runs at priority 10.
	 */
	public function test_init_hooks_the_registrant_after_the_dashboard_one() {
		Analytics_Dashboard::init();

		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ) ) );
	}

	/**
	 * The reports proxy registers with the REST API, and its cache with the Stats cleanup.
	 */
	public function test_init_hooks_the_reports_proxy() {
		Analytics_Dashboard::init();

		$this->assertSame( 10, has_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) ) );
		$this->assertSame(
			array( Api_Proxy_Controller::CACHE_PREFIX ),
			apply_filters( 'jetpack_stats_transient_cleanup_prefixes', array() )
		);
	}

	/**
	 * The section carries the WooCommerce label and the woocommerce slug, and places no widgets.
	 */
	public function test_registers_the_woocommerce_section() {
		$this->enable_store();
		Analytics_Dashboard::init();

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertSame( 'woocommerce', $section->slug );
		$this->assertSame( 'WooCommerce', $section->label );
		$this->assertSame( 40, $section->order );
		$this->assertTrue( $section->requires_sync );
		$this->assertTrue( $section->is_available() );
		$this->assertSame( array(), $section->get_default_layout() );
	}

	/**
	 * Without WooCommerce the section stays registered and unavailable.
	 */
	public function test_section_stays_unavailable_without_woocommerce() {
		wp_set_current_user( $this->create_admin() );
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );
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
	 * The site opt-in hides the section until the store flag is on.
	 */
	public function test_section_follows_the_store_flag_on_the_site_opt_in() {
		$this->enable_store();
		update_option( Enablement_Setting::ENABLED_OPTION, 1 );
		Analytics_Dashboard::init();

		$this->assertFalse( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID )->is_available() );

		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_STORE_SECTION_FLAG, '__return_true' );

		$this->assertTrue( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID )->is_available() );
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
	 * WooCommerce is treated as present, and the current user can read store reports.
	 */
	private function enable_store() {
		wp_set_current_user( $this->create_admin() );
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );
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
