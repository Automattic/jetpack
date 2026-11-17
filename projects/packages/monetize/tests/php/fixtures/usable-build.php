<?php
/**
 * A build index that can render the page, and records the screen ID its enqueue check sees.
 *
 * @package automattic/jetpack-monetize
 */

/**
 * Stands in for the generated render function.
 */
function jetpack_monetize_jetpack_monetize_dashboard_wp_admin_render_page() {}

add_action(
	'admin_enqueue_scripts',
	function () {
		$GLOBALS['jetpack_monetize_test_enqueue_screen_id'] = get_current_screen()->id;
	}
);
