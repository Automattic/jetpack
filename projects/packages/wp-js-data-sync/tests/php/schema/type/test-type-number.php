<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Test_Type_Number extends TestCase {

	public function cast_strings_to_numbers() {
		$validator = Schema::as_number();
		$this->assertSame( 123, $validator->parse( '123' ) );
	}

	public function expect_errors_on_non_numeric_values() {
		$type = Schema::as_number();
		$this->expectException( Schema_Error::class );
		$type->parse( 'abc' );
	}

	public function test_parse_zero() {
		$validator = Schema::as_number();
		$this->assertSame( 0, $validator->parse( 0 ) );
	}

	public function test_parse_zero_string() {
		$validator = Schema::as_number();
		$this->assertSame( 0, $validator->parse( '0' ) );
	}

	public function test_parse_boolean() {
		$validator = Schema::as_number();
		$this->expectException( Schema_Error::class );
		$validator->parse( true );

		$this->expectException( Schema_Error::class );
		$validator->parse( false );
	}
}
