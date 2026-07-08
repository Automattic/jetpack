<?php
/**
 * Unit Tests for Feedback Field Handling and Serialization.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Feedback Field Handling and Serialization
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Fields_Test extends BaseTestCase {

	public function test_feedback_is_matches_empty_data() {
		$form             = new Contact_Form( array() );
		$_post_data       = array();
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();

		$saved_response = Feedback::get( $feedback_post_id );

		$this->assertEquals( $response->serialize(), $saved_response->serialize(), 'Serialized data does not match' );
		$this->assertEquals( $response->get_fields(), $saved_response->get_fields(), 'Fields data does not match' );
	}

	public function test_feedback_is_matches_submission_data() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $name,
				'email'   => $email,
				'message' => $message,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );

		$this->assertEquals( $response->serialize(), $saved_response->serialize() );
		$this->assertEquals( $response->get_fields(), $saved_response->get_fields() );

		foreach ( $response->get_fields() as $field ) {
			$this->assertInstanceOf( Feedback_Field::class, $field );
		}

		foreach ( $saved_response->get_fields() as $field ) {
			$this->assertInstanceOf( Feedback_Field::class, $field );
		}
	}

	public function test_handle_previously_saved_response() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'value2',
			)
		);

		$response = Feedback::get( $post_id );

		$this->assertInstanceOf( Feedback::class, $response );

		$field = $response->get_fields()['1_field'];

		$this->assertInstanceOf( Feedback_Field::class, $field );
		$this->assertEquals( '1_field', $field->get_key() );
		$this->assertEquals( 'field', $field->get_label() );
		$this->assertEquals( 'value1', $field->get_value() );

		$this->assertEquals( 'basic', $field->get_type() ); // Assuming 'basic' is the default type for a simple text field.
		$this->assertEquals( 'value1', $field->get_render_value() );
	}

	/**
	 * Tests that the feedback ID is computed correctly when saving a from response.
	 *
	 * It should be non empty and match the post slug.
	 */
	public function test_feedback_computed_feedback_id() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $name,
				'email'   => $email,
				'message' => $message,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();
		$post     = get_post( $post_id );

		$saved_response = Feedback::get( $post_id );

		$this->assertEquals( $response->get_feedback_id(), $saved_response->get_feedback_id(), 'Feedback ID should match' );
		$this->assertEquals( $post->post_name, $saved_response->get_feedback_id(), 'Feedback ID should match post slug' );
		$this->assertNotEmpty( $saved_response->get_feedback_id(), 'Feedback ID should not be empty' );
	}

	public function test_get_all_values() {
		// Test that the get_all_values method returns all values from the form submission.

		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response            = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id             = $response->save();
		$response_all_values = $response->get_all_values();
		$saved_response      = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );
		$saved_all_values = $saved_response->get_all_values();

		$this->assertEquals(
			$response_all_values,
			$saved_all_values,
			'All values from the form submission should match the saved form submission'
		);

		$keys = array(
			'1_Email',
			'email_marketing_consent',
			'entry_title',
			'entry_permalink',
			'feedback_id',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_all_values, "Key '$key' should be present in the all values array" );
			$this->assertArrayHasKey( $key, $saved_all_values, "Key '$key' should be present in the saved all values array" );
		}
		$this->assertArrayNotHasKey( 'entry_page', $response_all_values, 'Key entry_page should not be present in the all values array' );
	}

	public function test_get_all_values_with_page_number() {
		// Test that the get_all_values method returns all values from the form submission.

		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response            = Feedback::from_submission( $_post_data, $form, $current_post, 888 );
		$post_id             = $response->save();
		$response_all_values = $response->get_all_values();
		$saved_response      = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );
		$saved_all_values = $saved_response->get_all_values();

		$this->assertEquals(
			$response_all_values,
			$saved_all_values,
			'All values from the form submission should match the saved form submission'
		);

		$keys = array(
			'1_Email',
			'email_marketing_consent',
			'entry_title',
			'entry_permalink',
			'feedback_id',
			'entry_page',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_all_values, "Key '$key' should be present in the all values array" );
			$this->assertArrayHasKey( $key, $saved_all_values, "Key '$key' should be present in the saved all values array" );
		}
		$this->assertEquals( 888, $response_all_values['entry_page'], 'Key entry_page should be present in the all values array' );
		$this->assertEquals( 888, $saved_all_values['entry_page'], 'Key entry_page should be present in the saved all values array' );

		$this->assertStringContainsString(
			'page=888',
			$response_all_values['entry_permalink'],
			'Entry permalink should contain the page number'
		);
	}

	public function test_get_all_values_with_image_select() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();

		// Create a form submission with two selected image choices
		$_post_data = Utility::get_post_request(
			array(
				'images' => array(
					'{"perceived":"B","selected":"B","label":"Choice B","showLabels":true,"image":{"id":null,"src":"https://www.example.com/choice-b.png"}}',
					'{"perceived":"C","selected":"C","label":"Choice C","showLabels":true,"image":{"id":12346,"src":"https://www.example.com/choice-c.png"}}',
				),
			),
			'g' . $form_id
		);

		// Helper function to create image block data for optionsdata
		$create_image_block = function ( $url, $alt ) {
			return array(
				'blockName'    => 'core/image',
				'attrs'        => array(
					'url'         => $url,
					'alt'         => $alt,
					'scale'       => 'cover',
					'aspectRatio' => '1',
				),
				'innerHTML'    => "<img src=\"{$url}\" alt=\"{$alt}\" />",
				'innerContent' => array( "<img src=\"{$url}\" alt=\"{$alt}\" />" ),
			);
		};

		$optionsdata = Contact_Form::esc_shortcode_val(
			wp_json_encode(
				array(
					array(
						'letter' => 'A',
						'label'  => 'Choice A',
						'image'  => $create_image_block( 'https://www.example.com/choice-a.png', 'Choice A' ),
					),
					array(
						'letter' => 'B',
						'label'  => 'Choice B',
						'image'  => $create_image_block( 'https://www.example.com/choice-b.png', 'Choice B' ),
					),
					array(
						'letter' => 'C',
						'label'  => 'Choice C',
						'image'  => $create_image_block( 'https://www.example.com/choice-c.png', 'Choice C' ),
					),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			)
		);

		$shortcode = "[contact-field type=\"image-select\" label=\"Images\" isMultiple=\"1\" options=\"A,B,C\" showLabels=\"1\" optionsdata=\"{$optionsdata}\" /]";

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			$shortcode
		);

		$expected_images = array(
			'type'    => 'image-select',
			'choices' => array(
				array(
					'perceived'  => 'B',
					'selected'   => 'B',
					'label'      => 'Choice B',
					'showLabels' => true,
					'image'      => array(
						'id'  => null,
						'src' => 'https://www.example.com/choice-b.png',
					),
				),
				array(
					'perceived'  => 'C',
					'selected'   => 'C',
					'label'      => 'Choice C',
					'showLabels' => true,
					'image'      => array(
						'id'  => 12346,
						'src' => 'https://www.example.com/choice-c.png',
					),
				),
			),
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertEquals( $expected_images, $response->get_all_values( 'submit' )['1_Images'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_images, $saved_response->get_all_values( 'submit' )['1_Images'], 'Saved response all values should match the expected values' );
	}

	public function test_get_all_values_with_file_upload() {

		add_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'uploadafile' => array( '{"file_id":54321,"name":"Screenshot.png","size":19914,"type":"image/png"}', '{}' ),
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field type="file" label="Upload a file" /]'
		);

		$expected_file = array(
			'field_id' => 'g' . $form_id . '-uploadafile',
			'files'    => array(
				array(
					'file_id' => 54321,
					'name'    => 'Screenshot.png',
					'size'    => 19914,
					'type'    => 'image/png',
				),
				array(
					'file_id' => 0,
					'name'    => '',
					'size'    => 0,
					'type'    => '',
				),
			),
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertTrue( $response->has_file(), 'Response should have file uploaded' );
		$this->assertTrue( $saved_response->has_file(), 'Saved response should have file uploaded' );

		$this->assertEquals( $expected_file, $response->get_all_values( 'submit' )['1_Upload a file'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_file, $saved_response->get_all_values( 'submit' )['1_Upload a file'], 'Saved response all values should match the expected values' );

		$this->assertEquals( $expected_file, $response->get_legacy_extra_values( 'submit' )['2_Upload a file'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_file, $saved_response->get_legacy_extra_values( 'submit' )['2_Upload a file'], 'Saved response all values should match the expected values' );

		remove_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );
	}

	public function test_get_compiled_fields_returns_default_fields_for_empty_form() {
		// default form will have email, name, url, message fields
		$form       = new Contact_Form( array() );
		$_post_data = array();
		$response   = Feedback::from_submission( $_post_data, $form );

		$compiled_fields = $response->get_compiled_fields();

		$default_form = array(
			'1_Name'    => array(
				'label' => 'Name',
				'value' => '',
			),
			'2_Email'   => array(
				'label' => 'Email',
				'value' => '',
			),
			'3_Website' => array(
				'label' => 'Website',
				'value' => '',
			),
			'4_Message' => array(
				'label' => 'Message',
				'value' => '',
			),
		);

		$this->assertEquals( $default_form, $compiled_fields );
	}

	/**
	 * Data provider for get_compiled_fields test cases.
	 *
	 * @return array Test data with different field format expectations.
	 */
	public static function get_compiled_fields_data_provider() {
		$test_name    = 'John Smith';
		$test_email   = 'john.smith@example.com';
		$test_website = 'https://johnsmith.dev';
		$test_message = 'Hello, this is a test message from our contact form.';

		return array(
			'all_format'         => array(
				'format'   => 'all',
				'expected' => array(
					'1_Name'    => array(
						'label' => 'Name',
						'value' => $test_name,
					),
					'2_Email'   => array(
						'label' => 'Email',
						'value' => $test_email,
					),
					'3_Website' => array(
						'label' => 'Website',
						'value' => $test_website,
					),
					'4_Message' => array(
						'label' => 'Message',
						'value' => $test_message,
					),
				),
				'message'  => 'Compiled fields should match the default form structure with all field data.',
			),
			'key_value_format'   => array(
				'format'   => 'key-value',
				'expected' => array(
					'1_Name'    => $test_name,
					'2_Email'   => $test_email,
					'3_Website' => $test_website,
					'4_Message' => $test_message,
				),
				'message'  => 'Compiled fields should return key-value pairs only.',
			),
			'label|value_format' => array(
				'format'   => 'label|value',
				'expected' => array(
					array(
						'label' => 'Name',
						'value' => $test_name,
					),
					array(
						'label' => 'Email',
						'value' => $test_email,
					),
					array(
						'label' => 'Website',
						'value' => $test_website,
					),
					array(
						'label' => 'Message',
						'value' => $test_message,
					),
				),
				'message'  => 'Compiled fields should return label|value pairs only.',
			),
			'value_format'       => array(
				'format'   => 'value',
				'expected' => array(
					$test_name,
					$test_email,
					$test_website,
					$test_message,
				),
				'message'  => 'Compiled fields should return only values as indexed array.',
			),
			'label-value_format' => array(
				'format'   => 'label-value',
				'expected' => array(
					'Name'    => $test_name,
					'Email'   => $test_email,
					'Website' => $test_website,
					'Message' => $test_message,
				),
				'message'  => 'Compiled fields should return only labels as indexed array.',
			),
			'label_format'       => array(
				'format'   => 'label',
				'expected' => array(
					'Name',
					'Email',
					'Website',
					'Message',
				),
				'message'  => 'Compiled fields should return only labels as indexed array.',
			),
			'id-value_format'    => array(
				'format'   => 'id-value',
				'expected' => array(), // Rebuilt dynamically in the test with actual form_id
				'message'  => 'Compiled fields should return field IDs mapped to values.',
			),
			'collection_format'  => array(
				'format'   => 'collection',
				'expected' => array(), // Rebuilt dynamically in the test with actual form_id
				'message'  => 'Compiled fields should return collection with label, value, type, id, key, and meta.',
			),
		);
	}

	/**
	 * Test get_compiled_fields with different output formats.
	 *
	 * @dataProvider get_compiled_fields_data_provider
	 *
	 * @param string $format   The format parameter for get_compiled_fields.
	 * @param array  $expected The expected output.
	 * @param string $message  The assertion message.
	 */
	#[DataProvider( 'get_compiled_fields_data_provider' )]
	public function test_get_compiled_fields_shapes( $format, $expected, $message ) {
		// Test data
		$test_name    = 'John Smith';
		$test_email   = 'john.smith@example.com';
		$test_website = 'https://johnsmith.dev';
		$test_message = 'Hello, this is a test message from our contact form.';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $test_name,
				'email'   => $test_email,
				'website' => $test_website,
				'message' => $test_message,
			),
			'g' . $form_id
		);

		// Test that get_compiled_fields returns the correct structure for a default form
		$form     = new Contact_Form( array() );
		$response = Feedback::from_submission( $_post_data, $form );

		// Test the specified format
		$compiled_fields = $response->get_compiled_fields( 'default', $format );

		// For id-value format, rebuild expected with actual form_id, there
		// was no way of passing the form_id to the data provider.
		if ( 'id-value' === $format ) {
			$expected = array(
				'g' . $form_id . '-name'    => $test_name,
				'g' . $form_id . '-email'   => $test_email,
				'g' . $form_id . '-website' => $test_website,
				'g' . $form_id . '-message' => $test_message,
			);
		}

		// For collection format, rebuild expected with actual form_id
		if ( 'collection' === $format ) {
			$expected = array(
				array(
					'label' => 'Name',
					'value' => $test_name,
					'type'  => 'name',
					'id'    => 'g' . $form_id . '-name',
					'key'   => '1_Name',
					'meta'  => array(),
				),
				array(
					'label' => 'Email',
					'value' => $test_email,
					'type'  => 'email',
					'id'    => 'g' . $form_id . '-email',
					'key'   => '2_Email',
					'meta'  => array(),
				),
				array(
					'label' => 'Website',
					'value' => $test_website,
					'type'  => 'url',
					'id'    => 'g' . $form_id . '-website',
					'key'   => '3_Website',
					'meta'  => array(),
				),
				array(
					'label' => 'Message',
					'value' => $test_message,
					'type'  => 'textarea',
					'id'    => 'g' . $form_id . '-message',
					'key'   => '4_Message',
					'meta'  => array(),
				),
			);
		}

		$this->assertEquals( $expected, $compiled_fields, $message );
	}

	public function test_get_compiled_fields_hidden_field() {
		// Test data
		$test_email = 'john.smith@example.com';
		$form_id    = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'hidden' => 'hidden_value',
				'email'  => $test_email,
			),
			'g' . $form_id
		);

		// Test that get_compiled_fields returns the correct structure for a default form
		$form     = new Contact_Form( array(), '[contact-field label="Hidden" type="hidden" default="hidden_value"][contact-field label="Email" type="email" ]' );
		$response = Feedback::from_submission( $_post_data, $form );

		// Test the specified format
		$web     = $response->get_compiled_fields( 'web' );
		$ajax    = $response->get_compiled_fields( 'ajax' );
		$default = $response->get_compiled_fields( 'default' );

		$empty = array(
			'2_Email' => array(
				'label' => 'Email',
				'value' => 'john.smith@example.com',
			),
		);

		$default_expected = array_merge(
			array(
				'1_Hidden' => array(
					'label' => 'Hidden',
					'value' => 'hidden_value',
				),
			),
			$empty
		);

		$this->assertEquals( $empty, $web );
		$this->assertEquals( $empty, $ajax );
		$this->assertEquals( $default_expected, $default );
	}

	public function test_get_field_by_id_and_value_by_id_new_submission() {
		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Hello!',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response  = Feedback::from_submission( $_post_data, $form );
		$field_ids = $form->get_field_ids();
		$email_id  = $field_ids['email'];

		$this->assertNotEmpty( $email_id );
		$this->assertEquals( 'john@example.com', $response->get_field_value_by_form_field_id( $email_id ) );

		$field = $response->get_field_by_form_field_id( $email_id );
		$this->assertInstanceOf( Feedback_Field::class, $field );
		$this->assertEquals( $email_id, $field->get_form_field_id() );

		// Save and reload; ensure the field id and value persist correctly
		$saved_post_id  = $response->save();
		$saved_response = Feedback::get( $saved_post_id );
		$this->assertEquals( 'john@example.com', $saved_response->get_field_value_by_form_field_id( $email_id ) );
		$saved_field = $saved_response->get_field_by_form_field_id( $email_id );
		$this->assertInstanceOf( Feedback_Field::class, $saved_field );
		$this->assertEquals( $email_id, $saved_field->get_form_field_id() );
	}

	public function test_get_field_by_id_and_value_by_id_legacy() {
		$post_id  = Utility::create_legacy_feedback( array() );
		$response = Feedback::get( $post_id );

		$this->assertSame( '', $response->get_field_value_by_form_field_id( 'email' ) );
		$this->assertNull( $response->get_field_by_form_field_id( 'email' ) );
	}

	/**
	 * Test that "Other" option in radio fields is processed correctly.
	 */
	public function test_radio_field_with_other_option() {
		$form_id = Utility::get_form_id();

		// Create form submission with separate radio value and text input value
		// This simulates the actual POST data from the form
		$_post_data = Utility::get_post_request(
			array(
				'favoritecolor'            => 'Other',  // Radio button value
				'favoritecolor-other-text' => 'Purple with green stripes',  // Text input value
			),
			'g' . $form_id
		);

		// Create options data with an "Other" option
		$optionsdata = Contact_Form::esc_shortcode_val(
			wp_json_encode(
				array(
					array(
						'label' => 'Red',
					),
					array(
						'label' => 'Blue',
					),
					array(
						'label'   => 'Other',
						'isOther' => true,
					),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			)
		);

		$shortcode = "[contact-field type='radio' label='Favorite Color' allowOther='1' options='Red,Blue,Other' optionsdata='{$optionsdata}' /]";

		$form = new Contact_Form(
			array(
				'title' => 'Test Form',
			),
			$shortcode
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// Get the field
		$fields = $response->get_fields();
		$this->assertNotEmpty( $fields, 'Fields should not be empty' );

		$field = reset( $fields ); // Get first field
		$this->assertInstanceOf( Feedback_Field::class, $field, 'Field should be a Feedback_Field instance' );

		// Test that the value is preserved
		$this->assertEquals( 'Other: Purple with green stripes', $field->get_value(), 'Value should be preserved as submitted' );

		// Test that metadata is set correctly
		$meta = $field->get_meta();
		$this->assertTrue( $meta['is_other_option'], 'is_other_option should be true' );
		$this->assertEquals( 'Other', $meta['other_label'], 'other_label should be "Other"' );
		$this->assertEquals( 'Purple with green stripes', $meta['other_user_value'], 'other_user_value should contain custom text' );

		// Test saved response
		$saved_fields = $saved_response->get_fields();
		$saved_field  = reset( $saved_fields );

		$this->assertEquals( 'Other: Purple with green stripes', $saved_field->get_value(), 'Saved value should match' );
		$saved_meta = $saved_field->get_meta();
		$this->assertTrue( $saved_meta['is_other_option'], 'Saved is_other_option should be true' );
		$this->assertEquals( 'Purple with green stripes', $saved_meta['other_user_value'], 'Saved other_user_value should match' );
	}
}
