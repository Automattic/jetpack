<?php
/**
 * Module Name: Monetize
 * Module Description: Manage payments, paid subscribers, and ads from one Monetize page.
 * Sort Order: 1
 * First Introduced: 16.5-a.1
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

	// Without it, the Features row gets Jetpack's settings search, which it drops for a module with no options.
	add_filter(
		'jetpack_module_configuration_url_' . Jetpack_Monetize_Feature_Flags::MODULE,
		static function () {
			return admin_url( 'admin.php?page=' . \Automattic\Jetpack\Monetize\Dashboard::MENU_SLUG );
		}
	);
}
