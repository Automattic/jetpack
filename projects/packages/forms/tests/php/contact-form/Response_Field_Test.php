<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Response_Field
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Response_Field
 * @covers \Automattic\Jetpack\Forms\ContactForm\Form_Response
 */
#[CoversClass( Response_Field::class )]
#[CoversClass( Form_Response::class )]
class Response_Field_Test extends BaseTestCase {
	/**
	 * Test that the Response_Field class can be instantiated.
	 */
	public function test_response_field_can_be_instantiated() {
		$field = new Response_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertInstanceOf( Response_Field::class, $field );

		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertEquals( 'test_label', $field->get_label() );
		$this->assertEquals( 'test_value', $field->get_value() );
		$this->assertEquals( 'basic', $field->get_type() );
		$this->assertEquals( array(), $field->get_meta() );
	}

	/**
	 * Test that the Response_Field class can be instantiated with additional parameters.
	 */
	public function test_response_field_with_additional_parameters() {
		$field = new Response_Field( 'test_key', 'test_label', 'test_value', 'text', array( 'meta_key' => 'meta_value' ) );
		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertEquals( 'test_label', $field->get_label() );
		$this->assertEquals( 'test_value', $field->get_value() );
		$this->assertEquals( 'text', $field->get_type() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $field->get_meta() );
	}

	/**
	 * Test that the Response_Field class can handle empty values.
	 */
	public function test_response_field_with_empty_values() {
		$field = new Response_Field( 'test_key', '', '' );
		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertSame( '', $field->get_label() );
		$this->assertSame( '', $field->get_value() );
		$this->assertEquals( 'basic', $field->get_type() );
		$this->assertEquals( array(), $field->get_meta() );
	}

	/**
	 * Test that the Response_Field can serealize and unserialize correctly.
	 */
	public function test_response_field_serialization() {
		$field        = new Response_Field( 'test_key', 'test_label', 'test_value', 'text', array( 'meta_key' => 'meta_value' ) );
		$serialized   = $field->serialize();
		$unserialized = Response_Field::from_serialized( $serialized );

		$this->assertInstanceOf( Response_Field::class, $unserialized );

		$this->assertEquals( $serialized, $unserialized->serialize() );
		$this->assertEquals( 'test_key', $unserialized->get_key() );
		$this->assertEquals( 'test_label', $unserialized->get_label() );
		$this->assertEquals( 'test_value', $unserialized->get_value() );
		$this->assertEquals( 'text', $unserialized->get_type() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $unserialized->get_meta() );
	}

	/**
	 * Test that the Response_Field can serealize and unserialize correctly.
	 */
	public function test_response_from_serialized_is_null() {

		$unserialized = Response_Field::from_serialized( array( 'key' => 'test_key' ) );

		$this->assertNull( $unserialized );

		$unserialized = Response_Field::from_serialized( 'howdy' );

		$this->assertNull( $unserialized );

		$unserialized = Response_Field::from_serialized( array( 'value' => 'test_value' ) );

		$this->assertNull( $unserialized );

		$unserialized = Response_Field::from_serialized( array( 'label' => 'test_value' ) );

		$this->assertNull( $unserialized );

		$unserialized = Response_Field::from_serialized(
			array(
				'label' => 'test_value',
				'value' => 'value',
			)
		);

		$this->assertNull( $unserialized );
	}

	public function test_get_render_value() {
		$field = new Response_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_value', $field->get_render_value() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'value1', 'value2' ) );
		$this->assertEquals( 'value1, value2', $field->get_render_value() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array( 'file1.jpg', 'file2.jpg' ) ) );
		$this->assertSame( '', $field->get_render_value() );
	}

	public function test_is_file_field() {
		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array( 'file1.jpg' ) ) );
		$this->assertTrue( $field->is_file_field() );

		$field = new Response_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertFalse( $field->is_file_field() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array() ) );
		$this->assertTrue( $field->is_file_field() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array( 'file1.jpg', 'file2.jpg' ) ), 'file' );
		$this->assertTrue( $field->is_file_field() );
	}

	public function test_has_file() {
		$field = new Response_Field(
			'test_key',
			'test_label',
			array(
				'files' => array(
					array(
						'name'    => 'file1.jpg',
						'file_id' => 123,
						'size'    => 123456789,
					),
				),
			)
		);
		$this->assertTrue( $field->has_file() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array( 'file1.jpg' ) ), 'file' );
		$this->assertTrue( $field->has_file() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array() ) );
		$this->assertFalse( $field->has_file() );

		$field = new Response_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertFalse( $field->has_file(), 'basic field should not be a file field' );

		$field = new Response_Field( 'test_key', 'test_label', array( 'files' => array() ), 'file' );
		$this->assertFalse( $field->has_file(), 'empty file field should not be non-empty' );
	}

	public function test_get_render_api_value() {
		$field = new Response_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_value', $field->get_render_api_value() );

		$field = new Response_Field( 'test_key', 'test_label', array( 'value1', 'value2' ) );
		$this->assertEquals( 'value1, value2', $field->get_render_api_value() );

		$expected = array(
			'files' => array(
				array(
					'name'           => 'file1.jpg',
					'file_id'        => 123,
					'size'           => '118 MB',
					'url'            => 'https://example.com/file1.jpg',
					'is_previewable' => true,
				),
			),
		);
		$field    = new Response_Field(
			'test_key',
			'test_label',
			array(
				'files' => array(
					array(
						'name'    => 'file1.jpg',
						'file_id' => 123,
						'size'    => 123456789,
					),
				),
			)
		);

		add_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );
		$this->assertSame( $expected, $field->get_render_api_value() );
		remove_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );
	}
	/**
	 * Helper function to return a URL for the file.
	 *
	 * @return string
	 */
	public function return_url() {
		return 'https://example.com/file1.jpg';
	}
}
