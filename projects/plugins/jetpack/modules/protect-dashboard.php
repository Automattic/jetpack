<?php
/**
 * Module Name: Protect
 * Module Description: Security tools that keep your site safe and sound, from posts to plugins.
 * Sort Order: 4
 * First Introduced: 16.4
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

require_once __DIR__ . '/protect-dashboard/class-jetpack-protect-dashboard.php';

Jetpack_Protect_Dashboard::init();
