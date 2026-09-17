<?php
/**
 * The Ads tab of the Premium Analytics dashboard, registered by the WordAds module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PremiumAnalytics\Capabilities;
use Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry;

/**
 * Registers the Ads tab on the Premium Analytics dashboard.
 *
 * The dashboard package composes the tab from its own WordAds widgets; this class decides that a
 * site running the module gets the tab, and who may read it.
 */
class WordAds_Premium_Analytics {

	/**
	 * Namespaced section identifier. Its slug, `ads`, keys the tab's URL and stored layouts.
	 */
	const SECTION_ID = 'wordads/ads';

	/**
	 * Registry action of the dashboard package.
	 */
	const REGISTER_ACTION = 'jetpack_premium_analytics_register_dashboard_sections';

	/**
	 * Hook the registration on the dashboard's registry action.
	 *
	 * Priority 20, after the package's own tabs: a package that still registers the tab itself,
	 * or WordPress.com registering it by plan feature, is found by slug and left alone.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( self::REGISTER_ACTION, array( __CLASS__, 'register_dashboard_section' ), 20 );
	}

	/**
	 * Register the Ads tab unless another owner already holds the `ads` slug.
	 *
	 * @param Dashboard_Section_Registry $registry The registry being hydrated.
	 * @return void
	 */
	public static function register_dashboard_section( $registry ) {
		if ( ! function_exists( 'Automattic\Jetpack\PremiumAnalytics\register_dashboard_section' ) ) {
			return;
		}

		$dashboard_name = \Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

		if ( $registry->get_registered_by_slug( $dashboard_name, 'ads' ) ) {
			return;
		}

		\Automattic\Jetpack\PremiumAnalytics\register_dashboard_section(
			$dashboard_name,
			self::SECTION_ID,
			array(
				'label'               => __( 'Ads', 'jetpack' ),
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
	 * The tab's default widget layout: the package's WordAds widgets on the three-column grid.
	 *
	 * @return array Widget instances.
	 */
	public static function get_default_layout() {
		$instance = 'Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance';

		return array(
			// Row 1: WordAds chart.
			$instance( 'default-wordads-chart-tabs-widget-instance', 'jpa/wordads-chart-tabs', 0, 3, 2 ),
			// Row 2: all-time balance.
			$instance( 'default-wordads-highlights-widget-instance', 'jpa/wordads-highlights', 1, 3, 1 ),
			// Row 3: earnings history.
			$instance( 'default-wordads-earnings-history-widget-instance', 'jpa/wordads-earnings-history', 2, 1, 2 ),
		);
	}
}
