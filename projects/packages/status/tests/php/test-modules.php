<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status\Modules methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 */
class Test_Modules extends TestCase {

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\when( 'is_multisite' )->justReturn( false );
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Tests that there are no enforced modules by default
	 */
	public function test_no_enforced_modules() {
		Functions\when( 'get_option' )->justReturn( array() );

		$enforced_modules = \Jetpack_Options::get_option( 'active_modules_enforced' );
		$this->assertEmpty( $enforced_modules );
	}

	/**
	 * Testing garbage input.
	 *
	 * @dataProvider provider_unfiltered_module_arrays
	 * @param Array $enforced Enforced module list.
	 * @param Array $filtered Module list to be filtered.
	 * @param Array $result   The list after being filtered.
	 */
	public function test_garbage_input( $enforced, $filtered, $result ) {
		$modules = new Modules();
		$modules->enforce( 'garbage' );

		// The filter should not change anything when garbage is passed
		$this->assertEquals(
			array_values( array_filter( $filtered ) ),
			$modules->filter_active_modules( $filtered )
		);

		$this->assertFalse(
			has_filter(
				'jetpack_active_modules',
				array( $modules, 'filter_active_modules' )
			)
		);
	}

	/**
	 * Testing the main filtering logic.
	 *
	 * @dataProvider provider_unfiltered_module_arrays
	 * @param Array $enforced Enforced module list.
	 * @param Array $filtered Module list to be filtered.
	 * @param Array $result   The list after being filtered.
	 */
	public function test_modules_get_enforced_by_filter( $enforced, $filtered, $result ) {
		$modules = new Modules();
		$modules->enforce( $enforced );

		$this->assertEquals(
			10,
			has_filter(
				'jetpack_active_modules',
				array( $modules, 'filter_active_modules' )
			)
		);

		$this->assertEquals(
			$result,
			$modules->filter_active_modules( $filtered )
		);
	}

	/**
	 * Provides three arguments:
	 * - the enforced array
	 * - the filtered array
	 * - the resulting array
	 * */
	public function provider_unfiltered_module_arrays() {
		return array(
			array(
				array( 'publicize' ),
				array( '' ),
				array( 'publicize' ),
			),
			array(
				array( 'publicize', 'sharing' ),
				array( '' ),
				array( 'publicize', 'sharing' ),
			),
			array(
				array( '' ),
				array( 'stats' ),
				array( 'stats' ),
			),
			array(
				array( 'sharing' ),
				array( 'publicize' ),
				array( 'publicize', 'sharing' ),
			),
		);
	}
}
