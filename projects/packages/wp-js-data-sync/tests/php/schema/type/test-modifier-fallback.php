<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Test_Modifier_Fallback extends TestCase {

	public function test_parse_with_first_parser() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->assertSame( 'test', $schema->parse( 'test' ) );
	}

	public function test_parse_with_second_parser() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->assertSame( array( '123' ), $schema->parse( array( '123' ) ) );
	}

	public function test_parse_failure() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->expectException( Schema_Error::class );
		$schema->parse( null );
	}

	public function test_parse_with_empty_string() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->assertSame( '', $schema->parse( '' ) );
	}

	public function test_parse_with_valid_array() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->assertSame( array( 'test1', 'test2' ), $schema->parse( array( 'test1', 'test2' ) ) );
	}

	public function test_parse_with_invalid_array() {
		$schema = Schema::either( Schema::as_string(), Schema::as_array( Schema::as_string() ) );
		$this->expectException( Schema_Error::class );
		$schema->parse( array( 'test', null ) );
	}

	public function test_parse_invalid_boolean() {
		$schema = Schema::either( Schema::as_boolean(), Schema::as_array( Schema::as_boolean() ) );
		$this->assertSame( true, $schema->parse( true ) );
		$this->assertSame( array( true, true, true ), $schema->parse( array( true, 1, '1' ) ) );
		$this->assertSame( false, $schema->parse( false ) );
		$this->assertSame( array( false, false, false ), $schema->parse( array( false, 0, '0' ) ) );
		$this->expectException( Schema_Error::class );
		$schema->parse( 99 );
	}

	public function test_parse_invalid_array_of_booleans() {
		$schema = Schema::either( Schema::as_boolean(), Schema::as_array( Schema::as_boolean() ) );
		$this->expectException( Schema_Error::class );
		$schema->parse( array( true, false, 99 ) );
	}
}
