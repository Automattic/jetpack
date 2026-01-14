<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-public-abilities
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'parse_file_list' => array(
			// Reference file for optional device-detection dependency (used via class_exists check).
			__DIR__ . '/../../device-detection/src/class-user-agent-info.php',
		),
	)
);
