<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-sharing-likes
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		// Settings > Sharing configures sharedaddy's services and reads the Likes
		// defaults, both of which still live in the Jetpack plugin. Every call is
		// behind a `class_exists()` guard, so this is for Phan's benefit only.
		'parse_file_list' => array(
			__DIR__ . '/../../../plugins/jetpack/modules/sharedaddy/sharing-service.php',   // class Sharing_Service
			__DIR__ . '/../../../plugins/jetpack/modules/sharedaddy/sharing-sources.php',   // class Sharing_Source, class Sharing_Advanced_Source, class Share_Custom
			__DIR__ . '/../../../plugins/jetpack/modules/likes/jetpack-likes-settings.php', // class Jetpack_Likes_Settings
		),
	)
);
