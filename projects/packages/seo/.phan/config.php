<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-seo
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		// The package tests stand in for host-plugin classes (Jetpack_SEO_Posts,
		// Jetpack_SEO_Utils) via tests/php/stubs/. Keep phan from parsing those
		// stubs — otherwise it treats them as the real classes and flags the
		// source's class_exists()-guarded @phan-suppress annotations as unused —
		// and skip analyzing the tests that reference the stand-ins. Also exclude
		// the generated build/ output.
		'exclude_file_regex'              => array(
			'build/',
			'tests/php/stubs/',
		),
		'exclude_analysis_directory_list' => array( 'tests/php/' ),
	)
);
