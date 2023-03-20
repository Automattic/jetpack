<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use PHPUnit\Framework\TestCase;

class Test_Type_Number extends TestCase {

	public function test_validate_ok() {
		$validator = new Type_Number();
		$this->assertTrue( $validator->validate( 123 ) );
	}

	public function test_validate_failure() {
		$validator = new Type_Number();
		$this->assertFalse( $validator->validate( 'hello world' ) );
	}

	public function test_sanitize_ok() {
		$validator = new Type_Number();
		$this->assertSame( 123, $validator->sanitize( '123' ) );
	}

	public function test_sanitize_failure() {
		$validator = new Type_Number();
		$this->assertNull( $validator->sanitize( 'hello world' ) );
	}

	public function test_sanitize_zero() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->sanitize( 0 ) );
	}

	public function test_sanitize_zero_string() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->sanitize( '0' ) );
	}

	public function test_ok_sanitize_false() {
		$validator = new Type_Number();
		$this->assertNull( $validator->sanitize( false ) );
	}

}
