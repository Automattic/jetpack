<?php
/**
 * Unit Tests for Form_Editor.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Editor;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Screen;

/**
 * Test class for Form_Editor
 *
 * @covers Automattic\Jetpack\Forms\Editor\Form_Editor
 */
#[CoversClass( Form_Editor::class )]
class Form_Editor_Test extends BaseTestCase {

	/**
	 * Test that init() registers the expected hooks.
	 */
	public function test_init_registers_hooks() {
		// Remove any existing hooks first to ensure a clean state
		remove_all_filters( 'allowed_block_types_all' );
		remove_all_filters( 'block_editor_settings_all' );
		remove_all_actions( 'admin_enqueue_scripts' );

		// Initialize the form editor
		Form_Editor::init();

		// Verify the filter is registered
		$this->assertNotFalse(
			has_filter( 'allowed_block_types_all', array( Form_Editor::class, 'allowed_blocks_for_jetpack_form' ) ),
			'allowed_block_types_all filter should be registered'
		);

		$this->assertNotFalse(
			has_filter( 'block_editor_settings_all', array( Form_Editor::class, 'block_editor_settings_all' ) ),
			'block_editor_settings_all filter should be registered'
		);

		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Form_Editor::class, 'enqueue_admin_scripts' ) ),
			'admin_enqueue_scripts action should be registered'
		);

		// Clean up
		remove_all_filters( 'allowed_block_types_all' );
		remove_all_filters( 'block_editor_settings_all' );
		remove_all_actions( 'admin_enqueue_scripts' );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the restricted block list
	 * when editing a jetpack-form post type.
	 */
	public function test_allowed_blocks_for_jetpack_form_restricts_blocks() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with an array of allowed blocks (default WordPress behavior)
		$allowed_blocks = array( 'core/paragraph', 'core/heading', 'jetpack/contact-form' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is an array
		$this->assertIsArray( $result, 'Result should be an array of allowed blocks' );

		// Verify that specific field blocks are in the allowed list
		$this->assertContains( 'jetpack/field-name', $result, 'Field name block should be allowed' );
		$this->assertContains( 'jetpack/field-email', $result, 'Field email block should be allowed' );
		$this->assertContains( 'jetpack/field-textarea', $result, 'Field textarea block should be allowed' );
		$this->assertContains( 'jetpack/button', $result, 'Button block should be allowed' );

		// Verify that core blocks are in the allowed list
		$this->assertContains( 'core/paragraph', $result, 'Paragraph block should be allowed' );
		$this->assertContains( 'core/heading', $result, 'Heading block should be allowed' );
		$this->assertContains( 'core/accordion', $result, 'Accordion block should be allowed' );
		$this->assertContains( 'core/details', $result, 'Details block should be allowed' );
		$this->assertContains( 'core/icon', $result, 'Icon block should be allowed' );

		// Verify that contact-form block is NOT in the list (handled by DOM manipulation)
		$this->assertNotContains( 'jetpack/contact-form', $result, 'Contact form block should not be in the allowed list' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the original allowed blocks
	 * when editing a different post type.
	 */
	public function test_allowed_blocks_for_jetpack_form_returns_original_for_other_post_types() {
		// Create a mock post with a different post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with an array of allowed blocks
		$allowed_blocks = array( 'core/paragraph', 'core/heading' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $allowed_blocks, $result, 'Should return original allowed blocks for non-jetpack-form post types' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the original value
	 * when allowed_block_types is true (all blocks allowed).
	 */
	public function test_allowed_blocks_for_jetpack_form_with_boolean_true() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with true (all blocks allowed)
		$result = Form_Editor::allowed_blocks_for_jetpack_form( true, $editor_context );

		// Verify that the result is an array (the restricted list)
		$this->assertIsArray( $result, 'Should return restricted block array even when input is true' );
		$this->assertContains( 'jetpack/field-name', $result, 'Field name block should be in the restricted list' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form handles missing editor context gracefully.
	 */
	public function test_allowed_blocks_for_jetpack_form_without_post() {
		// Create editor context without post
		$editor_context = new \stdClass();

		// Call the method
		$allowed_blocks = array( 'core/paragraph', 'core/heading' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is the same as the input (no restrictions applied)
		$this->assertEquals( $allowed_blocks, $result, 'Should return original allowed blocks when post is not set' );
	}

	/**
	 * Test that block_editor_settings_all disables block locking for jetpack-form posts.
	 */
	public function test_block_editor_settings_all_disables_locking() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with default settings
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that canLockBlocks is set to false
		$this->assertFalse( $result['canLockBlocks'], 'canLockBlocks should be false for jetpack-form posts' );

		// Verify that other settings are preserved
		$this->assertEquals( 'value', $result['otherSetting'], 'Other settings should be preserved' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that block_editor_settings_all returns original settings for other post types.
	 */
	public function test_block_editor_settings_all_returns_original_for_other_post_types() {
		// Create a mock post with a different post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with default settings
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $settings, $result, 'Should return original settings for non-jetpack-form post types' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that block_editor_settings_all handles missing editor context gracefully.
	 */
	public function test_block_editor_settings_all_without_post() {
		// Create editor context without post
		$editor_context = new \stdClass();

		// Call the method
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $settings, $result, 'Should return original settings when post is not set' );
	}

	/**
	 * Test that enqueue_admin_scripts enqueues the script in block editor context.
	 */
	public function test_enqueue_admin_scripts_in_block_editor() {
		global $wp_scripts;

		if ( ! file_exists( __DIR__ . '/../../../dist/form-editor/jetpack-form-editor.asset.php' ) ) {
			// Skip the test if the asset file does not exist to avoid false positives
			$this->markTestSkipped( 'Asset file does not exist; skipping enqueue test to avoid false positives.' );
		}

		// Create a mock screen for block editor
		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is enqueued
		$this->assertTrue(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should be enqueued in block editor context'
		);

		// Clean up
		set_current_screen( 'front' );
		wp_deregister_script( Form_Editor::SCRIPT_HANDLE );
	}

	/**
	 * Test that enqueue_admin_scripts does NOT enqueue the script in site editor.
	 */
	public function test_enqueue_admin_scripts_not_in_site_editor() {
		global $wp_scripts;

		// Create a mock screen for site editor
		$screen                  = WP_Screen::get( 'site-editor' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued in site editor'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that enqueue_admin_scripts does NOT enqueue the script in non-block editor context.
	 */
	public function test_enqueue_admin_scripts_not_in_non_block_editor() {
		global $wp_scripts;

		// Create a mock screen for non-block editor (classic editor)
		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = false;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued in non-block editor context'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that enqueue_admin_scripts handles null screen gracefully.
	 */
	public function test_enqueue_admin_scripts_with_null_screen() {
		global $wp_scripts, $current_screen;

		// Set current screen to null directly
		$current_screen = null;

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method - should not throw an error
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued when screen is null'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that the allowed blocks list includes all expected block types.
	 */
	public function test_allowed_blocks_list_completeness() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Get the allowed blocks
		$result = Form_Editor::allowed_blocks_for_jetpack_form( array(), $editor_context );

		// Expected blocks - field blocks
		$expected_field_blocks = array(
			'jetpack/field-name',
			'jetpack/field-email',
			'jetpack/field-url',
			'jetpack/field-telephone',
			'jetpack/field-textarea',
			'jetpack/field-checkbox',
			'jetpack/field-checkbox-multiple',
			'jetpack/field-radio',
			'jetpack/field-select',
			'jetpack/field-date',
			'jetpack/field-consent',
			'jetpack/field-rating',
			'jetpack/field-text',
			'jetpack/field-number',
			'jetpack/field-hidden',
			'jetpack/field-file',
			'jetpack/field-time',
			'jetpack/field-slider',
			'jetpack/field-image-select',
		);

		// Expected blocks - supporting blocks
		$expected_supporting_blocks = array(
			'jetpack/button',
			'jetpack/label',
			'jetpack/input',
			'jetpack/options',
			'jetpack/option',
			'jetpack/phone-input',
			'jetpack/dropzone',
			'jetpack/input-range',
			'jetpack/input-rating',
			'jetpack/fieldset-image-options',
			'jetpack/input-image-option',
		);

		// Expected blocks - multistep blocks
		$expected_multistep_blocks = array(
			'jetpack/form-step',
			'jetpack/form-step-container',
			'jetpack/form-step-divider',
			'jetpack/form-step-navigation',
			'jetpack/form-progress-indicator',
		);

		// Expected blocks - core blocks
		$expected_core_blocks = array(
			'core/accordion',
			'core/audio',
			'core/button',
			'core/code',
			'core/column',
			'core/columns',
			'core/details',
			'core/group',
			'core/heading',
			'core/html',
			'core/icon',
			'core/image',
			'core/list',
			'core/list-item',
			'core/math',
			'core/paragraph',
			'core/row',
			'core/separator',
			'core/spacer',
			'core/stack',
			'core/subhead',
			'core/video',
		);

		// Verify all expected blocks are present
		foreach ( $expected_field_blocks as $block ) {
			$this->assertContains( $block, $result, "Field block $block should be in allowed list" );
		}

		foreach ( $expected_supporting_blocks as $block ) {
			$this->assertContains( $block, $result, "Supporting block $block should be in allowed list" );
		}

		foreach ( $expected_multistep_blocks as $block ) {
			$this->assertContains( $block, $result, "Multistep block $block should be in allowed list" );
		}

		foreach ( $expected_core_blocks as $block ) {
			$this->assertContains( $block, $result, "Core block $block should be in allowed list" );
		}

		// Clean up
		wp_delete_post( $post_id, true );
	}
}
