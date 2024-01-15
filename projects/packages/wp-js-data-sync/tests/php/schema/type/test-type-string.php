<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;
use PHPUnit\Framework\TestCase;

class Test_Type_String extends TestCase {

	public function simple_strings() {
		$validator = new Type_String();
		$this->assertSame( 'hello world', $validator->parse( 'hello world' ) );
	}

	public function cast_to_string() {
		$validator = new Type_String();
		$this->assertSame( '123', $validator->parse( 123 ) );
		$this->assertSame( '1.23', $validator->parse( 1.23 ) );
		$this->assertSame( '1', $validator->parse( true ) );
		$this->assertSame( '', $validator->parse( false ) );
	}

	public function test_fail_sanitize_array() {
		$validator = new Type_String();
		$this->expectException( \RuntimeException::class );
		$validator->parse( array() );
	}
}
