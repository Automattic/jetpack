<?php
/**
 * Jetpack compatibility
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin\Compatibility\Jetpack;

/**
 * Override the condition to show Search submenu when Jetpack plugin exists.
 */
function should_show_jetpack_search_submenu() {
	return current_user_can( 'manage_options' );
}

// Search package uses priority 10 to override Search submenu visibility for Jetpack.
// https://github.com/Automattic/jetpack/blob/8594fe4d22863b251383c2550ca5f8d000d45b89/projects/packages/search/compatibility/jetpack.php#L29.
add_filter( 'jetpack_search_should_add_search_submenu', __NAMESPACE__ . '\should_show_jetpack_search_submenu', 20 );
