<?php
/**
 * Unit Tests for Jetpack_Form.
register* @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the the Jetpack_Form REST endpoint.
 *
 * To run this test, you can use the following command: (from the projects/packages/forms directory)
 *
 * composer test-php tests/php/contact-form/Jetpack_Form_Endpoint_Test.php
 */
class Jetpack_Form_Endpoint_Test extends TestCase {

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
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

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

		// Unregister the post type if it was registered
		unregister_post_type( 'jetpack_form' );
	}

	/**
	 * Test that the post type is registered when init is called.
	 */
	public function test_init_registers_post_type() {
		Contact_Form::register_post_type();

		$this->assertTrue( post_type_exists( 'jetpack_form' ), 'jetpack_form post type should be registered' );
	}

	/**
	 * Test that the post type has the correct configuration.
	 */
	public function test_post_type_configuration() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertNotNull( $post_type_object, 'Post type object should exist' );
		$this->assertEquals( 'jetpack_form', $post_type_object->name );
		$this->assertFalse( $post_type_object->public, 'Post type should not be public' );
		$this->assertTrue( $post_type_object->show_ui, 'Post type should show UI' );
		$this->assertFalse( $post_type_object->show_in_menu, 'Post type should not show in menu' );
		$this->assertTrue( $post_type_object->show_in_rest, 'Post type should be available in REST' );
		$this->assertEquals( 'jetpack-forms', $post_type_object->rest_base, 'REST base should be jetpack-forms' );
	}

	/**
	 * Test that the post type supports the correct features.
	 */
	public function test_post_type_supports() {
		Contact_Form::register_post_type();

		$this->assertTrue( post_type_supports( 'jetpack_form', 'title' ), 'Should support title' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'editor' ), 'Should support editor' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'revisions' ), 'Should support revisions' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'author' ), 'Should support author' );
	}

	/**
	 * Test that the REST endpoints are registered.
	 */
	public function test_rest_endpoints_are_registered() {
		Contact_Form::register_post_type();

		// Re-initialize REST server to pick up new routes
		do_action( 'rest_api_init' );

		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wp/v2/jetpack-forms', $routes, 'Main endpoint should be registered' );
		$this->assertArrayHasKey( '/wp/v2/jetpack-forms/(?P<id>[\d]+)', $routes, 'Single item endpoint should be registered' );
	}

	/**
	 * Test that GET request to jetpack-forms endpoint works.
	 */
	public function test_get_jetpack_forms_returns_200() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET request should return 200' );
		$this->assertIsArray( $response->get_data(), 'Response should be an array' );
	}

	/**
	 * Test that users without edit_posts capability cannot access jetpack-forms endpoint.
	 */
	public function test_get_jetpack_forms_unauthorized_returns_401() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Create a subscriber user (no edit_posts capability)
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );
		$response = $this->server->dispatch( $request );

		$this->assertContains( $response->get_status(), array( 401, 403 ), 'Unauthorized request should return 401 or 403' );
	}

	/**
	 * Test creating a jetpack-form via REST API.
	 */
	public function test_create_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'publish_posts' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/jetpack-forms' );
		$request->set_param( 'title', 'Test Reusable Form' );
		$request->set_param( 'status', 'publish' );
		$request->set_param( 'content', '<!-- wp:jetpack/contact-form --><div class="wp-block-jetpack-contact-form">Test Form</div><!-- /wp:jetpack/contact-form -->' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 201, $response->get_status(), 'POST request should return 201' );

		$data  = $response->get_data();
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Test Reusable Form', $title, 'Title should match' );
		$this->assertEquals( 'publish', $data['status'], 'Status should be publish' );
	}

	/**
	 * Test retrieving a specific jetpack-form via REST API.
	 */
	public function test_get_single_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Single Test Form',
				'post_content' => 'Form content',
				'post_status'  => 'publish',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET single item should return 200' );

		$data = $response->get_data();
		// Title might be in different formats depending on context
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Single Test Form', $title, 'Title should match' );
		$this->assertEquals( $post_id, $data['id'], 'ID should match' );
	}

	/**
	 * Test updating a jetpack-form via REST API.
	 */
	public function test_update_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'edit_published_posts' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Original Title',
				'post_content' => 'Original content',
				'post_status'  => 'publish',
			)
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/jetpack-forms/' . $post_id );
		$request->set_param( 'title', 'Updated Title' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'PUT request should return 200' );

		$data  = $response->get_data();
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Updated Title', $title, 'Title should be updated' );
	}

	/**
	 * Test deleting a jetpack-form via REST API.
	 */
	public function test_delete_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'delete_posts' );
		$user->add_cap( 'delete_published_posts' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Form to Delete',
				'post_content' => 'Form content',
				'post_status'  => 'publish',
			)
		);

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/jetpack-forms/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'DELETE request should return 200' );

		// Verify the post is trashed
		$post = get_post( $post_id );
		$this->assertEquals( 'trash', $post->post_status, 'Post should be in trash' );
	}

	/**
	 * Test that the REST controller class is correctly assigned.
	 */
	public function test_rest_controller_class() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertEquals(
			'Automattic\Jetpack\Forms\ContactForm\Jetpack_Form_Endpoint',
			$post_type_object->rest_controller_class,
			'REST controller class should be correctly set'
		);
	}

	/**
	 * Test that the post type has correct capability mappings.
	 */
	public function test_post_type_capabilities() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertEquals( 'edit_posts', $post_type_object->cap->read, 'Read capability should be edit_posts' );
		$this->assertEquals( 'publish_posts', $post_type_object->cap->create_posts, 'Create capability should be publish_posts' );
		$this->assertEquals( 'edit_posts', $post_type_object->cap->edit_posts, 'Edit posts capability should be edit_posts' );
	}
}
