<?php
/**
 * Module Name: Protect Dashboard
 * Module Description: Adds a Protect page to the Jetpack sidebar.
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
