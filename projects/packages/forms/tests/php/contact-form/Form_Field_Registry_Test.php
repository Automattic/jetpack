<?php
/**
 * Unit Tests for Jetpack Forms Field Registry.
 *
 * Tests the unified registration API for custom form fields.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionClass;
use WorDBless\BaseTestCase;

/**
 * Test class for the Form Field Registry.
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Form_Field_Registry
 */
#[CoversClass( Form_Field_Registry::class )]
class Form_Field_Registry_Test extends BaseTestCase {

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

		// Store original state before any tests run.
		self::$original_fields = Form_Field_Registry::get_all();
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Reset the registry to original state using reflection.
		$reflection = new ReflectionClass( Form_Field_Registry::class );

		$fields_property = $reflection->getProperty( 'registered_fields' );
		$fields_property->setAccessible( true );
		$fields_property->setValue( null, self::$original_fields );

		// Reset hooks_initialized flag so hooks can be re-added.
		$hooks_property = $reflection->getProperty( 'hooks_initialized' );
		$hooks_property->setAccessible( true );
		$hooks_property->setValue( null, false );

		// Remove any test filters.
		remove_all_filters( 'jetpack_forms_field_types' );
		remove_all_filters( 'jetpack_forms_validate_field' );
		remove_all_filters( 'jetpack_forms_render_field' );
		remove_all_filters( 'jetpack_forms_render_field_value' );
		remove_all_filters( 'jetpack_forms_error_types' );
	}

	/**
	 * Test that the global registration function exists.
	 */
	public function test_register_jetpack_form_field_function_exists() {
		$this->assertTrue( function_exists( 'register_jetpack_form_field' ) );
	}

	/**
	 * Test that the global get function exists.
	 */
	public function test_get_jetpack_form_field_function_exists() {
		$this->assertTrue( function_exists( 'get_jetpack_form_field' ) );
	}

	/**
	 * Test that the global exists function exists.
	 */
	public function test_jetpack_form_field_exists_function_exists() {
		$this->assertTrue( function_exists( 'jetpack_form_field_exists' ) );
	}

	/**
	 * Test basic field registration.
	 */
	public function test_register_field_type_succeeds() {
		$result = Form_Field_Registry::register( 'test-color', array() );

		$this->assertTrue( $result );
		$this->assertTrue( Form_Field_Registry::is_registered( 'test-color' ) );
	}

	/**
	 * Test registration with full configuration.
	 */
	public function test_register_field_with_full_config() {
		$config = array(
			'block_name'        => 'custom/color-picker',
			'block_attributes'  => array(
				'defaultColor' => array(
					'type'    => 'string',
					'default' => '#000000',
				),
			),
			'validate_callback' => function ( $value, $label, $field ) {
				return true;
			},
			'render_field'      => function ( $data ) {
				return '<input type="color" />';
			},
			'render_value'      => function ( $context, $value, $field ) {
				return $value;
			},
			'error_messages'    => array(
				'invalid_color' => 'Invalid color format.',
			),
			'editor_script'     => 'https://example.com/editor.js',
			'dashboard_script'  => 'https://example.com/dashboard.js',
		);

		$result = Form_Field_Registry::register( 'custom-color', $config );

		$this->assertTrue( $result );

		$registered = Form_Field_Registry::get( 'custom-color' );
		$this->assertEquals( 'custom/color-picker', $registered['block_name'] );
		$this->assertArrayHasKey( 'defaultColor', $registered['block_attributes'] );
		$this->assertIsCallable( $registered['validate_callback'] );
		$this->assertIsCallable( $registered['render_field'] );
		$this->assertIsCallable( $registered['render_value'] );
		$this->assertArrayHasKey( 'invalid_color', $registered['error_messages'] );
	}

	/**
	 * Test that field type is sanitized.
	 */
	public function test_field_type_is_sanitized() {
		// sanitize_key converts to lowercase and removes non-alphanumeric chars (except - and _).
		Form_Field_Registry::register( 'MY-CUSTOM_field', array() );

		// Field type should be sanitized to lowercase.
		$this->assertTrue( Form_Field_Registry::is_registered( 'my-custom_field' ) );
		$this->assertFalse( Form_Field_Registry::is_registered( 'MY-CUSTOM_field' ) );
	}

	/**
	 * Test registration fails with empty field type.
	 */
	public function test_register_fails_with_empty_field_type() {
		$result = Form_Field_Registry::register( '', array() );

		$this->assertFalse( $result );
	}

	/**
	 * Test registration fails with non-string field type.
	 */
	public function test_register_fails_with_non_string_field_type() {
		$result = Form_Field_Registry::register( 123, array() );

		$this->assertFalse( $result );
	}

	/**
	 * Test registration fails when type is already registered.
	 */
	public function test_register_fails_when_already_registered() {
		Form_Field_Registry::register( 'duplicate-test', array() );
		$result = Form_Field_Registry::register( 'duplicate-test', array() );

		$this->assertFalse( $result );
	}

	/**
	 * Test default block name is generated correctly.
	 */
	public function test_default_block_name_generation() {
		Form_Field_Registry::register( 'my-custom-type', array() );

		$registered = Form_Field_Registry::get( 'my-custom-type' );
		$this->assertEquals( 'jetpack/field-my-custom-type', $registered['block_name'] );
	}

	/**
	 * Test custom block name overrides default.
	 */
	public function test_custom_block_name_overrides_default() {
		Form_Field_Registry::register(
			'override-test',
			array(
				'block_name' => 'myplugin/custom-block',
			)
		);

		$registered = Form_Field_Registry::get( 'override-test' );
		$this->assertEquals( 'myplugin/custom-block', $registered['block_name'] );
	}

	/**
	 * Test get_registered_block_names returns all block names.
	 */
	public function test_get_registered_block_names() {
		Form_Field_Registry::register( 'block-test-1', array() );
		Form_Field_Registry::register(
			'block-test-2',
			array(
				'block_name' => 'custom/block-two',
			)
		);

		$block_names = Form_Field_Registry::get_registered_block_names();

		$this->assertContains( 'jetpack/field-block-test-1', $block_names );
		$this->assertContains( 'custom/block-two', $block_names );
	}

	/**
	 * Test is_registered returns correct boolean.
	 */
	public function test_is_registered_returns_correct_boolean() {
		Form_Field_Registry::register( 'exists-test', array() );

		$this->assertTrue( Form_Field_Registry::is_registered( 'exists-test' ) );
		$this->assertFalse( Form_Field_Registry::is_registered( 'does-not-exist' ) );
	}

	/**
	 * Test get returns null for unregistered field type.
	 */
	public function test_get_returns_null_for_unregistered() {
		$result = Form_Field_Registry::get( 'unregistered-type' );

		$this->assertNull( $result );
	}

	/**
	 * Test get_all returns all registered fields.
	 */
	public function test_get_all_returns_all_fields() {
		$initial_count = count( Form_Field_Registry::get_all() );

		Form_Field_Registry::register( 'all-test-1', array() );
		Form_Field_Registry::register( 'all-test-2', array() );

		$all = Form_Field_Registry::get_all();

		$this->assertCount( $initial_count + 2, $all );
		$this->assertArrayHasKey( 'all-test-1', $all );
		$this->assertArrayHasKey( 'all-test-2', $all );
	}

	/**
	 * Test filter_field_types adds custom types.
	 */
	public function test_filter_field_types_adds_custom_types() {
		Form_Field_Registry::register( 'filter-type-test', array() );

		$types = Form_Field_Registry::filter_field_types( array( 'text', 'email' ) );

		$this->assertContains( 'text', $types );
		$this->assertContains( 'email', $types );
		$this->assertContains( 'filter-type-test', $types );
	}

	/**
	 * Test filter_field_types doesn't add duplicates.
	 */
	public function test_filter_field_types_no_duplicates() {
		Form_Field_Registry::register( 'text', array() ); // Try to register existing type name.

		$types = Form_Field_Registry::filter_field_types( array( 'text', 'email' ) );

		// Should only have one 'text' entry.
		$text_count = array_count_values( $types )['text'] ?? 0;
		$this->assertSame( 1, $text_count );
	}

	/**
	 * Test filter_validate_field calls validation callback for registered type.
	 */
	public function test_filter_validate_field_calls_callback() {
		$callback_called = false;
		$received_params = array();

		Form_Field_Registry::register(
			'validate-test',
			array(
				'validate_callback' => function ( $value, $label, $field ) use ( &$callback_called, &$received_params ) {
					$callback_called   = true;
					$received_params   = array(
						'value' => $value,
						'label' => $label,
						'field' => $field,
					);
					return true;
				},
			)
		);

		$mock_field = $this->createMock( Contact_Form_Field::class );

		$result = Form_Field_Registry::filter_validate_field(
			null,
			'validate-test',
			'test-value',
			'Test Label',
			$mock_field
		);

		$this->assertTrue( $callback_called );
		$this->assertEquals( 'test-value', $received_params['value'] );
		$this->assertEquals( 'Test Label', $received_params['label'] );
		$this->assertTrue( $result );
	}

	/**
	 * Test filter_validate_field returns error message.
	 */
	public function test_filter_validate_field_returns_error() {
		Form_Field_Registry::register(
			'validate-error-test',
			array(
				'validate_callback' => function ( $value, $label, $field ) {
					return 'This field is invalid.';
				},
			)
		);

		$mock_field = $this->createMock( Contact_Form_Field::class );

		$result = Form_Field_Registry::filter_validate_field(
			null,
			'validate-error-test',
			'bad-value',
			'Test Label',
			$mock_field
		);

		$this->assertEquals( 'This field is invalid.', $result );
	}

	/**
	 * Test filter_validate_field passes through for unregistered type.
	 */
	public function test_filter_validate_field_passes_through_unregistered() {
		$mock_field = $this->createMock( Contact_Form_Field::class );

		$result = Form_Field_Registry::filter_validate_field(
			'original-result',
			'unregistered-type',
			'value',
			'Label',
			$mock_field
		);

		$this->assertEquals( 'original-result', $result );
	}

	/**
	 * Test filter_validate_field passes through when no callback.
	 */
	public function test_filter_validate_field_passes_through_no_callback() {
		Form_Field_Registry::register( 'no-validate-callback', array() );

		$mock_field = $this->createMock( Contact_Form_Field::class );

		$result = Form_Field_Registry::filter_validate_field(
			'original-result',
			'no-validate-callback',
			'value',
			'Label',
			$mock_field
		);

		$this->assertEquals( 'original-result', $result );
	}

	/**
	 * Test filter_render_field calls render callback.
	 */
	public function test_filter_render_field_calls_callback() {
		$received_data = array();

		Form_Field_Registry::register(
			'render-field-test',
			array(
				'render_field' => function ( $data ) use ( &$received_data ) {
					$received_data = $data;
					return '<input type="custom" />';
				},
			)
		);

		$data   = array(
			'id'       => 'test-id',
			'label'    => 'Test Label',
			'required' => true,
		);
		$result = Form_Field_Registry::filter_render_field( null, 'render-field-test', $data );

		$this->assertEquals( '<input type="custom" />', $result );
		$this->assertEquals( $data, $received_data );
	}

	/**
	 * Test filter_render_field passes through for unregistered type.
	 */
	public function test_filter_render_field_passes_through_unregistered() {
		$result = Form_Field_Registry::filter_render_field(
			'<original />',
			'unregistered-type',
			array()
		);

		$this->assertEquals( '<original />', $result );
	}

	/**
	 * Test filter_render_value calls render callback.
	 */
	public function test_filter_render_value_calls_callback() {
		Form_Field_Registry::register(
			'render-value-test',
			array(
				'render_value' => function ( $context, $value, $field ) {
					return "[$context] $value";
				},
			)
		);

		$mock_field = $this->createMock( Feedback_Field::class );

		$result = Form_Field_Registry::filter_render_value(
			null,
			'email',
			'render-value-test',
			'#FF0000',
			$mock_field
		);

		$this->assertEquals( '[email] #FF0000', $result );
	}

	/**
	 * Test filter_render_value with different contexts.
	 */
	public function test_filter_render_value_different_contexts() {
		Form_Field_Registry::register(
			'context-test',
			array(
				'render_value' => function ( $context, $value, $field ) {
					switch ( $context ) {
						case 'email':
							return "<b>$value</b>";
						case 'csv':
							return $value;
						case 'api':
							return array( 'value' => $value );
						default:
							return $value;
					}
				},
			)
		);

		$mock_field = $this->createMock( Feedback_Field::class );

		$email_result = Form_Field_Registry::filter_render_value( null, 'email', 'context-test', 'test', $mock_field );
		$this->assertEquals( '<b>test</b>', $email_result );

		$csv_result = Form_Field_Registry::filter_render_value( null, 'csv', 'context-test', 'test', $mock_field );
		$this->assertEquals( 'test', $csv_result );

		$api_result = Form_Field_Registry::filter_render_value( null, 'api', 'context-test', 'test', $mock_field );
		$this->assertIsArray( $api_result );
		$this->assertEquals( 'test', $api_result['value'] );
	}

	/**
	 * Test filter_error_types adds custom error messages.
	 */
	public function test_filter_error_types_adds_custom_messages() {
		Form_Field_Registry::register(
			'error-types-test',
			array(
				'error_messages' => array(
					'invalid_format' => 'The format is invalid.',
					'out_of_range'   => 'The value is out of range.',
				),
			)
		);

		$error_types = Form_Field_Registry::filter_error_types(
			array(
				'is_required' => 'This field is required.',
			)
		);

		$this->assertArrayHasKey( 'is_required', $error_types );
		$this->assertArrayHasKey( 'invalid_format', $error_types );
		$this->assertArrayHasKey( 'out_of_range', $error_types );
		$this->assertEquals( 'The format is invalid.', $error_types['invalid_format'] );
	}

	/**
	 * Test filter_error_types merges from multiple registered fields.
	 */
	public function test_filter_error_types_merges_multiple_fields() {
		Form_Field_Registry::register(
			'error-test-1',
			array(
				'error_messages' => array(
					'error_one' => 'Error one.',
				),
			)
		);
		Form_Field_Registry::register(
			'error-test-2',
			array(
				'error_messages' => array(
					'error_two' => 'Error two.',
				),
			)
		);

		$error_types = Form_Field_Registry::filter_error_types( array() );

		$this->assertArrayHasKey( 'error_one', $error_types );
		$this->assertArrayHasKey( 'error_two', $error_types );
	}

	/**
	 * Test default attributes are merged with custom attributes.
	 */
	public function test_default_attributes_merged() {
		Form_Field_Registry::register(
			'attr-test',
			array(
				'block_attributes' => array(
					'customAttr' => array(
						'type'    => 'string',
						'default' => 'custom',
					),
				),
			)
		);

		$registered = Form_Field_Registry::get( 'attr-test' );

		// Should have custom attribute.
		$this->assertArrayHasKey( 'customAttr', $registered['block_attributes'] );
		// Default label attribute should NOT be in block_attributes - it's added during block registration.
		// The block_attributes in the registry only stores the custom ones passed during registration.
		$this->assertEquals( 'custom', $registered['block_attributes']['customAttr']['default'] );
	}

	/**
	 * Test global function register_jetpack_form_field works.
	 */
	public function test_global_register_function() {
		$result = register_jetpack_form_field( 'global-test', array() );

		$this->assertTrue( $result );
		$this->assertTrue( jetpack_form_field_exists( 'global-test' ) );
	}

	/**
	 * Test global function get_jetpack_form_field works.
	 */
	public function test_global_get_function() {
		register_jetpack_form_field(
			'global-get-test',
			array(
				'error_messages' => array( 'test' => 'Test message' ),
			)
		);

		$config = get_jetpack_form_field( 'global-get-test' );

		$this->assertIsArray( $config );
		$this->assertArrayHasKey( 'test', $config['error_messages'] );
	}

	/**
	 * Test global function get_jetpack_form_field returns null for unregistered.
	 */
	public function test_global_get_function_returns_null() {
		$result = get_jetpack_form_field( 'nonexistent' );

		$this->assertNull( $result );
	}

	/**
	 * Test global function jetpack_form_field_exists works.
	 */
	public function test_global_exists_function() {
		register_jetpack_form_field( 'exists-global-test', array() );

		$this->assertTrue( jetpack_form_field_exists( 'exists-global-test' ) );
		$this->assertFalse( jetpack_form_field_exists( 'does-not-exist-global' ) );
	}

	/**
	 * Test default script dependencies are set.
	 */
	public function test_default_script_dependencies() {
		Form_Field_Registry::register( 'deps-test', array() );

		$registered = Form_Field_Registry::get( 'deps-test' );

		$this->assertContains( 'wp-blocks', $registered['editor_script_deps'] );
		$this->assertContains( 'wp-element', $registered['editor_script_deps'] );
		$this->assertContains( 'wp-hooks', $registered['dashboard_script_deps'] );
	}

	/**
	 * Test custom script dependencies override defaults.
	 */
	public function test_custom_script_dependencies() {
		Form_Field_Registry::register(
			'custom-deps-test',
			array(
				'editor_script_deps' => array( 'custom-dep' ),
			)
		);

		$registered = Form_Field_Registry::get( 'custom-deps-test' );

		$this->assertEquals( array( 'custom-dep' ), $registered['editor_script_deps'] );
	}

	/**
	 * Data provider for validation callback test cases.
	 *
	 * @return array Test cases.
	 */
	public static function validation_callback_data_provider(): array {
		return array(
			'valid value returns true'     => array(
				'value'    => '#FF0000',
				'expected' => true,
			),
			'empty required returns error' => array(
				'value'    => '',
				'expected' => 'Color is required.',
			),
			'invalid format returns error' => array(
				'value'    => 'not-a-color',
				'expected' => 'Invalid hex color format.',
			),
		);
	}

	/**
	 * Test validation callback with various inputs.
	 *
	 * @dataProvider validation_callback_data_provider
	 *
	 * @param string $value    The value to validate.
	 * @param mixed  $expected The expected result.
	 */
	#[DataProvider( 'validation_callback_data_provider' )]
	public function test_validation_callback_various_inputs( $value, $expected ) {
		Form_Field_Registry::register(
			'validation-data-test',
			array(
				'validate_callback' => function ( $val, $label, $field ) {
					if ( empty( $val ) ) {
						return 'Color is required.';
					}
					if ( ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $val ) ) {
						return 'Invalid hex color format.';
					}
					return true;
				},
			)
		);

		$mock_field = $this->createMock( Contact_Form_Field::class );

		$result = Form_Field_Registry::filter_validate_field(
			null,
			'validation-data-test',
			$value,
			'Color',
			$mock_field
		);

		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that hooks are only initialized once.
	 */
	public function test_hooks_initialized_only_once() {
		// Register multiple fields - hooks should only be added once.
		Form_Field_Registry::register( 'hooks-test-1', array() );
		Form_Field_Registry::register( 'hooks-test-2', array() );
		Form_Field_Registry::register( 'hooks-test-3', array() );

		// Check that the filter is added by checking filter priority.
		// has_filter returns the priority (int) if found, false if not.
		$filter_priority = has_filter( 'jetpack_forms_field_types', array( Form_Field_Registry::class, 'filter_field_types' ) );

		// The filter should exist and have a valid priority (10 is default).
		$this->assertIsInt( $filter_priority );
		$this->assertEquals( 10, $filter_priority );
	}
}
