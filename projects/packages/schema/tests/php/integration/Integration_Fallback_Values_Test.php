<?php

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Schema\Schema_Context;
use Automattic\Jetpack\Schema\Schema_Error;
use Automattic\Jetpack\Schema\Utils;
use PHPUnit\Framework\TestCase;

class Integration_Fallback_Values_Test extends TestCase {

	public function test_fallback() {
		$string = Schema::as_string()->fallback( 'default_value' );

		// Test with a valid value
		$parsed = $string->parse( 'test_value' );
		$this->assertSame( 'test_value', $parsed );

		// Test with an invalid value
		$parsed = $string->parse( null );
		$this->assertSame( 'default_value', $parsed );
		$this->assertSame( 'default_value', $string->get_fallback() );
	}

	public function test_context_on_fallback() {
		$context = new Schema_Context( 'custom_name' );
		$schema  = Schema::as_string();
		$schema->set_context( $context );

		// I've set the meta for the schema.
		// I expect this same meta to be thrown in the exception.
		try {
			$schema->parse( null );
		} catch ( Schema_Error $e ) {
			$this->assertSame( 'custom_name', $e->get_context()->get_name() );
		}

		// I've set the meta for the schema.
		// I expect this same meta to be thrown in the exception.
		// I also expect that parsing null with an invalid fallback is going to throw an error.
		try {
			Utils::set_mode( 'debug' );
			$schema->fallback( array( 'Invalid Fallback' ) )->parse( null );
			$this->fail( 'Expected "Schema_Error" exception, but no expection was thrown.' );
		} catch ( Schema_Error $e ) {
			$this->assertSame( 'custom_name', $e->get_context()->get_name() );
		} finally {
			Utils::set_mode( null );
		}
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

		$expected_result = array(
			'child' => 'default_value',
		);
		$test_schema     = Schema::as_assoc_array(
			array(
				'child' => Schema::as_string(),
			)
		)->fallback( $expected_result );

		// Test with an invald value.
		$parsed = $test_schema->parse( array( 'child' => null ) );
		$this->assertSame( $expected_result, $parsed );
		$this->assertSame( $expected_result, $test_schema->get_fallback() );
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
		$this->assertSame( true, $true->get_fallback() );

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

	private function get_schema_no_fallbacks() {
		return Schema::as_assoc_array(
			array(
				'one'          => Schema::as_number(),
				'array_of_two' => Schema::as_array( Schema::as_number() ),
			)
		);
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

		$schema_no_fallbacks = $this->get_schema_no_fallbacks();

		$valid_array = array(
			'one'          => 100,
			'array_of_two' => array( 200 ),
		);
		$this->assertSame( $valid_array, $schema->parse( $valid_array ) );
		$this->assertSame( $valid_array, $schema_no_fallbacks->parse( $valid_array ) );

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
			$this->fail( 'Expected \Schema_Error exception was not thrown' );
		} catch ( Schema_Error $e ) {
			// If the exception is thrown, assert that it's the expected exception
			$this->assertInstanceOf( Schema_Error::class, $e );
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

		// This looks valid code and will not break in production.
		// However, an empty array does not match $schema_no_fallbacks as a fallback.
		// It should have a fallback of `null` instead.
		if ( Utils::is_debug() ) {
			// We're expecting an exception because $schema_empty_array defines an incorrect fallback shape.
			// This throws an error in debug mode.
			$this->expectException( Schema_Error::class );
		}

		$schema_empty_array = $this->get_schema_no_fallbacks()->fallback( array() )->parse( array() );
		$this->assertSame( array(), $schema_empty_array );

		// So right now, to fallback to a full-value when the parent schema parsing fails
		// you have to do this:
		$schema_with_top_level_defaults = Schema::as_assoc_array(
			array(
				'one'          => Schema::as_number()->fallback( 999999 ),
				'array_of_two' => Schema::as_array( Schema::as_number() )->fallback( array( 999999 ) ),
			)
		)->fallback( $schema_fallback )->parse( null );
		$this->assertSame( $schema_fallback, $schema_with_top_level_defaults );

		// But keep in mind that parsing an array will work trigger the keys to use their fallbacks
		$schema_with_top_level_defaults = Schema::as_assoc_array(
			array(
				'one'          => Schema::as_number()->fallback( 999999 ),
				'array_of_two' => Schema::as_array( Schema::as_number() )->fallback( array( 999999 ) ),
			)
		)->fallback( $schema_fallback )->parse( array() );
		$this->assertSame(
			array(
				'one'          => 999999,
				'array_of_two' => array( 999999 ),
			),
			$schema_with_top_level_defaults
		);

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

		$this->expectException( Schema_Error::class );
		$this->get_schema_no_fallbacks()->parse( $invalid_array );
	}

	/**
	 * This test describes a bug that was discovered during the refactor here:
	 * https://github.com/Automattic/jetpack/pull/35062
	 * Fallbacks disappeared when parsing a nested assoc array,
	 * but only if `BUG` key is missing and nullable.
	 * `SAFE` key is nullable, but the tests passed even if it's missing.
	 *
	 * @return void
	 */
	public function test_fallbacks_dont_disappear() {
		$data = array(
			'url'  => 'ONE',
			'SAFE' => 'ONE',
			'meta' => array(
				'status' => 'ONE',
			),
		);

		$schema = Schema::as_assoc_array(
			array(
				'url'  => Schema::as_string(),
				'SAFE' => Schema::as_string()->nullable(),
				'meta' => Schema::as_assoc_array(
					array(
						'status' => Schema::as_string(),
					)
				)->nullable(),
				'BUG'  => Schema::as_string()->nullable(),
			)
		)->fallback( array() );

		$this->assertSame( $data, $schema->parse( $data ) );
		unset( $data['SAFE'] );
		$this->assertSame( $data, $schema->parse( $data ) );
	}

	public function test_debug_mode_fallbacks() {
		Utils::set_mode( 'debug' );
		$this->test_fallback();
		$this->test_nullable();
		$this->test_parent_fallback();
		$this->test_boolean_fallback();
		$this->test_nested_fallbacks();
		$this->test_fallbacks_dont_disappear();
		Utils::set_mode( null );
	}

	public function test_debug_mode_invalid_fallback_string() {

		// Define an incorrect Schema
		Utils::set_mode( null );
		$schema = Schema::as_string()->fallback( null );
		$this->assertSame( null, $schema->parse( null ) );

		// In debug mode, defining an incorrect schema will throw an exception
		Utils::set_mode( 'debug' );
		$this->expectException( Schema_Error::class );
		Schema::as_string()->fallback( null );
		Utils::set_mode( null );
	}

	public function test_debug_mode_invalid_fallback_assoc_array() {

		// Define an incorrect Schema
		Utils::set_mode( null );
		$schema = Schema::as_assoc_array(
			array(
				'one' => Schema::as_string(),
			)
		)->fallback( null );
		$this->assertSame( null, $schema->parse( null ) );

		// In debug mode, defining an incorrect schema will throw an exception
		Utils::set_mode( 'debug' );
		// @TODO: No internal exceptions!
		$this->expectException( Schema_Error::class );
		Schema::as_assoc_array(
			array(
				'one' => Schema::as_string(),
			)
		)->fallback( null );
		Utils::set_mode( null );
	}

	public function test_debug_mode_nullable_works_on_assoc_arrays() {
		Utils::set_mode( 'debug' );
		$schema = Schema::as_assoc_array(
			array(
				'one' => Schema::as_string()->nullable(),
			)
		)->nullable();
		$this->assertSame( null, $schema->parse( null ) );
		Utils::set_mode( null );
	}
}
