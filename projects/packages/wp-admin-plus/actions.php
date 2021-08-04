<?php
/**
 * Action Hooks for the WPAdminPlus.
 *
 * @package automattic/jetpack-wp-admin-plus
 */

namespace Automattic\Jetpack\WPAdminPlus;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Start the WordPress Admin Plus engines.
 */
function init_wp_admin_plus() {
	Admin::init();
}

add_action( 'init', __NAMESPACE__ . '\init_wp_admin_plus' );
