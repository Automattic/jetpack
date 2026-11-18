<?php
/**
 * The widget dashboard of the VideoPress Stats tab.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\PremiumAnalytics\Dashboard_Support;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Support_Routes;
use Automattic\Jetpack\Status\Host;
use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_TILE_CARD;

/**
 * Hosts the dashboard the Stats tab renders: registers its section under a dashboard name of
 * the package's own, and loads the dashboard API and its shared modules on the VideoPress page.
 *
 * Every call into the dashboard package is guarded, so a site without it keeps working.
 *
 * @since $$next-version$$
 */
class Stats_Dashboard {

	/**
	 * Name the package's sections register under, and its one section.
	 */
	const DASHBOARD_NAME = 'jetpack-videopress_stats';
	const SECTION_ID     = 'videopress/overview';

	/**
	 * Widget type names the default layout places, from the `widget.json` of each widget folder.
	 */
	const PERFORMANCE_TYPE       = 'videopress/performance';
	const MOST_VIEWED_TYPE       = 'videopress/most-viewed';
	const TOP_BY_WATCH_TIME_TYPE = 'videopress/top-by-watch-time';

	/**
	 * Rows the performance widget takes: the metric cards over the chart.
	 */
	const PERFORMANCE_HEIGHT = 3;

	/**
	 * Registry action of the dashboard package, and the import map filter of the VideoPress page.
	 */
	const REGISTER_SECTIONS_ACTION = 'jetpack_premium_analytics_register_dashboard_sections';
	const BOOT_DEPENDENCIES_FILTER = 'jetpack-videopress-dashboard-wp-admin_boot_dependencies';

	/**
	 * Hook the section registrant, and load what the page and its REST requests need.
	 *
	 * @return void
	 */
	public static function init() {
		// Simple and Atomic are not served yet, as with Analytics_Dashboard.
		if ( ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );

		if ( ! self::dashboard_package_is_available() ) {
			return;
		}

		// The dashboard package registers these routes itself only where its own dashboard is on.
		Dashboard_Support_Routes::register();

		if ( Admin_UI::is_videopress_admin_request() ) {
			Dashboard_Support::load();
			add_filter( self::BOOT_DEPENDENCIES_FILTER, 'Automattic\\Jetpack\\PremiumAnalytics\\add_widget_modules_to_boot_deps' );
		}
	}

	/**
	 * Register the Stats section when the dashboard's section registry hydrates.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( ! method_exists( $registry, 'register' ) || $registry->is_registered( self::DASHBOARD_NAME, self::SECTION_ID ) ) {
			return;
		}

		$registry->register(
			self::DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'          => __( 'Stats', 'jetpack-videopress-pkg' ),
				'order'          => 10,
				'is_available'   => array( __CLASS__, 'current_user_can_view' ),
				'default_layout' => array( __CLASS__, 'get_default_layout' ),
			)
		);
	}

	/**
	 * Whether the current user may read the section: the capability the VideoPress page asks for.
	 *
	 * @return bool
	 */
	public static function current_user_can_view() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * The section's default layout: performance across the grid, the two rankings side by side.
	 *
	 * @return array[] Widget instances.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'videopress-performance', self::PERFORMANCE_TYPE, 10, 'full', self::PERFORMANCE_HEIGHT ),
			get_dashboard_default_widget_instance( 'videopress-most-viewed', self::MOST_VIEWED_TYPE, 20, 1, DASHBOARD_TILE_CARD ),
			get_dashboard_default_widget_instance( 'videopress-top-by-watch-time', self::TOP_BY_WATCH_TIME_TYPE, 30, 1, DASHBOARD_TILE_CARD ),
		);
	}

	/**
	 * Whether the dashboard package is installed with the entry points this class calls.
	 *
	 * @return bool
	 */
	private static function dashboard_package_is_available() {
		return method_exists( Dashboard_Support::class, 'load' ) && method_exists( Dashboard_Support_Routes::class, 'register' );
	}
}
