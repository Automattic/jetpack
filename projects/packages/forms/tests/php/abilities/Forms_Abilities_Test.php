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
use Automattic\Jetpack\Forms\ContactForm\Response_Export_Link;
use Automattic\Jetpack\Forms\ContactForm\Utility;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../contact-form/class-utility.php';

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
			'jetpack-forms/export-responses',
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
		$content .= '<!-- wp:jetpack/field-text {"required":true,"helpText":"Use your legal name."} -->';
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
		$this->assertSame( 'Use your legal name.', $result['fields'][0]['help_text'] );
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

	/**
	 * Creates a legacy response to the form on the given post.
	 *
	 * @param int    $form_id Post the form lives on.
	 * @param string $status  Response status.
	 * @return int Response ID.
	 */
	private static function make_response( int $form_id, string $status = 'publish' ): int {
		global $post;
		$post = get_post( $form_id );
		$id   = (int) Utility::create_legacy_feedback( array(), 'Comment', 'Author', 'author@example.com', 'http://example.com', '127.0.0.1', 'Subject', $status );
		$post = null;
		return $id;
	}

	/**
	 * Answers the export's response queries for the given IDs, since the test
	 * database cannot run post queries, and records each query it was asked.
	 *
	 * @param int[] $ids Response IDs that match the export.
	 * @return \ArrayObject Receives the query vars of each export query.
	 */
	private function answer_export_query( array $ids ): \ArrayObject {
		$queries = new \ArrayObject();
		$forms   = array_values( array_unique( array_filter( array_map( 'wp_get_post_parent_id', $ids ) ) ) );
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $ids, $forms, $queries ) {
				if ( 'feedback' !== $query->get( 'post_type' ) ) {
					return $posts;
				}
				$queries->append( $query->query_vars );
				if ( 'id=>parent' !== $query->get( 'fields' ) ) {
					return $ids;
				}
				return array_map(
					static function ( $form ) {
						return (object) array(
							'ID'          => $form,
							'post_parent' => $form,
						);
					},
					array_slice( $forms, 0, $query->get( 'posts_per_page' ) )
				);
			},
			10,
			2
		);
		add_filter(
			'found_posts',
			static function ( $found, $query ) use ( $ids, $forms ) {
				if ( 'feedback' !== $query->get( 'post_type' ) ) {
					return $found;
				}
				return 'id=>parent' === $query->get( 'fields' ) ? count( $forms ) : count( $ids );
			},
			10,
			2
		);
		return $queries;
	}

	/**
	 * @dataProvider provide_export_roles
	 *
	 * @param string $role    Role of the user asking.
	 * @param bool   $allowed Whether the export may run.
	 */
	#[DataProvider( 'provide_export_roles' )]
	public function test_export_responses_runs_only_for_users_who_can_export( $role, $allowed ) {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API functions not available' );
		}
		$this->simulate_doing_wp_abilities_categories_init_action();
		Forms_Abilities::register_category();
		$this->simulate_doing_wp_abilities_init_action();
		Forms_Abilities::register_abilities();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => "export_$role",
					'user_pass'  => '123',
					'role'       => $role,
				)
			)
		);

		$this->assertSame( $allowed, true === wp_get_ability( 'jetpack-forms/export-responses' )->check_permissions() );
	}

	/**
	 * Roles and whether each may export, since an export holds every response's personal data.
	 */
	public static function provide_export_roles() {
		return array(
			'administrator' => array( 'administrator', true ),
			'editor'        => array( 'editor', false ),
			'subscriber'    => array( 'subscriber', false ),
		);
	}

	public function test_export_responses_returns_count_forms_and_a_link_for_the_current_user() {
		wp_set_current_user( self::$user_id );
		$contact = (int) wp_insert_post( array( 'post_title' => 'Contact' ) );
		$survey  = (int) wp_insert_post( array( 'post_title' => 'Survey' ) );
		$this->answer_export_query( array( self::make_response( $contact ), self::make_response( $contact ), self::make_response( $survey ) ) );

		$result = Forms_Abilities::export_responses( array() );

		$this->assertSame( 3, $result['count'] );
		$this->assertSame(
			array(
				array(
					'id'    => $contact,
					'title' => 'Contact',
				),
				array(
					'id'    => $survey,
					'title' => 'Survey',
				),
			),
			$result['forms']
		);
		$this->assertSame( 2, $result['forms_total'] );
		$this->assertEqualsWithDelta( time() + Response_Export_Link::LIFETIME, strtotime( $result['expires_at'] ), 5 );

		$query = array();
		wp_parse_str( (string) wp_parse_url( $result['download_url'], PHP_URL_QUERY ), $query );
		$this->assertIsArray( Response_Export_Link::resolve( $query['token'], self::$user_id ) );
	}

	public function test_export_responses_lists_at_most_fifty_forms_but_counts_them_all() {
		wp_set_current_user( self::$user_id );
		$responses = array( self::make_response( 0 ) );
		for ( $i = 0; $i <= Forms_Abilities::EXPORT_MAX_FORMS; $i++ ) {
			$responses[] = self::make_response( (int) wp_insert_post( array( 'post_title' => "Form $i" ) ) );
		}
		$queries = $this->answer_export_query( $responses );

		$result = Forms_Abilities::export_responses( array() );

		$this->assertSame( Forms_Abilities::EXPORT_MAX_FORMS + 2, $result['count'] );
		$this->assertCount( Forms_Abilities::EXPORT_MAX_FORMS, $result['forms'] );
		$this->assertSame( Forms_Abilities::EXPORT_MAX_FORMS + 1, $result['forms_total'], 'A response with no form must not count as a form.' );
		$this->assertNotContains( -1, array_column( $queries->getArrayCopy(), 'posts_per_page' ), 'The summary must not load every response.' );
	}

	public function test_export_responses_link_repeats_the_requested_filters() {
		wp_set_current_user( self::$user_id );
		$contact = (int) wp_insert_post( array( 'post_title' => 'Contact' ) );
		$this->answer_export_query( array( self::make_response( $contact ) ) );

		$result = Forms_Abilities::export_responses(
			array(
				'form_id'                => $contact,
				'status'                 => 'spam',
				'search'                 => 'invoice',
				'after'                  => '2026-10-01T00:00:00Z',
				'before'                 => '2026-11-01T00:00:00Z',
				'include_test_responses' => true,
			)
		);

		$query = array();
		wp_parse_str( (string) wp_parse_url( $result['download_url'], PHP_URL_QUERY ), $query );
		$this->assertSame(
			array(
				'filters'                => array(
					'status' => 'spam',
					'search' => 'invoice',
					'form'   => $contact,
					'after'  => '2026-10-01T00:00:00Z',
					'before' => '2026-11-01T00:00:00Z',
				),
				'include_test_responses' => true,
			),
			Response_Export_Link::resolve( $query['token'], self::$user_id )
		);
	}

	public function test_export_responses_queries_one_form_and_date_range() {
		wp_set_current_user( self::$user_id );
		$queries = $this->answer_export_query( array() );

		Forms_Abilities::export_responses(
			array(
				'form_id' => 12,
				'after'   => '2026-10-01T00:00:00Z',
				'before'  => '2026-11-01T00:00:00Z',
			)
		);

		$this->assertSame( 12, $queries[0]['post_parent'] );
		$this->assertSame(
			array(
				'after'  => '2026-10-01 00:00:00',
				'before' => '2026-11-01 00:00:00',
			),
			$queries[0]['date_query']
		);
	}

	public function test_export_responses_reads_dates_with_a_timezone_in_site_time() {
		wp_set_current_user( self::$user_id );
		update_option( 'timezone_string', 'Asia/Tokyo' );
		$queries = $this->answer_export_query( array() );

		Forms_Abilities::export_responses(
			array(
				'after'  => '2026-10-01T00:00:00Z',
				'before' => '2026-11-01T09:00:00+09:00',
			)
		);

		$this->assertSame(
			array(
				'after'  => '2026-10-01 09:00:00',
				'before' => '2026-11-01 09:00:00',
			),
			$queries[0]['date_query']
		);
	}

	public function test_export_responses_accepts_a_range_that_is_in_order_in_site_time() {
		wp_set_current_user( self::$user_id );
		update_option( 'timezone_string', 'Asia/Tokyo' );
		$this->answer_export_query( array() );

		$result = Forms_Abilities::export_responses(
			array(
				'after'  => '2026-10-01T05:00:00',
				'before' => '2026-10-01T00:00:00Z',
			)
		);

		$this->assertIsArray( $result );
	}

	public function test_export_with_a_search_term_stays_oldest_first() {
		$queries = $this->answer_export_query( array() );

		Contact_Form_Plugin::init()->get_export_feedback_ids( array( 'search' => 'invoice' ) );

		$this->assertSame( 'date', $queries[0]['orderby'], 'WP_Query sorts a search by relevance unless told otherwise.' );
		$this->assertSame( 'ASC', $queries[0]['order'] );
	}

	/**
	 * @dataProvider provide_test_response_inputs
	 *
	 * @param array $input    Ability input.
	 * @param bool  $excluded Whether the count and the file leave test responses out.
	 */
	#[DataProvider( 'provide_test_response_inputs' )]
	public function test_export_responses_counts_test_responses_only_when_the_file_has_them( $input, $excluded ) {
		wp_set_current_user( self::$user_id );
		$queries = $this->answer_export_query( array( self::make_response( 0 ) ) );

		$result = Forms_Abilities::export_responses( $input );

		$query = array();
		wp_parse_str( (string) wp_parse_url( $result['download_url'], PHP_URL_QUERY ), $query );
		$link = Response_Export_Link::resolve( $query['token'], self::$user_id );
		$this->assertSame( $excluded, ! empty( $queries[0]['meta_query'] ) );
		$this->assertSame( $excluded, ! empty( $link['filters']['exclude_test_responses'] ) );
	}

	/**
	 * Inputs and whether each leaves out form preview test responses.
	 */
	public static function provide_test_response_inputs() {
		return array(
			'default'  => array( array(), true ),
			'excluded' => array( array( 'include_test_responses' => false ), true ),
			'included' => array( array( 'include_test_responses' => true ), false ),
		);
	}

	/**
	 * @dataProvider provide_export_statuses
	 *
	 * @param array        $input       Ability input.
	 * @param string|array $post_status Expected query post status.
	 */
	#[DataProvider( 'provide_export_statuses' )]
	public function test_export_responses_queries_the_requested_folder( $input, $post_status ) {
		wp_set_current_user( self::$user_id );
		$queries = $this->answer_export_query( array() );

		Forms_Abilities::export_responses( $input );

		$this->assertEqualsCanonicalizing( $post_status, $queries[0]['post_status'] );
	}

	/**
	 * Folders and the post status each one queries.
	 */
	public static function provide_export_statuses() {
		return array(
			'no status' => array( array(), array( 'publish', 'draft' ) ),
			'inbox'     => array( array( 'status' => 'inbox' ), array( 'publish', 'draft' ) ),
			'spam'      => array( array( 'status' => 'spam' ), 'spam' ),
			'trash'     => array( array( 'status' => 'trash' ), 'trash' ),
		);
	}

	public function test_export_responses_with_no_matches_returns_no_link() {
		wp_set_current_user( self::$user_id );
		$this->answer_export_query( array() );

		$result = Forms_Abilities::export_responses( array() );

		$this->assertSame( 0, $result['count'] );
		$this->assertSame( array(), $result['forms'] );
		$this->assertNull( $result['download_url'] );
		$this->assertNull( $result['expires_at'] );
	}

	/**
	 * @dataProvider provide_bad_dates
	 *
	 * @param array  $input Ability input.
	 * @param string $code  Expected error code.
	 */
	#[DataProvider( 'provide_bad_dates' )]
	public function test_export_responses_rejects_bad_dates( $input, $code ) {
		wp_set_current_user( self::$user_id );

		$result = Forms_Abilities::export_responses( $input );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
	}

	/**
	 * Date inputs the ability must refuse.
	 */
	public static function provide_bad_dates() {
		return array(
			'unreadable after'   => array( array( 'after' => 'last month-ish' ), 'jetpack_forms_invalid_date' ),
			'unreadable before'  => array( array( 'before' => 'soonish' ), 'jetpack_forms_invalid_date' ),
			'range ends earlier' => array(
				array(
					'after'  => '2026-11-01T00:00:00Z',
					'before' => '2026-10-01T00:00:00Z',
				),
				'jetpack_forms_invalid_date_range',
			),
			'empty range'        => array(
				array(
					'after'  => '2026-11-01T00:00:00Z',
					'before' => '2026-11-01T00:00:00Z',
				),
				'jetpack_forms_invalid_date_range',
			),
		);
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Forms_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'public', $spec['meta'], "{$slug} must declare meta.public." );
			$this->assertTrue( $spec['meta']['public'], "{$slug} must be marked public." );
			$this->assertTrue( $spec['meta']['show_in_rest'], "{$slug} must be exposed through the Abilities REST API." );
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "{$slug} must publish meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}
}
