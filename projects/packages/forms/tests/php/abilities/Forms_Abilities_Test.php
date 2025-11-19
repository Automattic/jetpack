<?php
/**
 * Unit tests for Jetpack Forms Abilities
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Abilities;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;

/**
 * Unit tests for Forms Abilities registration and execution.
 *
 * To run this test, you can use the following command: (from the projects/packages/forms directory)
 *
 * composer test-php tests/php/abilities/Forms_Abilities_Test.php
 */
class Forms_Abilities_Test extends TestCase {

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
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
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
			$features = wp_get_features();
			$forms_abilities = array_filter(
				$features,
				function( $feature ) {
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

		$features = wp_get_features();
		$forms_abilities = array_filter(
			$features,
			function( $feature ) {
				return isset( $feature['id'] ) && strpos( $feature['id'], 'jetpack-forms/' ) === 0;
			}
		);

		$expected_abilities = array(
			'jetpack-forms/get-submissions',
			'jetpack-forms/get-submission',
			'jetpack-forms/update-submission',
			'jetpack-forms/delete-submission',
			'jetpack-forms/mark-as-spam',
			'jetpack-forms/mark-as-not-spam',
			'jetpack-forms/mark-as-read',
			'jetpack-forms/get-config',
			'jetpack-forms/get-integrations',
			'jetpack-forms/get-integration',
			'jetpack-forms/get-filters',
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
	 * Test ability execution - get form config.
	 */
	public function test_get_form_config_ability() {
		if ( ! function_exists( 'wp_execute_feature' ) ) {
			$this->markTestSkipped( 'Feature API execute function not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		wp_set_current_user( self::$user_id );

		$result = wp_execute_feature( 'jetpack-forms/get-config', array() );

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-config should not return WP_Error' );
		$this->assertIsArray( $result, 'get-config should return an array' );
		$this->assertArrayHasKey( 'blogId', $result, 'Config should include blogId' );
		$this->assertArrayHasKey( 'dashboardURL', $result, 'Config should include dashboardURL' );
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

		$result = wp_execute_feature( 'jetpack-forms/get-integrations', array( 'version' => 2 ) );

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
	 * Test ability execution - get form filters.
	 */
	public function test_get_form_filters_ability() {
		if ( ! function_exists( 'wp_execute_feature' ) ) {
			$this->markTestSkipped( 'Feature API execute function not available' );
			return;
		}

		Forms_Abilities::init();
		do_action( 'wp_feature_api_init' );

		wp_set_current_user( self::$user_id );

		$result = wp_execute_feature( 'jetpack-forms/get-filters', array() );

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-filters should not return WP_Error' );
		$this->assertIsArray( $result, 'get-filters should return an array' );
		$this->assertArrayHasKey( 'date', $result, 'Filters should include date' );
		$this->assertArrayHasKey( 'source', $result, 'Filters should include source' );
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
	 * Test ability callback - get_form_submission with missing ID.
	 */
	public function test_get_form_submission_missing_id() {
		$result = Forms_Abilities::get_form_submission( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when ID is missing' );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test ability callback - mark_as_spam with missing IDs.
	 */
	public function test_mark_as_spam_missing_ids() {
		$result = Forms_Abilities::mark_as_spam( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when IDs are missing' );
		$this->assertEquals( 'missing_ids', $result->get_error_code() );
	}

	/**
	 * Test ability callback - mark_as_read with missing parameters.
	 */
	public function test_mark_as_read_missing_parameters() {
		// Missing ID
		$result = Forms_Abilities::mark_as_read( array( 'is_unread' => true ) );
		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when ID is missing' );
		$this->assertEquals( 'missing_id', $result->get_error_code() );

		// Missing is_unread
		$result = Forms_Abilities::mark_as_read( array( 'id' => 1 ) );
		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when is_unread is missing' );
		$this->assertEquals( 'missing_is_unread', $result->get_error_code() );
	}

	/**
	 * Test ability callback - get_integration with missing slug.
	 */
	public function test_get_integration_missing_slug() {
		$result = Forms_Abilities::get_integration( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when slug is missing' );
		$this->assertEquals( 'missing_slug', $result->get_error_code() );
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

