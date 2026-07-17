<?php
/**
 * Unit tests for Jetpack Forms Abilities
 *
 * @package automattic/jetpack-forms
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that
 * @phan-file-suppress PhanPluginDuplicateAdjacentStatement -- Intentional for idempotency test
 */

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
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
		global $wp_rest_server;

		Contact_Form_Plugin::init();

		// Register the jetpack_form post type and initialize REST routes
		// so rest_do_request() can dispatch to /wp/v2/jetpack-forms.
		Contact_Form::register_post_type();
		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );

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
	 * Insert a Jetpack form post for fixture purposes.
	 *
	 * @param string $title   Post title.
	 * @param string $content Post content (typically block markup).
	 * @return int Inserted post ID.
	 */
	private static function make_form( string $title, string $content = '' ): int {
		return (int) wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => 'publish',
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
	 * Forms abilities shipped before the `jetpack_wp_abilities_enabled` gate
	 * existed; init() must register them even when the filter returns false,
	 * otherwise the previously-public get-responses / update-response /
	 * get-status-counts abilities would silently disappear.
	 */
	public function test_init_registers_abilities_even_when_rollout_filter_is_disabled() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API query functions not available' );
			return;
		}

		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		try {
			Forms_Abilities::init();

			if ( ! did_action( 'wp_abilities_api_categories_init' ) ) {
				do_action( 'wp_abilities_api_categories_init' );
			}
			if ( ! did_action( 'wp_abilities_api_init' ) ) {
				do_action( 'wp_abilities_api_init' );
			}

			$this->assertTrue(
				wp_has_ability( 'jetpack-forms/get-responses' ),
				'Pre-existing forms abilities must register regardless of the rollout filter.'
			);
		} finally {
			remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		}
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
			'jetpack-forms/list-forms',
			'jetpack-forms/get-form',
			'jetpack-forms/create-form',
			'jetpack-forms/delete-form',
			'jetpack-forms/get-responses',
			'jetpack-forms/update-response',
			'jetpack-forms/bulk-update-responses',
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

	/**
	 * Test get_form with missing ID.
	 */
	public function test_get_form_missing_id() {
		$result = Forms_Abilities::get_form( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test get_form with non-existent ID.
	 */
	public function test_get_form_not_found() {
		$result = Forms_Abilities::get_form( array( 'id' => 999999 ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_post_invalid_id', $result->get_error_code() );
	}

	/**
	 * Test get_form with a valid form post.
	 */
	public function test_get_form_success() {
		wp_set_current_user( self::$user_id );

		$post_id = self::make_form(
			'Test Form',
			'<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Name","required":true} /--><!-- /wp:jetpack/contact-form -->'
		);

		$result = Forms_Abilities::get_form( array( 'id' => $post_id ) );

		$this->assertIsArray( $result );
		$this->assertEquals( $post_id, $result['id'] );
		$this->assertEquals( 'Test Form', $result['title'] );
		$this->assertEquals( 'publish', $result['status'] );
		$this->assertIsArray( $result['fields'] );
		$this->assertCount( 1, $result['fields'], 'Expected one extracted jetpack/field-text block.' );
		$this->assertSame( 'Name', $result['fields'][0]['label'] );
		$this->assertSame( 'text', $result['fields'][0]['type'] );
		$this->assertTrue( $result['fields'][0]['required'] );
	}

	/**
	 * Modern Jetpack form fields nest the label/placeholder in jetpack/label
	 * and jetpack/input sub-blocks rather than inline on the field block.
	 * Regression guard: get-form must extract these — the previous version
	 * read attrs.label only and silently returned an empty fields array for
	 * every modern form.
	 */
	public function test_get_form_extracts_fields_with_inner_label_sub_blocks() {
		wp_set_current_user( self::$user_id );

		$content  = '<!-- wp:jetpack/contact-form -->';
		$content .= '<!-- wp:jetpack/field-text {"required":true} -->';
		$content .= '<!-- wp:jetpack/label {"label":"Full name"} /-->';
		$content .= '<!-- wp:jetpack/input {"type":"text","placeholder":"Enter your name"} /-->';
		$content .= '<!-- /wp:jetpack/field-text -->';
		$content .= '<!-- wp:jetpack/field-email -->';
		$content .= '<!-- wp:jetpack/label {"label":"Email"} /-->';
		$content .= '<!-- wp:jetpack/input {"type":"email"} /-->';
		$content .= '<!-- /wp:jetpack/field-email -->';
		$content .= '<!-- /wp:jetpack/contact-form -->';

		$post_id = self::make_form( 'Modern Form', $content );

		$result = Forms_Abilities::get_form( array( 'id' => $post_id ) );

		$this->assertCount( 2, $result['fields'], 'Both fields should be extracted from inner-block label structure.' );
		$this->assertSame( 'Full name', $result['fields'][0]['label'] );
		$this->assertSame( 'text', $result['fields'][0]['type'] );
		$this->assertTrue( $result['fields'][0]['required'] );
		$this->assertSame( 'Enter your name', $result['fields'][0]['placeholder'] );
		$this->assertSame( 'Email', $result['fields'][1]['label'] );
		$this->assertSame( 'email', $result['fields'][1]['type'] );
		$this->assertFalse( $result['fields'][1]['required'] );
	}

	/**
	 * Test create_form with missing title.
	 */
	public function test_create_form_missing_title() {
		$result = Forms_Abilities::create_form( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_title', $result->get_error_code() );
	}

	/**
	 * Test create_form success.
	 */
	public function test_create_form_success() {
		wp_set_current_user( self::$user_id );

		$result = Forms_Abilities::create_form( array( 'title' => 'My New Form' ) );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'id', $result );
		$this->assertEquals( 'My New Form', $result['title'] );
		$this->assertEquals( 'publish', $result['status'] );
	}

	/**
	 * Test create_form with custom content.
	 */
	public function test_create_form_with_content() {
		wp_set_current_user( self::$user_id );

		$content = '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->';
		$result  = Forms_Abilities::create_form(
			array(
				'title'   => 'Custom Form',
				'content' => $content,
				'status'  => 'draft',
			)
		);

		$this->assertIsArray( $result );
		$this->assertEquals( 'Custom Form', $result['title'] );
		$this->assertEquals( 'draft', $result['status'] );

		$post = get_post( $result['id'] );
		$this->assertStringContainsString( 'jetpack/field-email', $post->post_content );
		$this->assertStringContainsString( 'jetpack/contact-form', $post->post_content );
	}

	/**
	 * Test delete_form with missing ID.
	 */
	public function test_delete_form_missing_id() {
		$result = Forms_Abilities::delete_form( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_id', $result->get_error_code() );
	}

	/**
	 * Test delete_form with non-existent ID.
	 */
	public function test_delete_form_not_found() {
		$result = Forms_Abilities::delete_form( array( 'id' => 999999 ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_post_invalid_id', $result->get_error_code() );
	}

	/**
	 * Test delete_form success.
	 */
	public function test_delete_form_success() {
		wp_set_current_user( self::$user_id );

		$post_id = self::make_form( 'Form to Delete' );

		$result = Forms_Abilities::delete_form( array( 'id' => $post_id ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['deleted'] );
		$this->assertEquals( 'trash', $result['status'] );
		$this->assertEquals( 'trash', get_post_status( $post_id ) );
	}

	/**
	 * Test bulk_update_responses with missing params.
	 */
	public function test_bulk_update_responses_missing_params() {
		$result = Forms_Abilities::bulk_update_responses( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_params', $result->get_error_code() );
	}

	/**
	 * Insert a feedback (response) post for fixture purposes.
	 *
	 * @param string $title  Title.
	 * @param string $status Initial status.
	 * @return int Inserted post ID.
	 */
	private static function make_feedback( string $title, string $status = 'publish' ): int {
		return (int) wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_title'  => $title,
				'post_status' => $status,
			)
		);
	}

	public function test_bulk_update_responses_returns_per_id_confirmation() {
		wp_set_current_user( self::$user_id );

		$id_a = self::make_feedback( 'A' );
		$id_b = self::make_feedback( 'B' );

		$result = Forms_Abilities::bulk_update_responses(
			array(
				'action' => 'mark_as_spam',
				'ids'    => array( $id_a, $id_b ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'mark_as_spam', $result['action'] );
		$this->assertEqualsCanonicalizing( array( $id_a, $id_b ), $result['succeeded'] );
		$this->assertSame( array(), $result['failed'] );

		$this->assertSame( 'spam', get_post_status( $id_a ) );
		$this->assertSame( 'spam', get_post_status( $id_b ) );
	}

	public function test_bulk_update_responses_marks_not_spam_restores_publish_status() {
		wp_set_current_user( self::$user_id );

		$id = self::make_feedback( 'Spammed', 'spam' );

		$result = Forms_Abilities::bulk_update_responses(
			array(
				'action' => 'mark_as_not_spam',
				'ids'    => array( $id ),
			)
		);

		$this->assertSame( array( $id ), $result['succeeded'] );
		$this->assertSame( array(), $result['failed'] );
		$this->assertSame( 'publish', get_post_status( $id ) );
	}

	public function test_bulk_update_responses_reports_failures_per_id() {
		wp_set_current_user( self::$user_id );

		$valid   = self::make_feedback( 'Real' );
		$missing = 999999;

		$result = Forms_Abilities::bulk_update_responses(
			array(
				'action' => 'mark_as_spam',
				'ids'    => array( $valid, $missing ),
			)
		);

		$this->assertSame( array( $valid ), $result['succeeded'] );
		$this->assertCount( 1, $result['failed'] );
		$this->assertSame( $missing, $result['failed'][0]['id'] );
		$this->assertNotEmpty( $result['failed'][0]['code'] );
		$this->assertNotEmpty( $result['failed'][0]['message'] );
	}

	public function test_bulk_update_responses_dedupes_repeated_ids() {
		wp_set_current_user( self::$user_id );

		$id = self::make_feedback( 'Dupe' );

		$result = Forms_Abilities::bulk_update_responses(
			array(
				'action' => 'mark_as_spam',
				'ids'    => array( $id, $id, $id ),
			)
		);

		$this->assertSame( array( $id ), $result['succeeded'], 'Duplicate IDs in input should collapse to one succeeded entry.' );
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Forms_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "{$slug} must publish meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}
}
