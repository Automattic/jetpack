<?php
/**
 * Module Name: Protect (spike)
 * Module Description: Exploration: an alternative Protect dashboard, shown beside the real one for comparison.
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

require_once __DIR__ . '/protect-dashboard-spike/class-jetpack-protect-dashboard-spike.php';

Jetpack_Protect_Dashboard_Spike::init();
