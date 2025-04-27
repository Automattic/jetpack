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
} // end class
