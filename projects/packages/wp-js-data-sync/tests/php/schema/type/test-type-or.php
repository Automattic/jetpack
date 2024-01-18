<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use PHPUnit\Framework\TestCase;

class Test_Type_Or extends TestCase {

	public function test_parse_with_first_parser() {
		$schema = Schema::as_string()->or( Schema::as_array( Schema::as_string() ) );
		$this->assertSame( 'test', $schema->parse( 'test' ) );
	}

	public function test_parse_with_second_parser() {
		$schema = Schema::as_string()->or( Schema::as_array( Schema::as_string() ) );
		$this->assertSame( array( '123' ), $schema->parse( array( '123' ) ) );
	}

	public function test_parse_failure() {
		$schema = Schema::as_string()->or( Schema::as_array( Schema::as_string() ) );
		$this->expectException( Schema_Parsing_Error::class );
		$schema->parse( null );
	}

	
}
