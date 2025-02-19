<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
class WP_Test_Contact_Form_Field extends BaseTestCase {

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

		return new Contact_Form_Field( wp_parse_args( $attributes, $defaults ) );
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
	 * Test the render_radio_field method
	 */
	public function test_render_radio_field() {
		// Create a Contact_Form_Field instance with radio options
		$field = new Contact_Form_Field(
			array(
				'label'    => 'Test Radio',
				'type'     => 'radio',
				'options'  => array( 'Option 1', 'Option 2' ),
				'values'   => array( 'value1', 'value2' ),
				'required' => true,
			),
			null,
			new Contact_Form( array() )
		);

		// Call render_radio_field with test parameters
		$output = $field->render_radio_field(
			'test-id',
			'Test Radio',
			'Option 1', // Selected value
			"class='custom-class'",
			true,
			'(required)'
		);

		// Verify the output contains expected elements
		$this->assertStringContainsString( '<fieldset id="test-id-label"', $output );
		$this->assertStringContainsString( 'class="grunion-radio-options"', $output );

		// Check for first radio option
		$this->assertStringContainsString( "value='value1'", $output );
		$this->assertStringContainsString( 'id=\'test-id-value1\'', $output );
		$this->assertStringContainsString( 'Option 1', $output );
		$this->assertStringContainsString( 'type=\'radio\'', $output );

		// Check for second radio option
		$this->assertStringContainsString( "value='value2'", $output );
		$this->assertStringContainsString( 'id=\'test-id-value2\'', $output );
		$this->assertStringContainsString( 'Option 2', $output );

		// Verify required attributes
		$this->assertStringContainsString( "required aria-required='true'", $output );

		// Verify the label contains required text
		$this->assertStringContainsString( '(required)', $output );

		// Verify CSS classes
		$this->assertStringContainsString( "class='custom-class'", $output );
		$this->assertStringContainsString( "class='grunion-field-label'", $output );
		$this->assertStringContainsString( "class='grunion-radio-label radio'", $output );
		$this->assertStringContainsString( "class='grunion-field-text'", $output );

		// Verify labels exist and are properly linked to inputs
		$this->assertStringContainsString( "<label for='test-id-value1'", $output );
		$this->assertStringContainsString( "<label for='test-id-value2'", $output );

		// Verify the fieldset legend (main label)
		$this->assertStringContainsString( "<legend\n\t\t\t\tclass='grunion-field-label'>Test Radio", $output );

		// Verify input-label pairs match
		$this->assertMatchesRegularExpression(
			'/id=\'test-id-value1\'.*?<label for=\'test-id-value1\'.*?Option 1/s',
			$output
		);
		$this->assertMatchesRegularExpression(
			'/id=\'test-id-value2\'.*?<label for=\'test-id-value2\'.*?Option 2/s',
			$output
		);
	}

	/**
	 * Test the render_checkbox_field method
	 */
	public function test_render_checkbox_field() {
		// Create a Contact_Form_Field instance with checkbox field
		$field = new Contact_Form_Field(
			array(
				'label'    => 'Test Checkbox',
				'type'     => 'checkbox',
				'required' => true,
			),
			null,
			new Contact_Form( array() )
		);

		// Call render_checkbox_field with test parameters
		$output = $field->render_checkbox_field(
			'test-id',
			'Test Checkbox',
			'Yes', // Value
			"class='custom-class'",
			true,
			'(required)'
		);

		// Verify the basic structure
		$this->assertStringContainsString( "<div class='contact-form__checkbox-wrap'>", $output );

		// Verify input attributes
		$this->assertStringContainsString( "type='checkbox'", $output );
		$this->assertStringContainsString( "name='test-id'", $output );
		$this->assertStringContainsString( "id='test-id'", $output );
		$this->assertStringContainsString( "value='Yes'", $output );
		$this->assertStringContainsString( "class='custom-class'", $output );
		$this->assertStringContainsString( "required aria-required='true'", $output );

		// Verify label exists and is properly linked to input
		$this->assertStringContainsString( "<label for='test-id'", $output );
		$this->assertStringContainsString( "class='grunion-field-label checkbox", $output );

		// Verify label text and required indicator
		$this->assertStringContainsString( 'Test Checkbox', $output );
		$this->assertStringContainsString( '<span class="grunion-label-required" aria-hidden="true">(required)</span>', $output );

		// Verify the clear-form div exists
		$this->assertStringContainsString( "<div class='clear-form'>", $output );

		// Verify input-label connection using regex
		$this->assertMatchesRegularExpression(
			'/id=\'test-id\'.*?<label for=\'test-id\'.*?Test Checkbox/s',
			$output
		);

		// Test unchecked state
		$field = new Contact_Form_Field(
			array(
				'label'    => 'Test Checkbox',
				'type'     => 'checkbox',
				'required' => false,
			),
			null,
			new Contact_Form( array() )
		);

		$output = $field->render_checkbox_field(
			'test-id',
			'Test Checkbox',
			'', // Empty value for unchecked
			"class='custom-class'",
			false,
			'(required)'
		);

		// Verify non-required state
		$this->assertStringNotContainsString( 'required', $output );
		$this->assertStringNotContainsString( '(required)', $output );
		$this->assertStringNotContainsString( "checked='checked'", $output );
	}

