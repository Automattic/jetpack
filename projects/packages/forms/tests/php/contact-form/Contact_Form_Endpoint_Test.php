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
		$this->assertArrayHasKey( 'entry_title', $schema_properties );
		$this->assertArrayHasKey( 'entry_permalink', $schema_properties );
		$this->assertArrayHasKey( 'subject', $schema_properties );
		$this->assertArrayHasKey( 'fields', $schema_properties );
		$this->assertArrayHasKey( 'is_unread', $schema_properties );

		// Also make sure that we don't have fields that are not relevant to feedback.
		$this->assertArrayNotHasKey( 'link', $schema_properties );
		$this->assertArrayNotHasKey( 'password', $schema_properties );
		$this->assertArrayNotHasKey( 'template', $schema_properties );
		$this->assertArrayNotHasKey( 'title', $schema_properties );
		$this->assertArrayNotHasKey( 'content', $schema_properties );
		$this->assertArrayNotHasKey( 'excerpt', $schema_properties );
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

		// Test the get_item endpoint
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/' . $post_id );
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
}
