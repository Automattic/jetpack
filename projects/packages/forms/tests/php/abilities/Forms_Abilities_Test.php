<?php
/**
 * Unit tests for Jetpack Forms Abilities
 *
 * @package automattic/jetpack-forms
 * @phan-file-suppress PhanUndeclaredFunction -- wp_register_ability and wp_get_abilities are from Abilities API (WP 6.9)
 * @phan-file-suppress PhanUndeclaredClassMethod -- WP_Ability class is from Abilities API (WP 6.9)
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that
 * @phan-file-suppress PhanPluginDuplicateAdjacentStatement -- Intentional for idempotency test
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

		Contact_Form_Plugin::init();

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		self::$subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Simulates the `wp_abilities_api_categories_init` action.
	 */
	private function simulate_doing_wp_abilities_categories_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulates the `wp_abilities_api_init` action.
	 */
	private function simulate_doing_wp_abilities_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/**
	 * Test that abilities are initialized.
	 */
	public function test_abilities_initialization() {
		Forms_Abilities::init();

		// Trigger the Abilities API init hooks if not already fired
		if ( ! did_action( 'wp_abilities_api_categories_init' ) ) {
			do_action( 'wp_abilities_api_categories_init' );
		}
		if ( ! did_action( 'wp_abilities_api_init' ) ) {
			do_action( 'wp_abilities_api_init' );
		}

		// If Abilities API is available, verify abilities are registered
		if ( function_exists( 'wp_get_abilities' ) ) {
			$abilities       = wp_get_abilities();
			$forms_abilities = array_filter(
				$abilities,
				function ( $ability ) {
					return str_starts_with( $ability->get_name(), 'jetpack-forms/' );
				}
			);

			$this->assertGreaterThan( 0, count( $forms_abilities ), 'At least one Jetpack Forms ability should be registered' );
		} else {
			// Abilities API not available - abilities should still be registered via wp_register_ability
			// We can't verify without wp_get_abilities, but initialization should not fail
			$this->assertTrue( true, 'Abilities initialization completed (Abilities API query functions not available)' );
		}
	}

	/**
	 * Test that all expected abilities are registered.
	 */
	public function test_all_abilities_registered() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API query functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Forms_Abilities::register_abilities();

		$abilities       = wp_get_abilities();
		$forms_abilities = array_filter(
			$abilities,
			function ( $ability ) {
				return str_starts_with( $ability->get_name(), 'jetpack-forms/' );
			}
		);

		$expected_abilities = array(
			'jetpack-forms/get-responses',
			'jetpack-forms/update-response',
			'jetpack-forms/get-status-counts',
		);

		foreach ( $expected_abilities as $ability_name ) {
			$found = false;
			foreach ( $forms_abilities as $ability ) {
				if ( $ability->get_name() === $ability_name ) {
					$found = true;
					break;
				}
			}
			$this->assertTrue( $found, "Ability {$ability_name} should be registered" );
		}
	}

	/**
	 * Test ability execution - get form responses (empty list is okay).
	 */
	public function test_get_form_responses_ability() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Forms_Abilities::register_abilities();

		wp_set_current_user( self::$user_id );

		$ability = wp_get_ability( 'jetpack-forms/get-responses' );
		$this->assertNotNull( $ability, 'get-responses ability should exist' );

		$result = $ability->execute(
			array(
				'per_page' => 10,
				'page'     => 1,
			)
		);

		$this->assertNotInstanceOf( \WP_Error::class, $result, 'get-responses should not return WP_Error' );
		$this->assertIsArray( $result, 'get-responses should return an array' );
	}

	/**
	 * Test ability execution - get status counts.
	 */
	public function test_get_status_counts_ability() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Forms_Abilities::register_abilities();

		wp_set_current_user( self::$user_id );

		$ability = wp_get_ability( 'jetpack-forms/get-status-counts' );
		$this->assertNotNull( $ability, 'get-status-counts ability should exist' );

		$result = $ability->execute( array() );

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
	 * Test ability callback - update_form_response with missing ID.
	 */
	public function test_update_form_response_missing_id() {
		$result = Forms_Abilities::update_form_response( array() );

		$this->assertInstanceOf( \WP_Error::class, $result, 'Should return WP_Error when ID is missing' );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test that abilities handle Abilities API not being available gracefully.
	 */
	public function test_abilities_handle_missing_abilities_api() {
		// The init should not cause fatal errors even if Abilities API is not available
		Forms_Abilities::init();

		// If wp_abilities_api_init hasn't fired, trigger it
		if ( ! did_action( 'wp_abilities_api_init' ) ) {
			do_action( 'wp_abilities_api_init' );
		}

		// Should complete without errors
		$this->assertTrue( true, 'Abilities initialization should handle missing Abilities API gracefully' );
	}

	/**
	 * Test that register_abilities can be called multiple times safely.
	 */
	public function test_register_abilities_idempotent() {
		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Forms_Abilities::register_abilities();

		// Call register_abilities multiple times
		Forms_Abilities::register_abilities();
		Forms_Abilities::register_abilities();

		// Should not cause errors
		$this->assertTrue( true, 'register_abilities should be idempotent' );
	}

	/**
	 * Test that ability category is registered.
	 */
	public function test_ability_category_registered() {
		if ( ! function_exists( 'wp_has_ability_category' ) ) {
			$this->markTestSkipped( 'Abilities API category functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();

		$this->assertTrue(
			wp_has_ability_category( Forms_Abilities::CATEGORY_SLUG ),
			'Jetpack Forms ability category should be registered'
		);
	}

	/**
	 * Test get_form_responses callback directly.
	 */
	public function test_get_form_responses_callback() {
		wp_set_current_user( self::$user_id );

		$result = Forms_Abilities::get_form_responses( array( 'per_page' => 5 ) );

		$this->assertIsArray( $result, 'get_form_responses should return an array' );
	}

	/**
	 * Test get_status_counts callback directly.
	 */
	public function test_get_status_counts_callback() {
		wp_set_current_user( self::$user_id );

		$result = Forms_Abilities::get_status_counts( array() );

		$this->assertIsArray( $result, 'get_status_counts should return an array' );
		$this->assertArrayHasKey( 'inbox', $result );
		$this->assertArrayHasKey( 'spam', $result );
		$this->assertArrayHasKey( 'trash', $result );
	}
}
