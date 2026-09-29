<?php
/**
 * Tests for the Top videos registrants on the WordPress.com platform.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\VideoPress\Analytics_Dashboard;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;

// Required by path, like the section API below: the vendored classmap predates these classes.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-premium-analytics/src/widget-types.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-videopress/src/class-package-version.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'vendor/automattic/jetpack-videopress/src/class-analytics-dashboard.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/premium-analytics/videopress-widgets.php';

/**
 * The plan feature decides; the VideoPress package registers.
 *
 * @covers ::wpcom_premium_analytics_register_videopress_widget_types
 * @covers ::wpcom_premium_analytics_seed_videopress_default_layout
 */
#[CoversFunction( 'wpcom_premium_analytics_register_videopress_widget_types' )]
#[CoversFunction( 'wpcom_premium_analytics_seed_videopress_default_layout' )]
class Videopress_Widgets_Test extends \WorDBless\BaseTestCase {

	/**
	 * Read a fixture manifest: the vendored package has no build.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( Analytics_Dashboard::WIDGET_MANIFEST_FILTER, array( $this, 'widget_manifest' ) );
	}

	/**
	 * The package's widget, as its build manifest lists it.
	 *
	 * @return array[]
	 */
	public function widget_manifest() {
		return array(
			array(
				'name'          => Analytics_Dashboard::TOP_VIDEOS_TYPE,
				'dir_name'      => 'top-videos',
				'title'         => 'Top videos',
				'category'      => 'stats',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-videopress/widgets/top-videos/render',
				'widget_module' => 'jetpack-videopress/widgets/top-videos/widget',
				'textdomain'    => null,
			),
		);
	}

	/**
	 * Reset the widget registry between tests.
	 */
	public function tear_down() {
		remove_filter( Analytics_Dashboard::WIDGET_MANIFEST_FILTER, array( $this, 'widget_manifest' ) );
		$instance = new ReflectionProperty( Widget_Type_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tear_down();
	}

	public function test_registrants_hook_after_the_package_registrant_and_before_the_layout_policy() {
		$this->assertSame( 20, has_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_videopress_widget_types' ) );
		$this->assertSame( 10, has_filter( 'jetpack_premium_analytics_dashboard_default_layout', 'wpcom_premium_analytics_seed_videopress_default_layout' ) );
	}

	public function test_registers_the_widget_type_with_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );
		$registry = new Widget_Type_Registry();

		wpcom_premium_analytics_register_videopress_widget_types( $registry );

		$this->assertNotNull( $registry->get_registered( Analytics_Dashboard::TOP_VIDEOS_TYPE ) );
		$this->assertSame( Analytics_Dashboard::TOP_VIDEOS_TYPE, $registry->resolve_name( 'jpa/videopress' ) );
	}

	public function test_skips_the_widget_type_without_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );
		$registry = new Widget_Type_Registry();

		wpcom_premium_analytics_register_videopress_widget_types( $registry );

		$this->assertNull( $registry->get_registered( Analytics_Dashboard::TOP_VIDEOS_TYPE ) );
	}

	public function test_seeds_the_traffic_default_layout_with_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( true );

		$layout = wpcom_premium_analytics_seed_videopress_default_layout( array(), Analytics_Dashboard::TRAFFIC_SECTION_ID );

		$this->assertSame( array( Analytics_Dashboard::TOP_VIDEOS_TYPE ), array_column( $layout, 'type' ) );
	}

	public function test_leaves_the_traffic_default_layout_alone_without_the_plan_feature() {
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );

		$this->assertSame( array(), wpcom_premium_analytics_seed_videopress_default_layout( array(), Analytics_Dashboard::TRAFFIC_SECTION_ID ) );
	}
}
