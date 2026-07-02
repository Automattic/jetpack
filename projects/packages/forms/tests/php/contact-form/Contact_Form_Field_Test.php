<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Contact_Form::class )]
class Contact_Form_Field_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// Mock global variables
		global $user_identity;

		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'user_email' => 'admin@admin.com',
				'role'       => 'reader',
				'user_url'   => 'https://example.com',
			)
		);

		// Simulate a logged-in user
		wp_set_current_user( $user_id );
		$user_identity = 'Test User';
	}

	protected function tearDown(): void {
		parent::tearDown();
		global $current_user, $user_identity;

		// Clean up globals
		unset( $_POST, $_GET, $current_user, $user_identity );
	}

	/**
	 * Helper function to invoke the function from the class.
	 */
	private function invoke_get_computed_field_value( $field_type, $field_id ) {
		$field = $this->get_new_field_instance(
			array(
				'type' => $field_type,
				'id'   => $field_id,
			)
		);
		return $field->get_computed_field_value( $field_type, $field_id );
	}

	private function get_new_field_instance( $attributes ) {
		$defaults = array(
			'type'    => 'text',
			'id'      => 'id',
			'default' => 'default',
		);

		$form = new Contact_Form( array() );
		return new Contact_Form_Field( wp_parse_args( $attributes, $defaults ), '', $form );
	}

	/**
	 * Test handling $_POST single value
	 */
	public function test_handles_post_single_value() {
		$_POST['test_field'] = 'Post Value';

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( 'Post Value', $result );
	}

	/**
	 * Test handling $_POST array value
	 */
	public function test_handles_post_array_value() {
		$_POST['test_field'] = array( 'value1', 'value2' );

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( array( 'value1', 'value2' ), $result );
	}

	/**
	 * Test handling $_GET single value
	 */
	public function test_handles_get_single_value() {
		$_GET['test_field'] = 'Get Value';

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( 'Get Value', $result );
	}

	/**
	 * Test handling $_GET array value
	 */
	public function test_handles_get_array_value() {
		$_GET['test_field'] = array( 'value1', 'value2' );

		$result = $this->invoke_get_computed_field_value( 'text', 'test_field' );

		$this->assertEquals( array( 'value1', 'value2' ), $result );
	}

	/**
	 * Test logged-in user email return
	 */
	public function test_returns_logged_in_user_email() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'email', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'admin@admin.com', $result );
	}

	/**
	 * Test logged-in user name return
	 */
	public function test_returns_logged_in_user_name() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'name', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'Test User', $result );
	}

	/**
	 * Test logged-in user URL return
	 */
	public function test_returns_logged_in_user_url() {
		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'url', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'https://example.com', $result );
	}

	/**
	 * Test logged-in user URL return
	 */
	public function test_returns_logged_out_user_url() {
		global $current_user;
		unset( $current_user );
		wp_set_current_user( 0 );

		add_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );
		$result = $this->invoke_get_computed_field_value( 'url', 'test_field' );
		remove_filter( 'jetpack_auto_fill_logged_in_user', '__return_true' );

		$this->assertEquals( 'default', $result );
	}

	/**
	 * Test sanitization of field values.
	 */
	public function test_sanitizes_field_values() {
		$field = $this->get_new_field_instance(
			array(
				'type' => 'text',
				'id'   => 'test_field',
			)
		);

		$unsanitized_value = '<script>alert("XSS")</script>';
		$this->assertEquals( sanitize_text_field( html_entity_decode( $unsanitized_value, ENT_QUOTES ) ), $field->sanitize_text_field( $unsanitized_value ) );

		$unsanitized_value = 'hello&#044; world';
		$this->assertEquals( sanitize_text_field( html_entity_decode( $unsanitized_value, ENT_QUOTES ) ), $field->sanitize_text_field( $unsanitized_value ) );
	}

	/**
	 * Test consent field renders as hidden input when consent type is implicit.
	 */
	public function test_render_consent_field_implicit_type() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'consenttype'            => 'implicit',
				'implicitconsentmessage' => 'By submitting this form, you agree to our terms.',
			)
		);

		$html = $field->render();

		// Should contain a hidden input field
		$this->assertStringContainsString( 'type=\'hidden\'', $html );
		$this->assertStringContainsString( 'value=\'Yes\'', $html );
		$this->assertStringContainsString( 'consent-implicit', $html );
		$this->assertStringContainsString( 'By submitting this form, you agree to our terms.', $html );
	}

	/**
	 * Test consent field renders as checkbox when consent type is explicit.
	 */
	public function test_render_consent_field_explicit_type() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'consenttype'            => 'explicit',
				'explicitconsentmessage' => 'I agree to the terms and conditions.',
			)
		);

		$html = $field->render();

		// Should contain a checkbox input field
		$this->assertStringContainsString( 'type=\'checkbox\'', $html );
		$this->assertStringContainsString( 'value=\'Yes\'', $html );
		$this->assertStringContainsString( 'consent-explicit', $html );
		$this->assertStringContainsString( 'I agree to the terms and conditions.', $html );
	}

	/**
	 * Test consent field defaults to implicit when no consent type is specified.
	 */
	public function test_render_consent_field_default_implicit() {
		$field = $this->get_new_field_instance(
			array(
				'type'                   => 'consent',
				'id'                     => 'test_consent',
				'implicitconsentmessage' => 'Default implicit consent message.',
			)
		);

		$html = $field->render();

		// Should default to implicit (hidden field)
		$this->assertStringContainsString( 'type=\'hidden\'', $html );
		$this->assertStringContainsString( 'consent-implicit', $html );
	}

	/**
	 * Test that validate() does not emit a foreach warning for checkbox-multiple
	 * when $_POST contains a non-array (string) value.
	 */
	public function test_validate_checkbox_multiple_no_foreach_warning_with_string_value() {
		$_POST['test_field'] = 'not-an-array';

		$field = $this->get_new_field_instance(
			array(
				'type'     => 'checkbox-multiple',
				'id'       => 'test_field',
				'required' => true,
				'options'  => array( 'Option 1', 'Option 2' ),
			)
		);

		// This should not emit a PHP warning ("foreach() argument must be of type array|object, string given").
		$field->validate();

		// A validation error is expected because the string value is not a valid option.
		$this->assertTrue( $field->is_error() );
	}

	/**
	 * Test that validate() does not emit a foreach warning for image-select with ismultiple
	 * when $_POST contains a non-array (string) value.
	 */
	public function test_validate_image_select_multiple_no_foreach_warning_with_string_value() {
		$_POST['test_field'] = 'not-an-array';

		$field = $this->get_new_field_instance(
			array(
				'type'       => 'image-select',
				'id'         => 'test_field',
				'required'   => true,
				'ismultiple' => true,
				'options'    => array( 'a', 'b' ),
			)
		);

		// This should not emit a PHP warning ("foreach() argument must be of type array|object, string given").
		$field->validate();

		// A validation error is expected because the string value is not a valid option.
		$this->assertTrue( $field->is_error() );
	}
} // end class
