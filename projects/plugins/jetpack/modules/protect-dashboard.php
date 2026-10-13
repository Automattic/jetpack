<?php
/**
 * Module Name: Protect Dashboard
 * Module Description: Security tools that keep your site safe and sound, from posts to plugins.
 * Sort Order: 4
 * First Introduced: 16.4-a.1
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Security
 * Feature: Security
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( class_exists( \Automattic\Jetpack\Protect\Dashboard::class ) ) {
	\Automattic\Jetpack\Protect\Dashboard::init( array( 'module' => Jetpack_Protect_Dashboard_Feature_Flags::MODULE ) );
}
