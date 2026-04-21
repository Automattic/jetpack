<?php
/**
 * Tests for Form_Preview class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Form_Preview.
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Form_Preview
 */
#[CoversClass( Form_Preview::class )]
class Form_Preview_Test extends BaseTestCase {

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	private $editor_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Test form ID.
	 *
	 * @var int
	 */
	private $form_id;

	/**
	 * Set up test fixtures.
	 */
	protected function setUp(): void {
		parent::setUp();

		// Register the form post type.
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

		// Create test users.
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'test_editor_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'editor_' . wp_rand() . '@test.com',
				'role'       => 'editor',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'subscriber_' . wp_rand() . '@test.com',
				'role'       => 'subscriber',
			)
		);

		// Create test form.
		$this->form_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Test Form',
				'post_content' => '<!-- wp:jetpack/contact-form /-->',
				'post_author'  => $this->editor_id,
			)
		);
	}

	/**
	 * Tear down test fixtures.
	 */
	protected function tearDown(): void {
		wp_delete_user( $this->editor_id );
		wp_delete_user( $this->subscriber_id );
		wp_delete_post( $this->form_id, true );
		wp_set_current_user( 0 );

		parent::tearDown();
	}

	/**
	 * Test init() registers required hooks.
	 */
	public function test_init_registers_hooks() {
		remove_all_filters( 'query_vars' );
		remove_all_filters( 'template_include' );
		remove_all_filters( 'jetpack_is_frontend' );

		Form_Preview::init();

		$this->assertNotFalse( has_filter( 'query_vars', array( Form_Preview::class, 'register_query_vars' ) ) );
		$this->assertNotFalse( has_filter( 'template_include', array( Form_Preview::class, 'maybe_render_preview' ) ) );
		$this->assertNotFalse( has_filter( 'jetpack_is_frontend', array( Form_Preview::class, 'filter_is_frontend' ) ) );
	}

	/**
	 * Test register_query_vars() adds preview query vars.
	 */
	public function test_register_query_vars() {
		$vars   = array( 'existing' );
		$result = Form_Preview::register_query_vars( $vars );

		$this->assertContains( 'existing', $result );
		$this->assertContains( 'jetpack_form_preview', $result );
		$this->assertContains( 'jetpack_form_preview_nonce', $result );
	}

	/**
	 * Test generate_preview_url() for authorized editor.
	 */
	public function test_generate_preview_url_for_editor() {
		wp_set_current_user( $this->editor_id );

		$url = Form_Preview::generate_preview_url( $this->form_id );

		$this->assertNotNull( $url );
		$this->assertStringContainsString( 'jetpack_form_preview=' . $this->form_id, $url );
		$this->assertStringContainsString( 'jetpack_form_preview_nonce=', $url );
	}

	/**
	 * Test generate_preview_url() returns null for unauthorized user.
	 */
	public function test_generate_preview_url_unauthorized() {
		wp_set_current_user( $this->subscriber_id );

		$this->assertNull( Form_Preview::generate_preview_url( $this->form_id ) );
	}

	/**
	 * Test generate_preview_url() returns null for invalid form.
	 */
	public function test_generate_preview_url_invalid_form() {
		wp_set_current_user( $this->editor_id );

		$this->assertNull( Form_Preview::generate_preview_url( 0 ) );
		$this->assertNull( Form_Preview::generate_preview_url( 999999 ) );
	}

	/**
	 * Test generate_preview_url() returns null for wrong post type.
	 */
	public function test_generate_preview_url_wrong_post_type() {
		wp_set_current_user( $this->editor_id );

		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Regular Post',
			)
		);

		$this->assertNull( Form_Preview::generate_preview_url( $post_id ) );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test verify_preview_access() for valid access.
	 */
	public function test_verify_preview_access_valid() {
		wp_set_current_user( $this->editor_id );
		$nonce = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );

		$this->assertTrue( Form_Preview::verify_preview_access( $this->form_id, $nonce ) );
	}

	/**
	 * Test verify_preview_access() returns false for logged-out user.
	 */
	public function test_verify_preview_access_logged_out() {
		wp_set_current_user( 0 );
		$nonce = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );

		$this->assertFalse( Form_Preview::verify_preview_access( $this->form_id, $nonce ) );
	}

	/**
	 * Test verify_preview_access() returns false for unauthorized user.
	 */
	public function test_verify_preview_access_unauthorized() {
		wp_set_current_user( $this->subscriber_id );
		$nonce = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );

		$this->assertFalse( Form_Preview::verify_preview_access( $this->form_id, $nonce ) );
	}

	/**
	 * Test verify_preview_access() returns false for invalid nonce.
	 */
	public function test_verify_preview_access_invalid_nonce() {
		wp_set_current_user( $this->editor_id );

		$this->assertFalse( Form_Preview::verify_preview_access( $this->form_id, 'invalid' ) );
	}

	/**
	 * Test maybe_render_preview() returns template when no preview vars.
	 */
	public function test_maybe_render_preview_no_vars() {
		set_query_var( 'jetpack_form_preview', '' );
		set_query_var( 'jetpack_form_preview_nonce', '' );

		$template = '/path/to/template.php';

		$this->assertEquals( $template, Form_Preview::maybe_render_preview( $template ) );
	}

	/**
	 * Test preview works with draft forms.
	 */
	public function test_preview_works_with_draft_form() {
		wp_set_current_user( $this->editor_id );

		$draft_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form /-->',
				'post_author'  => $this->editor_id,
			)
		);

		$url = Form_Preview::generate_preview_url( $draft_id );
		$this->assertNotNull( $url );

		$nonce = wp_create_nonce( 'jetpack_form_preview_' . $draft_id );
		$this->assertTrue( Form_Preview::verify_preview_access( $draft_id, $nonce ) );

		wp_delete_post( $draft_id, true );
	}
}
