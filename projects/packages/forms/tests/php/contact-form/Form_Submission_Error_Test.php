<?php
/**
 * Test Form_Submission_Error class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\TestCase;

/**
 * Test Form_Submission_Error class.
 */
class Form_Submission_Error_Test extends TestCase {

	/**
	 * Test constructor with default system error type.
	 */
	public function test_constructor_default_system_error() {
		$error = new Form_Submission_Error( 'test_code', 'Test message' );

		$this->assertEquals( 'test_code', $error->get_error_code() );
		$this->assertEquals( 'Test message', $error->get_error_message() );
		$this->assertEquals( Form_Submission_Error::TYPE_SYSTEM, $error->get_error_type() );
		$this->assertTrue( $error->is_system_type() );
		$this->assertFalse( $error->is_validation_type() );
	}

	/**
	 * Test constructor with explicit validation error type.
	 */
	public function test_constructor_validation_error() {
		$error = new Form_Submission_Error( 'validation_code', 'Validation message', Form_Submission_Error::TYPE_VALIDATION );

		$this->assertEquals( 'validation_code', $error->get_error_code() );
		$this->assertEquals( 'Validation message', $error->get_error_message() );
		$this->assertEquals( Form_Submission_Error::TYPE_VALIDATION, $error->get_error_type() );
		$this->assertFalse( $error->is_system_type() );
		$this->assertTrue( $error->is_validation_type() );
	}

	/**
	 * Test constructor with explicit system error type.
	 */
	public function test_constructor_system_error() {
		$error = new Form_Submission_Error( 'system_code', 'System message', Form_Submission_Error::TYPE_SYSTEM );

		$this->assertEquals( 'system_code', $error->get_error_code() );
		$this->assertEquals( 'System message', $error->get_error_message() );
		$this->assertEquals( Form_Submission_Error::TYPE_SYSTEM, $error->get_error_type() );
		$this->assertTrue( $error->is_system_type() );
		$this->assertFalse( $error->is_validation_type() );
	}

