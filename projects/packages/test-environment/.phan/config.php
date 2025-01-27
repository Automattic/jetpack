<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-test-environment
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

// Get absolute path to WorDBless
$wordbless_path = dirname( __DIR__, 4 ) . '/tools/php-test-env/vendor/automattic/wordbless';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'directory_list'                  => array(
			$wordbless_path . '/src',
		),
		'exclude_analysis_directory_list' => array(
			$wordbless_path,
		),
	)
);
