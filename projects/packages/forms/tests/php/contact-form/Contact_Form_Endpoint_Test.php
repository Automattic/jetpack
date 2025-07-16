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
		$this->assertArrayHasKey( 'author_email', $schema_properties );
		$this->assertArrayHasKey( 'author_url', $schema_properties );
		$this->assertArrayHasKey( 'author_avatar', $schema_properties );
		$this->assertArrayHasKey( 'email_marketing_consent', $schema_properties );
		$this->assertArrayHasKey( 'ip', $schema_properties );
		$this->assertArrayHasKey( 'entry_title', $schema_properties );
		$this->assertArrayHasKey( 'entry_permalink', $schema_properties );
		$this->assertArrayHasKey( 'subject', $schema_properties );
		$this->assertArrayHasKey( 'fields', $schema_properties );
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
		$this->assertArrayHasKey( 'creative-mail-by-constant-contact', $data );
		$this->assertArrayHasKey( 'zero-bs-crm', $data );
		$this->assertArrayHasKey( 'google-drive', $data );
		$this->assertArrayHasKey( 'mailpoet', $data );

		// Verify structure of one integration
		$this->assertArrayHasKey( 'type', $data['akismet'] );
		$this->assertArrayHasKey( 'isInstalled', $data['akismet'] );
		$this->assertArrayHasKey( 'isActive', $data['akismet'] );
		$this->assertArrayHasKey( 'isConnected', $data['akismet'] );
		$this->assertArrayHasKey( 'needsConnection', $data['akismet'] );

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
		$this->assertContains( 'creative-mail-by-constant-contact', $integration_ids );
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
	 * Test resend email functionality
	 */
	public function test_resend_email() {
		// Create a test feedback post
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
			)
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

		// Create test content fields
		$content_fields = array(
			'_feedback_author'       => 'Test Author',
			'_feedback_author_email' => 'author@example.com',
			'_feedback_subject'      => 'Test Subject',
			'_feedback_all_fields'   => array(
				'name'  => 'Test Author',
				'email' => 'author@example.com',
			),
		);
		add_post_meta( $post_id, '_feedback_all_fields', $content_fields );

		// Test the update_item method which triggers resend_email
		$request = new WP_REST_Request( 'PUT', '/wp/v2/feedback/' . $post_id );
		$request->set_param( 'status', 'publish' );

		// Mock the previous status
		add_post_meta( $post_id, '_wp_trash_meta_status', 'spam' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test get_collection_params
	 */
	public function test_get_collection_params() {
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$params   = $endpoint->get_collection_params();

		$this->assertArrayHasKey( 'parent', $params );
		$this->assertArrayHasKey( 'parent_exclude', $params );

		$this->assertEquals( 'array', $params['parent']['type'] );
		$this->assertEquals( 'array', $params['parent_exclude']['type'] );

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

JSON_DATA{"name":"Test Author","email":"author@example.com","g1-file":{"field_id":"g1-file","files":[{"file_id":123,"name":"test.jpg","size":1024,"type":"image/jpeg"}]}}',
			)
		);

		// Add test metadata
		$all_fields = array(
			'name'    => 'Test Author',
			'email'   => 'author@example.com',
			'g1-file' => array(
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

		// Test the get_item endpoint
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		// Verify file field data in response
		$this->assertArrayHasKey( 'fields', $data );
		$this->assertArrayHasKey( 'g1-file', $data['fields'] );
		$this->assertArrayHasKey( 'files', $data['fields']['g1-file'] );

		$file = $data['fields']['g1-file']['files'][0];
		$this->assertEquals( 123, $file['file_id'] );
		$this->assertEquals( 'test.jpg', $file['name'] );
		$this->assertEquals( '1 KB', $file['size'] );
		$this->assertTrue( $file['is_previewable'] );
		$this->assertTrue( $data['has_file'] );
	}
}
