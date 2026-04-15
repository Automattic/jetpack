<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-rtc
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'          => array( 'wpcom' ),
		'parse_file_list' => array(
			// Functions defined in the jetpack-mu-wpcom package.
			__DIR__ . '/../../../packages/jetpack-mu-wpcom/src/utils.php',
			__DIR__ . '/../../../packages/jetpack-mu-wpcom/src/lib/transients.php',
			__DIR__ . '/../../../packages/jetpack-mu-wpcom/src/lib/admin-notifications.php',
			__DIR__ . '/../../../packages/jetpack-mu-wpcom/src/lib/site-owner.php',
		),
	)
);
