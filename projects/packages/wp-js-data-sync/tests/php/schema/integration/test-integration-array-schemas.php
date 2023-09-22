<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use PHPUnit\Framework\TestCase;

class Test_Integration_Array_Schemas extends TestCase {
	/**
	 * When you define a given shape,
	 * The validation should be applied to each item in the array.
	 */
	public function test_arrays_of_assoc_arrays() {
		// Create a nested schema: array of arrays with different types
		$schema = Schema::as_array(
			Schema::as_assoc_array(
				array(
					'string'  => Schema::as_string(),
					'number'  => Schema::as_number(),
					'boolean' => Schema::as_boolean(),
				)
			)
		);

		// Test with valid nested array
		$valid_array = array(
			array(
				'string'  => 'two',
				'number'  => 2,
				'boolean' => false,
			),
		);
		$this->assertEquals( $valid_array, $schema->parse( $valid_array ) );

		// Test with invalid nested array
		$invalid_array = array(
			array(
				'string'  => 2, // Should be cast to string
				'number'  => '2', // Should be cast to number
				'boolean' => 0, // Should be cast to boolean
			),
		);

		$expect_parsed_array = array(
			array(
				'string'  => '2',
				'number'  => 2,
				'boolean' => false,
			),
		);
		$this->assertEquals( $expect_parsed_array, $schema->parse( $invalid_array ) );
	}

	public function test_nested_assoc_arrays() {

		$schema = Schema::as_array(
			Schema::as_assoc_array(
				array(
					'array'  => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'string' => Schema::as_string(),
								'number' => Schema::as_number(),
							)
						)
					),
					'number' => Schema::as_number(),
				)
			)
		);

		$valid_array = array(
			array(
				'array'  => array(
					array(
						'string' => 'one',
						'number' => 1,
					),
					array(
						'string' => 'two',
						'number' => 2,
					),
				),
				'number' => 42,
			),
			array(
				'array'  => array(
					array(
						'string' => 'three',
						'number' => 3,
					),
					array(
						'string' => 'four',
						'number' => 4,
					),
				),
				'number' => 42,
			),
		);

		$this->assertEquals( $valid_array, $schema->parse( $valid_array ) );
	}
}
