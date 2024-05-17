<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use PHPUnit\Framework\TestCase;

class Test_Integration_Serialization extends TestCase {

	public function test_serialization_to_string() {

		// String
		$string = Schema::as_string();
		$this->assertSame( 'string', (string) $string );
		$this->assertSame( array( 'type' => 'string' ), $string->schema() );

		// Numbers
		$integer = Schema::as_number();
		$this->assertSame( 'number', (string) $integer );
		$this->assertSame( array( 'type' => 'number' ), $integer->schema() );

		// Boolean
		$boolean = Schema::as_boolean();
		$this->assertSame( 'boolean', (string) $boolean );
		$this->assertSame( array( 'type' => 'boolean' ), $boolean->schema() );

		// Any
		$any = Schema::as_unsafe_any();
		$this->assertSame( 'any', (string) $any );
		$this->assertSame( array( 'type' => 'any' ), $any->schema() );

		// Any JSON
		$any_json = Schema::any_json_data();
		$this->assertSame( 'any_json', (string) $any_json );
		$this->assertSame( array( 'type' => 'any_json' ), $any_json->schema() );

		// Float
		$float = Schema::as_float();
		$this->assertSame( 'float', (string) $float );
		$this->assertSame( array( 'type' => 'float' ), $float->schema() );

		// Array
		$array = Schema::as_array( Schema::as_string() );
		$this->assertSame( 'array(string)', (string) $array );
		$this->assertSame(
			array(
				'type'  => 'array',
				'value' => array( 'type' => 'string' ),
			),
			$array->schema()
		);

		// Enum
		$enum = Schema::enum( array( 'a', 'b', 'c' ) );
		$this->assertSame( 'enum(a,b,c)', (string) $enum );
		$this->assertSame(
			array(
				'type'  => 'enum',
				'value' => array( 'a', 'b', 'c' ),
			),
			$enum->schema()
		);

		// Enum with Schemas
		$enum = Schema::enum( array( Schema::as_string(), Schema::as_number() ) );
		$this->assertSame( 'enum(string,number)', (string) $enum );
		$this->assertSame(
			array(
				'type'  => 'enum',
				'value' => array(
					array( 'type' => 'string' ),
					array( 'type' => 'number' ),
				),
			),
			$enum->schema()
		);

		// Void
		$void = Schema::as_void();
		$this->assertSame( 'void', (string) $void );
		$this->assertSame( array( 'type' => 'void' ), $void->schema() );

		// With Fallback
		$with_fallback        = Schema::as_string()->fallback( 'fallback' );
		$expect_with_fallback = array(
			'type'  => 'or',
			'value' => array(
				array(
					'type' => 'string',
				),
				array(
					'type' => 'literal_value("fallback")',
				),
			),
		);

		$this->assertSame( $expect_with_fallback, $with_fallback->schema() );
		$this->assertSame( wp_json_encode( $expect_with_fallback ), wp_json_encode( $with_fallback ) );
	}

	public function test_serialization_assoc_value() {

		$schema = Schema::as_assoc_array(
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
				'nested_assoc'    => Schema::as_assoc_array(
					array(
						'level_2' => Schema::as_string(),
					)
				),
				'array_of_arrays' => Schema::as_array(
					Schema::as_array(
						Schema::as_string()
					)
				),
			)
		);

		$expect_schema_to_be = array(
			'type'  => 'assoc_array',
			'value' => array(
				'string'          => array(
					'type' => 'string',
				),
				'number'          => array(
					'type' => 'number',
				),
				'array'           => array(
					'type'  => 'array',
					'value' => array(
						'type' => 'string',
					),
				),
				'enum'            => array(
					'type'  => 'enum',
					'value' => array( 'a', 'b', 'c' ),
				),
				'enum_types'      => array(
					'type'  => 'enum',
					'value' => array(
						array(
							'type' => 'string',
						),
						array(
							'type' => 'number',
						),
					),
				),
				'void'            => array(
					'type' => 'void',
				),
				'any'             => array(
					'type' => 'any',
				),
				'float'           => array(
					'type' => 'float',
				),
				'bool'            => array(
					'type' => 'boolean',
				),
				'nested_assoc'    => array(
					'type'  => 'assoc_array',
					'value' => array(
						'level_2' => array(
							'type' => 'string',
						),
					),
				),
				'array_of_arrays' => array(
					'type'  => 'array',
					'value' => array(
						'type'  => 'array',
						'value' => array(
							'type' => 'string',
						),
					),
				),
			),
		);

		// Test in both directions
		$this->assertSame( $expect_schema_to_be, $schema->schema() );
		$this->assertSame( $expect_schema_to_be, json_decode( wp_json_encode( $schema ), true ) );
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
			'type'  => 'assoc_array',
			'value' => array(
				'level_1' => array(
					'type'  => 'assoc_array',
					'value' => array(
						'level_2' => array(
							'type'  => 'assoc_array',
							'value' => array(
								'level_3' => array(
									'type' => 'string',
								),
							),
						),
					),
				),
			),
		);

		$this->assertSame( $expect_schema_to_be, $schema->schema() );
		$this->assertSame( wp_json_encode( $expect_schema_to_be ), wp_json_encode( $schema ) );
	}

	public function test_serialization_array_fallbacks() {

		// Fallback in an array item
		$array_value_fallback        = Schema::as_array(
			Schema::as_string()->fallback( 'fallback' )
		);
		$expect_array_value_fallback = array(
			'type'  => 'array',
			'value' => array(
				'type'  => 'or',
				'value' => array(
					array(
						'type' => 'string',
					),
					array(
						'type' => 'literal_value("fallback")',
					),
				),
			),
		);

		$this->assertSame( $expect_array_value_fallback, $array_value_fallback->schema() );
		$this->assertSame( wp_json_encode( $expect_array_value_fallback ), wp_json_encode( $array_value_fallback ) );

		// Fallback on Array
		$array_group_fallback = Schema::as_array(
			Schema::as_string()
		)->fallback( array( 'fallback' ) );

		$expect_array_group_fallback = array(
			'type'  => 'or',
			'value' => array(
				array(
					'type'  => 'array',
					'value' => array(
						'type' => 'string',
					),
				),
				array(
					'type' => 'literal_value(array)',
				),
			),
		);

		$this->assertSame( $expect_array_group_fallback, $array_group_fallback->schema() );
		$this->assertSame( wp_json_encode( $expect_array_group_fallback ), wp_json_encode( $array_group_fallback ) );

		// Fallback on Array of Arrays
		$array_group_fallback = Schema::as_array(
			Schema::as_array(
				Schema::as_string()
			)
		)->fallback( array( array( 'fallback' ) ) );

		$expect_array_group_fallback = array(
			'type'  => 'or',
			'value' => array(
				array(
					'type'  => 'array',
					'value' => array(
						'type'  => 'array',
						'value' => array(
							'type' => 'string',
						),
					),
				),
				array(
					'type' => 'literal_value(array)',
				),
			),
		);

		$this->assertSame( $expect_array_group_fallback, $array_group_fallback->schema() );
		$this->assertSame( wp_json_encode( $expect_array_group_fallback ), wp_json_encode( $array_group_fallback ) );
	}
}
