<?php
/**
 * Tests for the Ads registrants of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-wordads-analytics
 */

namespace Automattic\Jetpack\WordAds;

use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

// Required by path, like the consumers do: the dashboard API is not autoloaded.
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/widget-types.php';

/**
 * The package registers the section, its layout and its widget types when the dashboard hydrates.
 *
 * @covers \Automattic\Jetpack\WordAds\Analytics_Dashboard
 */
#[CoversClass( Analytics_Dashboard::class )]
class Analytics_Dashboard_Test extends BaseTestCase {

	/**
	 * Reset the dashboard registries and the hooks between tests.
	 */
	public function tear_down() {
		remove_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ), 20 );
		remove_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ), 20 );

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
	 * A second init() must not double-hook the registrants.
	 */
	public function test_init_hooks_both_registrants_after_the_dashboard_ones_once() {
		Analytics_Dashboard::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- the repeat is the point: a second init() must not hook twice.
		Analytics_Dashboard::init();

		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_SECTIONS_ACTION, array( Analytics_Dashboard::class, 'register_section' ) ) );
		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ) ) );
	}

	/**
	 * The section carries the package's label, order, availability and layout.
	 */
	public function test_registers_the_ads_section_with_its_layout() {
		wp_set_current_user( $this->create_admin() );
		Analytics_Dashboard::init();

		$section = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID );

		$this->assertNotNull( $section );
		$this->assertSame( 'ads', $section->slug );
		$this->assertSame( 'Ads', $section->label );
		$this->assertSame( 'Ads performance', $section->title );
		$this->assertSame( 50, $section->order );
		$this->assertTrue( $section->is_available() );
		$this->assertSame(
			array( 'wordads/chart-tabs', 'wordads/highlights', 'wordads/earnings-history' ),
			array_column( $section->get_default_layout(), 'type' )
		);
	}

	/**
	 * Availability is the dashboard's ad-reports capability.
	 */
	public function test_section_availability_follows_the_ad_reports_capability() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wordads_editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		Analytics_Dashboard::init();

		$this->assertFalse( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID )->is_available() );
	}

	/**
	 * An older dashboard package that still registers the section is left alone.
	 */
	public function test_skips_the_section_when_the_ads_slug_is_taken() {
		add_action(
			Analytics_Dashboard::REGISTER_SECTIONS_ACTION,
			static function () {
				register_dashboard_section( DASHBOARD_NAME, 'other/ads', array( 'label' => 'Other Ads' ) );
			},
			15
		);
		Analytics_Dashboard::init();

		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
		$this->assertNotNull( get_registered_dashboard_section( DASHBOARD_NAME, 'other/ads' ) );
	}

	/**
	 * The manifest types register with the package's text domain and manifest URL.
	 */
	public function test_registers_the_widget_types_from_the_manifest_with_the_catalog_location() {
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$chart = $registry->get_registered( 'wordads/chart-tabs' );
		$this->assertNotNull( $chart );
		$this->assertSame( 'jetpack-wordads-analytics/widgets/wordads-chart-tabs/render', $chart->render_module );
		$this->assertSame( Analytics_Dashboard::TEXTDOMAIN, $chart->textdomain );
		$this->assertStringContainsString( 'build/i18n-manifest.json?ver=' . Analytics_Dashboard::PACKAGE_VERSION, $chart->i18n_manifest );
		// A candidate's own text domain wins over the package default.
		$this->assertSame( 'already-set', $registry->get_registered( 'wordads/highlights' )->textdomain );
	}

	/**
	 * An administrator, the role that can view ad reports.
	 *
	 * @return int
	 */
	private function create_admin() {
		return wp_insert_user(
			array(
				'user_login' => 'wordads_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
	}
}
