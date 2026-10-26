<?php
/**
 * Module Name: Protect Dashboard
 * Module Description: Security tools that keep your site safe and sound, from posts to plugins.
 * Sort Order: 4
 * First Introduced: 16.4-a.4
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Security
 * Feature: Security
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Activating the module loads this file even while the Jetpack Protect plugin hides it.
if ( class_exists( \Automattic\Jetpack\Protect\Dashboard::class ) && ! Jetpack_Protect_Dashboard_Feature_Flags::is_protect_plugin_active() ) {
	\Automattic\Jetpack\Protect\Dashboard::init( array( 'module' => Jetpack_Protect_Dashboard_Feature_Flags::MODULE ) );
}
