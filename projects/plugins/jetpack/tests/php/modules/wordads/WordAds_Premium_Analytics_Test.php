<?php
/**
 * Tests for the Premium Analytics registrant of the WordAds module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\WordAds\Analytics_Dashboard;
use PHPUnit\Framework\Attributes\CoversClass;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

require_once JETPACK__PLUGIN_DIR . 'modules/wordads/php/class-wordads-premium-analytics.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-premium-analytics/src/widget-types.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-ads/src/class-analytics-dashboard.php';

/**
 * The module hands the Ads section and widget types to the dashboard through the WordAds package.
 *
 * @covers WordAds_Premium_Analytics
 */
#[CoversClass( WordAds_Premium_Analytics::class )]
class WordAds_Premium_Analytics_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the dashboard registries and the hooks between tests.
	 */
	public function tear_down() {
		remove_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ), 20 );
		remove_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ), 20 );

		foreach ( array( Dashboard_Section_Registry::class, Widget_Type_Registry::class ) as $class ) {
			$instance = new ReflectionProperty( $class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$instance->setAccessible( true );
			}
			$instance->setValue( null, null );
		}

		wp_set_current_user( 0 );
		Constants::clear_constants();

		parent::tear_down();
	}

	public function test_init_hooks_the_package_registrants_after_the_dashboard_ones() {
		WordAds_Premium_Analytics::init();

		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ) ) );
		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ) ) );
	}

	public function test_registers_the_ads_tab_on_hydration() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		WordAds_Premium_Analytics::init();

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertSame( 'ads', $section->slug );
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array( 'wordads/chart-tabs', 'wordads/highlights', 'wordads/earnings-history' ),
			array_column( $section->get_default_layout(), 'type' )
		);
	}

	public function test_skips_on_the_wordpress_com_platform() {
		Constants::set_constant( 'IS_WPCOM', true );

		WordAds_Premium_Analytics::init();

		$this->assertFalse( has_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ) ) );
		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
	}
}
