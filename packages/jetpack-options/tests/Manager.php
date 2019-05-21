<?php

use WP_Mock\Tools\TestCase;
use Jetpack\V7\Options\Manager;

class ManagerTest extends TestCase {
	public function setUp(): void {
		\WP_Mock::setUp();

		$this->manager = new Manager_Test();
	}

	function test_delete_non_compact_option_returns_true_when_successfully_deleted() {
		\WP_Mock::userFunction( 'get_option', array(
			'times' => 1,
			'args' => array( 'jetpack_options', array() ),
			'return' => array(),
		) );
		\WP_Mock::userFunction( 'get_option', array(
			'times' => 1,
			'args' => array( 'jetpack_private_options', array() ),
			'return' => array(),
		) );
		\WP_Mock::userFunction( 'delete_option', array(
			'times' => 1,
			'args' => array( 'jetpack_uncompact_option_name' ),
			'return' => true,
		) );
		\WP_Mock::userFunction( 'is_multisite', array(
			'times' => 1,
			'args' => array(),
			'return' => false,
		) );

		$deleted = $this->manager->delete_option( 'uncompact_option_name' );

		// Did Jetpack_Options::delete_option() properly return true?
		$this->assertTrue( $deleted );
	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
	}
}

class Manager_Test extends Manager {

	/**
	 * Returns an array of option names for a given type.
	 *
	 * @param string $type The type of option to return. Defaults to 'compact'.
	 *
	 * @return array
	 */
	public function get_option_names( $type = 'compact' ) {
		switch ( $type ) {
		case 'non-compact' :
		case 'non_compact' :
			return array(
				'uncompact_option_name',
			);

		case 'private' :
			return array();

		case 'network' :
			return array();
		}

		return array(
			'id'
		);
	}
}
