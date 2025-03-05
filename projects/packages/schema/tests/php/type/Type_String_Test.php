<?php

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Type_String_Test extends TestCase {

	public function simple_strings() {
		$validator = Schema::as_string();
		$this->assertSame( 'hello world', $validator->parse( 'hello world' ) );
	}

	public function cast_to_string() {
		$validator = Schema::as_string();
		$this->assertSame( '123', $validator->parse( 123 ) );
		$this->assertSame( '1.23', $validator->parse( 1.23 ) );
		$this->assertSame( '1', $validator->parse( true ) );
		$this->assertSame( '', $validator->parse( false ) );
	}

	public function test_fail_sanitize_array() {
		$validator = Schema::as_string();
		$this->expectException( Schema_Error::class );
		$validator->parse( array() );
	}
}
