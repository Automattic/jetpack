<?php
/**
 * Unit Tests for Jetpack Forms Field Extensibility API.
 *
 * Tests the filter-based extensibility system for custom form fields,
 * including integration with the Form_Field_Registry unified registration API.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionClass;
use WorDBless\BaseTestCase;

/**
 * Test class for the Field Extensibility API.
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback_Field
 * @covers \Automattic\Jetpack\Forms\ContactForm\Form_Field_Registry
 */
#[CoversClass( Contact_Form_Field::class )]
#[CoversClass( Feedback_Field::class )]
#[CoversClass( Form_Field_Registry::class )]
class Field_Extensibility_Test extends BaseTestCase {

	/**
	 * Store original registered fields to restore after tests.
	 *
	 * @var array
	 */
	private static $original_fields = array();

	/**
	 * Set up before all tests.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		// Load the global functions file.
		require_once __DIR__ . '/../../../src/contact-form/form-field-functions.php';

		self::$original_fields = Form_Field_Registry::get_all();
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Reset the registry using reflection.
		$reflection = new ReflectionClass( Form_Field_Registry::class );

		$fields_property = $reflection->getProperty( 'registered_fields' );
		$fields_property->setAccessible( true );
		$fields_property->setValue( null, self::$original_fields );

		// Reset hooks_initialized flag so hooks can be re-added.
		$hooks_property = $reflection->getProperty( 'hooks_initialized' );
		$hooks_property->setAccessible( true );
		$hooks_property->setValue( null, false );

		// Remove test filters.
		remove_all_filters( 'jetpack_forms_field_types' );
		remove_all_filters( 'jetpack_forms_validate_field' );
		remove_all_filters( 'jetpack_forms_render_field' );
		remove_all_filters( 'jetpack_forms_render_field_value' );
		remove_all_filters( 'jetpack_forms_error_types' );
	}

	/**
	 * Test that jetpack_forms_field_types filter returns core field types.
	 */
	public function test_get_registered_field_types_returns_core_types() {
		$types = Contact_Form_Field::get_registered_field_types();

		$this->assertIsArray( $types );
		$this->assertContains( 'text', $types );
		$this->assertContains( 'email', $types );
		$this->assertContains( 'url', $types );
		$this->assertContains( 'telephone', $types );
		$this->assertContains( 'textarea', $types );
		$this->assertContains( 'checkbox', $types );
		$this->assertContains( 'radio', $types );
		$this->assertContains( 'select', $types );
		$this->assertContains( 'date', $types );
		$this->assertContains( 'file', $types );
		$this->assertContains( 'rating', $types );
	}

	/**
	 * Test that jetpack_forms_field_types filter allows adding custom types.
	 */
	public function test_get_registered_field_types_allows_custom_types() {
		add_filter(
			'jetpack_forms_field_types',
			function ( $types ) {
				$types[] = 'color';
				$types[] = 'custom-field';
				return $types;
			}
		);

		$types = Contact_Form_Field::get_registered_field_types();

		$this->assertContains( 'color', $types );
		$this->assertContains( 'custom-field', $types );

		// Clean up
		remove_all_filters( 'jetpack_forms_field_types' );
	}

	/**
	 * Test that jetpack_forms_render_field_value filter is called.
	 */
	public function test_render_field_value_filter_is_called() {
		$filter_called = false;
		$filter_params = array();

		add_filter(
			'jetpack_forms_render_field_value',
			function ( $html, $context, $type, $value, $field ) use ( &$filter_called, &$filter_params ) {
				$filter_called = true;
				$filter_params = array(
					'html'    => $html,
					'context' => $context,
					'type'    => $type,
					'value'   => $value,
					'field'   => $field,
				);
				return $html;
			},
			10,
			5
		);

		$field = new Feedback_Field( 'test_key', 'Test Label', 'test_value', 'custom-type' );
		$field->get_render_value( 'web' );

		$this->assertTrue( $filter_called );
		$this->assertNull( $filter_params['html'] );
		$this->assertEquals( 'web', $filter_params['context'] );
		$this->assertEquals( 'custom-type', $filter_params['type'] );
		$this->assertEquals( 'test_value', $filter_params['value'] );
		$this->assertInstanceOf( Feedback_Field::class, $filter_params['field'] );

		// Clean up
		remove_all_filters( 'jetpack_forms_render_field_value' );
	}

