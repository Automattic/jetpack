<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use PHPUnit\Framework\TestCase;

class Test_Type_Number extends TestCase {

	public function testValidateWithValidData() {
		$validator = new Type_Number();
		$this->assertTrue( $validator->validate( 123 ) );
	}

	public function testValidateWithInvalidData() {
		$validator = new Type_Number();
		$this->assertFalse( $validator->validate( 'hello world' ) );
	}

	public function testSanitizeWithValidData() {
		$validator = new Type_Number();
		$this->assertSame( 123, $validator->sanitize( '123' ) );
	}

	public function testSanitizeWithInvalidData() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->sanitize( 'hello world' ) );
	}

	public function testSanitizeWithZero() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->sanitize( 0 ) );
	}

	public function testSanitizeWithFalse() {
		$validator = new Type_Number();
		$this->assertSame( 0, $validator->sanitize( false ) );
	}

}
