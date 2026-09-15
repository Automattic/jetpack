<?php
/**
 * Test stub for the generated build/build.php.
 *
 * Hooks a stand-in for the generated enqueue check at the same default priority, recording
 * the screen ID that check would compare.
 *
 * @package my-jetpack
 */

add_action(
	'admin_enqueue_scripts',
	static function () {
		$GLOBALS['my_jetpack_test_wp_build_check_screen_id'] = get_current_screen()->id;
	}
);
