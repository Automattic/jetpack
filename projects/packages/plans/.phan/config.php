<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-plans
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'            => array( 'wpcom' ),
		// Those same stubs declare the registry these files stand in for at runtime, which Phan
		// reports as a redefinition.
		'exclude_file_list' => array(
			'tests/php/stubs/class-wpcom-features.php',
			'tests/php/stubs/functions-wpcom-features.php',
		),
	)
);
