<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-admin-ui
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'            => array( 'akismet' ),
		'exclude_file_list' => array(
			// Testing mock that overrides the akismet stubs.
			'tests/php/stubs/class-akismet-admin.php',
		),
	)
);
