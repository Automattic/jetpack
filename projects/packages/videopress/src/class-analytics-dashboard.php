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

/**
 * Registers the Top videos widget type on the Premium Analytics dashboard and seeds it into the
 * Traffic section's default layout.
 *
 * The package decides nothing about who gets the widget: `Initializer` calls `init()` where
 * VideoPress is active outside the WordPress.com platform, jetpack-mu-wpcom calls the registrants
 * on Simple and Atomic where the plan includes VideoPress. Everything registers when the
 * dashboard's widget registry hydrates, so a call on a site without the dashboard is inert.
 *
 * @since $$next-version$$
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
	 * Registry action and default-layout filter of the dashboard package.
	 */
	const REGISTER_WIDGET_TYPES_ACTION = 'jetpack_premium_analytics_register_widget_types';
	const DEFAULT_LAYOUT_FILTER        = 'jetpack_premium_analytics_dashboard_default_layout';

	/**
	 * Text domain of the widget metadata and of the built widget bundle.
	 */
	const TEXTDOMAIN = 'jetpack-videopress-pkg';

	/**
	 * Lowest widget contract the build works against: the CSV download action the widget imports
	 * reached the SDK in 1.3.0.
	 */
	const MIN_WIDGET_API_VERSION = '1.3.0';

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
		add_filter( self::DEFAULT_LAYOUT_FILTER, array( __CLASS__, 'add_default_layout_instance' ), 10, 2 );
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
	 * @return bool
	 */
	private static function widget_contract_is_supported() {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) ) {
			return false;
		}

		$version = \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION;

		return version_compare( $version, self::MIN_WIDGET_API_VERSION, '>=' ) && version_compare( $version, '2', '<' );
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
