<?php
/**
 * Module Name: Monetize
 * Module Description: Manage payments, paid subscribers, and ads from one Monetize page.
 * Sort Order: 1
 * First Introduced: 16.4-a.7
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Traffic
 * Feature: Engagement
 * Additional Search Queries: earn, monetize, payments, donations, paid subscribers, stripe, ads
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( class_exists( \Automattic\Jetpack\Monetize\Dashboard::class ) ) {
	\Automattic\Jetpack\Monetize\Dashboard::init( array( 'module' => Jetpack_Monetize_Feature_Flags::MODULE ) );
}
