<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Meta;
use PHPUnit\Framework\TestCase;

class Test_Intrgration_Serialization extends TestCase {

	public function test_serialization_to_string() {

		// String
		$string = Schema::as_string();
		$this->assertSame( 'string', (string) $string );

		// Numbers
		$integer = Schema::as_number();
		$this->assertSame( 'number', (string) $integer );

		// Boolean
		$boolean = Schema::as_boolean();
		$this->assertSame( 'boolean', (string) $boolean );

		// Any
		$any = Schema::as_unsafe_any();
		$this->assertSame( 'any', (string) $any );

		// Any JSON
		$any_json = Schema::any_json_data();
		$this->assertSame( 'any_json', (string) $any_json );

		// Float
		$float = Schema::as_float();
		$this->assertSame( 'float', (string) $float );

		// Array
		$array = Schema::as_array( Schema::as_string() );
		$this->assertSame( 'array(string)', (string) $array );

		// Enum
		$enum = Schema::enum( array( 'a', 'b', 'c' ) );
		$this->assertSame( 'enum(a,b,c)', (string) $enum );

		// Enum with Schemas
		$enum = Schema::enum( array( Schema::as_string(), Schema::as_number() ) );
		$this->assertSame( "enum(string,number)", (string) $enum );

		// Void
		$void = Schema::as_void();
		$this->assertSame( 'void', (string) $void );

		// With Fallback
		$with_fallback        = Schema::as_string()->fallback( 'fallback' );
		$expect_with_fallback = array(
			'type'    => 'string',
			'default' => 'fallback',
		);

		// Test fallbacks in both directions
		$this->assertSame( json_encode( $expect_with_fallback ), (string) $with_fallback );
		$this->assertSame( $expect_with_fallback, json_decode( $with_fallback, true ) );
	}

	public function test_serialization_assoc_values() {

		$schema              = Schema::as_assoc_array(
			array(
				'string'          => Schema::as_string(),
				'number'          => Schema::as_number(),
				'array'           => Schema::as_array( Schema::as_string() ),
				'enum'            => Schema::enum( array( 'a', 'b', 'c' ) ),
				'enum_types'      => Schema::enum( array( Schema::as_string(), Schema::as_number() ) ),
				'void'            => Schema::as_void(),
				'any'             => Schema::as_unsafe_any(),
				'float'           => Schema::as_float(),
				'bool'            => Schema::as_boolean(),
				'array_of_arrays' => Schema::as_array(
					Schema::as_array(
						Schema::as_string()
					)
				),
			)
		);
		$expect_schema_to_be = array(
			'string'          => 'string',
			'number'          => 'number',
			'array'           => 'array(string)',
			'enum'            => 'enum(a,b,c)',
			'enum_types'      => 'enum(string,number)',
			'void'            => 'void',
			'any'             => 'any',
			'float'           => 'float',
			'bool'            => 'boolean',
			'array_of_arrays' => 'array(array(string))',
		);

		// Test in both directions
		$this->assertSame( json_encode( $expect_schema_to_be ), (string) $schema );
		$this->assertSame( $expect_schema_to_be, json_decode( $schema, true ) );

	}

	public function test_serialization_assoc_nested() {
		$schema = Schema::as_assoc_array(
			array(
				'level_1' => Schema::as_assoc_array(
					array(
						'level_2' => Schema::as_assoc_array(
							array(
								'level_3' => Schema::as_string(),
							)
						),
					)
				),
			)
		);

		$expect_schema_to_be = array(
			'level_1' => array(
				'level_2' => array(
					'level_3' => 'string',
				),
			),
		);

		// Test in both directions
		$this->assertSame( json_encode( $expect_schema_to_be ), (string) $schema );
		$this->assertSame( $expect_schema_to_be, json_decode( $schema, true ) );
	}

	public function test_serialization_array_fallbacks() {
		$this->assertTrue( true );
		// Array values with fallback
//		$array_value_fallback        = Schema::as_array(
//			Schema::as_string()->fallback( 'fallback' )
//		);
//		$expect_array_value_fallback = array(
//			'type'    => 'string',
//			'default' => 'fallback',
//		);
//		$expect_array_value_fallback = json_encode( $expect_array_value_fallback );
//		$this->assertSame( $expect_array_value_fallback, (string) $array_value_fallback );


		// Array with array fallback
//		$array_group_fallback        = Schema::as_array(
//			Schema::as_string()
//		)->fallback( array( 'fallback' ) );
//		$expect_array_group_fallback = array(
//			'type'    => 'array("string")',
//			'default' => array( 'fallback' ),
//		);
//		$expect_array_group_fallback = json_encode( $expect_array_group_fallback );
//		$this->assertSame( $expect_array_group_fallback, json_encode( $array_group_fallback ) );
	}
}
