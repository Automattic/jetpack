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

	function test_delete_private_option_returns_true_when_successfully_deleted() {
		\WP_Mock::userFunction( 'get_option', array(
			'times' => 1,
			'args' => array( 'jetpack_options', array() ),
			'return' => array(),
		) );
		\WP_Mock::userFunction( 'get_option', array(
			'times' => 1,
			'args' => array( 'jetpack_private_options', array() ),
			'return' => array( 'private_name' => false ),
		) );
		\WP_Mock::userFunction( 'update_option', array(
			'times' => 1,
			'args' => array( 'jetpack_private_options', array() ),
			'return' => true,
		) );

		$deleted = $this->manager->delete_option( 'private_name' );

		// Did Jetpack_Options::delete_option() properly return true?
		$this->assertTrue( $deleted );
	}

	function test_update_non_compact_option_returns_true_when_successfully_updated() {
		\WP_Mock::expectAction(
			'pre_update_jetpack_option_uncompact_option_name',
			'uncompact_option_name',
			true
		);

		\WP_Mock::userFunction( 'update_option', array(
			'times' => 1,
			'args' => array( 'jetpack_uncompact_option_name', true, NULL ),
			'return' => true,
		) );
		\WP_Mock::userFunction( 'is_multisite', array(
			'times' => 1,
			'args' => array(),
			'return' => false,
		) );

		$updated = $this->manager->update_option( 'uncompact_option_name', true );

		// Did Jetpack_Options::delete_option() properly return true?
		$this->assertTrue( $updated );
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
			return array(
				'private_name'
			);

		case 'network' :
			return array();
		}

		return array(
			'id'
		);
	}
}
