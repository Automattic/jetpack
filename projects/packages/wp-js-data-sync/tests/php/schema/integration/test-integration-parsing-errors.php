<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Meta;
use PHPUnit\Framework\TestCase;

class Test_Integration_Errors extends TestCase {



	/**
	 * Tests the schema generation and data validation methods.
	 */
	public function test_parsing_errors_array_creation() {
		$valid_data = $this->get_valid_assoc_data( 'hello world', 2 );
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
		$generated_schema = $this->get_assoc_schema( 2 );
		$this->assertEquals( $manual_schema->parse( $data ), $generated_schema->parse( $data ) );

	}


	public function test_parsing_errors_meta_has_known_meta() {
		$schema = $this->get_assoc_schema(3);
		$schema->set_meta( new Schema_Validation_Meta( 'known-meta' ) );
		$invalid_data = array(
			'level_1' => array(
				'level_2' => 'whoopsy daisy!',
			),
		);

		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		} catch ( Schema_Parsing_Error $e ) {
			$this->assertEquals( 'known-meta', $e->get_meta()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Parsing_Error", but received ' . get_class( $e ) );
		}
	}

	public function test_parsing_errors_meta_has_late_known_meta() {
		$schema       = $this->get_assoc_schema();
		$invalid_data = array(
			'key' => array(),
		);

		// We're going to run validation twice.
		// First, without giving a meta and expect "unknown"
		// Second, with giving a meta and expect "known-meta"

		// First run.
		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		} catch ( Schema_Parsing_Error $e ) {
			$this->assertEquals( 'unknown', $e->get_meta()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Parsing_Error", but received ' . get_class( $e ) );
		}

		// Second run.
		try {
			$schema->set_meta( new Schema_Validation_Meta( 'known-meta' ) );
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		} catch ( Schema_Parsing_Error $e ) {
			$this->assertEquals( 'known-meta', $e->get_meta()->get_name() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Parsing_Error", but received ' . get_class( $e ) );
		}
	}

	public function test_parsing_errors_schema_parsing_error() {
		$schema       = Schema::as_string();
		$invalid_data = array();
		$schema->set_meta( new Schema_Validation_Meta( 'unit-test' ) );

		try {
			$schema->parse( $invalid_data );
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		} catch ( Schema_Parsing_Error $e ) {
			$this->assertEquals( '', $e->get_meta()->get_path() );
			$this->assertEquals( 'Expected a string, received array', $e->getMessage() );
			$this->assertEquals( $invalid_data, $e->get_data() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected "Schema_Parsing_Error", but received ' . get_class( $e ) );
		}

	}


	public function test_parsing_errors_error_handling_for_nested_arrays() {
		$schema = Schema::as_assoc_array(
			array(
				'level1' => Schema::as_assoc_array(
					array(
						'level2' => Schema::as_assoc_array(
							array(
								'level3' => Schema::as_boolean(),
							)
						),
					)
				),
			)
		);

		$invalid_data = array(
			'level1' => array(
				'level2' => array(
					'level3' => 'string',
				),
			),
		);

		try {
			$schema->set_meta( new Schema_Validation_Meta( 'unittest' ) );
			$schema->parse( $invalid_data, new Schema_Validation_Meta( 'unittest' ) );
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		} catch ( Schema_Parsing_Error $e ) {
			$this->assertEquals( 'level1.level2.level3', $e->get_meta()->get_path() );
			$this->assertEquals( 'string', $e->get_data() );
		} catch ( Exception $e ) {
			$this->fail( 'Expected Schema_Validation_Error was not thrown' );
		}
	}

	/**
	 * Creates a schema for an associative array with nested levels.
	 *
	 * @param int $levels       The depth of nesting required in the schema.
	 * @param int $currentLevel The current level of depth (used for recursion).
	 *
	 * @return array The schema of the associative array.
	 */
	private function get_assoc_schema( $levels = 3, $currentLevel = 1 ) {
		if ( $currentLevel > $levels ) {
			return Schema::as_string();
		}

		return Schema::as_assoc_array(
			array(
				'level_' . $currentLevel => $this->get_assoc_schema( $levels, $currentLevel + 1 ),
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
	private function get_valid_assoc_data( $data, $levels = 3, $i = 1 ) {
		if ( $levels < $i ) {
			return $data;
		}
		return array(
			'level_' . $i => $this->get_valid_assoc_data( $data, $levels, $i + 1 ),
		);
	}

}
