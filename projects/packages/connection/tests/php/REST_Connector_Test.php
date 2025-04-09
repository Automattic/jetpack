<?php
/**
 * REST_Connector functionality testing.
 *
 * These tests focus on testing the permission checks and basic functionality
 * of the REST_Connector class which handles the REST API endpoints for the Jetpack
 * connection.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;
use ReflectionClass;
// WorDBless Classes are used in the tests but may trigger lint errors in some environments.

/**
 * REST_Connector functionality testing.
 */
class REST_Connector_Test extends TestCase {

	/**
	 * The current user ID.
	 *
	 * @var int|null
	 */
	private static $user_id;

	/**
	 * The admin user ID.
	 *
	 * @var int|null
	 */
	private static $admin_user_id;

	/**
	 * The REST_Connector instance.
	 *
	 * @var REST_Connector
	 */
	private $rest_connector;

	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	public function set_up() {
		// Make sure WorDBless is initialized
		// These calls may produce linter errors but are required for testing
		// @phpcs:ignore
		\WorDBless\Options::init()->clear_options();
		// @phpcs:ignore
		\WorDBless\Users::init()->clear_all_users();

		// Create an admin user for testing
		self::$admin_user_id = wp_insert_user(
			array(
				'user_login' => 'connector_admin_user',
				'user_pass'  => 'password',
				'user_email' => 'connector_admin@example.com',
				'role'       => 'administrator',
			)
		);

		// Create a regular user for testing
		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'connector_test_user',
				'user_pass'  => 'password',
				'user_email' => 'connector_test@example.com',
				'role'       => 'subscriber',
			)
		);

		// Create an instance of REST_Connector for testing without requiring Manager
		$reflection           = new ReflectionClass( REST_Connector::class );
		$this->rest_connector = $reflection->newInstanceWithoutConstructor();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		// Reset current user
		wp_set_current_user( 0 );

		// Explicitly delete the users we created
		if ( self::$user_id ) {
			wp_delete_user( self::$user_id );
			self::$user_id = null;
		}

		if ( self::$admin_user_id ) {
			wp_delete_user( self::$admin_user_id );
			self::$admin_user_id = null;
		}

		// Also clean up any other users that might have been created
		$users = get_users();
		foreach ( $users as $user ) {
			if ( $user->ID > 0 ) {
				wp_delete_user( $user->ID );
			}
		}

		// Clean up user meta and options
		global $wpdb;
		if ( isset( $wpdb->usermeta ) ) {
			$wpdb->query( "DELETE FROM $wpdb->usermeta" );
		}
		if ( isset( $wpdb->users ) ) {
			$wpdb->query( "DELETE FROM $wpdb->users" );
		}

		// Reset WorDBless state
		// These calls may produce linter errors but are required for testing
		// @phpcs:ignore
		\WorDBless\Options::init()->clear_options();
		// @phpcs:ignore
		\WorDBless\Users::init()->clear_all_users();
	}

	/**
	 * Placeholder test to ensure the class is properly set up.
	 */
	public function test_class_exists() {
		$this->assertTrue( class_exists( 'Automattic\Jetpack\Connection\REST_Connector' ) );
	}

	/**
	 * Test the static connection_plugins_permission_check method.
	 */
	public function test_connection_plugins_permission_check() {
		// Test without any user
		wp_set_current_user( 0 );
		$result = REST_Connector::connection_plugins_permission_check();
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_user_permission_activate_plugins', array_keys( $result->errors )[0] );

		// Test with non-admin user
		wp_set_current_user( self::$user_id );
		$result = REST_Connector::connection_plugins_permission_check();
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_user_permission_activate_plugins', array_keys( $result->errors )[0] );

		// Test with admin user
		wp_set_current_user( self::$admin_user_id );
		// We need to add the capability to the user
		$user = get_userdata( self::$admin_user_id );
		$user->add_cap( 'activate_plugins', true );
		$result = REST_Connector::connection_plugins_permission_check();
		$this->assertTrue( $result );
	}

	/**
	 * Test the static unlink_user_permission_callback method.
	 */
	public function test_unlink_user_permission_callback() {
		// Test without any user
		wp_set_current_user( 0 );
		$result = REST_Connector::unlink_user_permission_callback();
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_user_permission_unlink_user', array_keys( $result->errors )[0] );

		// We can't easily test the successful case because it requires a connected user
		// which would need complex mocking of the Manager class. The error case is sufficient
		// to test that the method works as expected.
	}

	/**
	 * Test the static is_request_signed_by_jetpack_debugger method.
	 */
	public function test_is_request_signed_by_jetpack_debugger_with_no_signature() {
		// Test without proper signature
		$result = REST_Connector::is_request_signed_by_jetpack_debugger();
		$this->assertFalse( $result );
	}

	/**
	 * Test that connection_status method exists as static.
	 */
	public function test_connection_status_method_exists() {
		$this->assertTrue( method_exists( REST_Connector::class, 'connection_status' ) );
	}
}
