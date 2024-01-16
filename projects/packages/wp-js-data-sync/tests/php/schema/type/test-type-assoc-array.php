<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use PHPUnit\Framework\TestCase;

class Type_Assoc_Array_Test extends TestCase {
	public function test_valid_assoc_array() {
		$assoc_schema = Schema::as_assoc_array(
			array(
				'key1' => Schema::as_string(),
				'key2' => Schema::as_number(),
			)
		);

		$valid_assoc_array = array(
			'key1' => 'test',
			'key2' => 42,
		);

		$this->assertEquals( $valid_assoc_array, $assoc_schema->parse( $valid_assoc_array ) );

		$valid_assoc_array_casted = array(
			'key1' => 'test',
			'key2' => '42',
		);
		$this->assertEquals( $valid_assoc_array, $assoc_schema->parse( $valid_assoc_array_casted ) );
	}

	public function throw_exceptions_on_failure() {
		$assoc_schema = Schema::as_assoc_array();

		// This should throw an exception on failure
		$this->expectException( Schema_Parsing_Error::class );
		$assoc_schema->parse( 'not_an_array' );
	}
}
