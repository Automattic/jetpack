<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Meta;
use PHPUnit\Framework\TestCase;

class Test_Intrgration_Serialization extends TestCase {

	public function test_serialization_basic() {

		// String
		$string = Schema::as_string();
		$this->assertSame( (string) $string, '"string"' );

		// Numbers
		$integer = Schema::as_number();
		$this->assertSame( (string) $integer, '"number"' );

		// Boolean
		$boolean = Schema::as_boolean();
		$this->assertSame( (string) $boolean, '"boolean"' );

		// Any
		$any = Schema::as_unsafe_any();
		$this->assertSame( (string) $any, '"any"' );

		// Any JSON
		$any_json = Schema::any_json_data();
		$this->assertSame( (string) $any_json, '"any_json"' );

		// Float
		$float = Schema::as_float();
		$this->assertSame( (string) $float, '"float"' );

		// Array
		$array = Schema::as_array( Schema::as_string() );
		$this->assertSame( (string) $array, '"array("string")"' );

		// Enum
		$enum = Schema::enum( array( 'a', 'b', 'c' ) );
		$this->assertSame( (string) $enum, '"enum(a, b, c)"' );

		// Enum with Schemas
		$enum = Schema::enum( array( Schema::as_string(), Schema::as_number() ) );
		$this->assertSame( (string) $enum, '"enum("string", "number")"' );

		// Void
		$void = Schema::as_void();
		$this->assertSame( (string) $void, '"void"' );

		// With Fallback
		$with_fallback = Schema::as_string()->fallback( 'fallback' );
		$expect        = array(
			'type'    => 'string',
			'default' => 'fallback',
		);
		$this->assertSame( (string) $with_fallback, json_encode( $expect ) );

		// Array values with fallback
		$array_value_fallback        = Schema::as_array(
			Schema::as_string()->fallback( "fallback" )
		);
		$expect_array_value_fallback = array(
			'type'    => 'string',
			'default' => 'fallback',
		);
		$expect_array_value_fallback = "\"array(" . json_encode( $expect_array_value_fallback ) . ")\"";
		$this->assertSame( (string) $array_value_fallback, $expect_array_value_fallback );


		// Array with array fallback
		$array_group_fallback        = Schema::as_array(
			Schema::as_string()
		)->fallback( array( 'fallback' ) );
		$expect_array_group_fallback = array(
			'type'    => 'array("string")',
			'default' => array( "fallback" ),
		);
		$expect_array_group_fallback = json_encode( $expect_array_group_fallback );
		$this->assertSame( (string) $array_group_fallback, $expect_array_group_fallback );
	}
}
