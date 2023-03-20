<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use PHPUnit\Framework\TestCase;

class Type_Array_Test extends TestCase {

	public function test_regular_arrays() {
		$type_array = Schema::as_array( Schema::as_string() );

		// Test with valid array
		$valid_array     = [ 'one', 'two', 'three' ];
		$sanitized_array = $type_array->parse( $valid_array );
		$this->assertEquals( $valid_array, $sanitized_array );

		// Test with invalid array
		$invalid_array            = [ 'one', 2, 'three' ];
		$expected_sanitized_array = [ 'one', '2', 'three' ];
		$sanitized_array          = $type_array->parse( $invalid_array );
		$this->assertEquals( $expected_sanitized_array, $sanitized_array );

		// Test with non-array data
		$non_array_data = 'not an array';
		$this->expectException( \Error::class );
		$sanitized_array = $type_array->parse( $non_array_data );
	}

	public function test_nested_arrays() {
		// Create a nested schema: array of arrays of strings
		$nested_schema =
			Schema::as_array(
				Schema::as_array(
					Schema::as_string()
				)
			);

		// Test with valid nested array
		$valid_nested_array = [
			[ 'one', 'two', 'three' ],
			[ 'four', 'five', 'six' ],
		];

		// Test with invalid nested array
		$invalid_nested_array = [
			3,
			[ 'four', 'five', 'six' ],
		];
		$this->expectException( \Error::class );
		$nested_schema->parse( $invalid_nested_array );
	}



}
