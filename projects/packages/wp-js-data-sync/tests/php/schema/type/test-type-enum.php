<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use PHPUnit\Framework\TestCase;

class Test_Type_Enum extends TestCase {

	public function test_validate_with_valid_data() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertTrue( $validator->validate( 'foo' ) );
	}

	public function test_validate_with_invalid_data() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertFalse( $validator->validate( 'qux' ) );
	}

	public function test_sanitize_with_valid_data() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertSame( 'foo', $validator->sanitize( 'foo' ) );
	}

	public function test_sanitize_with_invalid_data() {
		$validator = new Type_Enum( array( 'foo', 'bar', 'baz' ) );
		$this->assertSame( 'foo', $validator->sanitize( 'qux' ) );
	}

}
