<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use PHPUnit\Framework\TestCase;

class Test_Type_Number extends TestCase {

	public function cast_strings_to_numbers() {
		$validator = new Type_Number();
		$this->assertSame( 123, $validator->parse( '123' ) );
	}

	public function expect_errors_on_non_numeric_values() {
		$type = new Type_Number();
		$this->expectException( \Error::class );
		$type->parse( 'abc' );
	}

	public function test_parse_zero() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->parse( 0 ) );
	}

	public function test_parse_zero_string() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->parse( '0' ) );
	}

	public function test_parse_boolean() {
		$validator = new Type_Number();
		$this->expectException( \Error::class );
		$validator->parse( true );

		$this->expectException( \Error::class );
		$validator->parse( false );
	}

}
