<?php

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * To run this test, you can use the following command: (from the projects/packages/forms directory)
 *
 * composer test-php tests/php/contact-form/Contact_Form_Endpoint_Test.php
 */
class Contact_Form_Endpoint_Test extends TestCase {

	private $send_email_called = false;
	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The plugin instance.
	 *
	 * @var Contact_Form_Plugin
	 */
	private $plugin;

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		// Avoid actually trying to send any mail.
		add_filter( 'pre_wp_mail', '__return_true', PHP_INT_MAX );
	}

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$this->plugin = Contact_Form_Plugin::init();

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();
	}

	/**
	 * Test GET feedback/filters
	 */
	public function test_get_feedbacks_filters_returns_200() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/filters' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'date', $data );
		$this->assertArrayHasKey( 'source', $data );
	}

	/**
	 * Test GET feedback/filters unautorized.
	 */
	public function test_get_feedbacks_filters_returns_401() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/filters' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test GET feedback/count
	 */
	public function test_get_feedbacks_count_returns_200() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'inbox', $data );
		$this->assertArrayHasKey( 'spam', $data );
		$this->assertArrayHasKey( 'trash', $data );
	}

	/**
	 * Test GET feedback/count unautorized.
	 */
	public function test_get_feedbacks_count_returns_401() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test DELETE feedback/trash
	 */
	public function test_empty_trash_returns_200() {
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'deleted', $data );
	}

	/**
	 * Test DELETE feedback/trash unautorized.
	 */
	public function test_empty_trash_returns_401() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test item schema.
	 */
	public function test_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/feedback' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema_properties = $data['schema']['properties'];
		$this->assertArrayHasKey( 'uid', $schema_properties );
		$this->assertArrayHasKey( 'author_name', $schema_properties );
		$this->assertArrayHasKey( 'author_display_name', $schema_properties );
		$this->assertArrayHasKey( 'author_email', $schema_properties );
		$this->assertArrayHasKey( 'author_url', $schema_properties );
		$this->assertArrayHasKey( 'author_avatar', $schema_properties );
		$this->assertArrayHasKey( 'email_marketing_consent', $schema_properties );
		$this->assertArrayHasKey( 'ip', $schema_properties );
		$this->assertArrayHasKey( 'country_code', $schema_properties );
		$this->assertArrayHasKey( 'browser', $schema_properties );
		$this->assertArrayHasKey( 'logged_in_user', $schema_properties );
		$this->assertArrayHasKey( 'entry_title', $schema_properties );
		$this->assertArrayHasKey( 'entry_permalink', $schema_properties );
		$this->assertArrayHasKey( 'subject', $schema_properties );
		$this->assertArrayHasKey( 'fields', $schema_properties );
		$this->assertArrayHasKey( 'is_unread', $schema_properties );
		$this->assertArrayHasKey( 'is_test', $schema_properties );
		$this->assertEquals( 'boolean', $schema_properties['is_test']['type'] );
		$this->assertArrayHasKey( 'preview_url', $schema_properties );

		// Verify logged_in_user schema structure
		$logged_in_user_schema = $schema_properties['logged_in_user'];
		$this->assertArrayHasKey( 'type', $logged_in_user_schema );
		$this->assertContains( 'object', $logged_in_user_schema['type'] );
		$this->assertContains( 'null', $logged_in_user_schema['type'] );
		$this->assertArrayHasKey( 'properties', $logged_in_user_schema );
		$this->assertArrayHasKey( 'display_name', $logged_in_user_schema['properties'] );
		$this->assertArrayHasKey( 'username', $logged_in_user_schema['properties'] );
		$this->assertArrayHasKey( 'id', $logged_in_user_schema['properties'] );

		// Also make sure that we don't have fields that are not relevant to feedback.
		$this->assertArrayNotHasKey( 'link', $schema_properties );
		$this->assertArrayNotHasKey( 'password', $schema_properties );
		$this->assertArrayNotHasKey( 'template', $schema_properties );
		$this->assertArrayNotHasKey( 'title', $schema_properties );
		$this->assertArrayNotHasKey( 'content', $schema_properties );
		$this->assertArrayNotHasKey( 'excerpt', $schema_properties );
	}

	/**
	 * Helper: insert a v3-format feedback post, optionally flagged as a test submission.
	 *
	 * @param bool $is_test Whether to mark the feedback as a test submission.
	 * @return int The new feedback post ID.
	 */
	private function insert_v3_feedback_post( $is_test = false ) {
		$content = array(
			'subject'     => 'Subject',
			'ip'          => '127.0.0.1',
			'entry_title' => 'Source Post',
			'entry_page'  => 1,
			'source_id'   => 0,
			'source_type' => 'single',
			'request_url' => '',
			'fields'      => array(
				array(
					'id'    => '1_Name',
					'label' => 'Name',
					'type'  => 'text',
					'value' => $is_test ? 'Preview Tester' : 'Real User',
				),
			),
		);

		if ( $is_test ) {
			$content['is_test'] = true;
		}

		Feedback::clear_cache();

		return wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => 'Response ' . ( $is_test ? 'test' : 'real' ) . ' ' . microtime(),
				'post_content'   => wp_json_encode( $content, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v3',
			)
		);
	}

	/**
	 * A real feedback row exposes is_test = false and preview_url = null.
	 */
	public function test_get_item_exposes_is_test_false_for_real_feedback() {
		$post_id = $this->insert_v3_feedback_post( false );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'is_test', $data );
		$this->assertFalse( $data['is_test'] );
		$this->assertArrayHasKey( 'preview_url', $data );
		$this->assertNull( $data['preview_url'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * A feedback row flagged as test exposes is_test = true and a preview_url
	 * when a parent form is available and the current user can preview it.
	 */
	public function test_get_item_exposes_is_test_true_for_preview_feedback() {
		// Register the jetpack_form CPT so the Feedback loader picks up the
		// post_parent as the form_id and preview URL generation can run.
		if ( ! post_type_exists( Contact_Form::POST_TYPE ) ) {
			register_post_type(
				Contact_Form::POST_TYPE,
				array(
					'public'       => false,
					'show_ui'      => true,
					'map_meta_cap' => true,
				)
			);
		}
		$form_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Preview Test Form',
				'post_content' => '<!-- wp:jetpack/contact-form /-->',
				'post_author'  => self::$user_id,
			)
		);

		$post_id = $this->insert_v3_feedback_post( true );
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_parent' => $form_id,
			)
		);
		Feedback::clear_cache();

		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'is_test', $data );
		$this->assertTrue( $data['is_test'] );
		$this->assertArrayHasKey( 'preview_url', $data );
		$this->assertIsString( $data['preview_url'] );
		$this->assertStringContainsString( 'jetpack_form_preview=' . $form_id, $data['preview_url'] );

		wp_delete_post( $post_id, true );
		wp_delete_post( $form_id, true );
	}

	/**
	 * Test GET feedback/integrations with version 1 format
	 */
	public function test_get_integrations_v1_returns_200() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );
		$request->set_param( 'version', 1 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify response code
		$this->assertEquals( 200, $response->get_status() );

		// Verify basic structure (object format for v1)
		$this->assertIsArray( $data );

		// Verify required integrations exist
		$this->assertArrayHasKey( 'akismet', $data );
		$this->assertArrayHasKey( 'zero-bs-crm', $data );
		$this->assertArrayHasKey( 'google-drive', $data );
		$this->assertArrayHasKey( 'mailpoet', $data );

		// Verify structure of one integration
		$this->assertArrayHasKey( 'type', $data['akismet'] );
		$this->assertArrayHasKey( 'isInstalled', $data['akismet'] );
		$this->assertArrayHasKey( 'isActive', $data['akismet'] );
		$this->assertArrayHasKey( 'isConnected', $data['akismet'] );
		$this->assertArrayHasKey( 'needsConnection', $data['akismet'] );
		$this->assertArrayHasKey( 'title', $data['akismet'] );
		$this->assertArrayHasKey( 'subtitle', $data['akismet'] );

		// Verify structure of google-drive
		$this->assertArrayHasKey( 'type', $data['google-drive'] );
		$this->assertArrayHasKey( 'isInstalled', $data['google-drive'] );
		$this->assertArrayHasKey( 'isActive', $data['google-drive'] );
		$this->assertArrayHasKey( 'isConnected', $data['google-drive'] );
		$this->assertArrayHasKey( 'needsConnection', $data['google-drive'] );
	}

	/**
	 * Test GET feedback/integrations with version 2 format
	 */
	public function test_get_integrations_v2_returns_200() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );
		$request->set_param( 'version', 2 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify response code
		$this->assertEquals( 200, $response->get_status() );

		// Verify basic structure (array format for v2)
		$this->assertIsArray( $data );
		$this->assertNotEmpty( $data, 'Should have at least one integration' );

		// Verify core integrations are present (by id)
		$integration_ids = array_column( $data, 'id' );
		$this->assertContains( 'akismet', $integration_ids );
		$this->assertContains( 'zero-bs-crm', $integration_ids );
		$this->assertContains( 'google-drive', $integration_ids );
		$this->assertContains( 'mailpoet', $integration_ids );

		// Verify structure of each integration
		foreach ( $data as $integration ) {
			$this->assertArrayHasKey( 'id', $integration );
			$this->assertArrayHasKey( 'type', $integration );
			$this->assertArrayHasKey( 'slug', $integration );
			$this->assertArrayHasKey( 'isInstalled', $integration );
			$this->assertArrayHasKey( 'isActive', $integration );
			$this->assertArrayHasKey( 'isConnected', $integration );
			$this->assertArrayHasKey( 'settingsUrl', $integration );
			$this->assertArrayHasKey( 'pluginFile', $integration );
			$this->assertArrayHasKey( 'version', $integration );
			$this->assertArrayHasKey( 'details', $integration );
			$this->assertArrayHasKey( 'needsConnection', $integration );
			$this->assertArrayHasKey( 'marketingUrl', $integration );
			$this->assertArrayHasKey( 'title', $integration );
			$this->assertArrayHasKey( 'subtitle', $integration );

			// Verify expected data types
			$this->assertIsString( $integration['id'] );
			$this->assertIsString( $integration['type'] );
			$this->assertIsString( $integration['slug'] );
			$this->assertIsBool( $integration['isInstalled'] );
			$this->assertIsBool( $integration['isActive'] );
			$this->assertIsBool( $integration['needsConnection'] );
			$this->assertIsBool( $integration['isConnected'] );
			$this->assertTrue( $integration['settingsUrl'] === null || is_string( $integration['settingsUrl'] ) );
			$this->assertTrue( $integration['pluginFile'] === null || is_string( $integration['pluginFile'] ) );
			$this->assertTrue( $integration['version'] === null || is_string( $integration['version'] ) );
			$this->assertIsArray( $integration['details'] );
			$this->assertTrue( $integration['marketingUrl'] === null || is_string( $integration['marketingUrl'] ) );
			$this->assertTrue( $integration['title'] === '' || is_string( $integration['title'] ) );
			$this->assertTrue( $integration['subtitle'] === '' || is_string( $integration['subtitle'] ) );
		}
	}

	/**
	 * Test GET feedback/integrations unauthorized access
	 */
	public function test_get_integrations_returns_401() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test GET feedback/integrations-metadata returns 200 and expected structure
	 */
	public function test_get_integrations_metadata_returns_200() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations-metadata' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify response code
		$this->assertEquals( 200, $response->get_status() );

		// Verify basic structure (array format)
		$this->assertIsArray( $data );
		$this->assertNotEmpty( $data, 'Should have at least one integration' );

		// Verify core integrations are present (by id)
		$integration_ids = array_column( $data, 'id' );
		$this->assertContains( 'akismet', $integration_ids );
		$this->assertContains( 'zero-bs-crm', $integration_ids );
		$this->assertContains( 'google-drive', $integration_ids );
		$this->assertContains( 'mailpoet', $integration_ids );

		// Verify structure of each integration - should only have metadata fields
		foreach ( $data as $integration ) {
			// Fields that SHOULD be present
			$this->assertArrayHasKey( 'id', $integration );
			$this->assertArrayHasKey( 'slug', $integration );
			$this->assertArrayHasKey( 'type', $integration );
			$this->assertArrayHasKey( 'title', $integration );
			$this->assertArrayHasKey( 'subtitle', $integration );
			$this->assertArrayHasKey( 'marketingUrl', $integration );
			$this->assertArrayHasKey( 'enabledByDefault', $integration );

			// Fields that should NOT be present (expensive to compute)
			$this->assertArrayNotHasKey( 'isInstalled', $integration );
			$this->assertArrayNotHasKey( 'isActive', $integration );
			$this->assertArrayNotHasKey( 'isConnected', $integration );
			$this->assertArrayNotHasKey( 'needsConnection', $integration );
			$this->assertArrayNotHasKey( 'settingsUrl', $integration );
			$this->assertArrayNotHasKey( 'pluginFile', $integration );
			$this->assertArrayNotHasKey( 'version', $integration );
			$this->assertArrayNotHasKey( 'details', $integration );

			// Verify expected data types
			$this->assertIsString( $integration['id'] );
			$this->assertIsString( $integration['slug'] );
			$this->assertIsString( $integration['type'] );
			$this->assertTrue( $integration['title'] === '' || is_string( $integration['title'] ) );
			$this->assertTrue( $integration['subtitle'] === '' || is_string( $integration['subtitle'] ) );
			$this->assertTrue( $integration['marketingUrl'] === null || is_string( $integration['marketingUrl'] ) );
			$this->assertIsBool( $integration['enabledByDefault'] );
		}
	}

	/**
	 * Test GET feedback/integrations-metadata unauthorized access
	 */
	public function test_get_integrations_metadata_returns_401() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations-metadata' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that metadata endpoint does not make any external HTTP calls
	 */
	public function test_get_integrations_metadata_makes_no_external_calls() {
		$http_requests_made = array();

		// Hook into HTTP API to track any external requests
		$http_filter = function ( $false, $parsed_args, $url ) use ( &$http_requests_made ) {
			$http_requests_made[] = $url;
			// Return a mock response to prevent actual calls
			return array(
				'headers'  => array(),
				'body'     => wp_json_encode( array(), JSON_UNESCAPED_SLASHES ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
			);
		};

		add_filter( 'pre_http_request', $http_filter, 10, 3 );

		// Make the request
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations-metadata' );
		$response = $this->server->dispatch( $request );

		// Remove the filter
		remove_filter( 'pre_http_request', $http_filter, 10 );

		// Verify the endpoint returns 200
		$this->assertEquals( 200, $response->get_status() );

		// Verify NO external HTTP requests were made
		$this->assertEmpty(
			$http_requests_made,
			'Metadata endpoint should not make any external HTTP requests. Found: ' . implode( ', ', $http_requests_made )
		);

		// Verify we still get data back
		$data = $response->get_data();
		$this->assertNotEmpty( $data, 'Should return integration metadata' );
	}

	/**
	 * Test that metadata endpoint returns consistent data with full endpoint
	 */
	public function test_integrations_metadata_consistency_with_full_endpoint() {
		// Fetch metadata endpoint
		$metadata_request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations-metadata' );
		$metadata_response = $this->server->dispatch( $metadata_request );
		$metadata_data     = $metadata_response->get_data();

		// Fetch full integrations endpoint
		$full_request = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );
		$full_request->set_param( 'version', 2 );
		$full_response = $this->server->dispatch( $full_request );
		$full_data     = $full_response->get_data();

		// Both should return the same number of integrations
		$this->assertSameSize( $full_data, $metadata_data, 'Metadata and full endpoints should return the same number of integrations' );

		// Build a map of metadata by slug
		$metadata_by_slug = array();
		foreach ( $metadata_data as $meta ) {
			$metadata_by_slug[ $meta['slug'] ] = $meta;
		}

		// Verify that metadata fields match between endpoints
		foreach ( $full_data as $integration ) {
			$slug = $integration['slug'];
			$this->assertArrayHasKey( $slug, $metadata_by_slug, "Integration $slug should be in metadata endpoint" );

			$meta = $metadata_by_slug[ $slug ];

			// Compare shared fields
			$this->assertEquals( $integration['id'], $meta['id'], "ID should match for $slug" );
			$this->assertEquals( $integration['slug'], $meta['slug'], "Slug should match for $slug" );
			$this->assertEquals( $integration['type'], $meta['type'], "Type should match for $slug" );
			$this->assertEquals( $integration['title'], $meta['title'], "Title should match for $slug" );
			$this->assertEquals( $integration['subtitle'], $meta['subtitle'], "Subtitle should match for $slug" );
			$this->assertEquals( $integration['marketingUrl'], $meta['marketingUrl'], "Marketing URL should match for $slug" );
			$this->assertEquals( $integration['enabledByDefault'], $meta['enabledByDefault'], "Enabled by default should match for $slug" );
		}
	}

	/**
	 * Test GET feedback/integrations/{slug} with a valid integration
	 */
	public function test_get_single_integration_returns_200_and_structure() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations/google-drive' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'slug', $data );
		$this->assertArrayHasKey( 'isInstalled', $data );
		$this->assertArrayHasKey( 'isActive', $data );
		$this->assertArrayHasKey( 'isConnected', $data );
		$this->assertArrayHasKey( 'settingsUrl', $data );
		$this->assertArrayHasKey( 'pluginFile', $data );
		$this->assertArrayHasKey( 'version', $data );
		$this->assertArrayHasKey( 'details', $data );
		$this->assertArrayHasKey( 'needsConnection', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'subtitle', $data );
	}

	/**
	 * Test GET feedback/integrations/{slug} with an invalid integration
	 */
	public function test_get_single_integration_returns_400_for_invalid_slug() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations/not-a-real-integration' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test GET feedback/integrations/{slug} unauthorized access
	 */
	public function test_get_single_integration_returns_401_for_unauthorized() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/integrations/google-drive' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test DELETE feedback/trash endpoint with default status
	 */
	public function test_delete_feedback_trash_default_status() {
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify response code
		$this->assertEquals( 200, $response->get_status() );

		// Verify response structure
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'deleted', $data );
		$this->assertIsInt( $data['deleted'] );
	}

	/**
	 * Test DELETE feedback/trash endpoint with spam status
	 */
	public function test_delete_feedback_trash_spam_status() {
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );
		$request->set_param( 'status', 'spam' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		// Verify response code
		$this->assertEquals( 200, $response->get_status() );

		// Verify response structure
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'deleted', $data );
		$this->assertIsInt( $data['deleted'] );
	}

	/**
	 * Test DELETE feedback/trash endpoint unauthorized access
	 */
	public function test_delete_feedback_trash_unauthorized() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test bulk actions with invalid action
	 */
	public function test_bulk_actions_invalid_action() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_param( 'action', 'invalid_action' );
		$request->set_param( 'post_ids', array( 1, 2, 3 ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
		$this->assertEquals( 'Invalid parameter(s): action', $data['message'] );
	}

	/**
	 * Test bulk actions with invalid post_ids parameter
	 */
	public function test_bulk_actions_invalid_post_ids() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_param( 'action', 'mark_as_spam' );
		$request->set_param( 'post_ids', 'not_an_array' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
		$this->assertEquals( 'Invalid parameter(s): post_ids', $data['message'] );
	}

	/**
	 * Test bulk actions mark_as_spam
	 */
	public function test_bulk_actions_mark_as_spam() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_param( 'action', 'mark_as_spam' );
		$request->set_param( 'post_ids', array( 1, 2, 3 ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array(), $response->get_data() );
	}

	/**
	 * Test bulk actions mark_as_not_spam
	 */
	public function test_bulk_actions_mark_as_not_spam() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_param( 'action', 'mark_as_not_spam' );
		$request->set_param( 'post_ids', array( 1, 2, 3 ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array(), $response->get_data() );
	}

	/**
	 * Test delete posts by status with invalid status
	 */
	public function test_delete_posts_by_status_invalid_status() {
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/feedback/trash' );
		$request->set_param( 'status', 'invalid_status' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
		$this->assertEquals( 'Invalid parameter(s): status', $data['message'] );
	}

	/**
	 * Test GET feedback/config returns expected structure for authorized user.
	 */
	public function test_get_forms_config_returns_200_and_keys() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/config' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();

		// Required keys
		$expected_keys = array(
			'formsResponsesUrl',
			'isMailPoetEnabled',
			'blogId',
			'gdriveConnectSupportURL',
			'pluginAssetsURL',
			'siteURL',
			'hasFeedback',
			'isIntegrationsEnabled',
			'dashboardURL',
			'canInstallPlugins',
			'canActivatePlugins',
			'exportNonce',
			'newFormNonce',
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $data );
		}

		// Basic type checks for a few fields
		$this->assertIsBool( $data['isMailPoetEnabled'] );
		$this->assertIsInt( $data['blogId'] );
		$this->assertIsBool( $data['canInstallPlugins'] );
		$this->assertIsBool( $data['canActivatePlugins'] );
		$this->assertIsString( $data['exportNonce'] );
		$this->assertIsString( $data['newFormNonce'] );
	}

	/**
	 * Test GET feedback/config unauthorized access.
	 */
	public function test_get_forms_config_returns_401_for_unauthorized() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/config' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test resend email functionality
	 */
	public function test_resend_email() {
		// Create a test feedback post
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'author name',
				'email' => 'email@example.com',
			),
			'This is a test comment content.',
			'author name',
			'test@example.com',
			null,
			null,
			'Test Subject',
			'spam'
		);
		// Add test metadata
		add_post_meta(
			$post_id,
			'_feedback_email',
			array(
				'to'      => 'test@example.com',
				'message' => 'Test message',
				'headers' => 'From: test@example.com',
			)
		);

		add_post_meta( $post_id, '_feedback_subject', 'Test Subject' );

		// Test the update_item method which triggers resend_email
		$request = new WP_REST_Request( 'PUT', '/wp/v2/feedback/' . $post_id );
		$request->set_param( 'status', 'publish' );

		// Mock the previous status
		add_filter( 'wp_mail', array( $this, 'mock_wp_mail_succeeded' ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $this->send_email_called, 'Email should have been sent' );

		$this->send_email_called = false; // Reset the flag
		remove_filter( 'wp_mail', array( $this, 'mock_wp_mail_succeeded' ) );
	}

	public function test_404_single_feedback_response() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/999999' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'rest_post_invalid_id', $data['code'] );
		$this->assertEquals( 'Invalid post ID.', $data['message'] );
	}

	/**
	 * Mock wp_mail_succeeded filter
	 */
	public function mock_wp_mail_succeeded( $data ) {
		$this->send_email_called = true;
		return $data;
	}

	/**
	 * Test get_collection_params
	 */
	public function test_get_collection_params() {
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$params   = $endpoint->get_collection_params();

		$this->assertArrayHasKey( 'parent', $params );
		$this->assertArrayHasKey( 'parent_exclude', $params );
		$this->assertArrayHasKey( 'is_unread', $params );

		$this->assertEquals( 'array', $params['parent']['type'] );
		$this->assertEquals( 'array', $params['parent_exclude']['type'] );
		$this->assertEquals( 'boolean', $params['is_unread']['type'] );

		$this->assertEquals( 'integer', $params['parent']['items']['type'] );
		$this->assertEquals( 'integer', $params['parent_exclude']['items']['type'] );
	}

	/**
	 * Test prepare_item_for_response with file fields
	 */
	public function test_prepare_item_for_response_with_files() {
		// Create a test feedback post with file attachment
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'feedback',
				'post_status'  => 'publish',
				'post_content' => '
AUTHOR: Test Author
AUTHOR EMAIL: author@example.com
SUBJECT: Test Subject
IP: 127.0.0.1

<!--more-->

JSON_DATA{"1_name":"Test Author","2_email":"author@example.com","3_file":{"field_id":"g1-file","files":[{"file_id":123,"name":"test.jpg","size":1024,"type":"image/jpeg"}]}}',
			)
		);

		// Add test metadata
		$all_fields = array(
			'1_name'  => 'Test Author',
			'2_email' => 'author@example.com',
			'3_file'  => array(
				'field_id' => 'g1-file',
				'files'    => array(
					array(
						'file_id' => 123,
						'name'    => 'test.jpg',
						'size'    => 1024,
						'type'    => 'image/jpeg',
					),
				),
			),
		);

		add_post_meta( $post_id, '_feedback_all_fields', $all_fields );
		add_post_meta( $post_id, '_feedback_author', 'Test Author' );
		add_post_meta( $post_id, '_feedback_author_email', 'author@example.com' );
		add_post_meta( $post_id, '_feedback_subject', 'Test Subject' );
		add_post_meta( $post_id, '_feedback_ip', '127.0.0.1' );

		// Test the get_item endpoint with collection format to get rich field data
		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$request->set_param( 'fields_format', 'collection' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		// Verify file field data in response (collection format returns array of field objects)
		$this->assertArrayHasKey( 'fields', $data );
		$this->assertIsArray( $data['fields'] );

		// Find the file field in the collection array
		$file_field = null;
		foreach ( $data['fields'] as $field ) {
			if ( isset( $field['type'] ) && $field['type'] === 'file' ) {
				$file_field = $field;
				break;
			}
		}

		$this->assertNotNull( $file_field, 'File field should exist in fields collection' );
		$this->assertArrayHasKey( 'value', $file_field );
		$this->assertArrayHasKey( 'files', $file_field['value'] );

		$file = $file_field['value']['files'][0];
		$this->assertEquals( 123, $file['file_id'] );
		$this->assertEquals( 'test.jpg', $file['name'] );
		$this->assertEquals( '1 KB', $file['size'] );
		$this->assertTrue( $file['is_previewable'] );
		$this->assertTrue( $data['has_file'] );
	}

	/**
	 * Test fields_format parameter defaults to label-value format for backwards compatibility
	 */
	public function test_fields_format_defaults_to_label_value() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'Name'  => 'Test User',
				'Email' => 'test@example.com',
			),
			'Test message',
			'Test User'
		);

		// Request WITHOUT fields_format parameter - should return label-value format
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'fields', $data );
		$this->assertIsArray( $data['fields'] );

		// label-value format should have field labels as keys
		$this->assertArrayHasKey( 'Name', $data['fields'] );
		$this->assertArrayHasKey( 'Email', $data['fields'] );
		$this->assertEquals( 'Test User', $data['fields']['Name'] );
		$this->assertEquals( 'test@example.com', $data['fields']['Email'] );
	}

	/**
	 * Test fields_format=collection returns rich field data
	 */
	public function test_fields_format_collection_returns_rich_data() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'Name'  => 'Test User',
				'Email' => 'test@example.com',
			),
			'Test message',
			'Test User'
		);

		// Request WITH fields_format=collection - should return array of field objects
		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$request->set_param( 'fields_format', 'collection' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'fields', $data );
		$this->assertIsArray( $data['fields'] );

		// collection format should be an indexed array of objects with label, value, type, etc.
		$first_field = $data['fields'][0];
		$this->assertArrayHasKey( 'label', $first_field );
		$this->assertArrayHasKey( 'value', $first_field );
		$this->assertArrayHasKey( 'type', $first_field );
		$this->assertArrayHasKey( 'id', $first_field );
		$this->assertArrayHasKey( 'key', $first_field );
	}

	/**
	 * Test prepare_item_for_response with file fields
	 */
	public function test_prepare_item_for_response_with_consent() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'field1'                  => 'value1',
				'field2'                  => 'value2',
				'email_marketing_consent' => 'yes',
			),
			'This is a test comment content.',
			'Test User'
		);

		// Test the get_item endpoint
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		// Verify file field data in response
		$this->assertArrayHasKey( 'fields', $data );

		$this->assertArrayHasKey( 'email_marketing_consent', $data );
		$this->assertSame( '1', $data['email_marketing_consent'] );

		$this->assertArrayHasKey( 'author_name', $data );
		$this->assertEquals( 'Test User', $data['author_name'] );

		$this->assertArrayHasKey( 'has_file', $data );
		$this->assertFalse( $data['has_file'] );
	}

	/**
	 * Test prepare_item_for_response with file fields
	 */
	public function test_prepare_item_for_response_without_consent() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'field1'                  => 'value1',
				'field2'                  => 'value2',
				'email_marketing_consent' => '',
			),
			'This is a test comment content.',
			'Test User'
		);

		// Test the get_item endpoint
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		// Verify file field data in response
		$this->assertArrayHasKey( 'fields', $data );

		$this->assertArrayHasKey( 'email_marketing_consent', $data );
		$this->assertSame( '', $data['email_marketing_consent'] );

		$this->assertArrayHasKey( 'author_name', $data );
		$this->assertEquals( 'Test User', $data['author_name'] );

		$this->assertArrayHasKey( 'has_file', $data );
		$this->assertFalse( $data['has_file'] );
	}

	/**
	 * Test default unread state on new feedback
	 */
	public function test_feedback_is_unread_by_default() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'Test Subject',
			'spam',
			null,
			true // is_unread
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'is_unread', $data );
		$this->assertTrue( $data['is_unread'] );

		// Verify Feedback class method
		$feedback = \Automattic\Jetpack\Forms\ContactForm\Feedback::get( $post_id );
		$this->assertTrue( $feedback->is_unread() );
	}

	/**
	 * Test marking feedback as read
	 */
	public function test_mark_feedback_as_read() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'',
			'publish',
			false,
			true // is_unread
		);

		// Mark as read
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/' . $post_id . '/read' );
		$request->set_param( 'is_unread', false );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( $post_id, $data['id'] );
		$this->assertFalse( $data['is_unread'] );

		// Verify the state persists
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$this->assertFalse( $data['is_unread'] );

		// Verify Feedback class method
		$feedback = \Automattic\Jetpack\Forms\ContactForm\Feedback::get( $post_id );
		$this->assertFalse( $feedback->is_unread() );
	}

	/**
	 * Test marking feedback as read
	 */
	public function test_mark_feedback_as_read_on_non_feedback() {

		// Mark as read
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/99999999/read' );
		$request->set_param( 'is_unread', false );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Test marking feedback as read
	 */
	public function test_mark_feedback_as_unread_on_non_feedback() {

		// Mark as read
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/99999999/read' );
		$request->set_param( 'is_unread', true );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_bad_db_read_update() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'',
			'publish',
			false,
			true // is_unread
		);

		// Simulate DB error
		add_filter( 'wp_checkdate', '__return_false' );
		// Mark as read
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/' . $post_id . '/read' );
		$request->set_param( 'is_unread', false );
		$response = $this->server->dispatch( $request );
		remove_filter( 'wp_checkdate', '__return_false' );

		$this->assertEquals( 500, $response->get_status() );
	}

	public function test_bad_db_unread_update() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'',
			'publish',
			false,
			false // is_unread
		);

		// Simulate DB error
		add_filter( 'wp_checkdate', '__return_false' );
		// Mark as read
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/' . $post_id . '/read' );
		$request->set_param( 'is_unread', true );
		$response = $this->server->dispatch( $request );
		remove_filter( 'wp_checkdate', '__return_false' );

		$this->assertEquals( 500, $response->get_status() );
	}

	/**
	 * Test marking feedback as unread
	 */
	public function test_mark_feedback_as_unread() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com'
		);

		// First mark as read
		wp_update_post(
			array(
				'ID'             => $post_id,
				'comment_status' => 'closed',
			)
		);

		// Then mark as unread
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/' . $post_id . '/read' );
		$request->set_param( 'is_unread', true );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( $post_id, $data['id'] );
		$this->assertTrue( $data['is_unread'] );

		// Verify Feedback class method
		$feedback = \Automattic\Jetpack\Forms\ContactForm\Feedback::get( $post_id );
		$this->assertTrue( $feedback->is_unread() );
	}

	/**
	 * Test marking feedback with invalid ID
	 */
	public function test_mark_feedback_with_invalid_id() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/999999/read' );
		$request->set_param( 'is_unread', false );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'rest_post_invalid_id', $data['code'] );
	}

	/**
	 * Test unauthorized access to mark feedback
	 */
	public function test_mark_feedback_unauthorized() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com'
		);

		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'POST', '/wp/v2/feedback/' . $post_id . '/read' );
		$request->set_param( 'is_unread', false );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test prepare_item_for_response includes logged_in_user when user is logged in.
	 */
	public function test_prepare_item_for_response_with_logged_in_user() {
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'testuser',
				'user_pass'    => 'testpass',
				'display_name' => 'Test Display Name',
			)
		);

		$feedback_time = current_time( 'mysql' );
		$content       = wp_json_encode(
			array(
				'subject'        => 'Test Subject',
				'ip'             => '127.0.0.1',
				'country_code'   => 'US',
				'entry_title'    => 'Test Form',
				'entry_page'     => 123,
				'logged_in_user' => array(
					'display_name' => 'Test Display Name',
					'username'     => 'testuser',
					'id'           => $user_id,
				),
				'fields'         => array(
					array(
						'id'    => '1',
						'label' => 'Name',
						'value' => 'Submitter Name',
					),
				),
			),
			JSON_UNESCAPED_SLASHES
		);

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => 'Test Feedback - ' . $feedback_time,
				'post_content'   => $content,
				'post_mime_type' => 'v2',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'logged_in_user', $data );
		$this->assertIsArray( $data['logged_in_user'] );
		$this->assertArrayHasKey( 'display_name', $data['logged_in_user'] );
		$this->assertArrayHasKey( 'username', $data['logged_in_user'] );
		$this->assertArrayHasKey( 'id', $data['logged_in_user'] );
		$this->assertEquals( 'Test Display Name', $data['logged_in_user']['display_name'] );
		$this->assertEquals( 'testuser', $data['logged_in_user']['username'] );
		$this->assertEquals( $user_id, $data['logged_in_user']['id'] );

		wp_delete_user( $user_id );
	}

	/**
	 * Test prepare_item_for_response returns null for logged_in_user when not logged in.
	 */
	public function test_prepare_item_for_response_without_logged_in_user() {
		$feedback_time = current_time( 'mysql' );
		$content       = wp_json_encode(
			array(
				'subject'        => 'Test Subject',
				'ip'             => '127.0.0.1',
				'country_code'   => 'US',
				'entry_title'    => 'Test Form',
				'entry_page'     => 123,
				'logged_in_user' => null,
				'fields'         => array(
					array(
						'id'    => '1',
						'label' => 'Name',
						'value' => 'Submitter Name',
					),
				),
			),
			JSON_UNESCAPED_SLASHES
		);

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => 'Test Feedback - ' . $feedback_time,
				'post_content'   => $content,
				'post_mime_type' => 'v2',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'logged_in_user', $data );
		$this->assertNull( $data['logged_in_user'] );
	}

	/**
	 * Test that the source parameter is registered in the feedback collection schema.
	 */
	public function test_source_parameter_is_registered() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/feedback' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'source', $data['endpoints'][0]['args'] );
		$this->assertEquals( 'integer', $data['endpoints'][0]['args']['source']['type'] );
	}

	/**
	 * Test that the source parameter is registered in the counts endpoint.
	 */
	public function test_source_parameter_is_registered_in_counts() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/feedback/counts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'source', $data['endpoints'][0]['args'] );
		$this->assertEquals( 'integer', $data['endpoints'][0]['args']['source']['type'] );
	}

	/**
	 * Test that the counts endpoint applies source filter SQL when source param is set.
	 */
	public function test_counts_with_source_includes_source_filter_sql() {
		$captured_query = null;
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$captured_query ) {
				if ( strpos( $query, 'SUM(CASE' ) !== false && strpos( $query, 'source_meta' ) !== false ) {
					$captured_query = $query;
				}
				return $results;
			},
			10,
			2
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );
		$request->set_param( 'source', 123 );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertNotNull( $captured_query, 'Counts query should include source filter SQL' );
		$this->assertStringContainsString( '_feedback_source_post_id', $captured_query, 'Counts query should reference the source meta key' );
		$this->assertStringContainsString( 'source_meta.meta_value', $captured_query, 'Counts query should filter by source meta value' );
		$this->assertStringContainsString( 'post_parent', $captured_query, 'Counts query should include post_parent fallback' );

		remove_all_filters( 'wordbless_wpdb_query_results' );
	}

	/**
	 * Test that the shared Feedback::get_source_filter_sql helper returns
	 * the correct SQL JOIN and WHERE fragments.
	 */
	public function test_source_filter_sql_helper_returns_expected_fragments() {
		$sql = Feedback::get_source_filter_sql( 42 );

		$this->assertArrayHasKey( 'join', $sql );
		$this->assertArrayHasKey( 'where', $sql );

		$this->assertStringContainsString( 'source_meta', $sql['join'], 'JOIN should include the source_meta alias' );
		$this->assertStringContainsString( '_feedback_source_post_id', $sql['join'], 'JOIN should reference the source meta key' );

		$this->assertStringContainsString( 'source_meta.meta_value', $sql['where'], 'WHERE should filter by source meta value' );
		$this->assertStringContainsString( 'post_parent', $sql['where'], 'WHERE should include post_parent fallback' );
		$this->assertStringContainsString( 'source_meta.meta_id IS NULL', $sql['where'], 'WHERE should check for missing meta in fallback' );
		$this->assertStringContainsString( "'42'", $sql['where'], 'WHERE should include the source ID value' );
	}

	/**
	 * Test that source filter hooks are cleaned up after get_items
	 * by verifying a second request without source does not include source SQL.
	 */
	public function test_source_filter_hooks_are_cleaned_up() {
		// First request with source filter.
		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback' );
		$request->set_param( 'source', 42 );
		$this->server->dispatch( $request );

		// Second request without source — capture SQL to verify no leftover filter.
		$found_source_sql = false;
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$found_source_sql ) {
				if ( strpos( $query, 'source_meta' ) !== false ) {
					$found_source_sql = true;
				}
				return $results;
			},
			10,
			2
		);

		$request2 = new WP_REST_Request( 'GET', '/wp/v2/feedback' );
		$this->server->dispatch( $request2 );

		$this->assertFalse( $found_source_sql, 'Source filter should not leak into subsequent requests' );

		remove_all_filters( 'wordbless_wpdb_query_results' );
	}

	/**
	 * Test that without source param, no source filter hooks are added.
	 */
	public function test_no_source_filter_without_param() {
		$found_source_sql = false;

		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$found_source_sql ) {
				if ( strpos( $query, 'source_meta' ) !== false ) {
					$found_source_sql = true;
				}
				return $results;
			},
			10,
			2
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback' );
		$this->server->dispatch( $request );

		$this->assertFalse( $found_source_sql, 'SQL should not include source_meta when no source param' );

		remove_all_filters( 'wordbless_wpdb_query_results' );
	}

	/**
	 * Test that source=0 does not inject source filter SQL.
	 */
	public function test_source_filter_with_zero_value_is_ignored() {
		$found_source_sql = false;

		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$found_source_sql ) {
				if ( strpos( $query, 'source_meta' ) !== false ) {
					$found_source_sql = true;
				}
				return $results;
			},
			10,
			2
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/feedback' );
		$request->set_param( 'source', 0 );
		$this->server->dispatch( $request );

		$this->assertFalse( $found_source_sql, 'source=0 should not inject source filter SQL' );

		remove_all_filters( 'wordbless_wpdb_query_results' );
	}
}
