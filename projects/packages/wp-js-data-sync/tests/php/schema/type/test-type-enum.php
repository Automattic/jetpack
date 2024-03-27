<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Test_Type_Enum extends TestCase {

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
