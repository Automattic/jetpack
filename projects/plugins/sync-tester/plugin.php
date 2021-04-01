<?php
/**
 * Jetpack Sync Tester
 *
 * Sync PR #18608 Tester.
 *
 * @link       https://jetpack.com/
 *
 * @package    Jetpack
 * @subpackage Sync
 * @since      9.6
 */

/**
 * Plugin Name: Sync PR #18608 Tester.
 */

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

/**
 * Test Sync changes.
 */
function test_sync_changes() {
	// Test change to Functions::get_modules().
	error_log( 'get_modules returns: ' . print_r( Automattic\Jetpack\Sync\Functions::get_modules(), true ) );

	// Test change to Listener::get_actor(). The returned array should include the actor's ip.
	error_log( 'get_actor returns ' . print_r( Automattic\Jetpack\Sync\Listener::get_instance()->get_actor( 'jetpack_wp_login', null ), true ) );

	// Test change to Options::jetpack_sync_core_icon().
	error_log( 'calling jetpack_sync_core_icon' );
	( new Automattic\Jetpack\Sync\Modules\Options() )->jetpack_sync_core_icon();
}

add_action( 'plugins_loaded', 'test_sync_changes' );
