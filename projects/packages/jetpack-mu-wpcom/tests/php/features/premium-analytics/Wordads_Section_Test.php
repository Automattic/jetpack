<?php
/**
 * Tests for the Ads registrants on the WordPress.com platform.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\WordAds\Analytics_Dashboard;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

// Required by path, like the section API below: the vendored classmap predates these classes.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/widget-types.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-ads/src/class-analytics-dashboard.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/premium-analytics/wordads-section.php';

require_once __DIR__ . '/wordads-manifest-stand-in.php';

/**
 * The plan feature decides; the WordAds package registers.
 *
 * @covers ::wpcom_premium_analytics_register_wordads_section
 * @covers ::wpcom_premium_analytics_register_wordads_widget_types
 */
#[CoversFunction( 'wpcom_premium_analytics_register_wordads_section' )]
#[CoversFunction( 'wpcom_premium_analytics_register_wordads_widget_types' )]
class Wordads_Section_Test extends \WorDBless\BaseTestCase {

	/**
	 * Reset the dashboard registries between tests.
	 */
	public function tear_down() {
		foreach ( array( Dashboard_Section_Registry::class, Widget_Type_Registry::class ) as $class ) {
			$instance = new ReflectionProperty( $class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$instance->setAccessible( true );
			}
			$instance->setValue( null, null );
		}

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	public function test_registrants_hook_after_the_package_registrants() {
		$this->assertSame( 20, has_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section' ) );
		$this->assertSame( 20, has_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_wordads_widget_types' ) );
	}

	public function test_registers_the_ads_section_when_the_plan_includes_wordads() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wordads_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertSame( 'ads', $section->slug );
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array( 'wordads/chart-tabs', 'wordads/highlights', 'wordads/earnings-history' ),
			array_column( $section->get_default_layout(), 'type' )
		);
	}

	public function test_skips_without_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
	}

	public function test_registers_the_widget_types_with_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );

		$this->assertNotNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
	}

	public function test_skips_the_widget_types_without_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );

		$this->assertNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
	}
}