	/**
	 * Test the render_checkbox_multiple_field method
	 */
	public function test_render_checkbox_multiple_field() {
		// Create a Contact_Form_Field instance with multiple checkbox field
		$field = new Contact_Form_Field(
			array(
				'label'    => 'Test Multiple Checkbox',
				'type'     => 'checkbox-multiple',
				'options'  => array( 'Option 1', 'Option 2' ),
				'values'   => array( 'value1', 'value2' ),
				'required' => true,
			),
			null,
			new Contact_Form( array() )
		);

		// Call render_checkbox_multiple_field with test parameters
		$output = $field->render_checkbox_multiple_field(
			'test-id',
			'Test Multiple Checkbox',
			array( 'Option 1' ), // Selected values
			"class='custom-class'",
			true,
			'(required)'
		);

		// Verify the basic structure
		$this->assertStringContainsString( '<fieldset id="test-id-label"', $output );
		$this->assertStringContainsString( 'class="grunion-checkbox-multiple-options"', $output );
		$this->assertStringContainsString( 'data-required', $output );

		// Verify the fieldset legend (main label)
		$this->assertStringContainsString( "<legend\n\t\t\t\tclass='grunion-field-label'>", $output );
		$this->assertStringContainsString( 'Test Multiple Checkbox', $output );
		$this->assertStringContainsString( '<span class="grunion-label-required">(required)</span>', $output );

		// Check for first checkbox option
		$this->assertStringContainsString( "value='value1'", $output );
		$this->assertStringContainsString( 'id=\'test-id-value1\'', $output );
		$this->assertStringContainsString( 'Option 1', $output );
		$this->assertStringContainsString( 'type=\'checkbox\'', $output );
		$this->assertStringContainsString( "name='test-id[]'", $output );
		$this->assertStringContainsString( "value='value1' class='custom-class' checked='checked", $output ); // Check that the selected value is set.

		// Check for second checkbox option
		$this->assertStringContainsString( "value='value2'", $output );
		$this->assertStringContainsString( 'id=\'test-id-value2\'', $output );
		$this->assertStringContainsString( 'Option 2', $output );
		$this->assertStringNotContainsString( "value='value2' class='custom-class' checked='checked", $output );

		// Verify CSS classes
		$this->assertStringContainsString( "class='custom-class'", $output );
		$this->assertStringContainsString( "class='grunion-checkbox-multiple-label checkbox-multiple '", $output );
		$this->assertStringContainsString( "class='grunion-field-text'", $output );

		// Verify labels exist and are properly linked to inputs
		$this->assertStringContainsString( "<label for='test-id-value1'", $output );
		$this->assertStringContainsString( "<label for='test-id-value2'", $output );

		// Verify input-label pairs match
		$this->assertMatchesRegularExpression(
			'/id=\'test-id-value1\'.*?<label for=\'test-id-value1\'.*?Option 1/s',
			$output
		);
		$this->assertMatchesRegularExpression(
			'/id=\'test-id-value2\'.*?<label for=\'test-id-value2\'.*?Option 2/s',
			$output
		);

		// Test non-required state
		$field = new Contact_Form_Field(
			array(
				'label'    => 'Test Multiple Checkbox',
				'type'     => 'checkbox-multiple',
				'options'  => array( 'Option 1', 'Option 2' ),
				'values'   => array( 'value1', 'value2' ),
				'required' => false,
			),
			null,
			new Contact_Form( array() )
		);

		$output = $field->render_checkbox_multiple_field(
			'test-id',
			'Test Multiple Checkbox',
			array(), // No selected values
			"class='custom-class'",
			false,
			'(required)'
		);

		// Verify non-required state
		$this->assertStringNotContainsString( 'data-required', $output );
		$this->assertStringNotContainsString( '(required)', $output );
		$this->assertStringNotContainsString( "checked='checked'", $output );
	}

