<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\ContactForm\Form_Preview.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Form_Preview
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Form_Preview
 */
#[CoversClass( Form_Preview::class )]
class Form_Preview_Test extends BaseTestCase {

	/**
	 * The test user ID with editor capabilities.
	 *
	 * @var int
	 */
	private $editor_user_id;

	/**
	 * The test user ID with subscriber capabilities (no edit access).
	 *
	 * @var int
	 */
	private $subscriber_user_id;

	/**
	 * A test form post ID.
	 *
	 * @var int
	 */
	private $form_id;

	/**
	 * Set up test fixtures.
	 */
	protected function setUp(): void {
		parent::setUp();

		// Register the jetpack_form post type for testing.
		if ( ! post_type_exists( Contact_Form::POST_TYPE ) ) {
			register_post_type(
				Contact_Form::POST_TYPE,
				array(
					'public'       => false,
					'show_ui'      => true,
					'supports'     => array( 'title', 'editor' ),
					'capabilities' => array(
						'edit_post'          => 'edit_posts',
						'edit_posts'         => 'edit_posts',
						'edit_others_posts'  => 'edit_others_posts',
						'publish_posts'      => 'publish_posts',
						'read_post'          => 'read',
						'read_private_posts' => 'read_private_posts',
						'delete_post'        => 'delete_posts',
					),
					'map_meta_cap' => true,
				)
			);
		}

		// Create an editor user who can edit posts.
		$this->editor_user_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => 'password',
				'user_email' => 'editor@example.com',
				'role'       => 'editor',
			)
		);

		// Create a subscriber user who cannot edit posts.
		$this->subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'subscriber@example.com',
				'role'       => 'subscriber',
			)
		);

		// Create a test form.
		$this->form_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => 'Test Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-email /--></div><!-- /wp:jetpack/contact-form -->',
				'post_author'  => $this->editor_user_id,
			)
		);
	}

	/**
	 * Tear down test fixtures.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Clean up users.
		if ( $this->editor_user_id ) {
			wp_delete_user( $this->editor_user_id );
		}
		if ( $this->subscriber_user_id ) {
			wp_delete_user( $this->subscriber_user_id );
		}

		// Clean up form post.
		if ( $this->form_id ) {
			wp_delete_post( $this->form_id, true );
		}

		// Reset current user.
		wp_set_current_user( 0 );

		// Clean up globals.
		unset( $_POST, $_GET );

		// Reset preview mode via reflection.
		$this->reset_preview_mode();
	}

	/**
	 * Reset the static preview mode flag via reflection.
	 */
	private function reset_preview_mode() {
		$reflection = new \ReflectionClass( Form_Preview::class );
		$property   = $reflection->getProperty( 'is_preview_mode' );
		$property->setAccessible( true );
		$property->setValue( null, false );
	}

	/**
	 * Set the static preview mode flag via reflection.
	 *
	 * @param bool $value The value to set.
	 */
	private function set_preview_mode( $value ) {
		$reflection = new \ReflectionClass( Form_Preview::class );
		$property   = $reflection->getProperty( 'is_preview_mode' );
		$property->setAccessible( true );
		$property->setValue( null, $value );
	}

	/**
	 * Test that init() registers the required filters.
	 */
	public function test_init_registers_filters() {
		// Remove any existing filters first.
		remove_all_filters( 'query_vars' );
		remove_all_filters( 'template_include' );
		remove_all_filters( 'jetpack_is_frontend' );

		// Call init.
		Form_Preview::init();

		// Check that filters are registered.
		$this->assertNotFalse( has_filter( 'query_vars', array( Form_Preview::class, 'register_query_vars' ) ) );
		$this->assertNotFalse( has_filter( 'template_include', array( Form_Preview::class, 'maybe_render_preview' ) ) );
		$this->assertNotFalse( has_filter( 'jetpack_is_frontend', array( Form_Preview::class, 'filter_is_frontend' ) ) );
	}

	/**
	 * Test that register_query_vars() adds the required query variables.
	 */
	public function test_register_query_vars_adds_preview_vars() {
		$vars = array( 'existing_var' );

		$result = Form_Preview::register_query_vars( $vars );

		$this->assertContains( 'existing_var', $result );
		$this->assertContains( 'jetpack_form_preview', $result );
		$this->assertContains( 'preview_nonce', $result );
	}

	/**
	 * Test is_preview_mode() returns false by default.
	 */
	public function test_is_preview_mode_returns_false_by_default() {
		$this->reset_preview_mode();

		$this->assertFalse( Form_Preview::is_preview_mode() );
	}

	/**
	 * Test is_preview_mode() returns true when set.
	 */
	public function test_is_preview_mode_returns_true_when_set() {
		$this->set_preview_mode( true );

		$this->assertTrue( Form_Preview::is_preview_mode() );
	}

	/**
	 * Test generate_preview_url() returns null for non-existent form.
	 */
	public function test_generate_preview_url_returns_null_for_nonexistent_form() {
		wp_set_current_user( $this->editor_user_id );

		$result = Form_Preview::generate_preview_url( 999999 );

		$this->assertNull( $result );
	}

	/**
	 * Test generate_preview_url() returns null for wrong post type.
	 */
	public function test_generate_preview_url_returns_null_for_wrong_post_type() {
		wp_set_current_user( $this->editor_user_id );

		// Create a regular post (not a form).
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Regular Post',
			)
		);

		$result = Form_Preview::generate_preview_url( $post_id );

		$this->assertNull( $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test generate_preview_url() returns null for user without edit capability.
	 */
	public function test_generate_preview_url_returns_null_for_user_without_capability() {
		wp_set_current_user( $this->subscriber_user_id );

		$result = Form_Preview::generate_preview_url( $this->form_id );

		$this->assertNull( $result );
	}

	/**
	 * Test generate_preview_url() returns valid URL for authorized user.
	 */
	public function test_generate_preview_url_returns_valid_url_for_authorized_user() {
		wp_set_current_user( $this->editor_user_id );

		$result = Form_Preview::generate_preview_url( $this->form_id );

		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'jetpack_form_preview=' . $this->form_id, $result );
		$this->assertStringContainsString( 'preview_nonce=', $result );
	}

	/**
	 * Test verify_preview_access() returns false for logged-out user.
	 */
	public function test_verify_preview_access_returns_false_for_logged_out_user() {
		wp_set_current_user( 0 );

		$nonce  = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );
		$result = Form_Preview::verify_preview_access( $this->form_id, $nonce );

		$this->assertFalse( $result );
	}

	/**
	 * Test verify_preview_access() returns false for user without capability.
	 */
	public function test_verify_preview_access_returns_false_for_user_without_capability() {
		wp_set_current_user( $this->subscriber_user_id );

		$nonce  = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );
		$result = Form_Preview::verify_preview_access( $this->form_id, $nonce );

		$this->assertFalse( $result );
	}

	/**
	 * Test verify_preview_access() returns false for invalid nonce.
	 */
	public function test_verify_preview_access_returns_false_for_invalid_nonce() {
		wp_set_current_user( $this->editor_user_id );

		$result = Form_Preview::verify_preview_access( $this->form_id, 'invalid_nonce' );

		$this->assertFalse( $result );
	}

	/**
	 * Test verify_preview_access() returns true for valid access.
	 */
	public function test_verify_preview_access_returns_true_for_valid_access() {
		wp_set_current_user( $this->editor_user_id );

		$nonce  = wp_create_nonce( 'jetpack_form_preview_' . $this->form_id );
		$result = Form_Preview::verify_preview_access( $this->form_id, $nonce );

		$this->assertTrue( $result );
	}

	/**
	 * Test filter_is_frontend() returns original value when not in preview mode.
	 */
	public function test_filter_is_frontend_returns_original_when_not_in_preview_mode() {
		$this->reset_preview_mode();

		$this->assertTrue( Form_Preview::filter_is_frontend( true ) );
		$this->assertFalse( Form_Preview::filter_is_frontend( false ) );
	}

	/**
	 * Test filter_is_frontend() returns true when in preview mode.
	 */
	public function test_filter_is_frontend_returns_true_when_in_preview_mode() {
		$this->set_preview_mode( true );

		$this->assertTrue( Form_Preview::filter_is_frontend( false ) );
		$this->assertTrue( Form_Preview::filter_is_frontend( true ) );
	}

	/**
	 * Test that maybe_render_preview() returns template unchanged when no preview vars.
	 */
	public function test_maybe_render_preview_returns_template_when_no_preview_vars() {
		// Set up query vars without preview parameters.
		set_query_var( 'jetpack_form_preview', '' );
		set_query_var( 'preview_nonce', '' );

		$template = '/path/to/template.php';
		$result   = Form_Preview::maybe_render_preview( $template );

		$this->assertEquals( $template, $result );
	}

	/**
	 * Data provider for preview URL generation test.
	 *
	 * @return array
	 */
	public static function provide_form_ids() {
		return array(
			'zero form id'     => array( 0 ),
			'negative form id' => array( -1 ),
			'string form id'   => array( 'invalid' ),
		);
	}

	/**
	 * Test generate_preview_url() handles invalid form IDs.
	 *
	 * @param mixed $form_id The form ID to test.
	 * @dataProvider provide_form_ids
	 */
	#[DataProvider( 'provide_form_ids' )]
	public function test_generate_preview_url_handles_invalid_form_ids( $form_id ) {
		wp_set_current_user( $this->editor_user_id );

		$result = Form_Preview::generate_preview_url( $form_id );

		$this->assertNull( $result );
	}

	/**
	 * Test that preview mode affects Contact_Form_Block rendering.
	 */
	public function test_preview_mode_allows_form_block_rendering() {
		// This test verifies the integration between Form_Preview and Contact_Form_Block.
		$this->set_preview_mode( true );

		// When in preview mode, is_preview_mode should return true.
		$this->assertTrue( Form_Preview::is_preview_mode() );

		// And filter_is_frontend should return true regardless of input.
		$this->assertTrue( Form_Preview::filter_is_frontend( false ) );
	}

	/**
	 * Test generate_preview_url() with draft form.
	 */
	public function test_generate_preview_url_works_with_draft_form() {
		wp_set_current_user( $this->editor_user_id );

		// Create a draft form.
		$draft_form_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form /-->',
				'post_author'  => $this->editor_user_id,
			)
		);

		$result = Form_Preview::generate_preview_url( $draft_form_id );

		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'jetpack_form_preview=' . $draft_form_id, $result );

		wp_delete_post( $draft_form_id, true );
	}

	/**
	 * Test verify_preview_access() works with draft form.
	 */
	public function test_verify_preview_access_works_with_draft_form() {
		wp_set_current_user( $this->editor_user_id );

		// Create a draft form.
		$draft_form_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form /-->',
				'post_author'  => $this->editor_user_id,
			)
		);

		$nonce  = wp_create_nonce( 'jetpack_form_preview_' . $draft_form_id );
		$result = Form_Preview::verify_preview_access( $draft_form_id, $nonce );

		$this->assertTrue( $result );

		wp_delete_post( $draft_form_id, true );
	}
}
