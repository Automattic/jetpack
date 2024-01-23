<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Context;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use PHPUnit\Framework\TestCase;

class Test_Integration_Parsing_Errors extends TestCase {

	/**
	 * This unit test has internal methods defined for array creation - test them first.
	 */
	public function test_parsing_errors_array_creation() {
		$valid_data = $this->get_assoc_data( 'hello world', 2 );
		$data       = array(
			'level_1' => array(
				'level_2' => 'hello world',
			),
		);
		$this->assertEquals( $data, $valid_data );
		$manual_schema    = Schema::as_assoc_array(
			array(
				'level_1' => Schema::as_assoc_array(
					array(
						'level_2' => Schema::as_string(),
					)
				),
			)
		);
		$generated_schema = $this->get_assoc_schema( Schema::as_string(), 2 );
		$this->assertEquals( $manual_schema->parse( $data ), $generated_schema->parse( $data ) );
	}

	public function test_parsing_errors_meta_data() {
		$schema       = $this->get_assoc_schema( Schema::as_boolean(), 3 );
		$invalid_data = $this->get_assoc_data( 'hello world', 3, 1 );
		$schema->set_context( new Schema_Context( 'test-levels' ) );
		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Error was not thrown' );
		} catch ( Schema_Error $e ) {

			$this->assertEquals( 'test-levels.level_1.level_2.level_3', $e->get_context()->get_path() );
			$this->assertEquals( 'hello world', $e->get_value() );
			$this->assertEquals( $invalid_data, $e->get_context()->get_data() );

		} catch ( Exception $e ) {
			$this->fail( 'Expected Schema_Error was not thrown' );
		}
	}

	public function test_parsing_errors_meta_has_known_meta() {
		// Expect 3 level schema.
		$schema = $this->get_assoc_schema( Schema::as_string(), 3 );
		// Generate only 2 levels of data.
		$invalid_data = $this->get_assoc_data( 'hello world', 2 );

		// Set meta to a known value
		$schema->set_context( new Schema_Context( 'known-meta' ) );

		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Error was not thrown' );
		} catch ( Schema_Error $e ) {
			$this->assertEquals( 'known-meta', $e->get_context()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Error", but received ' . get_class( $e ) );
		}
	}

	public function test_parsing_errors_meta_has_late_known_meta() {
		// Expect 3 level schema.
		$schema = $this->get_assoc_schema( Schema::as_string(), 3 );
		// Generate only 2 levels of data.
		$invalid_data = $this->get_assoc_data( 'hello world', 2 );

		// We're going to run validation twice.
		// First, without giving a meta and expect "unknown"
		// Second, with giving a meta and expect "known-meta"

		// First run.
		// Expect "unknown"
		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Error was not thrown' );
		} catch ( Schema_Error $e ) {
			$this->assertEquals( 'unknown', $e->get_context()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Error", but received ' . get_class( $e ) );
		}

		// Second run.
		// Expect "known-meta"
		try {
			$schema->set_context( new Schema_Context( 'known-meta' ) );
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Error was not thrown' );
		} catch ( Schema_Error $e ) {
			$this->assertEquals( 'known-meta', $e->get_context()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Error", but received ' . get_class( $e ) );
		}
	}

	/**
	 * Creates a schema for an associative array with nested levels.
	 *
	 * @param Parser $schema The schema to use for the last level
	 * @param int    $levels The depth of nesting in the associative array.
	 *                       Defaults to 3.
	 * @param int    $i      The current level of nesting. Defaults to 1.
	 */
	private function get_assoc_schema( $schema, $levels = 3, $i = 1 ) {
		if ( $i > $levels ) {
			return $schema;
		}

		return Schema::as_assoc_array(
			array(
				'level_' . $i => $this->get_assoc_schema( $schema, $levels, $i + 1 ),
			)
		);
	}

	/**
	 * Creates an associative array with nested levels containing 'hello world' string.
	 *
	 * @param int $levels The depth of nesting in the associative array.
	 *
	 * @return array The associative array with data.
	 */
	private function get_assoc_data( $data, $levels = 3, $i = 1 ) {
		if ( $i > $levels ) {
			return $data;
		}
		return array(
			'level_' . $i => $this->get_assoc_data( $data, $levels, $i + 1 ),
		);
	}
}
