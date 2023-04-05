<?php

use Automattic\Jetpack\VideoPress\Data;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Option;
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

	/**
	 * Check that a failure in a child schema uses the parent schema's fallback.
	 */
	public function test_parent_fallback() {
		$test_schema = Schema::as_assoc_array(
			array(
				'child' => Schema::as_string(),
			)
		)->fallback(
			array(
				'child' => 'default_value',
			)
		);

		// Test with a valid value.
		$parsed = $test_schema->parse( array( 'child' => 'test_value' ) );
		$this->assertSame( 'test_value', $parsed['child'] );

		// Test with an invald value.
		$parsed = $test_schema->parse( array( 'child' => null ) );
		$this->assertSame( 'default_value', $parsed['child'] );
	}

	/**
	 * Boolean values in WordPress get_option are tricky.
	 * They can return boolean values, or strings that represent boolean values.
	 * But the default value is `false`.
	 *
	 * This makes it challenging to use a fallback value of `true`.
	 */
	public function test_boolean_fallback() {
		$true  = Schema::as_boolean()->fallback( true );
		$false = Schema::as_boolean()->fallback( false );

		$parsed = $true->parse( true );
		$this->assertSame( true, $parsed );

		$parsed = $true->parse( '1' );
		$this->assertSame( true, $parsed );

		$parsed = $true->parse( 1 );
		$this->assertSame( true, $parsed );


		// Values shouldn't fallback if they're falsy
		$parsed = $true->parse( false );
		$this->assertSame( false, $parsed );

		$parsed = $true->parse( '0' );
		$this->assertSame( false, $parsed );

		$parsed = $true->parse( 0 );
		$this->assertSame( false, $parsed );

		$parsed = $true->parse( '' );
		$this->assertSame( false, $parsed );
	}

	public function test_wordpress_option_fallback_true() {
		$key = 'test_wp_booleans';
		// Ensure the option doesn't exist before we start.
		delete_option( $key );
		$this->assertSame( false, get_option( $key ) );

		$schema = Schema::as_boolean()->fallback( true );
		$entry = new Data_Sync_Entry( new Data_Sync_Option( $key ), $schema );

		// Test with a valid value
		$this->assertSame( true, $entry->set( true ) );
		$this->assertSame( true, $entry->set( 1 ) );
		$this->assertSame( true, $entry->set( '1' ) );
		$this->assertSame( false, $entry->set( false ) );
		$this->assertSame( false, $entry->set( '' ) );
		$this->assertSame( false, $entry->set( '0' ) );
		$this->assertSame( false, $entry->set( 0 ) );

		// Entry should default to true
		// because the fallback is set.
		$entry->delete();
		$this->assertSame( true, $entry->get() );
	}

	public function test_wordpress_option_no_fallback() {
		$key = 'test_wp_booleans';
		// Ensure the option doesn't exist before we start.
		delete_option( $key );
		$this->assertSame( false, get_option( $key ) );

		$schema = Schema::as_boolean();
		$entry = new Data_Sync_Entry( new Data_Sync_Option( $key ), $schema );

		// Test with a valid values
		$this->assertSame( true, $entry->set( true ) );
		$this->assertSame( true, $entry->set( 1 ) );
		$this->assertSame( true, $entry->set( '1' ) );
		$this->assertSame( false, $entry->set( false ) );
		$this->assertSame( false, $entry->set( '' ) );
		$this->assertSame( false, $entry->set( '0' ) );
		$this->assertSame( false, $entry->set( 0 ) );

		// Entry should default to false
		// because the fallback is not set.
		$entry->delete();
		$this->assertSame( false, $entry->get() );

	}
}
