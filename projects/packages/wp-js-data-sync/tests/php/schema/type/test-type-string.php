<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;
use PHPUnit\Framework\TestCase;

class Test_Type_String extends TestCase {

	public function test_validate_with_valid_data() {
		$validator = new Type_String();
		$this->assertTrue( $validator->validate( 'hello world' ) );
	}

	public function test_validate_with_invalid_data() {
		$validator = new Type_String();
		$this->assertFalse( $validator->validate( 123 ) );
	}

	public function test_sanitize_with_valid_data() {
		$validator = new Type_String();
		$this->assertSame( 'hello world', $validator->sanitize( 'hello world' ) );
	}

	public function test_sanitize_with_invalid_data() {
		$validator = new Type_String();
		$this->assertSame( '', $validator->sanitize( 123 ) );
	}

}
