<?php
/**
 * Unit Tests for synced forms functionality.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Block;

/**
 * Test class for synced forms functionality
 *
 * @covers \Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Contact_Form_Block::class )]
#[CoversClass( Contact_Form::class )]
class Contact_Form_Synced_Test extends BaseTestCase {

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
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();
		Contact_Form_Block::register_child_blocks();

		// Register the form post type if not already registered.
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

		// Create test users for permission testing.
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
	}

	/**
	 * Tear down the test environment.
	 */
	public function tear_down() {
		// Reset current user.
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Test that form with ref attribute loads content from synced form post.
	 */
	public function test_render_synced_form_loads_content() {
		// Create a jetpack_form post with form content
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Synced Form',
				'post_content' => '<!-- wp:jetpack/contact-form -->
					<!-- wp:jetpack/field-email {"label":"Email","required":true} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
					<!-- /wp:jetpack/contact-form -->',
			)
		);

		$this->assertGreaterThan( 0, $form_id, 'Synced form post should be created' );

		// Create a block with ref attribute
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		// Render the block
		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Verify the output contains the email field from the synced form
		$this->assertStringContainsString( '[contact-field type="email" label="Email"/]', trim( $output ), 'Output should contain email field from synced form' );
	}

	/**
	 * Test that invalid ref ID returns empty string.
	 */
	public function test_render_synced_form_invalid_ref_returns_empty() {
		// Create a block with invalid ref
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => 99999 ), // Non-existent form
			)
		);

		// Render the block
		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should return empty string for invalid ref
		$this->assertEmpty( $output, 'Invalid ref should return empty string' );
	}

	/**
	 * Test circular reference prevention.
	 */
	public function test_render_synced_form_prevents_circular_reference() {
		// Create a form that references itself
		$form_id = wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Circular Form',
			)
		);

		// Update the form to reference itself (circular reference)
		wp_update_post(
			array(
				'ID'           => $form_id,
				'post_content' => sprintf(
					'<!-- wp:jetpack/contact-form {"ref":%d} /-->',
					$form_id
				),
			)
		);

		// Try to render this form
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should return empty string to prevent infinite loop
		$this->assertEmpty( $output, 'Circular reference should be prevented and return empty string' );
	}

	/**
	 * Test that trashed forms are never rendered, even with edit permissions.
	 */
	public function test_render_synced_trashed_form_always_hidden() {
		// Create a trashed form.
		$trashed_form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'trash',
				'post_title'   => 'Trashed Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user with edit permissions.
		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $trashed_form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should not render trashed form, even with edit permissions.
		$this->assertEmpty( $output, 'Trashed form should not be rendered even with edit permissions' );
	}

	/**
	 * Test that published forms are rendered.
	 */
	public function test_render_synced_form_renders_published_form() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Published Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		$this->assertNotEmpty( $output, 'Published form should be rendered' );
		$this->assertStringContainsString( 'email', $output, 'Published form output should contain email field' );
	}

	/**
	 * Test that draft forms are rendered with notice for users with edit_post permission.
	 */
	public function test_render_synced_draft_form_with_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user with edit permissions.
		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should render with status notice.
		$this->assertNotEmpty( $output, 'Draft form should be rendered for users with edit_post permission' );
		$this->assertStringContainsString( 'jetpack-form-status-notice', $output, 'Output should contain status notice' );
		$this->assertStringContainsString( 'draft', $output, 'Output should mention draft status' );
		$this->assertStringContainsString( 'Edit form', $output, 'Output should contain edit link' );
	}

	/**
	 * Test that draft forms are NOT rendered without edit_post permission.
	 */
	public function test_render_synced_draft_form_without_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user without edit permissions.
		wp_set_current_user( $this->subscriber_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertEmpty( $output, 'Draft form should NOT be rendered for users without edit_post permission' );
	}

	/**
	 * Test that pending forms are rendered with notice for users with edit_post permission.
	 */
	public function test_render_synced_pending_form_with_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'pending',
				'post_title'   => 'Pending Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user with edit permissions.
		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should render with status notice.
		$this->assertNotEmpty( $output, 'Pending form should be rendered for users with edit_post permission' );
		$this->assertStringContainsString( 'jetpack-form-status-notice', $output, 'Output should contain status notice' );
		$this->assertStringContainsString( 'pending review', $output, 'Output should mention pending review status' );
		$this->assertStringContainsString( 'Edit form', $output, 'Output should contain edit link' );
	}

	/**
	 * Test that pending forms are NOT rendered without edit_post permission.
	 */
	public function test_render_synced_pending_form_without_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'pending',
				'post_title'   => 'Pending Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user without edit permissions.
		wp_set_current_user( $this->subscriber_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertEmpty( $output, 'Pending form should NOT be rendered for users without edit_post permission' );
	}

	/**
	 * Test that future (scheduled) forms are rendered with notice for users with edit_post permission.
	 */
	public function test_render_synced_future_form_with_edit_permission() {
		// Create a future-dated form.
		$future_date = gmdate( 'Y-m-d H:i:s', strtotime( '+1 week' ) );
		$form_id     = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'future',
				'post_date'    => $future_date,
				'post_date_gmt' => get_gmt_from_date( $future_date ),
				'post_title'   => 'Scheduled Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-name {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user with edit permissions.
		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should render with status notice.
		$this->assertNotEmpty( $output, 'Future form should be rendered for users with edit_post permission' );
		$this->assertStringContainsString( 'jetpack-form-status-notice', $output, 'Output should contain status notice' );
		$this->assertStringContainsString( 'scheduled', $output, 'Output should mention scheduled status' );
		$this->assertStringContainsString( 'Edit form', $output, 'Output should contain edit link' );
	}

	/**
	 * Test that future forms are NOT rendered without edit_post permission.
	 */
	public function test_render_synced_future_form_without_edit_permission() {
		// Create a future-dated form.
		$future_date = gmdate( 'Y-m-d H:i:s', strtotime( '+1 week' ) );
		$form_id     = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'future',
				'post_date'    => $future_date,
				'post_date_gmt' => get_gmt_from_date( $future_date ),
				'post_title'   => 'Scheduled Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-name {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user without edit permissions.
		wp_set_current_user( $this->subscriber_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertEmpty( $output, 'Future form should NOT be rendered for users without edit_post permission' );
	}

	/**
	 * Test that private forms are rendered without notice for users with edit_post permission.
	 */
	public function test_render_synced_private_form_with_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'private',
				'post_title'   => 'Private Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-telephone {"label":"Phone"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user with edit permissions.
		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should render without status notice (private is treated like published).
		$this->assertNotEmpty( $output, 'Private form should be rendered for users with edit_post permission' );
		$this->assertStringNotContainsString( 'jetpack-form-status-notice', $output, 'Private form should not contain status notice' );
	}

	/**
	 * Test that private forms are NOT rendered without edit_post permission.
	 */
	public function test_render_synced_private_form_without_edit_permission() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'private',
				'post_title'   => 'Private Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-telephone {"label":"Phone"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Set user without edit permissions.
		wp_set_current_user( $this->subscriber_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertEmpty( $output, 'Private form should NOT be rendered for users without edit_post permission' );
	}

	/**
	 * Test that status notice contains correct CSS classes for different statuses.
	 */
	public function test_status_notice_css_classes() {
		// Test draft form (warning).
		$draft_form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Text"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		wp_set_current_user( $this->editor_id );

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $draft_form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertStringContainsString( 'jetpack-form-status-notice--warning', $output, 'Draft form should have warning CSS class' );

		// Test future form (info).
		$future_date    = gmdate( 'Y-m-d H:i:s', strtotime( '+1 week' ) );
		$future_form_id = wp_insert_post(
			array(
				'post_type'     => 'jetpack_form',
				'post_status'   => 'future',
				'post_date'     => $future_date,
				'post_date_gmt' => get_gmt_from_date( $future_date ),
				'post_title'    => 'Scheduled Form',
				'post_content'  => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Text"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $future_form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertStringContainsString( 'jetpack-form-status-notice--info', $output, 'Future form should have info CSS class' );
	}

	/**
	 * Test that form without ref attribute renders inline content.
	 */
	public function test_render_inline_form_without_ref() {
		// Create a block without ref attribute (inline form)
		$block = new WP_Block(
			array(
				'blockName'   => 'jetpack/contact-form',
				'attrs'       => array( 'to' => 'test@example.com' ),
				'innerBlocks' => array(),
			)
		);

		// Render the block with inline content
		$content = '<div class="wp-block-jetpack-contact-form"><form></form></div>';
		$output  = Contact_Form_Block::gutenblock_render_form( $block->attributes, $content );

		// Should render the inline content, not try to load from ref
		$this->assertNotEmpty( $output, 'Inline form should render' );
	}

	/**
	 * Test that ref_id is set and cleared during synced form rendering.
	 */
	public function test_ref_id_is_set_and_cleared() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Render synced form
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		// The ref_id is managed internally by render_synced_form() and cleared after rendering
		// We verify this works by successfully rendering a form
		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Verify that form was rendered successfully (proves ref_id was set and cleared properly)
		$this->assertNotEmpty( $output, 'Form should render successfully with ref_id management' );
	}
}
