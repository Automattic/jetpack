<?php

class Example_WPCOM_REST_API_V2_Field_Controller extends WPCOM_REST_API_V2_Field_Controller {
	protected $object_type = 'example';
	protected $field_name = 'example';
}

/**
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Field_Controller extends WP_UnitTestCase {
	public function test_filter_response_by_context_for_scalar_with_correct_context() {
		$value = 1;
		$schema = array(
			'type' => 'integer',
			'context' => array( 'edit' ),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_scalar_with_incorrect_context() {
		$value = 1;
		$schema = array(
			'type' => 'integer',
			'context' => array( 'edit' ),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// We expect a root object with incorrect context to return a WP_Error.
		// The Core REST API will remove root objects with an incorrect context,
		// so this WP_Error is never seen.
		$this->assertInstanceOf( 'WP_Error', $actual );
		$this->assertSame( '__wrong-context__', $actual->get_error_code() );
	}

	public function test_filter_response_by_context_for_array_of_scalars_with_correct_context() {
		$value = array( 1, 2 );
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'integer',
				'context' => array( 'edit' ),
			),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_array_of_scalars_with_incorrect_context() {
		$value = array( 1, 2 );
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'integer',
				'context' => array( 'edit' ),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( array(), $actual );
	}

	public function test_filter_response_by_context_for_array_with_incorrect_context() {
		$value = array( 1, 2 );
		$schema = array(
			'type' => 'array',
			// This is a weird schema - don't do this in real life :)
			// In real life: the array doesn't need a context - the items schema does.
			'context' => array( 'edit' ),
			'items' => array(
				'type' => 'integer',
				'context' => array( 'view' ),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// We expect a root object with incorrect context to return a WP_Error.
		// The Core REST API will remove root objects with an incorrect context,
		// so this WP_Error is never seen.
		$this->assertInstanceOf( 'WP_Error', $actual );
		$this->assertSame( '__wrong-context__', $actual->get_error_code() );
	}

	public function test_filter_response_by_context_for_array_of_arrays_with_correct_context() {
		$value = array( array( 1 ), array( 2 ) );
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'object',
				// no context - array values should go through
				'items' => array(
					'type' => 'integer',
					// matching context - array values should go through
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'edit';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( $value, $actual );
	}

	public function test_filter_response_by_context_for_array_of_arrays_with_incorrect_context() {
		$value = array( array( 1 ), array( 2 ) );
		$schema = array(
			'type' => 'array',
			'items' => array(
				'type' => 'array',
				// no context - array values should go through
				'items' => array(
					'type' => 'integer',
					// no matching context - array values should be filtered out
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		$this->assertSame( array( array(), array() ), $actual );
	}

	public function test_filter_response_by_context_for_object() {
		$value = array( 'one' => 1, 'two' => 2 );
		$schema = array(
			'type' => 'object',
			// no context - should go through
			'properties' => array(
				'one' => array(
					'type' => 'integer',
					// matching context - should go through
					'context' => array( 'view', 'edit' ),
				),
				'two' => array(
					'type' => 'integer',
					// no matching context - should be filtered out
					'context' => array( 'edit' ),
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// ->filter_response_by_context() casts to (object)
		$this->assertInternalType( 'object', $actual );

		$this->assertEquals( (object) array( 'one' => 1 ), $actual );
	}

	public function test_filter_response_by_context_for_object_of_objects() {
		$value = array( 'one' => array( 'example' => 1 ), 'two' => array( 'another_example' => 2 ) );
		$schema = array(
			'type' => 'object',
			'properties' => array(
				'one' => array(
					'type' => 'object',
					// no context - should go through
					'properties' => array(
						'example' => array(
							'type' => 'integer',
							// matching context - should go through
							'context' => array( 'view', 'edit' ),
						)
					)
				),
				'two' => array(
					'type' => 'object',
					// no context - should go through
					'properties' => array(
						'another_example' => array(
							'type' => 'integer',
							// no matching context - should be filtered out
							'context' => array( 'edit' ),
						)
					)
				),
			),
		);
		$context = 'view';

		$controller = new Example_WPCOM_REST_API_V2_Field_Controller();

		$actual = $controller->filter_response_by_context( $value, $schema, $context );

		// ->filter_response_by_context() casts to (object)
		$this->assertInternalType( 'object', $actual );

		$this->assertEquals( (object) array(
			'one' => (object) array( 'example' => 1 ),
			'two' => (object) array(),
		), $actual );
	}
}
