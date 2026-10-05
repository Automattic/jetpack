<?php
/**
 * Tests for the Top videos registrant of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_default_dashboard_sections;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;
use const Automattic\Jetpack\PremiumAnalytics\REGISTRABLE_WIDGET_TYPES_FILTER;

// Required by path, like the consumers do: the dashboard API is not autoloaded.
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/widget-types.php';
require_once __DIR__ . '/mocks/analytics-dashboard-manifest-fixture.php';

/**
 * The package registers its widget type and seeds the Traffic layout when the dashboard hydrates.
 *
 * @covers \Automattic\Jetpack\VideoPress\Analytics_Dashboard
 */
#[CoversClass( Analytics_Dashboard::class )]
class Analytics_Dashboard_Test extends BaseTestCase {

	/**
	 * Read the fixture manifest, and keep the dashboard's own out: the registry holds only what a test registers.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, 'jetpack_videopress_test_widget_manifest' );
	}

	/**
	 * Reset the dashboard registries, the hooks and the platform constants between tests.
	 */
	public function tear_down() {
		remove_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ), 20 );
		remove_filter( Analytics_Dashboard::DEFAULT_LAYOUT_FILTER, array( Analytics_Dashboard::class, 'add_default_layout_instance' ), 10 );
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		remove_filter( REGISTRABLE_WIDGET_TYPES_FILTER, 'jetpack_videopress_test_widget_manifest' );

		foreach ( array( Dashboard_Section_Registry::class, Widget_Type_Registry::class ) as $class ) {
			$instance = new \ReflectionProperty( $class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$instance->setAccessible( true );
			}
			$instance->setValue( null, null );
		}

		Constants::clear_constants();
		// Host::is_wpcom_platform() memoizes `is_woa_site` past Constants::clear_constants().
		Cache::clear();

		parent::tear_down();
	}

	/**
	 * A manifest path that does not exist.
	 *
	 * @return string
	 */
	public function use_absent_widget_manifest() {
		return __DIR__ . '/no-such-widgets.php';
	}

	/**
	 * The registrant hooks after the dashboard package's own, the seed before the dashboard's policy.
	 */
	public function test_init_hooks_the_registrant_and_the_layout_seed() {
		Analytics_Dashboard::init();

		$this->assertSame( 20, has_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ) ) );
		$this->assertSame( 10, has_filter( Analytics_Dashboard::DEFAULT_LAYOUT_FILTER, array( Analytics_Dashboard::class, 'add_default_layout_instance' ) ) );
	}

	/**
	 * Simple and Atomic register by plan feature from jetpack-mu-wpcom instead.
	 */
	public function test_init_skips_on_the_wordpress_com_platform() {
		Constants::set_constant( 'IS_WPCOM', true );

		Analytics_Dashboard::init();

		$this->assertFalse( has_action( Analytics_Dashboard::REGISTER_WIDGET_TYPES_ACTION, array( Analytics_Dashboard::class, 'register_widget_types' ) ) );
		$this->assertFalse( has_filter( Analytics_Dashboard::DEFAULT_LAYOUT_FILTER, array( Analytics_Dashboard::class, 'add_default_layout_instance' ) ) );
	}

	/**
	 * The manifest type registers with the package's text domain, manifest URL and former name.
	 */
	public function test_registers_the_top_videos_type_from_the_manifest() {
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$top_videos = $registry->get_registered( Analytics_Dashboard::TOP_VIDEOS_TYPE );
		$this->assertNotNull( $top_videos );
		$this->assertSame( 'jetpack-videopress/widgets/top-videos/render', $top_videos->render_module );
		$this->assertSame( Analytics_Dashboard::TEXTDOMAIN, $top_videos->textdomain );
		$this->assertStringContainsString( 'build/i18n-manifest.json?ver=' . Package_Version::PACKAGE_VERSION, $top_videos->i18n_manifest );
		$this->assertSame( array( 'jpa/videopress' ), $top_videos->former_names );
		$this->assertSame( 'none', $top_videos->chart_interval );
		$this->assertSame( Analytics_Dashboard::TOP_VIDEOS_TYPE, $registry->resolve_name( 'jpa/videopress' ) );
	}

	/**
	 * The Traffic section serves the instance where the dashboard used to seed it.
	 */
	public function test_seeds_the_top_videos_instance_into_the_traffic_default_layout() {
		register_default_dashboard_sections();
		Analytics_Dashboard::init();

		$layout    = get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::TRAFFIC_SECTION_ID )->get_default_layout();
		$instances = array_column( $layout, null, 'uuid' );

		$this->assertArrayHasKey( Analytics_Dashboard::TOP_VIDEOS_INSTANCE_UUID, $instances );
		$this->assertSame( Analytics_Dashboard::TOP_VIDEOS_TYPE, $instances[ Analytics_Dashboard::TOP_VIDEOS_INSTANCE_UUID ]['type'] );
		$this->assertSame(
			array(
				'width'  => 1,
				'height' => 2,
				'order'  => 8,
			),
			$instances[ Analytics_Dashboard::TOP_VIDEOS_INSTANCE_UUID ]['placement']
		);
	}

	/**
	 * Other sections keep their layouts.
	 */
	public function test_leaves_the_layouts_of_other_sections_alone() {
		$layout = array(
			array(
				'uuid' => 'other',
				'type' => 'jpa/other',
			),
		);

		$this->assertSame( $layout, Analytics_Dashboard::add_default_layout_instance( $layout, 'analytics/insights' ) );
	}

	/**
	 * A layout that carries the instance already, under the current name or a former one, keeps one copy.
	 */
	public function test_does_not_seed_twice() {
		$current = array(
			array(
				'uuid' => 'x',
				'type' => Analytics_Dashboard::TOP_VIDEOS_TYPE,
			),
		);
		$former  = array(
			array(
				'uuid' => 'y',
				'type' => 'jpa/videopress',
			),
		);
		$by_uuid = array(
			array(
				'uuid' => Analytics_Dashboard::TOP_VIDEOS_INSTANCE_UUID,
				'type' => 'jpa/something-else',
			),
		);

		foreach ( array( $current, $former, $by_uuid ) as $layout ) {
			$this->assertSame( $layout, Analytics_Dashboard::add_default_layout_instance( $layout, Analytics_Dashboard::TRAFFIC_SECTION_ID ) );
		}
	}

	/**
	 * A malformed layout passes through untouched.
	 */
	public function test_passes_a_non_array_layout_through() {
		$this->assertSame( 'not-a-layout', Analytics_Dashboard::add_default_layout_instance( 'not-a-layout', Analytics_Dashboard::TRAFFIC_SECTION_ID ) );
	}
}