	/**
	 * Test that custom render value overrides default rendering.
	 */
	public function test_custom_render_value_overrides_default() {
		add_filter(
			'jetpack_forms_render_field_value',
			function ( $html, $context, $type, $value, $field ) {
				if ( $type === 'color' ) {
					return '<span style="color:' . esc_attr( $value ) . '">' . esc_html( $value ) . '</span>';
				}
				return $html;
			},
			10,
			5
		);

		$field  = new Feedback_Field( 'color_key', 'Color', '#FF0000', 'color' );
		$result = $field->get_render_value( 'email' );

		$this->assertEquals( '<span style="color:#FF0000">#FF0000</span>', $result );

		// Clean up
		remove_all_filters( 'jetpack_forms_render_field_value' );
	}

	/**
	 * Test that non-matching custom render filter falls through to default.
	 */
	public function test_non_matching_render_filter_falls_through() {
		add_filter(
			'jetpack_forms_render_field_value',
			function ( $html, $context, $type, $value, $field ) {
				if ( $type === 'color' ) {
					return 'custom render';
				}
				return $html; // Return null to fall through
			},
			10,
			5
		);

		// Test with a non-color field type
		$field  = new Feedback_Field( 'text_key', 'Text', 'hello world', 'text' );
		$result = $field->get_render_value( 'default' );

		// Should fall through to default rendering
		$this->assertEquals( 'hello world', $result );

		// Clean up
		remove_all_filters( 'jetpack_forms_render_field_value' );
	}

	/**
	 * Test that custom render value works with different contexts.
	 */
	public function test_custom_render_value_with_different_contexts() {
		add_filter(
			'jetpack_forms_render_field_value',
			function ( $html, $context, $type, $value, $field ) {
				if ( $type !== 'color' ) {
					return $html;
				}

				switch ( $context ) {
					case 'email':
						return '<span style="background-color:' . esc_attr( $value ) . '">' . esc_html( $value ) . '</span>';
					case 'csv':
						return $value;
					case 'web':
						return array(
							'type'  => 'color',
							'value' => $value,
						);
					default:
						return $value;
				}
			},
			10,
			5
		);

		$field = new Feedback_Field( 'color_key', 'Color', '#00FF00', 'color' );

		// Test email context
		$email_result = $field->get_render_value( 'email' );
		$this->assertStringContainsString( 'background-color:#00FF00', $email_result );

		// Test csv context
		$csv_result = $field->get_render_value( 'csv' );
		$this->assertEquals( '#00FF00', $csv_result );

		// Test web context
		$web_result = $field->get_render_value( 'web' );
		$this->assertIsArray( $web_result );
		$this->assertEquals( 'color', $web_result['type'] );
		$this->assertEquals( '#00FF00', $web_result['value'] );

		// Clean up
		remove_all_filters( 'jetpack_forms_render_field_value' );
	}

	/**
	 * Test error types filter returns core error types.
	 */
	public function test_error_types_filter_returns_core_types() {
		// We can't easily test the Contact_Form filter directly since it requires
		// the full rendering context. Instead, we test that our filter pattern works.
		$core_error_types = array(
			'is_required'        => 'This field is required.',
			'invalid_form_empty' => 'The form you are trying to submit is empty.',
			'invalid_form'       => 'Please fill out the form correctly.',
			'network_error'      => 'Connection issue while submitting the form.',
			'preview_mode'       => 'Form submissions are disabled in preview mode.',
		);

		$error_types = apply_filters( 'jetpack_forms_error_types', $core_error_types );

		$this->assertArrayHasKey( 'is_required', $error_types );
		$this->assertArrayHasKey( 'invalid_form_empty', $error_types );
	}

	/**
	 * Test error types filter allows adding custom error types.
	 */
	public function test_error_types_filter_allows_custom_types() {
		add_filter(
			'jetpack_forms_error_types',
			function ( $error_types ) {
				$error_types['invalid_color']        = 'Please enter a valid hex color.';
				$error_types['color_not_in_palette'] = 'This color is not in the allowed palette.';
				return $error_types;
			}
		);

		$core_error_types = array(
			'is_required' => 'This field is required.',
		);

		$error_types = apply_filters( 'jetpack_forms_error_types', $core_error_types );

		$this->assertArrayHasKey( 'invalid_color', $error_types );
		$this->assertEquals( 'Please enter a valid hex color.', $error_types['invalid_color'] );
		$this->assertArrayHasKey( 'color_not_in_palette', $error_types );

		// Clean up
		remove_all_filters( 'jetpack_forms_error_types' );
	}

	/**
	 * Test that field types can be filtered correctly.
	 */
	public function test_field_types_filter_preserves_core_types() {
		// Add a filter that appends custom types
		add_filter(
			'jetpack_forms_field_types',
			function ( $types ) {
				// Add custom type without removing any
				$types[] = 'signature';
				return $types;
			}
		);

		$types = Contact_Form_Field::get_registered_field_types();

		// Core types should still be present
		$this->assertContains( 'text', $types );
		$this->assertContains( 'email', $types );

		// Custom type should also be present
		$this->assertContains( 'signature', $types );

		// Clean up
		remove_all_filters( 'jetpack_forms_field_types' );
	}

