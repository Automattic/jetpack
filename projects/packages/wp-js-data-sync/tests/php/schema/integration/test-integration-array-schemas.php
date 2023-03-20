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
				[
					'string'  => Schema::as_string(),
					'number'  => Schema::as_number(),
					'boolean' => Schema::as_boolean(),
				]
			)
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

	public function test_nested_assoc_arrays() {

		$schema = Schema::as_array(
			Schema::as_assoc_array(
				[
					'array'  => Schema::as_array( Schema::as_assoc_array(
						[
							'string' => Schema::as_string(),
							'number' => Schema::as_number(),
						]
					) ),
					'number' => Schema::as_number(),
				]
			)
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
