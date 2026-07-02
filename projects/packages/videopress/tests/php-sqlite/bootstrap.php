<?php
/**
 * Bootstrap for the sqlite test suite.
 *
 * Unlike the main suite (tests/php), this suite runs WorDBless on the
 * 'sqlite' engine so tests get real database tables. The playlist tests need
 * this: taxonomy term storage (wp_terms, wp_term_taxonomy,
 * wp_term_relationships, wp_termmeta) has no in-memory backing in the default
 * 'dbless' engine.
 *
 * @package automattic/
 */

// Work around WordPress bug when `@runInSeparateProcess` is used.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init( 'packages-videopress-sqlite', 'sqlite' );

/*
 * WorDBless creates the sqlite database without running the full WordPress
 * installer, so install-time state is missing. Two pieces matter here:
 * - `db_version`: term meta is hard-disabled when it is below 34370 (see
 *   wp_check_term_meta_support_prefilter()), and a missing option reads as 0.
 * - default roles: without `wp_user_roles`, every capability check fails.
 * Populate both once; populate_options() skips options that already exist,
 * and the database persists, so later runs see a healed install.
 */
if ( ! get_option( 'db_version' ) || ! get_option( 'wp_user_roles' ) ) {
	require_once ABSPATH . 'wp-admin/includes/upgrade.php'; // Loads schema.php and __get_option(), both needed by populate_options().
	populate_options();
	populate_roles();
	wp_cache_flush();
}
