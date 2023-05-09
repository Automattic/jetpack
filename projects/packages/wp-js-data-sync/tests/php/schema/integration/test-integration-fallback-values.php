<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Adapter;
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
		$true = Schema::as_boolean()->fallback( true );

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
		$entry  = new Data_Sync_Entry_Adapter( new Data_Sync_Option( $key ), $schema );

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
		$entry  = new Data_Sync_Entry_Adapter( new Data_Sync_Option( $key ), $schema );

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

	public function test_nested_fallbacks() {

		// This is what the full fallback array should look like
		$schema_fallback = array(
			'one'          => 1,
			'array_of_two' => array( 2 ),
		);

		$schema = Schema::as_assoc_array(
			array(
				'one'          => Schema::as_number()->fallback( 1 ),
				'array_of_two' => Schema::as_array( Schema::as_number() )->fallback( array( 2 ) ),
			)
		);

		$valid_array = array(
			'one'          => 100,
			'array_of_two' => array( 200 ),
		);

		$this->assertSame( $valid_array, $schema->parse( $valid_array ) );

		// If the values are empty, fallback is going to work
		$invalid_array = array(
			'one'          => null,
			'array_of_two' => null,
		);
		$this->assertSame( $schema_fallback, $schema->parse( $invalid_array ) );

		// Passing an empty array also works
		$this->assertSame( $schema_fallback, $schema->parse( array() ) );

		// Passing a partial array also works
		$partial_array = array(
			'one' => 100,
		);
		$this->assertSame( array_merge( $schema_fallback, $partial_array ), $schema->parse( $partial_array ) );

		// But passing a non-array value will not work
		// Because the parent schema has no fallback, this will fail.
		try {
			$schema->parse( null );
			// If the exception is not thrown, fail the test
			$this->fail( 'Expected \Error exception was not thrown' );
		} catch ( \Error $e ) {
			// If the exception is thrown, assert that it's the expected exception
			$this->assertInstanceOf( \Error::class, $e );
		}

		// -------
		// -------
		// ------- This should be improved -------
		// -------
		// -------

		// So if the parent schema has no specific fallback defined,
		// it will fall back to an empty array
		$schema_with_parent_fallback = $schema->fallback( array() )->parse( null );
		$this->assertSame( array(), $schema_with_parent_fallback );

		// So right now, to fallback to a full-value when the parent schema parsing fails
		// you have to do this:
		$schema_with_top_level_defaults = $schema->fallback( $schema_fallback )->parse( null );
		$this->assertSame( $schema_fallback, $schema_with_top_level_defaults );

		// -------
		// -------
		// ------- Incorrect Tests Below -------
		// -------
		// -------
		// @TODO: This should actually fail, but it works right now.
		$partial_schema = Schema::as_array( Schema::as_string() )->fallback( $schema_fallback );
		$this->assertSame( $schema_fallback, $partial_schema->parse( null ) );

		$incorrect_schema = Schema::as_string()->fallback( $schema_fallback );
		$this->assertSame( $schema_fallback, $incorrect_schema->parse( null ) );
	}
}
