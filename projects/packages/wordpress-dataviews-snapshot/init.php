<?php
/**
 * Initialization file for the package. Should be require_once-ed by the plugin.
 *
 * @package automattic/jetpack-wordpress-dataviews-snapshot
 */

use Automattic\Jetpack\Assets;

add_action(
	'wp_loaded',
	function () {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$handle = json_decode( file_get_contents( __DIR__ . '/build/dependency-data.json' ), true )['handle'];
		if ( ! wp_script_is( $handle, 'registered' ) ) {
			Assets::register_script(
				$handle,
				'./build/dataviews.js',
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-wordpress-dataviews-snapshot',
				)
			);
		}
	}
);
