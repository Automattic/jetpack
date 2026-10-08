<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// PHPUnit runs an isolated test from stdin, and wp_guess_url() warns on PHP 7.4 when the script path is empty.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();

// Stand-in for the manifest accessor wp-build generates, read from the manifests it would build from.
if ( ! function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
	/**
	 * Manifest stand-in.
	 *
	 * @return array[]
	 * @throws RuntimeException When a widget manifest does not decode to an array.
	 */
	function jetpack_woocommerce_stats_get_registered_widget_modules() {
		$modules = array();

		foreach ( glob( __DIR__ . '/../../widgets/*/widget.json' ) as $manifest ) {
			$widget = json_decode( (string) file_get_contents( $manifest ), true );
			if ( ! is_array( $widget ) ) {
				throw new RuntimeException( 'Unreadable widget manifest: ' . $manifest );
			}
			$dir_name = basename( dirname( $manifest ) );

			$modules[] = array(
				'name'          => $widget['name'],
				'dir_name'      => $dir_name,
				'title'         => $widget['title'],
				'category'      => $widget['category'],
				'presentation'  => $widget['presentation'],
				'render_module' => 'jetpack-woocommerce-stats/widgets/' . $dir_name . '/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/' . $dir_name . '/widget',
				'textdomain'    => null,
			);
		}

		return $modules;
	}
}
