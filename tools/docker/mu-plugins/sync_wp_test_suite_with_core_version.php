<?php
/**
 * Plugin Name: Sync WP test suite with Core version
 * Description: When WordPress core is updated, sync the WordPress test suite to the matching version.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 *
 * @todo Consider adding support for nightly/alpha/beta/RC?
 */

// phpcs:disable WordPress.PHP.DevelopmentFunctions

/**
 * Update the WordPress test suite to match the installed core version.
 *
 * @param WP_Upgrader $upgrader   Upgrader instance.
 * @param array       $hook_extra Extra arguments.
 */
function jetpack_sync_phpunit_tests_with_core( $upgrader, $hook_extra ) {
	if ( ( $hook_extra['type'] ?? '' ) !== 'core' ) {
		return;
	}

	// Read the version fresh from disk
	$wp_version = '';
	require ABSPATH . WPINC . '/version.php';

	// WordPress versioning has no minor 0 version.
	$tag  = preg_replace( '/^(\d+\.\d+)\.0$/', '$1', $wp_version );
	$base = '/tmp/wordpress-develop/tests/phpunit';

	foreach ( array( 'data', 'includes' ) as $dir ) {
		$url    = "https://develop.svn.wordpress.org/tags/$tag/tests/phpunit/$dir";
		$cmd    = sprintf(
			'svn -q switch --trust-server-cert --non-interactive %s %s 2>&1',
			escapeshellarg( $url ),
			escapeshellarg( "$base/$dir" )
		);
		$output = shell_exec( $cmd );
		if ( $output ) {
			// Error!
			error_log( "Error while updating test suite to match core version!\n\nSVN output:\n$output" );
		} else {
			error_log( "Successfully updated test suite to match core version: svn switch $dir -> tags/$tag" );
		}
	}
}
add_action( 'upgrader_process_complete', 'jetpack_sync_phpunit_tests_with_core', 10, 2 );
