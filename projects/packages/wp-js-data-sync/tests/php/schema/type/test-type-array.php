<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use PHPUnit\Framework\TestCase;

class Type_Array_Test extends TestCase {
	public function test_validate() {
		$type_array = new Type_Array( Schema::as_string() );

		// Test with valid array
		$valid_array = [ 'one', 'two', 'three' ];
		$this->assertTrue( $type_array->validate( $valid_array ) );

		// Test with invalid array
		$invalid_array = [ 'one', 2, 'three' ];
		$this->assertFalse( $type_array->validate( $invalid_array ) );

		// Test with non-array data
		$this->assertFalse( $type_array->validate( 'not an array' ) );
	}

	public function test_sanitize() {
		$type_array = new Type_Array( Schema::as_string() );

		// Test with valid array
		$valid_array     = [ 'one', 'two', 'three' ];
		$sanitized_array = $type_array->sanitize( $valid_array );
		$this->assertEquals( $valid_array, $sanitized_array );

		// Test with invalid array
		$invalid_array            = [ 'one', 2, 'three' ];
		$expected_sanitized_array = [ 'one', '', 'three' ];
		$sanitized_array          = $type_array->sanitize( $invalid_array );
		$this->assertEquals( $expected_sanitized_array, $sanitized_array );

		// Test with non-array data
		$non_array_data  = 'not an array';
		$sanitized_array = $type_array->sanitize( $non_array_data );
		$this->assertEquals( [], $sanitized_array );
	}

	public function test_nested_arrays() {
		// Create a nested schema: array of arrays of strings
		$nested_schema = Schema::as_array(
			Schema::as_array(
				Schema::as_string()
			)
		);

		// Test with valid nested array
		$valid_nested_array = [
			[ 'one', 'two', 'three' ],
			[ 'four', 'five', 'six' ],
		];
		$this->assertTrue( $nested_schema->validate( $valid_nested_array ) );

		// Test with invalid nested array
		$invalid_nested_array = [
			[ 'one', 'two', 3 ],
			[ 'four', 'five', 'six' ],
		];
		$this->assertFalse( $nested_schema->validate( $invalid_nested_array ) );

		// Test sanitizing nested array
		$sanitized_nested_array          = $nested_schema->sanitize( $invalid_nested_array );
		$expected_sanitized_nested_array = [
			[ 'one', 'two', '' ],
			[ 'four', 'five', 'six' ],
		];
		$this->assertEquals( $expected_sanitized_nested_array, $sanitized_nested_array );
	}

	/**
	 * When you define a given shape,
	 * The validation should be applied to each item in the array.
	 */
	public function test_arrays_of_shapes() {
		// Create a nested schema: array of arrays with different types
		$schema = Schema::as_array(
			[
				'string'  => Schema::as_string(),
				'number'  => Schema::as_number(),
				'boolean' => Schema::as_boolean(),
			]
		);

		// Test with valid nested array
		$valid_array = [
			[
				'string'  => 'one',
				'number'  => 1,
				'boolean' => true,
			],
			[
				'string'  => 'two',
				'number'  => 2,
				'boolean' => false,
			],
		];
		$this->assertTrue( $schema->validate( $valid_array ) );
		$this->assertEquals( $valid_array, $schema->sanitize( $valid_array ) );

		// Test with invalid nested array
		$invalid_array = [
			[
				'string'  => 'one',
				'number'  => 1,
				'boolean' => 1, // Invalid boolean value
			],
			[
				'string'  => 2, // Invalid string value
				'number'  => 2,
				'boolean' => false,
			],
		];
		$this->assertFalse( $schema->validate( $invalid_array ) );

		$expected_invalid_array_sanitization = [
			[
				'string'  => 'one',
				'number'  => 1,
				'boolean' => true, // Sanitized boolean value
			],
			[
				'string'  => '', // Sanitized string value
				'number'  => 2,
				'boolean' => false,
			],
		];
		$this->assertEquals( $expected_invalid_array_sanitization, $schema->sanitize( $invalid_array ) );
	}

	public function test_multidimensional_arrays() {

		$schema      = Schema::as_array(
			[
				'array'  => Schema::as_array(
					[
						'string' => Schema::as_string(),
						'number' => Schema::as_number(),
					]
				),
				'number' => Schema::as_number(),
			]
		);
		$valid_array = [
			[
				'array'  => [
					[
						'string' => 'one',
						'number' => 1,
					],
					[
						'string' => 'two',
						'number' => 2,
					],
				],
				'number' => 42,
			],
			[
				'array'  => [
					[
						'string' => 'three',
						'number' => 3,
					],
					[
						'string' => 'four',
						'number' => 4,
					],
				],
				'number' => 42,
			],
		];

		$this->assertTrue( $schema->validate( $valid_array ) );
		$this->assertEquals( $valid_array, $schema->sanitize( $valid_array ) );
	}

}
