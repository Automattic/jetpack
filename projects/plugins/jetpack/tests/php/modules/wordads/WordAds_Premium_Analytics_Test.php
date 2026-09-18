<?php
/**
 * Tests for the Ads tab the WordAds module registers on the Premium Analytics dashboard.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

require_once JETPACK__PLUGIN_DIR . 'modules/wordads/php/class-wordads-premium-analytics.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';

/**
 * Tests for WordAds_Premium_Analytics.
 *
 * @covers \WordAds_Premium_Analytics
 */
#[CoversClass( WordAds_Premium_Analytics::class )]
class WordAds_Premium_Analytics_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Unhook the registrant and reset the shared section registry between tests.
	 */
	public function tear_down() {
		remove_action( WordAds_Premium_Analytics::REGISTER_ACTION, array( 'WordAds_Premium_Analytics', 'register_dashboard_section' ), 20 );

		$instance = new ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		$instance->setAccessible( true );
		$instance->setValue( null, null );

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * The registrant runs after the package's own tabs, so an existing Ads tab is found first.
	 */
	public function test_init_hooks_after_the_package_registrant() {
		WordAds_Premium_Analytics::init();

		$this->assertSame(
			20,
			has_action( WordAds_Premium_Analytics::REGISTER_ACTION, array( 'WordAds_Premium_Analytics', 'register_dashboard_section' ) )
		);
	}

	/**
	 * Reading the registry hydrates it, and the module's Ads tab is registered with it.
	 */
	public function test_registers_the_ads_tab_on_hydration() {
		WordAds_Premium_Analytics::init();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$section = get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( 'ads', $section->slug );
		$this->assertSame( 'Ads', $section->label );
		$this->assertSame( 50, $section->order );
		$this->assertSame(
			array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			$section->date_filter_options
		);
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array(
				'jpa/wordads-chart-tabs',
				'jpa/wordads-highlights',
				'jpa/wordads-earnings-history',
			),
			array_column( $section->get_default_layout(), 'type' )
		);
	}

	/**
	 * Another owner of the `ads` slug, such as WordPress.com on Atomic, keeps its tab.
	 */
	public function test_skips_when_the_ads_slug_is_taken() {
		register_dashboard_section( DASHBOARD_NAME, 'other/ads', array( 'label' => 'Ads' ) );
		WordAds_Premium_Analytics::init();

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' ) );
		$this->assertInstanceOf( Dashboard_Section::class, get_registered_dashboard_section( DASHBOARD_NAME, 'other/ads' ) );
	}

	/**
	 * The tab follows the dashboard's ad reports capability, which a stats reader lacks.
	 */
	public function test_availability_follows_the_ad_reports_capability() {
		WordAds_Premium_Analytics::init();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$section = get_registered_dashboard_section( DASHBOARD_NAME, 'wordads/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertFalse( $section->is_available() );
	}
}
