<?php
/**
 * The Top videos widget of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Status\Host;
use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the Top videos widget type on the Premium Analytics dashboard, seeds it into the
 * Traffic section's default layout, and registers the video single-report page.
 *
 * The package decides nothing about who gets the widget: `Initializer` calls `init()` where
 * VideoPress is active outside the WordPress.com platform, jetpack-mu-wpcom calls the registrants
 * on Simple and Atomic where the plan includes VideoPress. Everything registers when the
 * dashboard's widget registry hydrates, so a call on a site without the dashboard is inert.
 *
 * @since 0.55.0
 */
class Analytics_Dashboard {

	/**
	 * Widget type name the package builds, from `widgets/top-videos/widget.json`.
	 */
	const TOP_VIDEOS_TYPE = 'videopress/top-videos';

	/**
	 * Names the widget type registered under before it moved here. A persisted layout that still
	 * carries one resolves to TOP_VIDEOS_TYPE.
	 */
	const TOP_VIDEOS_FORMER_NAMES = array( 'jpa/videopress' );

	/**
	 * The dashboard section whose default layout seeds the widget, and the seeded instance.
	 */
	const TRAFFIC_SECTION_ID       = 'analytics/traffic';
	const TOP_VIDEOS_INSTANCE_UUID = 'default-videopress-widget-instance';

	/**
	 * The video single-report page, served by the dashboard at `/report/video/{id}`.
	 */
	const VIDEO_PAGE_ID = 'videopress/video';

	/**
	 * Registry actions and default-layout filter of the dashboard package.
	 */
	const REGISTER_WIDGET_TYPES_ACTION        = 'jetpack_premium_analytics_register_widget_types';
	const REGISTER_SINGLE_REPORT_PAGES_ACTION = 'jetpack_premium_analytics_register_single_report_pages';
	const DEFAULT_LAYOUT_FILTER               = 'jetpack_premium_analytics_dashboard_default_layout';

	/**
	 * Text domain of the widget metadata and of the built widget bundle.
	 */
	const TEXTDOMAIN = 'jetpack-videopress-pkg';

	/**
	 * Lowest widget contract the build works against: Top videos renders the `@wordpress/ui`
	 * primitives the SDK shares, which the dashboard ships from 2.1.0.
	 */
	const MIN_WIDGET_API_VERSION = '2.1.0';

	/**
	 * Lowest widget contract with the single-report page API and the generic route that serves it.
	 */
	const MIN_SINGLE_REPORT_API_VERSION = '2.2.0';

