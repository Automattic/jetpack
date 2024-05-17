<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

$root = dirname( __DIR__, 4 );

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'parse_file_list' => array(
			"$root/projects/packages/jetpack-mu-wpcom/src/class-jetpack-mu-wpcom.php",
			"$root/projects/packages/connection/src/class-tracking.php",
		),
	)
);
