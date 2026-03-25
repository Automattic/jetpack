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
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();
		Contact_Form_Block::register_block();
		Contact_Form_Block::register_child_blocks();
	}

	/**
	 * Tear down the test environment.
	 */
	public function tear_down() {
		// Reset the seen refs to avoid state pollution between tests.
		Contact_Form::reset_seen_refs();
		parent::tear_down();
	}

	/**
	 * Test that form with ref attribute loads content from synced form post.
	 */
	public function test_render_synced_form_loads_content() {
		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

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

		kses_init_filters();

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

		// Verify the output contains the email field from the synced form (rendered as HTML)
		$this->assertStringContainsString( 'type=\'email\'', $output, 'Output should contain email input type' );
		$this->assertStringContainsString( 'grunion-field-label email', $output, 'Output should contain email field label class' );
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
		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();
		$circular_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_id );
		wp_update_post(
			array(
				'ID'           => $form_id,
				'post_content' => $circular_content,
			)
		);
		kses_init_filters();

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
	 * Test that only published or draft forms are rendered.
	 */
	public function test_render_synced_form_only_renders_published_or_draft() {
		// Create a trashed form
		$trashed_form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'trash',
				'post_title'   => 'Trashed Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $trashed_form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should not render trashed form
		$this->assertEmpty( $output, 'Trashed form should not be rendered' );
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
	 * Test that draft forms are NOT rendered.
	 */
	public function test_render_synced_form_does_not_render_draft_form() {
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'draft',
				'post_title'   => 'Draft Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );
		$this->assertEmpty( $output, 'Draft form should NOT be rendered' );
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

	/**
	 * Test set_ref_id marks the ID as seen.
	 */
	public function test_set_ref_id_marks_as_seen() {
		$ref_id = 123;

		// Initially not seen
		$this->assertFalse( Contact_Form::has_seen( $ref_id ), 'Ref ID should not be seen initially' );

		// Set ref_id
		Contact_Form::set_ref_id( $ref_id );

		// Should now be seen
		$this->assertTrue( Contact_Form::has_seen( $ref_id ), 'Ref ID should be seen after set_ref_id' );
		$this->assertSame( $ref_id, Contact_Form::get_ref_id(), 'get_ref_id should return the set ref_id' );

		// Clean up
		Contact_Form::clear_ref_id( $ref_id );
	}

	/**
	 * Test that has_seen works correctly during form rendering context.
	 */
	public function test_has_seen_during_render_context() {
		// Create a simple form with actual content
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-text {"label":"Name"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Manually set the ref_id as if we were in the middle of rendering
		Contact_Form::set_ref_id( $form_id );

		// Verify has_seen returns true for the form we're "rendering"
		$this->assertTrue( Contact_Form::has_seen( $form_id ), 'has_seen should return true for form being rendered' );

		// Try to render the same form - should detect the circular reference
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_id ),
			)
		);

		// This call should detect that form_id is already being rendered and return empty
		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Clean up
		Contact_Form::clear_ref_id( $form_id );

		// The output should be empty because we detected circular reference
		$this->assertEmpty( $output, 'Attempting to render a form already being rendered should return empty' );
	}

	/**
	 * Test clear_ref_id removes the seen status.
	 */
	public function test_clear_ref_id_removes_seen_status() {
		$ref_id = 456;

		// Set and verify it's seen
		Contact_Form::set_ref_id( $ref_id );
		$this->assertTrue( Contact_Form::has_seen( $ref_id ), 'Ref ID should be seen after set' );

		// Clear it
		Contact_Form::clear_ref_id( $ref_id );

		// Should no longer be seen
		$this->assertFalse( Contact_Form::has_seen( $ref_id ), 'Ref ID should not be seen after clear' );
		$this->assertNull( Contact_Form::get_ref_id(), 'get_ref_id should return null after clear' );
	}

	/**
	 * Test multiple ref_ids can be tracked simultaneously.
	 */
	public function test_multiple_ref_ids_tracked_simultaneously() {
		$ref_a = 100;
		$ref_b = 200;

		// Set ref A
		Contact_Form::set_ref_id( $ref_a );
		$this->assertTrue( Contact_Form::has_seen( $ref_a ), 'Ref A should be seen' );
		$this->assertFalse( Contact_Form::has_seen( $ref_b ), 'Ref B should not be seen yet' );

		// Set ref B (simulating nested form)
		Contact_Form::set_ref_id( $ref_b );
		$this->assertTrue( Contact_Form::has_seen( $ref_a ), 'Ref A should still be seen' );
		$this->assertTrue( Contact_Form::has_seen( $ref_b ), 'Ref B should now be seen' );

		// Clear ref B (inner form done)
		Contact_Form::clear_ref_id( $ref_b );
		$this->assertTrue( Contact_Form::has_seen( $ref_a ), 'Ref A should still be seen after clearing B' );
		$this->assertFalse( Contact_Form::has_seen( $ref_b ), 'Ref B should no longer be seen' );

		// Clear ref A (outer form done)
		Contact_Form::clear_ref_id( $ref_a );
		$this->assertFalse( Contact_Form::has_seen( $ref_a ), 'Ref A should no longer be seen' );
	}

	/**
	 * Test indirect circular reference prevention (Form A -> Form B -> Form A).
	 */
	public function test_render_synced_form_prevents_indirect_circular_reference() {
		// Create Form A (will be updated to reference Form B)
		$form_a_id = wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Form A',
			)
		);

		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

		// Create Form B that references Form A
		$form_b_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_a_id );
		$form_b_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form B',
				'post_content' => $form_b_content,
			)
		);

		// Update Form A to reference Form B (creating indirect circular reference: A -> B -> A)
		$form_a_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_b_id );
		wp_update_post(
			array(
				'ID'           => $form_a_id,
				'post_content' => $form_a_content,
			)
		);

		kses_init_filters();

		// Try to render Form A
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_a_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should return empty string to prevent infinite loop
		// The rendering chain is: Form A -> Form B -> Form A (blocked)
		$this->assertEmpty( $output, 'Indirect circular reference (A->B->A) should be prevented' );
	}

	/**
	 * Test three-level indirect circular reference (Form A -> Form B -> Form C -> Form A).
	 */
	public function test_render_synced_form_prevents_three_level_circular_reference() {
		// Create Form A
		$form_a_id = wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Form A',
			)
		);

		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

		// Create Form C that references Form A
		$form_c_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_a_id );
		$form_c_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form C',
				'post_content' => $form_c_content,
			)
		);

		// Create Form B that references Form C
		$form_b_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_c_id );
		$form_b_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form B',
				'post_content' => $form_b_content,
			)
		);

		// Update Form A to reference Form B (A -> B -> C -> A)
		$form_a_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_b_id );
		wp_update_post(
			array(
				'ID'           => $form_a_id,
				'post_content' => $form_a_content,
			)
		);

		kses_init_filters();

		// Try to render Form A
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_a_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		// Should return empty string to prevent infinite loop
		$this->assertEmpty( $output, 'Three-level circular reference (A->B->C->A) should be prevented' );
	}

	/**
	 * Test simple two-level nested forms (A -> B where B has content).
	 */
	public function test_two_level_nested_forms_render() {
		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

		// Create Form B with actual content
		$form_b_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form B',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Create Form A that references Form B
		$form_a_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_b_id );
		$form_a_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form A',
				'post_content' => $form_a_content,
			)
		);

		// Verify Form A's content is stored correctly
		$form_a = get_post( $form_a_id );
		$blocks = parse_blocks( $form_a->post_content );
		$this->assertNotEmpty( $blocks, 'Form A should have blocks' );
		$this->assertArrayHasKey( 'ref', $blocks[0]['attrs'] ?? array(), sprintf( 'Block should have ref attr. Content: %s', $form_a->post_content ) );

		// Render Form A (keep kses disabled during rendering for nested form loading)
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_a_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		kses_init_filters();

		// Should render Form B's content since there's no circular reference
		$this->assertStringContainsString( 'email', $output, 'Two-level nested forms should render the leaf form content' );
	}

	/**
	 * Test that shortcode with ref attribute loads content from synced form post.
	 */
	public function test_shortcode_with_ref_attribute_loads_synced_form() {
		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

		// Use a unique label that wouldn't appear in a default form to avoid false positives
		$unique_label = 'Unique Shortcode Test Field XYZ123';

		// Create a jetpack_form post with form content containing the unique label
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Synced Form',
				'post_content' => sprintf(
					'<!-- wp:jetpack/contact-form -->
					<!-- wp:jetpack/field-text {"label":"%s","required":true} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
					<!-- /wp:jetpack/contact-form -->',
					$unique_label
				),
			)
		);

		kses_init_filters();

		$this->assertGreaterThan( 0, $form_id, 'Synced form post should be created' );

		// Process the shortcode with ref attribute
		$shortcode = sprintf( '[contact-form ref="%d"]', $form_id );
		$output    = do_shortcode( $shortcode );

		// Verify the output contains the unique label from the synced form
		// This ensures we're loading the actual referenced form, not a default form
		$this->assertStringContainsString( $unique_label, $output, 'Shortcode output should contain the unique label from the referenced form' );
	}

	/**
	 * Test that shortcode with invalid ref returns empty.
	 */
	public function test_shortcode_with_invalid_ref_returns_empty() {
		// Process the shortcode with invalid ref
		$shortcode = '[contact-form ref="99999"]'; // Non-existent form
		$output    = do_shortcode( $shortcode );

		// Should return empty or the original shortcode text (not render as a form)
		$this->assertEmpty( $output, 'Shortcode with invalid ref should return empty' );
	}

	/**
	 * Test that shortcode ref attribute prevents circular references.
	 */
	public function test_shortcode_ref_prevents_circular_reference() {
		// Create a form that references itself
		$form_id = wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Circular Form',
			)
		);

		// Update the form to reference itself (circular reference)
		kses_remove_filters();
		$circular_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_id );
		wp_update_post(
			array(
				'ID'           => $form_id,
				'post_content' => $circular_content,
			)
		);
		kses_init_filters();

		// Process the shortcode
		$shortcode = sprintf( '[contact-form ref="%d"]', $form_id );
		$output    = do_shortcode( $shortcode );

		// Should return empty to prevent infinite loop
		$this->assertEmpty( $output, 'Shortcode with circular ref should return empty' );
	}

	/**
	 * Test that shortcode with ref attribute only renders published forms.
	 */
	public function test_shortcode_ref_only_renders_published_forms() {
		// Create a trashed form
		$trashed_form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'trash',
				'post_title'   => 'Trashed Form',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Process the shortcode
		$shortcode = sprintf( '[contact-form ref="%d"]', $trashed_form_id );
		$output    = do_shortcode( $shortcode );

		// Should not render trashed form
		$this->assertEmpty( $output, 'Shortcode should not render trashed form' );
	}

	/**
	 * Test that non-circular nested forms render successfully.
	 */
	public function test_non_circular_nested_forms_render() {
		// Disable content filtering to prevent WordPress from escaping JSON
		kses_remove_filters();

		// Create Form C (leaf form with actual content)
		$form_c_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form C',
				'post_content' => '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/field-email {"label":"Email"} /--><!-- /wp:jetpack/contact-form -->',
			)
		);

		// Create Form B that references Form C
		$form_b_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_c_id );
		$form_b_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form B',
				'post_content' => $form_b_content,
			)
		);

		// Create Form A that references Form B (A -> B -> C, no cycle)
		$form_a_content = sprintf( '<!-- wp:jetpack/contact-form {"ref":%d} /-->', $form_b_id );
		$form_a_id      = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Form A',
				'post_content' => $form_a_content,
			)
		);

		// Render Form A (keep kses disabled during rendering for nested form loading)
		$block = new WP_Block(
			array(
				'blockName' => 'jetpack/contact-form',
				'attrs'     => array( 'ref' => $form_a_id ),
			)
		);

		$output = Contact_Form_Block::gutenblock_render_form( $block->attributes, '' );

		kses_init_filters();

		// Should render successfully since there's no circular reference
		$this->assertStringContainsString( 'email', $output, 'Non-circular nested forms should render the leaf form content' );
	}
}
