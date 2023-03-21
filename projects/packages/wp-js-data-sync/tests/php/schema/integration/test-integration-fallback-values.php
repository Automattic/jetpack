<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use PHPUnit\Framework\TestCase;

class Test_Integration_Fallback_Values extends TestCase {
	public function test_fallback() {
		$string = Schema::as_string()->fallback( 'default_value' );

		// Test with a valid value
		$parsed = $string->parse( 'test_value' );
		$this->assertSame( 'test_value', $parsed );

		// Test with an invalid value
		$parsed = $string->parse( null );
		$this->assertSame( 'default_value', $parsed );
	}

	public function test_nullable() {
		$string = Schema::as_string()->nullable();

		// Test with a valid value
		$parsed = $string->parse( 'test_value' );
		$this->assertSame( 'test_value', $parsed );

		// Test with a null value
		$parsed = $string->parse( null );
		$this->assertNull( $parsed );
	}
}
