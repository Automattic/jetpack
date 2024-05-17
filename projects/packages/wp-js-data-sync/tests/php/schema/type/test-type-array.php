<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Type_Array_Test extends TestCase {

	public function test_regular_arrays() {
		$type_array = Schema::as_array( Schema::as_string() );

		// Test with valid array
		$valid_array     = array( 'one', 'two', 'three' );
		$sanitized_array = $type_array->parse( $valid_array );
		$this->assertEquals( $valid_array, $sanitized_array );

		// Test with invalid array
		$invalid_array            = array( 'one', 2, 'three' );
		$expected_sanitized_array = array( 'one', '2', 'three' );
		$sanitized_array          = $type_array->parse( $invalid_array );
		$this->assertEquals( $expected_sanitized_array, $sanitized_array );

		// Test with non-array data
		$non_array_data = 'not an array';

		$this->expectException( Schema_Error::class );
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
		$valid_nested_array = array(
			array( 'one', 'two', 'three' ),
			array( 'four', 'five', 'six' ),
		);
		$sanitized_array    = $nested_schema->parse( $valid_nested_array );
		$this->assertEquals( $valid_nested_array, $sanitized_array );

		// Test with invalid nested array
		$invalid_nested_array = array(
			3,
			array( 'four', 'five', 'six' ),
		);

		$this->expectExceptionMessage( "Expected an array, received 'integer'" );
		$nested_schema->parse( $invalid_nested_array );
	}
}
