<?php
/**
 * Tests for the dashboard the Stats tab hosts.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Support_Routes;
use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_available_dashboard_sections;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

// Required by path, like the consumers do: the dashboard API is not autoloaded.
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-dashboard-support.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-dashboard-support-routes.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/widget-types.php';

/**
 * The package hosts a dashboard of its own for the Stats tab.
 *
 * @covers \Automattic\Jetpack\VideoPress\Stats_Dashboard
 */
#[CoversClass( Stats_Dashboard::class )]
class Stats_Dashboard_Test extends BaseTestCase {

	/**
	 * Keep the dashboard's own widget manifest out: the registry holds only what a test registers.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
	}

	/**
	 * Reset the hooks, the request, the registries and the platform constants between tests.
	 */
	public function tear_down() {
		remove_action( Stats_Dashboard::REGISTER_SECTIONS_ACTION, array( Stats_Dashboard::class, 'register_section' ), 20 );
		remove_all_filters( Stats_Dashboard::BOOT_DEPENDENCIES_FILTER );
		remove_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) );
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		wp_set_current_user( 0 );

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
	 * Creates a user of the given role and makes it current.
	 *
	 * @param string $role Role slug.
	 * @return void
	 */
	private function login_as( $role ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'videopress-stats-' . $role,
					'user_pass'  => 'password',
					'role'       => $role,
				)
			)
		);
	}

	/**
	 * The section lists under the package's dashboard, with its three widgets, and not under Premium Analytics'.
	 */
	public function test_the_section_registers_under_the_dashboard_of_the_package() {
		foreach ( array( Stats_Dashboard::PERFORMANCE_TYPE, Stats_Dashboard::MOST_VIEWED_TYPE, Stats_Dashboard::TOP_BY_WATCH_TIME_TYPE ) as $type ) {
			Widget_Type_Registry::get_instance()->register( $type, array( 'render_module' => 'jetpack-videopress/widgets/example/render' ) );
		}
		Stats_Dashboard::init();
		$this->login_as( 'administrator' );

		$sections = get_available_dashboard_sections( Stats_Dashboard::DASHBOARD_NAME );

		$this->assertSame( array( Stats_Dashboard::SECTION_ID ), wp_list_pluck( $sections, 'id' ) );
		$this->assertSame(
			array( Stats_Dashboard::PERFORMANCE_TYPE, Stats_Dashboard::MOST_VIEWED_TYPE, Stats_Dashboard::TOP_BY_WATCH_TIME_TYPE ),
			array_column( $sections[0]->get_default_layout(), 'type' )
		);
		$this->assertNull( get_registered_dashboard_section( DASHBOARD_NAME, Stats_Dashboard::SECTION_ID ) );
	}

	/**
	 * The section follows the capability of the VideoPress page, not the Stats one a section defaults to.
	 */
	public function test_the_section_is_for_whoever_can_open_the_videopress_page() {
		Stats_Dashboard::init();

		$this->login_as( 'editor' );
		$this->assertSame( array(), get_available_dashboard_sections( Stats_Dashboard::DASHBOARD_NAME ) );

		$this->login_as( 'administrator' );
		$this->assertCount( 1, get_available_dashboard_sections( Stats_Dashboard::DASHBOARD_NAME ) );
	}

	/**
	 * The REST routes register on every request; the import map is fed on the VideoPress page alone.
	 */
	public function test_the_dashboard_api_loads_on_the_videopress_page_only() {
		set_current_screen( 'dashboard' );
		$_GET['page'] = 'jetpack';

		Stats_Dashboard::init();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) ) );
		$this->assertFalse( has_filter( Stats_Dashboard::BOOT_DEPENDENCIES_FILTER ) );

		$_GET['page'] = Admin_UI::ADMIN_PAGE_SLUG;

		Stats_Dashboard::init();

		$this->assertNotFalse( has_filter( Stats_Dashboard::BOOT_DEPENDENCIES_FILTER, 'Automattic\\Jetpack\\PremiumAnalytics\\add_widget_modules_to_boot_deps' ) );
	}

	/**
	 * WordPress.com is not served yet: nothing registers there.
	 */
	public function test_init_skips_on_the_wordpress_com_platform() {
		Constants::set_constant( 'IS_WPCOM', true );

		Stats_Dashboard::init();

		$this->assertFalse( has_action( Stats_Dashboard::REGISTER_SECTIONS_ACTION, array( Stats_Dashboard::class, 'register_section' ) ) );
		$this->assertFalse( has_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) ) );
	}
}
