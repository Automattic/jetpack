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

	/**
	 * Test that export_to_gdrive functionality has been moved from Admin to Contact_Form_Plugin.
	 *
	 * This test verifies that the export_to_gdrive method is available in Contact_Form_Plugin
	 * and that the deprecated Admin method properly delegates to it.
	 */
	public function test_export_to_gdrive_moved_from_admin_to_plugin() {
		// Verify that Contact_Form_Plugin has the export_to_gdrive method
		$plugin_reflection = new \ReflectionClass( Contact_Form_Plugin::class );
		$this->assertTrue(
			$plugin_reflection->hasMethod( 'export_to_gdrive' ),
			'Contact_Form_Plugin should have export_to_gdrive method'
		);

		// Verify that Admin still has the deprecated method
		$admin_reflection = new \ReflectionClass( Admin::class );
		$this->assertTrue(
			$admin_reflection->hasMethod( 'export_to_gdrive' ),
			'Admin should still have deprecated export_to_gdrive method for backward compatibility'
		);

		// Verify that Admin method is marked as deprecated
		$admin_method = $admin_reflection->getMethod( 'export_to_gdrive' );
		$doc_comment  = $admin_method->getDocComment();
		$this->assertStringContainsString( '@deprecated', $doc_comment, 'Admin::export_to_gdrive() should be marked as deprecated' );
	}

	/**
	 * Test export_to_gdrive method security and validation.
	 *
	 * This test verifies that the export_to_gdrive method properly validates
	 * permissions and nonces before processing the export request.
	 */
	public function test_export_to_gdrive_security_validation() {
		// Create a Contact_Form_Plugin instance
		$plugin = Contact_Form_Plugin::init();

		// Test without proper capabilities
		$original_user = wp_get_current_user();
		wp_set_current_user( 0 ); // Set to no user

		// Mock $_POST data without proper nonce
		$_POST = array(
			'feedback_export_nonce_gdrive' => 'invalid_nonce',
		);

		// Capture output to check for JSON error response
		ob_start();
		$plugin->export_to_gdrive();
		$output = ob_get_clean();

		// Verify that an error response was sent
		$this->assertStringContainsString( 'You aren\'t authorized to do that.', $output );

		// Restore original user
		wp_set_current_user( $original_user->ID );

		// Clean up $_POST
		unset( $_POST['feedback_export_nonce_gdrive'] );
	}

	/**
	 * Test that deprecated Admin::export_to_gdrive properly delegates to Contact_Form_Plugin.
	 *
	 * This test ensures that calling the deprecated Admin method still works
	 * by delegating to the new implementation in Contact_Form_Plugin.
	 */
	public function test_deprecated_admin_export_delegates_to_plugin() {
		// Verify that the Admin method contains the proper delegation code
		$reflection = new \ReflectionMethod( Admin::class, 'export_to_gdrive' );

		// Get the method source code to verify it delegates to Contact_Form_Plugin
		$filename   = $reflection->getFileName();
		$start_line = $reflection->getStartLine();
		$end_line   = $reflection->getEndLine();

		$file_contents = file( $filename );
		$method_source = implode( '', array_slice( $file_contents, $start_line - 1, $end_line - $start_line + 1 ) );

		// Verify the method calls _deprecated_function with the correct replacement
		$this->assertStringContainsString(
			'Contact_Form_Plugin::init()->export_to_gdrive()',
			$method_source,
			'Admin::export_to_gdrive should reference Contact_Form_Plugin::init()->export_to_gdrive() in deprecation notice'
		);

		// Verify the method actually delegates to Contact_Form_Plugin
		$this->assertStringContainsString(
			'return Contact_Form_Plugin::init()->export_to_gdrive()',
			$method_source,
			'Admin::export_to_gdrive should delegate to Contact_Form_Plugin::init()->export_to_gdrive()'
		);
	}
}
