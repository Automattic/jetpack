<?php
/**
 * Admin Menu loader.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-admin-menu.php';

if ( jetpack_is_atomic_site() ) {
	require_once __DIR__ . '/class-atomic-admin-menu.php';
	Atomic_Admin_Menu::get_instance();
} else {
	Admin_Menu::get_instance();
}

// Ensures Calypsoify does not modify the navigation.
add_filter( 'jetpack_calypsoify_override_nav', '__return_false' );