	// =========================================================================
	// Form_Field_Registry Integration Tests
	// =========================================================================

	/**
	 * Test that register_jetpack_form_field adds field type to registered types.
	 */
	public function test_registry_adds_field_to_registered_types() {
		register_jetpack_form_field( 'color', array() );

		$types = Contact_Form_Field::get_registered_field_types();

		$this->assertContains( 'color', $types );
	}

	/**
	 * Test that registry validation callback integrates with validate filter.
	 */
	public function test_registry_validation_integrates_with_filter() {
		register_jetpack_form_field(
			'color',
			array(
				'validate_callback' => function ( $value, $label, $field ) {
					if ( empty( $value ) ) {
						return sprintf( '%s is required.', $label );
					}
					if ( ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $value ) ) {
						return sprintf( '%s must be a valid hex color.', $label );
					}
					return true;
				},
			)
		);

		// Simulate the filter being called (as Contact_Form_Field::validate() would do).
		$result = apply_filters(
			'jetpack_forms_validate_field',
			null,
			'color',
			'invalid-color',
			'Favorite Color',
			$this->createMock( Contact_Form_Field::class )
		);

		$this->assertEquals( 'Favorite Color must be a valid hex color.', $result );
	}

	/**
	 * Test that registry validation returns true for valid values.
	 */
	public function test_registry_validation_returns_true_for_valid() {
		register_jetpack_form_field(
			'color',
			array(
				'validate_callback' => function ( $value, $label, $field ) {
					if ( ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $value ) ) {
						return 'Invalid color.';
					}
					return true;
				},
			)
		);

		$result = apply_filters(
			'jetpack_forms_validate_field',
			null,
			'color',
			'#FF0000',
			'Color',
			$this->createMock( Contact_Form_Field::class )
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that registry render_field callback integrates with filter.
	 */
	public function test_registry_render_field_integrates_with_filter() {
		register_jetpack_form_field(
			'color',
			array(
				'render_field' => function ( $data ) {
					return sprintf(
						'<input type="color" id="%s" name="%s" value="%s" />',
						esc_attr( $data['id'] ),
						esc_attr( $data['id'] ),
						esc_attr( $data['value'] ?? '#000000' )
					);
				},
			)
		);

		$result = apply_filters(
			'jetpack_forms_render_field',
			null,
			'color',
			array(
				'id'    => 'my-color',
				'value' => '#FF0000',
			)
		);

		$this->assertStringContainsString( 'type="color"', $result );
		$this->assertStringContainsString( 'id="my-color"', $result );
		$this->assertStringContainsString( 'value="#FF0000"', $result );
	}

	/**
	 * Test that registry render_value callback integrates with Feedback_Field.
	 */
	public function test_registry_render_value_integrates_with_feedback_field() {
		register_jetpack_form_field(
			'color',
			array(
				'render_value' => function ( $context, $value, $field ) {
					if ( $context === 'email' ) {
						return sprintf(
							'<span style="background-color:%s">%s</span>',
							esc_attr( $value ),
							esc_html( $value )
						);
					}
					return $value;
				},
			)
		);

		$field  = new Feedback_Field( 'color_key', 'Favorite Color', '#00FF00', 'color' );
		$result = $field->get_render_value( 'email' );

		$this->assertStringContainsString( 'background-color:#00FF00', $result );
		$this->assertStringContainsString( '#00FF00', $result );
	}

	/**
	 * Test that registry error_messages integrate with error_types filter.
	 */
	public function test_registry_error_messages_integrate_with_filter() {
		register_jetpack_form_field(
			'color',
			array(
				'error_messages' => array(
					'invalid_color'  => 'Please enter a valid hex color (e.g., #FF0000).',
					'color_too_dark' => 'The selected color is too dark.',
				),
			)
		);

		$error_types = apply_filters( 'jetpack_forms_error_types', array() );

		$this->assertArrayHasKey( 'invalid_color', $error_types );
		$this->assertArrayHasKey( 'color_too_dark', $error_types );
		$this->assertEquals( 'Please enter a valid hex color (e.g., #FF0000).', $error_types['invalid_color'] );
	}

	/**
	 * Test complete field registration workflow.
	 */
	public function test_complete_registration_workflow() {
		// Register a complete custom field.
		register_jetpack_form_field(
			'rating',
			array(
				'block_attributes'  => array(
					'maxRating' => array(
						'type'    => 'number',
						'default' => 5,
					),
				),
				'validate_callback' => function ( $value, $label, $field ) {
					if ( empty( $value ) && $field->get_attribute( 'required' ) ) {
						return sprintf( '%s is required.', $label );
					}
					$value = intval( $value );
					if ( $value < 1 || $value > 5 ) {
						return sprintf( '%s must be between 1 and 5.', $label );
					}
					return true;
				},
				'render_value'      => function ( $context, $value, $field ) {
					$stars = str_repeat( '★', intval( $value ) ) . str_repeat( '☆', 5 - intval( $value ) );
					if ( $context === 'email' ) {
						return $stars . " ($value/5)";
					}
					return $value;
				},
				'error_messages'    => array(
					'invalid_rating' => 'Please select a valid rating.',
				),
			)
		);

		// Verify field type is registered.
		$this->assertTrue( jetpack_form_field_exists( 'rating' ) );
		$this->assertContains( 'rating', Contact_Form_Field::get_registered_field_types() );

		// Verify configuration is retrievable.
		$config = get_jetpack_form_field( 'rating' );
		$this->assertArrayHasKey( 'maxRating', $config['block_attributes'] );

		// Verify validation works.
		$mock_field = $this->createMock( Contact_Form_Field::class );
		$mock_field->method( 'get_attribute' )->willReturn( false );

		$valid_result = apply_filters( 'jetpack_forms_validate_field', null, 'rating', '4', 'Rating', $mock_field );
		$this->assertTrue( $valid_result );

		$invalid_result = apply_filters( 'jetpack_forms_validate_field', null, 'rating', '10', 'Rating', $mock_field );
		$this->assertStringContainsString( 'must be between 1 and 5', $invalid_result );

		// Verify rendering works.
		$feedback_field = new Feedback_Field( 'rating_key', 'Rating', '4', 'rating' );
		$email_render   = $feedback_field->get_render_value( 'email' );
		$this->assertStringContainsString( '★★★★☆', $email_render );
		$this->assertStringContainsString( '(4/5)', $email_render );

		// Verify error messages are registered.
		$error_types = apply_filters( 'jetpack_forms_error_types', array() );
		$this->assertArrayHasKey( 'invalid_rating', $error_types );
	}

	/**
	 * Test that multiple custom fields can be registered independently.
	 */
	public function test_multiple_custom_fields_independent() {
		register_jetpack_form_field(
			'color',
			array(
				'validate_callback' => function ( $value, $label, $field ) {
					return 'color validation';
				},
			)
		);

		register_jetpack_form_field(
			'signature',
			array(
				'validate_callback' => function ( $value, $label, $field ) {
					return 'signature validation';
				},
			)
		);

		$mock_field = $this->createMock( Contact_Form_Field::class );

		$color_result     = apply_filters( 'jetpack_forms_validate_field', null, 'color', 'val', 'Label', $mock_field );
		$signature_result = apply_filters( 'jetpack_forms_validate_field', null, 'signature', 'val', 'Label', $mock_field );

		$this->assertEquals( 'color validation', $color_result );
		$this->assertEquals( 'signature validation', $signature_result );
	}

	/**
	 * Test that unregistered field types pass through to default handling.
	 */
	public function test_unregistered_types_use_default_handling() {
		register_jetpack_form_field(
			'color',
			array(
				'validate_callback' => function () {
					return 'custom validation';
				},
			)
		);

		$mock_field = $this->createMock( Contact_Form_Field::class );

		// 'text' is a core type, not registered via Form_Field_Registry.
		// The filter should pass through the original result.
		$result = apply_filters( 'jetpack_forms_validate_field', 'default-result', 'text', 'val', 'Label', $mock_field );

		$this->assertEquals( 'default-result', $result );
	}

	/**
	 * Test Feedback_Field renders custom field values correctly for different contexts.
	 */
	public function test_feedback_field_renders_custom_values_for_contexts() {
		register_jetpack_form_field(
			'color',
			array(
				'render_value' => function ( $context, $value, $field ) {
					switch ( $context ) {
						case 'email':
							return "<div style='background:$value'>$value</div>";
						case 'csv':
							return $value; // Raw value for CSV.
						case 'api':
							return array(
								'hex'  => $value,
								'type' => 'color',
							);
						default:
							return $value;
					}
				},
			)
		);

		$field = new Feedback_Field( 'color_key', 'Color', '#123456', 'color' );

		// Test email context.
		$email = $field->get_render_value( 'email' );
		$this->assertStringContainsString( 'background:#123456', $email );

		// Test CSV context.
		$csv = $field->get_render_value( 'csv' );
		$this->assertEquals( '#123456', $csv );

		// Test API context.
		$api = $field->get_render_value( 'api' );
		$this->assertIsArray( $api );
		$this->assertEquals( '#123456', $api['hex'] );
		$this->assertEquals( 'color', $api['type'] );
	}
}
