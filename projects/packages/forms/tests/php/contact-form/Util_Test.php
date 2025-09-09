<?php
/**
 * Unit Tests for Util class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Util
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Util
 */
#[CoversClass( Util::class )]
class Util_Test extends BaseTestCase {

	/**
	 * Test that Admin::init() is not called when Util::init() is called.
	 *
	 * This test verifies that the deprecated Admin class is not being initialized
	 * when the Util class is initialized, confirming the deprecation of the
	 * classic admin functionality.
	 */
	public function test_admin_init_not_called_on_util_init() {
		// Initialize Util
		Util::init();

		$actions_after = $GLOBALS['wp_filter'];

		// Verify that no admin-specific hooks were added
		// We check for hooks that would be added by Admin::init()
		$admin_hooks = array(
			'media_buttons',
			'wp_ajax_grunion_form_builder',
			'admin_print_styles',
			'admin_print_scripts',
			'admin_head',
			'admin_init',
			'admin_enqueue_scripts',
			'admin_footer-edit.php',
		);

		$unexpected_hooks_found = array();
		foreach ( $admin_hooks as $hook ) {
			if ( isset( $actions_after[ $hook ] ) ) {
				// Check if any of the callbacks are from the Admin class
				foreach ( $actions_after[ $hook ]->callbacks as $callbacks ) {
					foreach ( $callbacks as $callback ) {
						if ( is_array( $callback['function'] ) &&
							is_object( $callback['function'][0] ) &&
							$callback['function'][0] instanceof Admin ) {
							$unexpected_hooks_found[] = $hook;
						}
					}
				}
			}
		}

		$this->assertEmpty(
			$unexpected_hooks_found,
			'No Admin class hooks should be registered after Util::init(). Found: ' . implode( ', ', $unexpected_hooks_found )
		);
	}

	/**
	 * Test that Admin::init() method is properly deprecated.
	 *
	 * This test verifies that calling Admin::init() directly triggers
	 * a deprecation notice as expected.
	 */
	public function test_admin_init_is_deprecated() {
		// Test that the Admin::init method has the @deprecated annotation
		$reflection  = new \ReflectionMethod( Admin::class, 'init' );
		$doc_comment = $reflection->getDocComment();

		$this->assertStringContainsString( '@deprecated', $doc_comment, 'Admin::init() method should have @deprecated annotation' );

		// Call the deprecated method and verify it still works (for backward compatibility)
		$admin_instance = Admin::init();
		$this->assertInstanceOf( Admin::class, $admin_instance, 'Admin::init() should still return an Admin instance for backward compatibility' );
	}

	/**
	 * Test that Util::init() sets up the expected hooks and filters.
	 *
	 * This test verifies that the Util::init() method properly registers
	 * the expected WordPress hooks and filters without initializing the
	 * deprecated Admin class.
	 */
	public function test_util_init_registers_expected_hooks() {
		// Remove any existing hooks first to get a clean state
		remove_all_filters( 'template_include' );
		remove_all_actions( 'render_block_core_template_part_post' );
		remove_all_actions( 'init' );
		remove_all_actions( 'grunion_scheduled_delete' );
		remove_all_actions( 'grunion_pre_message_sent' );

		// Initialize Util
		Util::init();

		// Verify that the expected hooks are registered (has_filter/has_action return priority or false)
		$this->assertNotFalse(
			has_filter( 'template_include', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_attribute' ),
			'template_include filter should be registered'
		);

		$this->assertNotFalse(
			has_action( 'render_block_core_template_part_post', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' ),
			'render_block_core_template_part_post action should be registered'
		);

		$this->assertNotFalse(
			has_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init' ),
			'Contact_Form_Plugin::init should be registered on init action'
		);

		$this->assertNotFalse(
			has_action( 'grunion_scheduled_delete', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_delete_old_spam' ),
			'grunion_scheduled_delete action should be registered'
		);

		$this->assertNotFalse(
			has_action( 'grunion_pre_message_sent', '\Automattic\Jetpack\Forms\ContactForm\Util::jetpack_tracks_record_grunion_pre_message_sent' ),
			'grunion_pre_message_sent action should be registered'
		);
	}
}
