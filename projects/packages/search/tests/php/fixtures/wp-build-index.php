<?php
/**
 * Stands in for the generated build/build.php.
 *
 * Hooks a stand-in for the generated enqueue check at the same default priority, recording
 * the screen ID that check would compare.
 *
 * @package automattic/jetpack-search
 */

add_action(
	'admin_enqueue_scripts',
	static function () {
		$GLOBALS['jetpack_search_test_wp_build_check_screen_id'] = get_current_screen()->id;
	}
);
