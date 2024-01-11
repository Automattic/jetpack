<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use PHPUnit\Framework\TestCase;

class Test_Type_Enum extends TestCase {

	public function test_parse_valid_enum() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertSame( 'foo', $validator->parse( 'foo' ) );
	}

	public function test_parse_invalid_enum() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->expectException( \Error::class );
		$validator->parse( 'invalid' );
	}
}