	/**
	 * Hook the registrant on the dashboard's registry action and the seed on its layout filter.
	 *
	 * Priority 20 for the registrant, after the dashboard package's own; priority 10 for the seed,
	 * before the dashboard drops the instances of unregistered types at 100.
	 *
	 * @return void
	 */
	public static function init() {
		// Simple and Atomic decide by plan feature, from jetpack-mu-wpcom.
		if ( ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		add_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ), 20 );
		add_action( self::REGISTER_SINGLE_REPORT_PAGES_ACTION, array( __CLASS__, 'register_single_report_pages' ), 20 );
		add_filter( self::DEFAULT_LAYOUT_FILTER, array( __CLASS__, 'add_default_layout_instance' ), 10, 2 );
	}

	/**
	 * Register the video single-report page: the dashboard renders it from this record at
	 * `/report/video/{id}`, with the arrangements readers saved on the page it served before.
	 *
	 * The layout names the dashboard's own video detail widget types until those move here too.
	 *
	 * @since $$next-version$$
	 *
	 * @param object $registry The single-report page registry being hydrated.
	 * @return void
	 */
	public static function register_single_report_pages( $registry ) {
		if ( ! self::widget_contract_is_supported( self::MIN_SINGLE_REPORT_API_VERSION ) || ! method_exists( $registry, 'register' ) ) {
			return;
		}

		$registry->register(
			DASHBOARD_NAME,
			self::VIDEO_PAGE_ID,
			array(
				'path'              => 'video',
				'label'             => __( 'Video', 'jetpack-videopress-pkg' ),
				'dashboard_section' => 'traffic',
				'feature'           => 'videos',
				'scope_param'       => 'post_id',
				'icon'              => 'jpa/video',
				'reports_page'      => 'videos',
				'default_layout'    => array(
					get_dashboard_default_widget_instance( 'video-detail-views-performance', 'jpa/video-detail-views-performance', 1, 3, 2, array( 'chartType' => 'bar' ) ),
					get_dashboard_default_widget_instance( 'video-detail-embeds', 'jpa/video-detail-embeds', 2, 3, 2 ),
				),
				'preferences_scope' => 'jetpack-premium-analytics/video-detail',
			)
		);
	}

	/**
	 * Register the widget types from the package's build manifest.
	 *
	 * Loads the generated build first: after `init` it registers the widget script modules on the
	 * spot, so they reach the page import map the same request.
	 *
	 * @param object $registry The widget type registry being hydrated.
	 * @return void
	 */
	public static function register_widget_types( $registry ) {
		if ( ! self::widget_contract_is_supported() ) {
			return;
		}

		register_widget_types_from_manifest(
			self::get_widget_manifest(),
			array(
				'textdomain'    => self::TEXTDOMAIN,
				'i18n_manifest' => add_query_arg( 'ver', Package_Version::PACKAGE_VERSION, plugins_url( 'i18n-manifest.json', self::build_dir() . '/build.php' ) ),
				'former_names'  => array( self::TOP_VIDEOS_TYPE => self::TOP_VIDEOS_FORMER_NAMES ),
				'plan_features' => array( self::TOP_VIDEOS_TYPE => 'videos' ),
			),
			$registry
		);
	}

	/**
	 * Seed the Top videos instance into the Traffic section's default layout.
	 *
	 * Order 8 keeps the place the dashboard seeded it in before the widget moved here. A layout
	 * that already holds the instance, under this name or a former one, is left alone; and one
	 * seeded on a site where the type never registers loses it to the dashboard's own policy.
	 *
	 * @param mixed  $layout     The section's default widget instances; anything but an array passes through.
	 * @param string $section_id Namespaced section identifier.
	 * @return mixed The layout, with the instance appended when it is an array.
	 */
	public static function add_default_layout_instance( $layout, $section_id ) {
		if ( self::TRAFFIC_SECTION_ID !== $section_id || ! is_array( $layout ) ) {
			return $layout;
		}

		foreach ( $layout as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			if ( self::TOP_VIDEOS_INSTANCE_UUID === ( $item['uuid'] ?? null ) || self::is_top_videos_type( $item['type'] ?? null ) ) {
				return $layout;
			}
		}

		$layout[] = get_dashboard_default_widget_instance( self::TOP_VIDEOS_INSTANCE_UUID, self::TOP_VIDEOS_TYPE, 8, 1, 2 );

		return $layout;
	}

	/**
	 * Whether a widget type name is the Top videos type, current or former.
	 *
	 * @param mixed $type A widget type name.
	 * @return bool
	 */
	private static function is_top_videos_type( $type ) {
		return is_string( $type ) && ( self::TOP_VIDEOS_TYPE === $type || in_array( $type, self::TOP_VIDEOS_FORMER_NAMES, true ) );
	}

	/**
	 * Whether the dashboard's widget contract is one this build works against.
	 *
	 * Undefined is a request that never loaded the dashboard's widget types, such as the sections
	 * REST route: the widgets wait for one that does.
	 *
	 * @param string $minimum The lowest contract the caller needs.
	 * @return bool
	 */
	private static function widget_contract_is_supported( $minimum = self::MIN_WIDGET_API_VERSION ) {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) ) {
			return false;
		}

		$version = \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION;

		return version_compare( $version, $minimum, '>=' ) && version_compare( $version, '3', '<' );
	}

	/**
	 * The widget manifest the package registers from: what its build generated, none without a build.
	 *
	 * @return array[] Manifest entries, as `jetpack_videopress_get_registered_widget_modules()` returns them.
	 */
	private static function get_widget_manifest() {
		self::load_build();
		if ( ! function_exists( 'jetpack_videopress_get_registered_widget_modules' ) ) {
			return array();
		}

		return (array) jetpack_videopress_get_registered_widget_modules();
	}

	/**
	 * Load the generated build once. Guarded by symbol, not by path: on WordPress.com two copies of
	 * the package can share a request.
	 *
	 * @return void
	 */
	private static function load_build() {
		if ( function_exists( 'jetpack_videopress_get_registered_widget_modules' ) ) {
			return;
		}
		$loader = self::build_dir() . '/build.php';
		if ( file_exists( $loader ) ) {
			require_once $loader;
		}
	}

	/**
	 * Directory of the wp-build output.
	 *
	 * @return string
	 */
	private static function build_dir() {
		return dirname( __DIR__ ) . '/build';
	}
}
