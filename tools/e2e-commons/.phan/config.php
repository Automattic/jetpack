<?php
/**
 * Phan config.
 *
 * @package automattic/e2e-common
 */

// Require base config.
$root = dirname( __DIR__, 3 );
// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath -- It's absolute just above.
require "$root/.phan/config.base.php";

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'parse_file_list' => array(
			"$root/projects/packages/connection/legacy/class-jetpack-options.php",
			"$root/projects/plugins/beta/src/class-utils.php",
		),
	)
);
