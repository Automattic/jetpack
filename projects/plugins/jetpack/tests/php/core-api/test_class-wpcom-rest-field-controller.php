<?php

class Example_WPCOM_REST_API_V2_Field_Controller extends WPCOM_REST_API_V2_Field_Controller {
	protected $object_type = 'example';
	protected $field_name  = 'example';

	private $test_schema = array();

	public function __construct( $test_schema ) {
		$this->test_schema = $test_schema;

		parent::__construct();
	}

	public function get_schema() {
		return $this->test_schema;
	}

	public function get_permission_check( $object_data, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return new WP_Error( 'nope' );
	}
}

/**
 * @group rest-api
 * phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class Test_WPCOM_REST_API_V2_Field_Controller extends WP_UnitTestCase {

	public function provide_type_defaults() {
		return array(
			'string'                  => array( 'string', '' ),
			'integer'                 => array( 'integer', 0 ),
			'number'                  => array( 'number', 0 ),
			'array'                   => array( 'array', array() ),
			// 'object'  => [sic] handled separately
							'boolean' => array( 'boolean', false ),
			'null'                    => array( 'null', null ),
		);
	}

	public function test_default_value_provided_by_schema() {
		$schema = array(
			'default' => 'hello',
		);

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->get_default_value( $schema );

		$this->assertSame( 'hello', $actual );
	}

	/**
	 * @dataProvider provide_type_defaults()
	 */
	public function test_default_value_guessed_from_type( $type, $expected ) {
		$schema = array(
			'type' => $type,
		);

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->get_default_value( $schema );

		$this->assertSame( $expected, $actual );
	}

	public function test_default_value_guessed_from_object_type() {
		$schema = array(
			'type' => 'object',
		);

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->get_default_value( $schema );

		$this->assertIsObject( $actual );
		$this->assertEquals( new stdClass(), $actual );
	}

	public function test_get_for_response_returns_default_value_for_users_without_permission() {
		$schema = array(
			'default' => 'hello',
		);

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );
		$actual     = $controller->get_for_response( 1, 2, 3, 4 );

		$this->assertSame( 'hello', $actual );
	}

	public function test_filter_response_by_context_for_scalar_with_correct_context() {
		$value   = 1;
		$schema  = array(
			'type'    => 'integer',
			'context' => array( 'edit' ),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_scalar_with_incorrect_context() {
		$value   = 1;
		$schema  = array(
			'type'    => 'integer',
			'context' => array( 'edit' ),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// We expect a root object with incorrect context to return a WP_Error.
		// The Core REST API will remove root objects with an incorrect context,
		// so this WP_Error is never seen.
		$this->assertInstanceOf( 'WP_Error', $actual );
		$this->assertSame( '__wrong-context__', $actual->get_error_code() );
	}

	public function test_filter_response_by_context_for_array_of_scalars_with_correct_context() {
		$value   = array( 1, 2 );
		$schema  = array(
			'type'  => 'array',
			'items' => array(
				'type'    => 'integer',
				'context' => array( 'edit' ),
			),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_array_of_scalars_with_incorrect_context() {
		$value   = array( 1, 2 );
		$schema  = array(
			'type'  => 'array',
			'items' => array(
				'type'    => 'integer',
				'context' => array( 'edit' ),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( array(), $actual );
	}

	public function test_filter_response_by_context_for_array_with_incorrect_context() {
		$value   = array( 1, 2 );
		$schema  = array(
			'type'    => 'array',
			// This is a weird schema - don't do this in real life :)
			// In real life: the array doesn't need a context - the items schema does.
			'context' => array( 'edit' ),
			'items'   => array(
				'type'    => 'integer',
				'context' => array( 'view' ),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// We expect a root object with incorrect context to return a WP_Error.
		// The Core REST API will remove root objects with an incorrect context,
		// so this WP_Error is never seen.
		$this->assertInstanceOf( 'WP_Error', $actual );
		$this->assertSame( '__wrong-context__', $actual->get_error_code() );
	}

	public function test_filter_response_by_context_for_array_of_arrays_with_correct_context() {
		$value   = array( array( 1 ), array( 2 ) );
		$schema  = array(
			'type'  => 'array',
			'items' => array(
				'type'  => 'object',
				// no context - array values should go through
				'items' => array(
					'type'    => 'integer',
					// matching context - array values should go through
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_array_of_arrays_with_incorrect_context() {
		$value   = array( array( 1 ), array( 2 ) );
		$schema  = array(
			'type'  => 'array',
			'items' => array(
				'type'  => 'array',
				// no context - array values should go through
				'items' => array(
					'type'    => 'integer',
					// no matching context - array values should be filtered out
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( array( array(), array() ), $actual );
	}

	public function test_filter_response_by_context_for_object() {
		$value   = array(
			'one' => 1,
			'two' => 2,
		);
		$schema  = array(
			'type'       => 'object',
			// no context - should go through
			'properties' => array(
				'one' => array(
					'type'    => 'integer',
					// matching context - should go through
					'context' => array( 'view', 'edit' ),
				),
				'two' => array(
					'type'    => 'integer',
					// no matching context - should be filtered out
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// ->filter_response_by_context() casts to (object)
		$this->assertIsObject( $actual );

		$this->assertEquals( (object) array( 'one' => 1 ), $actual );
	}

	public function test_filter_response_by_context_for_object_of_objects() {
		$value   = array(
			'one' => array( 'example' => 1 ),
			'two' => array( 'another_example' => 2 ),
		);
		$schema  = array(
			'type'       => 'object',
			'properties' => array(
				'one' => array(
					'type'       => 'object',
					// no context - should go through
					'properties' => array(
						'example' => array(
							'type'    => 'integer',
							// matching context - should go through
							'context' => array( 'view', 'edit' ),
						),
					),
				),
				'two' => array(
					'type'       => 'object',
					// no context - should go through
					'properties' => array(
						'another_example' => array(
							'type'    => 'integer',
							// no matching context - should be filtered out
							'context' => array( 'edit' ),
						),
					),
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller( $schema );

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// ->filter_response_by_context() casts to (object)
		$this->assertIsObject( $actual );

		$this->assertEquals(
			(object) array(
				'one' => (object) array( 'example' => 1 ),
				'two' => (object) array(),
			),
			$actual
		);
	}
}
