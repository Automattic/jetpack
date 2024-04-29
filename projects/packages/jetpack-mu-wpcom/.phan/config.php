<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

$root = dirname( __DIR__, 4 );

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'          => array( 'full-site-editing', 'photon-opencv', 'wpcom' ),
		'parse_file_list' => array(
			"$root/projects/plugins/jetpack/class-jetpack-stats-dashboard-widget.php",
		),
	)
);
