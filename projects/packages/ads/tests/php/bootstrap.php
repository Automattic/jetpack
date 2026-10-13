<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-ads
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// PHPUnit runs an isolated test from stdin, and wp_guess_url() warns on PHP 7.4 when the script path is empty.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();

// Stand-in for the manifest accessor wp-build generates: two of the package's widgets, one with a text domain of its own.
if ( ! function_exists( 'jetpack_ads_get_registered_widget_modules' ) ) {
	/**
	 * Manifest stand-in.
	 *
	 * @return array[]
	 */
	function jetpack_ads_get_registered_widget_modules() {
		return array(
			array(
				'name'          => 'wordads/chart-tabs',
				'dir_name'      => 'wordads-chart-tabs',
				'title'         => 'Ads summary',
				'category'      => 'stats',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-ads/widgets/wordads-chart-tabs/render',
				'widget_module' => 'jetpack-ads/widgets/wordads-chart-tabs/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'wordads/highlights',
				'dir_name'      => 'wordads-highlights',
				'title'         => 'All-time balance',
				'category'      => 'stats',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-ads/widgets/wordads-highlights/render',
				'widget_module' => 'jetpack-ads/widgets/wordads-highlights/widget',
				'textdomain'    => 'already-set',
			),
		);
	}
}
