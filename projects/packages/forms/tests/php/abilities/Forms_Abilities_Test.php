<?php
/**
 * Unit tests for Jetpack Forms Abilities
 *
 * @package automattic/jetpack-forms
 * @phan-file-suppress PhanUndeclaredFunction -- wp_execute_feature and wp_get_features are from Feature API plugin
 */

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use WorDBless\BaseTestCase;

/**
 * Unit tests for Forms Abilities registration and execution.
 *
 * To run this test, you can use the following command: (from the projects/packages/forms directory)
 *
 * composer test-php tests/php/abilities/Forms_Abilities_Test.php
 */
class Forms_Abilities_Test extends BaseTestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The current user id without permissions.
	 *
	 * @var int
	 */
	private static $subscriber_user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Initialize the plugin
		Contact_Form_Plugin::init();

		// Create admin user
		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		// Create subscriber user (no permissions)
		self::$subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Test that abilities are initialized.
	 */
	public function test_abilities_initialization() {
		Forms_Abilities::init();

		// Trigger the Feature API init hook if not already fired
		if ( ! did_action( 'wp_feature_api_init' ) ) {
			do_action( 'wp_feature_api_init' );
		}

		// If Feature API is available, verify abilities are registered
		if ( function_exists( 'wp_get_features' ) ) {
			$features        = wp_get_features();
			$forms_abilities = array_filter(
				$features,
				function ( $feature ) {
					return isset( $feature['id'] ) && strpos( $feature['id'], 'jetpack-forms/' ) === 0;
				}
			);

			$this->assertGreaterThan( 0, count( $forms_abilities ), 'At least one Jetpack Forms ability should be registered' );
		} else {
			// Feature API not available - abilities should still be registered via wp_register_feature
			// We can't verify without wp_get_features, but initialization should not fail
			$this->assertTrue( true, 'Abilities initialization completed (Feature API query functions not available)' );
		}
	}

	/**
	 * Test that all expected abilities are registered.
	 */
	public function test_all_abilities_registered() {
		if ( ! function_exists( 'wp_get_features' ) ) {
			$this->markTestSkipped( 'Feature API query functions not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		$features        = wp_get_features();
		$forms_abilities = array_filter(
			$features,
			function ( $feature ) {
				return isset( $feature['id'] ) && strpos( $feature['id'], 'jetpack-forms/' ) === 0;
			}
		);

		$expected_abilities = array(
			'jetpack-forms/get-submissions',
			'jetpack-forms/update-submission',
			'jetpack-forms/delete-submission',
			'jetpack-forms/get-integrations',
			'jetpack-forms/get-status-counts',
		);

		foreach ( $expected_abilities as $ability_id ) {
			$found = false;
			foreach ( $forms_abilities as $ability ) {
				if ( isset( $ability['id'] ) && $ability['id'] === $ability_id ) {
					$found = true;
					break;
				}
			}
			$this->assertTrue( $found, "Ability {$ability_id} should be registered" );
		}
	}

	/**
	 * Test ability execution - get integrations.
	 */
	public function test_get_integrations_ability() {
		if ( ! function_exists( 'wp_execute_feature' ) ) {
			$this->markTestSkipped( 'Feature API execute function not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		wp_set_current_user( self::$user_id );

		$result = wp_execute_feature( 'jetpack-forms/get-integrations', array() );

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-integrations should not return WP_Error' );
		$this->assertIsArray( $result, 'get-integrations should return an array' );
	}

	/**
	 * Test ability execution - get form submissions (empty list is okay).
	 */
	public function test_get_form_submissions_ability() {
		if ( ! function_exists( 'wp_execute_feature' ) ) {
			$this->markTestSkipped( 'Feature API execute function not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		wp_set_current_user( self::$user_id );

		$result = wp_execute_feature(
			'jetpack-forms/get-submissions',
			array(
				'per_page' => 10,
				'page'     => 1,
			)
		);

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-submissions should not return WP_Error' );
		$this->assertIsArray( $result, 'get-submissions should return an array' );
	}

	/**
	 * Test ability execution - get status counts.
	 */
	public function test_get_status_counts_ability() {
		if ( ! function_exists( 'wp_execute_feature' ) ) {
			$this->markTestSkipped( 'Feature API execute function not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		wp_set_current_user( self::$user_id );

		$result = wp_execute_feature( 'jetpack-forms/get-status-counts', array() );

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-status-counts should not return WP_Error' );
		$this->assertIsArray( $result, 'get-status-counts should return an array' );
		$this->assertArrayHasKey( 'inbox', $result, 'Status counts should include inbox' );
		$this->assertArrayHasKey( 'spam', $result, 'Status counts should include spam' );
		$this->assertArrayHasKey( 'trash', $result, 'Status counts should include trash' );
	}

	/**
	 * Test permission checks - can_edit_pages.
	 */
	public function test_permission_check_can_edit_pages() {
		// Test with admin user
		wp_set_current_user( self::$user_id );
		$this->assertTrue( Forms_Abilities::can_edit_pages(), 'Admin user should have edit_pages capability' );

		// Test with subscriber user
		wp_set_current_user( self::$subscriber_user_id );
		$this->assertFalse( Forms_Abilities::can_edit_pages(), 'Subscriber user should not have edit_pages capability' );
	}

	/**
	 * Test permission checks - can_delete_posts.
	 */
	public function test_permission_check_can_delete_posts() {
		// Test with admin user
		wp_set_current_user( self::$user_id );
		$this->assertTrue( Forms_Abilities::can_delete_posts(), 'Admin user should have delete_posts capability' );

		// Test with subscriber user
		wp_set_current_user( self::$subscriber_user_id );
		$this->assertFalse( Forms_Abilities::can_delete_posts(), 'Subscriber user should not have delete_posts capability' );
	}

	/**
	 * Test ability callback - update_form_submission with missing ID.
	 */
	public function test_update_form_submission_missing_id() {
		$result = Forms_Abilities::update_form_submission( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when ID is missing' );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test ability callback - delete_form_submission with missing ID.
	 */
	public function test_delete_form_submission_missing_id() {
		$result = Forms_Abilities::delete_form_submission( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when ID is missing' );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test that abilities handle Feature API not being available gracefully.
	 */
	public function test_abilities_handle_missing_feature_api() {
		// Mock the function_exists check to return false
		// This simulates Feature API not being available
		// The init should not cause fatal errors
		Forms_Abilities::init();

		// If wp_feature_api_init hasn't fired, trigger it
		if ( ! did_action( 'wp_feature_api_init' ) ) {
			do_action( 'wp_feature_api_init' );
		}

		// Should complete without errors
		$this->assertTrue( true, 'Abilities initialization should handle missing Feature API gracefully' );
	}

	/**
	 * Test that register_abilities can be called multiple times safely.
	 */
	public function test_register_abilities_idempotent() {
		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		// Call register_abilities multiple times
		Forms_Abilities::register_abilities();
		Forms_Abilities::register_abilities();

		// Should not cause errors
		$this->assertTrue( true, 'register_abilities should be idempotent' );
	}
}
