<?php
/**
 * Admin Menu loader.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

if ( jetpack_is_atomic_site() ) {
	require_once __DIR__ . '/class-atomic-admin-menu.php';
	Atomic_Admin_Menu::get_instance();
} elseif ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
	require_once __DIR__ . '/class-jetpack-admin-menu.php';
	Jetpack_Admin_Menu::get_instance();
}
