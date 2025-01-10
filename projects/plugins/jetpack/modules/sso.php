<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Secure Sign On
 * Module Description: Allow users to log in to this site using WordPress.com accounts
 * Sort Order: 30
 * Recommendation Order: 5
 * First Introduced: 2.6
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: No
 * Module Tags: Developers
 * Feature: Security
 * Additional Search Queries: sso, single sign on, login, log in, 2fa, two-factor
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\SSO;

SSO::get_instance();

add_action(
	'jetpack_modules_loaded',
	function () {
		Jetpack::enable_module_configurable( __FILE__ );
	}
);
