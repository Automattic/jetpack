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
 * Test class for Feedback_Field
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback_Field
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback_Field::class )]
#[CoversClass( Feedback::class )]
class Feedback_Field_Test extends BaseTestCase {
	/**
	 * Test that the Feedback_Field class can be instantiated.
	 */
	public function test_Feedback_Field_can_be_instantiated() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertInstanceOf( Feedback_Field::class, $field );

		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertEquals( 'test_label', $field->get_label() );
		$this->assertEquals( 'test_value', $field->get_value() );
		$this->assertEquals( 'basic', $field->get_type() );
		$this->assertEquals( array(), $field->get_meta() );
		$this->assertSame( '', $field->get_form_field_id() );
	}

	/**
	 * Test that the Feedback_Field class can be instantiated with additional parameters.
	 */
	public function test_Feedback_Field_with_additional_parameters() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value', 'text', array( 'meta_key' => 'meta_value' ), 'firstname' );
		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertEquals( 'test_label', $field->get_label() );
		$this->assertEquals( 'test_value', $field->get_value() );
		$this->assertEquals( 'text', $field->get_type() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $field->get_meta() );
		$this->assertEquals( 'meta_value', $field->get_meta_key_value( 'meta_key' ) );
		$this->assertNull( $field->get_meta_key_value( 'non_existant' ) );
		$this->assertEquals( 'firstname', $field->get_form_field_id() );
	}

	/**
	 * Test that the Feedback_Field class can handle empty values.
	 */
	public function test_Feedback_Field_with_empty_values() {
		$field = new Feedback_Field( 'test_key', '', '' );
		$this->assertEquals( 'test_key', $field->get_key() );
		$this->assertSame( '', $field->get_label() );
		$this->assertSame( '', $field->get_value() );
		$this->assertEquals( 'basic', $field->get_type() );
		$this->assertEquals( array(), $field->get_meta() );
		$this->assertSame( '', $field->get_form_field_id() );
	}

	/**
	 * Test that the Feedback_Field can serialize and unserialize correctly.
	 */
	public function test_Feedback_Field_serialization() {
		$field        = new Feedback_Field( 'test_key', 'test_label', 'test_value', 'text', array( 'meta_key' => 'meta_value' ) );
		$serialized   = $field->serialize();
		$unserialized = Feedback_Field::from_serialized( $serialized );

		$this->assertInstanceOf( Feedback_Field::class, $unserialized );

		$this->assertEquals( $serialized, $unserialized->serialize() );
		$this->assertEquals( 'test_key', $unserialized->get_key() );
		$this->assertEquals( 'test_label', $unserialized->get_label() );
		$this->assertEquals( 'test_value', $unserialized->get_value() );
		$this->assertEquals( 'text', $unserialized->get_type() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $unserialized->get_meta() );
	}

	public function test_Feedback_Field_serialization_v2() {
		$field        = new Feedback_Field( 'test_key', 'test_label', 'test_value', 'text', array( 'meta_key' => 'meta_value' ) );
		$serialized   = $field->serialize();
		$unserialized = Feedback_Field::from_serialized_v2( $serialized );

		$this->assertInstanceOf( Feedback_Field::class, $unserialized );

		$this->assertEquals( $serialized, $unserialized->serialize() );
		$this->assertEquals( 'test_key', $unserialized->get_key() );
		$this->assertEquals( 'test_label', $unserialized->get_label() );
		$this->assertEquals( 'test_value', $unserialized->get_value() );
		$this->assertEquals( 'text', $unserialized->get_type() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $unserialized->get_meta() );
	}

	public function test_Feedback_Field_serialization_v2_special() {
		$field        = new Feedback_Field( 'test_key', 'test_label 🙈', 'test_value 🙈', 'text', array( 'meta_key' => 'meta_value' ), 'id' );
		$serialized   = $field->serialize();
		$unserialized = Feedback_Field::from_serialized_v2( $serialized );

		$this->assertInstanceOf( Feedback_Field::class, $unserialized );

		$this->assertEquals( $serialized, $unserialized->serialize() );
		$this->assertEquals( 'test_key', $unserialized->get_key() );
		$this->assertEquals( 'test_label 🙈', $unserialized->get_label() );
		$this->assertEquals( 'test_value 🙈', $unserialized->get_value() );
		$this->assertEquals( 'text', $unserialized->get_type() );
		$this->assertEquals( 'id', $unserialized->get_form_field_id() );
		$this->assertEquals( array( 'meta_key' => 'meta_value' ), $unserialized->get_meta() );
	}

	public function test_Feedback_Field_serialization_v2_special_plain() {

		$serialized   = array(
			'key'           => 'test_key',
			'label'         => 'test_label ud83dude48',
			'value'         => 'test_value ud83dude48',
			'type'          => 'text',
			'meta'          => array( 'meta_key' => 'meta_value' ),
			'form_field_id' => 'id',
		);
		$unserialized = Feedback_Field::from_serialized_v2( $serialized );

		$this->assertInstanceOf( Feedback_Field::class, $unserialized );

		$this->assertEquals( 'test_label 🙈', $unserialized->get_label() );
		$this->assertEquals( 'test_value 🙈', $unserialized->get_value() );
	}

	/**
	 * Test that the Feedback_Field can serialize and unserialize correctly.
	 */
	public function test_response_from_serialized_is_null() {

		$unserialized = Feedback_Field::from_serialized( array( 'key' => 'test_key' ) );

		$this->assertNull( $unserialized );

		$unserialized = Feedback_Field::from_serialized( array( 'value' => 'test_value' ) );

		$this->assertNull( $unserialized );

		$unserialized = Feedback_Field::from_serialized( array( 'label' => 'test_value' ) );

		$this->assertNull( $unserialized );

		$unserialized = Feedback_Field::from_serialized(
			array(
				'label' => 'test_value',
				'value' => 'value',
			)
		);

		$this->assertNull( $unserialized );
	}

	public function test_get_render_value() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_value', $field->get_render_value() );
		$this->assertEquals( 'test_value', $field->get_value() );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'value1', 'value2' ) );
		$this->assertEquals( 'value1, value2', $field->get_render_value() );
		$this->assertEquals( array( 'value1', 'value2' ), $field->get_value() );

		// EMPTY FILE FIELD
		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array() ), 'file' );
		$this->assertSame( '', $field->get_render_value() );
		$this->assertEquals(
			array( 'files' => array() ),
			$field->get_value()
		);
		$file  = array(
			'name'    => 'file1.jpg',
			'type'    => 'image/jpeg',
			'file_id' => 123,
			'size'    => 123456789,
		);
		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array( $file ) ), 'file' );
		$this->assertSame( 'file1.jpg (118 MB)', $field->get_render_value() );
		$this->assertEquals(
			array( 'files' => array( $file ) ),
			$field->get_value()
		);
	}

	public function test_get_render_value_submit() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_value', $field->get_render_value( 'submit' ) );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'value1', 'value2' ) );
		$this->assertEquals( array( 'value1', 'value2' ), $field->get_render_value( 'submit' ) );

		// EMPTY FILE FIELD
		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array() ), 'file', array(), 'id' );
		$this->assertEquals(
			array(
				'field_id' => 'id',
				'files'    => array(),
			),
			$field->get_render_value( 'submit' )
		);
		$this->assertFalse( $field->has_file() );

		$file  = array(
			'file_id' => 123,
			'name'    => 'file1.jpg',
			'size'    => 123456789,
			'type'    => 'image/jpeg',
		);
		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array( $file ) ), 'file', array(), 'id' );
		$this->assertSame(
			array(
				'field_id' => 'id',
				'files'    => array( $file ),
			),
			$field->get_render_value( 'submit' )
		);
		$this->assertTrue( $field->has_file() );
	}

	public function test_render_file_field() {
		$file = array(
			'name'    => 'file1.jpg',
			'file_id' => 123,
			'size'    => 123456789,
		);

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array( $file ) ), 'file' );
		$this->assertStringContainsString( $file['name'], $field->get_render_value() );
		$this->assertStringContainsString( size_format( $file['size'] ), $field->get_render_value() );
	}

	public function test_is_of_type() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertFalse( $field->is_of_type( 'file' ) );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array( 'file1.jpg' ) ), 'file' );
		$this->assertTrue( $field->is_of_type( 'file' ) );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'hello' ) );
		$this->assertTrue(
			$field->is_of_type( 'basic' ),
			'Basic field should not be a file field'
		);
	}

	public function test_has_file() {
		$field = new Feedback_Field(
			'test_key',
			'test_label',
			array(
				'files' => array(
					array(
						'name'    => 'file1 . jpg',
						'file_id' => 123,
						'size'    => 123456789,
					),
				),
			),
			'file'
		);
		$this->assertTrue( $field->has_file() );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array( 'file1 . jpg' ) ), 'file' );
		$this->assertTrue( $field->has_file() );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array() ), 'file' );
		$this->assertFalse( $field->has_file() );

		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertFalse( $field->has_file(), 'basic field should not be a file field' );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'files' => array() ), 'file' );
		$this->assertFalse( $field->has_file(), 'empty file field should not be non-empty' );
	}

	public function test_get_render_api_value() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_value', $field->get_render_value( 'api' ) );

		$field = new Feedback_Field( 'test_key', 'test_label', array( 'value1', 'value2' ) );
		$this->assertEquals(
			'value1, value2',
			$field->get_render_value( 'api' )
		);

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
		$field    = new Feedback_Field(
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
			),
			'file'
		);

		add_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );
		$this->assertSame( $expected, $field->get_render_value( 'api' ) );
		remove_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );

		$field = new Feedback_Field(
			'test_key',
			'test_label',
			array(
				'files' => array(
					array(),
				),
			),
			'file'
		);

		add_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );
		$this->assertSame( array( 'files' => array() ), $field->get_render_value( 'api' ) );
		remove_filter( 'jetpack_unauth_file_download_url', array( $this, 'return_url' ) );
	}

	public function test_render_label_in_different_contexts() {
		$field = new Feedback_Field( 'test_key', 'test_label', 'test_value' );
		$this->assertEquals( 'test_label', $field->get_label() );

		$field = new Feedback_Field( 'test_key', '', 'test_value' );
		$this->assertSame( '', $field->get_label() );

		$field = new Feedback_Field( 'test_key', null, 'test_value' );
		$this->assertSame( '', $field->get_label() );

		$field = new Feedback_Field( 'test_key', false, 'test_value' );
		$this->assertSame( '', $field->get_label() );

		$field = new Feedback_Field( 'test_key', 'á&#044; ç&#044; ü&#044; ń&#044; ğ', 'test_value' );
		$this->assertSame( 'á, ç, ü, ń, ğ', $field->get_label() );
	}

	public function test_normalize_unicode() {
		$input    = 'hello world \ud83d\ude48';
		$expected = 'hello world 🙈';
		$this->assertEquals( $expected, Feedback_Field::normalize_unicode( $input ) );
	}

	public function test_normalize_unicode_non_escaped() {
		$input    = 'á, ç, ü, ń, ğ hello world ud83dude48';
		$expected = 'á, ç, ü, ń, ğ hello world 🙈';
		$this->assertEquals( $expected, Feedback_Field::normalize_unicode( $input ) );
	}

	public function test_normalize_unicode_non_escaped_test_string() {
		$input    = 'test_label ud83dude48';
		$expected = 'test_label 🙈';
		$this->assertEquals( $expected, Feedback_Field::normalize_unicode( $input ) );
	}

	public function test_normalize_unicode_plain() {
		$input    = 'hello world';
		$expected = 'hello world';
		$this->assertEquals( $expected, Feedback_Field::normalize_unicode( $input ) );
	}

	/**
	 * Helper function to return a URL for the file.
	 *
	 * @return string
	 */
	public function return_url() {
		return 'https://example.com/file1.jpg';
	}

	/**
	 * Test phone field with UK number displays flag.
	 */
	public function test_phone_field_with_uk_number_displays_flag() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '+44 7911 123456', 'phone' );
		$this->assertEquals( '🇬🇧 +44 7911 123456', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with US number displays flag.
	 */
	public function test_phone_field_with_us_number_displays_flag() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '+1 555 123 4567', 'phone' );
		$this->assertEquals( '🇺🇸 +1 555 123 4567', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with German number displays flag.
	 */
	public function test_phone_field_with_german_number_displays_flag() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '+49 30 12345678', 'phone' );
		$this->assertEquals( '🇩🇪 +49 30 12345678', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with 4-digit prefix (Anguilla) displays correct flag.
	 */
	public function test_phone_field_with_4_digit_prefix_displays_correct_flag() {
		// Anguilla has +1264 prefix, should not be confused with US +1.
		$field = new Feedback_Field( 'phone_key', 'Phone', '+1264 123 4567', 'phone' );
		$this->assertEquals( '🇦🇮 +1264 123 4567', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with Kazakhstan number (ambiguous +7 prefix) displays correct flag.
	 */
	public function test_phone_field_with_kazakhstan_number_displays_correct_flag() {
		// Kazakhstan has +77 prefix, should not be confused with Russia +7.
		$field = new Feedback_Field( 'phone_key', 'Phone', '+77 123 456 7890', 'phone' );
		$this->assertEquals( '🇰🇿 +77 123 456 7890', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with Russia number displays flag.
	 */
	public function test_phone_field_with_russia_number_displays_flag() {
		// Russia has +7 prefix (but not +77).
		$field = new Feedback_Field( 'phone_key', 'Phone', '+7 495 123 4567', 'phone' );
		$this->assertEquals( '🇷🇺 +7 495 123 4567', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field without country code returns number as-is.
	 */
	public function test_phone_field_without_country_code_returns_number_as_is() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '07911 123456', 'phone' );
		$this->assertSame( '07911 123456', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with empty value returns empty string.
	 */
	public function test_phone_field_with_empty_value_returns_empty() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '', 'phone' );
		$this->assertSame( '', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with telephone type also displays flag.
	 */
	public function test_telephone_field_type_displays_flag() {
		$field = new Feedback_Field( 'phone_key', 'Phone', '+33 1 23 45 67 89', 'telephone' );
		$this->assertEquals( '🇫🇷 +33 1 23 45 67 89', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with array value (multiple numbers).
	 */
	public function test_phone_field_with_array_value() {
		$field = new Feedback_Field( 'phone_key', 'Phone', array( '+44 123', '+44 456' ), 'phone' );
		// Array values are joined with comma, flag is based on first number in joined string.
		$this->assertEquals( '🇬🇧 +44 123, +44 456', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test phone field with invalid prefix returns number without flag.
	 */
	public function test_phone_field_with_invalid_prefix_returns_number_without_flag() {
		// +999 is not a valid country prefix.
		$field = new Feedback_Field( 'phone_key', 'Phone', '+999 123 456', 'phone' );
		$this->assertEquals( '+999 123 456', $field->get_render_value( 'web' ) );
	}

	/**
	 * Test non-phone field type does not get flag treatment.
	 */
	public function test_non_phone_field_does_not_get_flag() {
		$field = new Feedback_Field( 'text_key', 'Text', '+44 7911 123456', 'text' );
		$this->assertEquals( '+44 7911 123456', $field->get_render_value( 'web' ) );
	}
}