	/**
	 * Test get_error_type method.
	 */
	public function test_get_error_type() {
		$system_error     = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_SYSTEM );
		$validation_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_VALIDATION );

		$this->assertEquals( Form_Submission_Error::TYPE_SYSTEM, $system_error->get_error_type() );
		$this->assertEquals( Form_Submission_Error::TYPE_VALIDATION, $validation_error->get_error_type() );
	}

	/**
	 * Test is_validation_type method.
	 */
	public function test_is_validation_type() {
		$validation_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_VALIDATION );
		$system_error     = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_SYSTEM );

		$this->assertTrue( $validation_error->is_validation_type() );
		$this->assertFalse( $system_error->is_validation_type() );
	}

	/**
	 * Test is_system_type method.
	 */
	public function test_is_system_type() {
		$system_error     = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_SYSTEM );
		$validation_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_VALIDATION );

		$this->assertTrue( $system_error->is_system_type() );
		$this->assertFalse( $validation_error->is_system_type() );
	}

	/**
	 * Test static is_system_error method with system error.
	 */
	public function test_static_is_system_error_with_system_error() {
		$system_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_SYSTEM );

		$this->assertTrue( Form_Submission_Error::is_system_error( $system_error ) );
	}

	/**
	 * Test static is_system_error method with validation error.
	 */
	public function test_static_is_system_error_with_validation_error() {
		$validation_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_VALIDATION );

		$this->assertFalse( Form_Submission_Error::is_system_error( $validation_error ) );
	}

	/**
	 * Test static is_system_error method with non-Form_Submission_Error.
	 */
	public function test_static_is_system_error_with_non_form_submission_error() {
		$wp_error = new \WP_Error( 'code', 'message' );
		$string   = 'not an error';
		$null     = null;

		$this->assertFalse( Form_Submission_Error::is_system_error( $wp_error ) );
		$this->assertFalse( Form_Submission_Error::is_system_error( $string ) );
		$this->assertFalse( Form_Submission_Error::is_system_error( $null ) );
	}

	/**
	 * Test static is_validation_error method with validation error.
	 */
	public function test_static_is_validation_error_with_validation_error() {
		$validation_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_VALIDATION );

		$this->assertTrue( Form_Submission_Error::is_validation_error( $validation_error ) );
	}

	/**
	 * Test static is_validation_error method with system error.
	 */
	public function test_static_is_validation_error_with_system_error() {
		$system_error = new Form_Submission_Error( 'code', 'message', Form_Submission_Error::TYPE_SYSTEM );

		$this->assertFalse( Form_Submission_Error::is_validation_error( $system_error ) );
	}

	/**
	 * Test static is_validation_error method with non-Form_Submission_Error.
	 */
	public function test_static_is_validation_error_with_non_form_submission_error() {
		$wp_error = new \WP_Error( 'code', 'message' );
		$string   = 'not an error';
		$null     = null;

		$this->assertFalse( Form_Submission_Error::is_validation_error( $wp_error ) );
		$this->assertFalse( Form_Submission_Error::is_validation_error( $string ) );
		$this->assertFalse( Form_Submission_Error::is_validation_error( $null ) );
	}

	/**
	 * Test validation_error factory method.
	 */
	public function test_validation_error_factory() {
		$error = Form_Submission_Error::validation_error( 'validation_code', 'Validation message' );

		$this->assertInstanceOf( Form_Submission_Error::class, $error );
		$this->assertEquals( 'validation_code', $error->get_error_code() );
		$this->assertEquals( 'Validation message', $error->get_error_message() );
		$this->assertEquals( Form_Submission_Error::TYPE_VALIDATION, $error->get_error_type() );
		$this->assertTrue( $error->is_validation_type() );
		$this->assertFalse( $error->is_system_type() );
	}

	/**
	 * Test system_error factory method.
	 */
	public function test_system_error_factory() {
		$error = Form_Submission_Error::system_error( 'system_code', 'System message' );

		$this->assertInstanceOf( Form_Submission_Error::class, $error );
		$this->assertEquals( 'system_code', $error->get_error_code() );
		$this->assertEquals( 'System message', $error->get_error_message() );
		$this->assertEquals( Form_Submission_Error::TYPE_SYSTEM, $error->get_error_type() );
		$this->assertTrue( $error->is_system_type() );
		$this->assertFalse( $error->is_validation_type() );
	}

	/**
	 * Test that Form_Submission_Error extends WP_Error.
	 */
	public function test_extends_wp_error() {
		$error = new Form_Submission_Error( 'code', 'message' );

		$this->assertInstanceOf( \WP_Error::class, $error );
	}

	/**
	 * Test that Form_Submission_Error can use WP_Error methods.
	 */
	public function test_wp_error_methods() {
		$error = new Form_Submission_Error( 'code', 'message' );

		// Test adding additional errors
		$error->add( 'additional_code', 'Additional message' );

		$this->assertTrue( $error->has_errors() );
		$this->assertEquals( 'code', $error->get_error_code() );
		$this->assertEquals( 'message', $error->get_error_message() );
		$this->assertEquals( 'Additional message', $error->get_error_message( 'additional_code' ) );
	}

	/**
	 * Test multiple errors with same Form_Submission_Error instance.
	 */
	public function test_multiple_errors_same_instance() {
		$error = Form_Submission_Error::validation_error( 'first_code', 'First message' );
		$error->add( 'second_code', 'Second message' );

		$this->assertTrue( $error->is_validation_type() );
		$this->assertEquals( 'first_code', $error->get_error_code() );
		$this->assertEquals( 'First message', $error->get_error_message() );
		$this->assertEquals( 'Second message', $error->get_error_message( 'second_code' ) );
		$this->assertCount( 2, $error->get_error_codes() );
	}
}
