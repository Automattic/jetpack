<?php
/**
 * Stand-in for the manifest accessor wp-build generates for the WordAds package, so its widget
 * types register in tests without a build.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'jetpack_wordads_analytics_get_registered_widget_modules' ) ) {
	/**
	 * One of the package's widgets, as its build manifest lists it.
	 *
	 * @return array[]
	 */
	function jetpack_wordads_analytics_get_registered_widget_modules() {
		return array(
			array(
				'name'          => 'wordads/chart-tabs',
				'dir_name'      => 'wordads-chart-tabs',
				'title'         => 'Ads summary',
				'category'      => 'stats',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-wordads-analytics/widgets/wordads-chart-tabs/render',
				'widget_module' => 'jetpack-wordads-analytics/widgets/wordads-chart-tabs/widget',
				'textdomain'    => null,
			),
		);
	}
}
