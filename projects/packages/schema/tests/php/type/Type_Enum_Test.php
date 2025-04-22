<?php

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Type_Enum_Test extends TestCase {

	public function test_parse_valid_enum() {
		$validator = Schema::enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertSame( 'foo', $validator->parse( 'foo' ) );
	}

	public function test_parse_invalid_enum() {
		$validator = Schema::enum( array( 'foo', 'bar', 'baz' ) );
		$this->expectException( Schema_Error::class );
		$validator->parse( 'invalid' );
	}
}
