<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-google-analytics
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		// Stands in for a WordPress.com class, which would make the source's guarded suppressions look unused.
		'exclude_file_regex' => array( 'tests/php/stubs/' ),
	)
);
