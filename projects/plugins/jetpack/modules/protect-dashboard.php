<?php
/**
 * Module Name: Protect
 * Module Description: Manage your site's security features and scan results from one Protect dashboard.
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
