<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/scheduled-updates
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'            => array( 'wpcom' ),
		'exclude_file_list' => array(
			// Testing mocks that conflict with wpcom stubs.
			'tests/lib/functions-wordpress.php',
		),
	)
);