	/**
	 * Test the render_consent_field method with explicit consent
	 */
	public function test_render_consent_field_explicit() {
		$field = new Contact_Form_Field(
			array(
				'type'                   => 'consent',
				'consenttype'            => 'explicit',
				'explicitconsentmessage' => 'I agree to the terms and conditions',
			),
			null,
			new Contact_Form( array() )
		);

		$output = $field->render_consent_field(
			'test-id',
			"class='custom-class'"
		);

		// Verify explicit consent structure
		$this->assertStringContainsString( "<label class='grunion-field-label consent consent-explicit'", $output );
		$this->assertStringContainsString( "type='checkbox'", $output );
		$this->assertStringContainsString( "name='test-id'", $output );
		$this->assertStringContainsString( "value='Yes'", $output );
		$this->assertStringContainsString( "class='custom-class'", $output );
		$this->assertStringContainsString( 'I agree to the terms and conditions', $output );
		$this->assertStringContainsString( "<div class='clear-form'>", $output );

		// Verify explicit consent checkbox is visible and interactive
		$this->assertStringNotContainsString( 'style=\'display:none;\'', $output );
		$this->assertStringNotContainsString( 'aria-hidden=\'true\'', $output );
		$this->assertStringNotContainsString( 'checked', $output );
	}

	/**
	 * Test the render_consent_field method with implicit consent
	 */
	public function test_render_consent_field_implicit() {
		// Test implicit consent
		$field = new Contact_Form_Field(
			array(
				'type'                   => 'consent',
				'consenttype'            => 'implicit',
				'implicitconsentmessage' => 'By submitting your information, you consent to our privacy policy',
			),
			null,
			new Contact_Form( array() )
		);

		$output = $field->render_consent_field(
			'test-id',
			"class='custom-class'"
		);

		// Verify implicit consent structure
		$this->assertStringContainsString( "<label class='grunion-field-label consent consent-implicit'", $output );
		$this->assertStringContainsString( "type='checkbox'", $output );
		$this->assertStringContainsString( "name='test-id'", $output );
		$this->assertStringContainsString( "value='Yes'", $output );
		$this->assertStringContainsString( 'By submitting your information, you consent to our privacy policy', $output );
		$this->assertStringContainsString( "<div class='clear-form'>", $output );

		// Verify implicit consent checkbox is hidden and checked
		$this->assertStringContainsString( 'style=\'display:none;\'', $output );
		$this->assertStringContainsString( 'aria-hidden=\'true\'', $output );
		$this->assertStringContainsString( 'checked', $output );

		// Test default consent type (should be implicit)
		$field = new Contact_Form_Field(
			array(
				'type'                   => 'consent',
				'implicitconsentmessage' => 'Default consent message',
			),
			null,
			new Contact_Form( array() )
		);

		$output = $field->render_consent_field(
			'test-id',
			"class='custom-class'"
		);

		// Verify default falls back to implicit
		$this->assertStringContainsString( "<label class='grunion-field-label consent consent-implicit'", $output );
		$this->assertStringContainsString( 'style=\'display:none;\'', $output );
		$this->assertStringContainsString( 'checked', $output );
	}
} // end class
