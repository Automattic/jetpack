<?php
/**
 * Tests for the Ads registrants on the WordPress.com platform.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\WordAds\Analytics_Dashboard;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
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
 * WordAds being on decides, plus the plan on Atomic; the WordAds package registers.
 *
 * @covers ::wpcom_premium_analytics_register_wordads_section
 * @covers ::wpcom_premium_analytics_register_wordads_widget_types
 * @covers ::wpcom_premium_analytics_wordads_is_enabled
 */
#[CoversFunction( 'wpcom_premium_analytics_register_wordads_section' )]
#[CoversFunction( 'wpcom_premium_analytics_register_wordads_widget_types' )]
#[CoversFunction( 'wpcom_premium_analytics_wordads_is_enabled' )]
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
		Constants::clear_constants();
		delete_option( 'jetpack_active_modules' );

		parent::tear_down();
	}

	/**
	 * Atomic with the WordAds module on and the plan feature: the shape every registering test uses.
	 */
	private function enable_wordads_on_atomic() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		update_option( 'jetpack_active_modules', array( 'wordads' ) );
	}

	public function test_registrants_hook_after_the_package_registrants() {
		$this->assertSame( 20, has_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section' ) );
		$this->assertSame( 20, has_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_wordads_widget_types' ) );
	}

	public function test_registers_the_ads_section_on_atomic_with_the_wordads_module_on() {
		$this->enable_wordads_on_atomic();
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

	/**
	 * On Atomic both the module and the plan must be there: the module stays on after a downgrade.
	 *
	 * @dataProvider provide_atomic_states_without_the_tab
	 *
	 * @param string[] $active_modules   Stored active modules.
	 * @param bool     $has_plan_feature Whether the plan includes WordAds.
	 */
	#[DataProvider( 'provide_atomic_states_without_the_tab' )]
	public function test_skips_on_atomic_without_the_module_or_the_plan( $active_modules, $has_plan_feature ) {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( $has_plan_feature );
		update_option( 'jetpack_active_modules', $active_modules );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
	}

	/**
	 * Atomic states that must not show the Ads tab.
	 *
	 * @return array[]
	 */
	public static function provide_atomic_states_without_the_tab() {
		return array(
			'module off, plan feature'   => array( array( 'stats' ), true ),
			'module on, no plan feature' => array( array( 'wordads' ), false ),
		);
	}

	/**
	 * Simple reads the WordAds stickers rather than the module list, as the sites API does: a plan
	 * that includes WordAds is not enough.
	 */
	public function test_simple_skips_without_the_wordads_stickers_even_with_the_plan_feature() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		Functions\when( 'has_any_blog_stickers' )->justReturn( false );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
	}

	public function test_simple_registers_the_ads_section_for_an_approved_site_without_the_plan_feature() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );
		// `when()` rather than `expect()`: an expectation does not override an earlier test's stub here.
		$asked = array();
		Functions\when( 'has_any_blog_stickers' )->alias(
			function ( $stickers, $blog_id ) use ( &$asked ) {
				$asked = array( $stickers, $blog_id );
				return true;
			}
		);

		$this->assertNotNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNotNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
		$this->assertSame(
			array( array( 'wordads-approved', 'wordads-approved-misfits' ), get_current_blog_id() ),
			$asked
		);
	}

	public function test_registers_the_widget_types_on_atomic_with_the_wordads_module_on() {
		$this->enable_wordads_on_atomic();

		$this->assertNotNull( Widget_Type_Registry::get_instance()->get_registered( 'wordads/chart-tabs' ) );
	}
}
