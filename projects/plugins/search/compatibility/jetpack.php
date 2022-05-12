<?php
/**
 * Jetpack compatibility
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin\Compatibility\Jetpack;

use Jetpack;

/**
 * Override the condition to show Search submenu when Jetpack plugin exists.
 */
function should_show_jetpack_search_submenu() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	// If site is in Offline Mode or not connected yet.
	if ( ! Jetpack::is_active_and_not_offline_mode() ) {
		return false;
	}

	return true;
}

// Search package uses priority 10 to override Search submenu visibility for Jetpack.
// https://github.com/Automattic/jetpack/blob/8594fe4d22863b251383c2550ca5f8d000d45b89/projects/packages/search/compatibility/jetpack.php#L29.
add_filter( 'jetpack_search_should_add_search_submenu', __NAMESPACE__ . '\should_show_jetpack_search_submenu', 20 );
