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
		// tests/php/stubs/ stands in for host-plugin classes. Keep phan from parsing
		// them, or it flags the source's guarded @phan-suppress annotations as unused.
		// Also skip the tests that use the stand-ins, and the generated build/ output.
		'exclude_file_regex'              => array(
			'build/',
			'tests/php/stubs/',
		),
		'exclude_analysis_directory_list' => array( 'tests/php/' ),
		'+stubs'                          => array( 'wpcom' ),
	)
);
