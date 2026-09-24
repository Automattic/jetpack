<?php
/**
 * Tests for the Ads tab registered on the Premium Analytics dashboard by plan feature and WordAds state.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use function Automattic\Jetpack\PremiumAnalytics\get_ads_section_default_layout;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

// Required by path, like the section API below: the vendored classmap predates these classes.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/premium-analytics/wordads-section.php';

/**
 * Tests for the WordAds section registrant.
 */
class Wordads_Section_Test extends \WorDBless\BaseTestCase {

	/**
	 * Reset the shared section registry between tests.
	 */
	public function tear_down() {

		$instance = new ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		wp_set_current_user( 0 );
		Constants::clear_constants();
		delete_option( 'jetpack_active_modules' );

		parent::tear_down();
	}

	/**
	 * Atomic with the plan feature and the WordAds module on: the shape every registering test uses.
	 */
	private function enable_wordads_on_atomic() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		update_option( 'jetpack_active_modules', array( 'wordads' ) );
	}

	/**
	 * The registrant runs after the package's own tabs, so an existing Ads tab is found first.
	 */
	public function test_registrant_hooks_after_the_package_registrant() {
		$this->assertSame(
			20,
			has_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section' )
		);
	}

	/**
	 * A plan carrying WordAds gets the tab, keyed by the `ads` slug the client expects.
	 */
	public function test_registers_the_ads_tab_when_the_plan_includes_wordads() {
		$this->enable_wordads_on_atomic();
		$user_id = wp_insert_user(
			array(
				'user_login' => 'wordads_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$section = get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( 'ads', $section->slug );
		$this->assertSame( 'Ads', $section->label );
		$this->assertSame( 'Ads performance', $section->title );
		$this->assertSame( 50, $section->order );
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array_column( get_ads_section_default_layout(), 'uuid' ),
			array_column( $section->get_default_layout(), 'uuid' )
		);
	}

	/**
	 * Without the plan feature there is nothing to report on, so no tab.
	 */
	public function test_registers_nothing_without_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
	}

	/**
	 * A plan that could use WordAds is not a site that does: on Atomic the module decides, as in
	 * classic Stats.
	 */
	public function test_registers_nothing_on_atomic_while_the_wordads_module_is_off() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		update_option( 'jetpack_active_modules', array( 'stats' ) );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
	}

	/**
	 * Simple reads its own WordAds record rather than the module list.
	 */
	public function test_simple_follows_the_wpcom_wordads_record() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		Functions\when( 'wpcom_wordads_is_enabled' )->justReturn( false );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
	}

	/**
	 * Simple without the wpcom record wired keeps today's plan-only behaviour rather than losing the tab.
	 *
	 * Its own process: a Brain Monkey stub of the record function from another test would otherwise
	 * make `function_exists()` true here.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_simple_falls_back_to_the_plan_feature_without_the_wpcom_record() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );

		$this->assertInstanceOf( Dashboard_Section::class, get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
	}

	/**
	 * Another owner of the `ads` slug, such as the WordAds module on Atomic, keeps its tab.
	 */
	public function test_skips_when_the_ads_slug_is_taken() {
		$this->enable_wordads_on_atomic();
		register_dashboard_section( DASHBOARD_NAME, 'other/ads', array( 'label' => 'Ads' ) );

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
		$this->assertInstanceOf( Dashboard_Section::class, get_registered_dashboard_section( DASHBOARD_NAME, 'other/ads' ) );
	}

	/**
	 * A dashboard package without the slug lookup is read through its full section list.
	 */
	public function test_slug_lookup_falls_back_to_the_section_list() {
		$registry = new class() {
			/**
			 * Sections of any dashboard.
			 *
			 * @param string $dashboard_name Dashboard identifier.
			 * @return object[]
			 */
			public function get_all_registered( $dashboard_name ) {
				return 'ads_dashboard' === $dashboard_name ? array( (object) array( 'slug' => 'ads' ) ) : array();
			}
		};

		$this->assertTrue( wpcom_premium_analytics_dashboard_has_section_slug( $registry, 'ads_dashboard', 'ads' ) );
		$this->assertFalse( wpcom_premium_analytics_dashboard_has_section_slug( $registry, 'ads_dashboard', 'traffic' ) );
		$this->assertFalse( wpcom_premium_analytics_dashboard_has_section_slug( $registry, 'other_dashboard', 'ads' ) );
	}
}
