<?php
/**
 * Jetpack compatibility
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search\Compatibility\Jetpack;

use Jetpack;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Override the condition to show Search submenu when Jetpack plugin exists.
 */
function should_show_jetpack_search_submenu() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	// Offline mode sites can't connect, but the dashboard has its own
	// connection-page fallback, so still show the menu rather than hiding it.
	if ( ! Jetpack::is_connection_ready() && ! ( new \Automattic\Jetpack\Status() )->is_offline_mode() ) {
		return false;
	}

	return true;
}

add_filter( 'jetpack_search_should_add_search_submenu', __NAMESPACE__ . '\should_show_jetpack_search_submenu' );
