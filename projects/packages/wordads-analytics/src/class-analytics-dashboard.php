<?php
/**
 * The Ads section and widgets of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-wordads-analytics
 */

namespace Automattic\Jetpack\WordAds;

use Automattic\Jetpack\PremiumAnalytics\Capabilities;
use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use function Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the Ads section, its default layout and its widget types on the Premium Analytics
 * dashboard.
 *
 * The package decides nothing about who gets Ads: the WordAds module of the Jetpack plugin calls
 * `init()` outside the WordPress.com platform, jetpack-mu-wpcom calls the registrants on Simple
 * and Atomic where the plan includes WordAds. Everything registers when the dashboard's registries
 * hydrate, so a call on a site without the dashboard is inert.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Namespaced section identifier. Its slug, `ads`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'wordads/ads';

	/**
	 * Widget type names the package builds, from `widgets/*\/widget.json`.
	 */
	const CHART_TABS_TYPE       = 'wordads/chart-tabs';
	const HIGHLIGHTS_TYPE       = 'wordads/highlights';
	const EARNINGS_HISTORY_TYPE = 'wordads/earnings-history';

	/**
	 * Registry actions of the dashboard package.
	 */
	const REGISTER_SECTIONS_ACTION     = 'jetpack_premium_analytics_register_dashboard_sections';
	const REGISTER_WIDGET_TYPES_ACTION = 'jetpack_premium_analytics_register_widget_types';

	/**
	 * Text domain of the widget metadata and of the built widget bundles.
	 */
	const TEXTDOMAIN = 'jetpack-wordads-analytics-pkg';

	/**
	 * Hook both registrants on the dashboard's registry actions.
	 *
	 * Priority 20, after the dashboard package's own registrants: an older package that still
	 * registers the section itself is found by slug and left alone.
	 *
	 * @return void
	 */
	public static function init() {
		if ( false === has_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ) ) ) {
			add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );
		}
		if ( false === has_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ) ) ) {
			add_action( self::REGISTER_WIDGET_TYPES_ACTION, array( __CLASS__, 'register_widget_types' ), 20 );
		}
	}

	/**
	 * Register the Ads section unless another owner already holds the `ads` slug.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( self::dashboard_has_section_slug( $registry, DASHBOARD_NAME, 'ads' ) ) {
			return;
		}

		register_dashboard_section(
			DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'               => __( 'Ads', 'jetpack-wordads-analytics-pkg' ),
				'title'               => __( 'Ads performance', 'jetpack-wordads-analytics-pkg' ),
				'order'               => 50,
				'is_available'        => array( Capabilities::class, 'current_user_can_view_ad_reports' ),
				// Only the chart supports dates, so it owns the control. No Ads widget
				// supports comparison.
				'date_filter_options' => array(
					'with_date_comparison'     => false,
					'with_header_date_control' => false,
				),
				'default_layout'      => array( __CLASS__, 'get_default_layout' ),
			)
		);
	}

	/**
	 * The default layout of the Ads section: chart on top, balance, then earnings history.
	 *
	 * @return array[] Widget instances, as `get_dashboard_default_widget_instance()` builds them.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'default-wordads-chart-tabs-widget-instance', self::CHART_TABS_TYPE, 0, 3, 2 ),
			get_dashboard_default_widget_instance( 'default-wordads-highlights-widget-instance', self::HIGHLIGHTS_TYPE, 1, 3, 1 ),
			get_dashboard_default_widget_instance( 'default-wordads-earnings-history-widget-instance', self::EARNINGS_HISTORY_TYPE, 2, 1, 2 ),
		);
	}

	/**
	 * Register the widget types from the package's build manifest.
	 *
	 * Loads the generated build first: after `init` it registers the widget script modules on the
	 * spot, so they reach the page import map the same request. Skipped when the dashboard's widget
	 * contract has moved to a major this package was not built against.
	 *
	 * @param object $registry The widget type registry being hydrated.
	 * @return void
	 */
	public static function register_widget_types( $registry ) {
		if ( ! defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' )
			|| version_compare( \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION, '2', '>=' ) ) {
			return;
		}

		self::load_build();
		if ( ! function_exists( 'jetpack_wordads_analytics_get_registered_widget_modules' ) ) {
			return;
		}

		register_widget_types_from_manifest(
			jetpack_wordads_analytics_get_registered_widget_modules(),
			array(
				'textdomain'    => self::TEXTDOMAIN,
				'i18n_manifest' => add_query_arg( 'ver', self::PACKAGE_VERSION, plugins_url( 'i18n-manifest.json', self::build_dir() . '/build.php' ) ),
			),
			$registry
		);
	}

	/**
	 * Load the generated build once. Guarded by symbol, not by path: on WordPress.com Simple two
	 * copies of the package can share a request.
	 *
	 * @return void
	 */
	private static function load_build() {
		if ( function_exists( 'jetpack_wordads_analytics_get_registered_widget_modules' ) ) {
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

	/**
	 * Whether a section with the slug is registered on the dashboard.
	 *
	 * Reads the registry through the slug lookup when the package offers it, and through the full
	 * list otherwise: the package and this one ship on different cadences.
	 *
	 * @param object $registry       The registry being hydrated.
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $slug           Section slug.
	 * @return bool
	 */
	private static function dashboard_has_section_slug( $registry, $dashboard_name, $slug ) {
		if ( method_exists( $registry, 'get_registered_by_slug' ) ) {
			return null !== $registry->get_registered_by_slug( $dashboard_name, $slug );
		}

		foreach ( $registry->get_all_registered( $dashboard_name ) as $section ) {
			if ( $section->slug === $slug ) {
				return true;
			}
		}

		return false;
	}
}
