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
		$json = json_decode( file_get_contents( __DIR__ . '/build/dependency-data.json' ), true );
		if ( isset( $json['handle'] ) && ! wp_script_is( $json['handle'], 'registered' ) ) {
			Assets::register_script(
				$json['handle'],
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
