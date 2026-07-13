<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-podcast
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'             => array( 'wpcom' ),
		'exclude_file_regex' => array(
			'build/',
		),
		'parse_file_list'    => array(
			__DIR__ . '/../../../plugins/jetpack/_inc/lib/core-api/load-wpcom-endpoints.php', // function wpcom_rest_api_v2_load_plugin
			__DIR__ . '/../../../plugins/jetpack/class.jetpack-gutenberg.php',                // class Jetpack_Gutenberg
		),
	)
);
