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
 *
 * @backupStaticAttributes enabled
 */
class Test_Modules extends TestCase {

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function setUp(): void { //phpcs:ignore PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.voidFound
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'is_multisite' )->justReturn( false );
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tearDown(): void { //phpcs:ignore PHPCompatibility.FunctionDeclarations.NewReturnTypeDeclarations.voidFound
		parent::tearDown();

		$container = \Mockery::getContainer();
		if ( $container ) {
			$this->addToAssertionCount(
				$container->mockery_getExpectationCount()
			);
		}

		Monkey\tearDown();
		\Mockery::close();
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
	 */
	public function test_garbage_input( $enforced, $filtered ) {
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
		Functions\when( 'get_option' )->justReturn( array() );
		Functions\when( 'update_option' )->justReturn( true );

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

		$modules2 = new Modules();
		$modules2->enforce( array( 'infinite-scroll' ) );

		$this->assertEquals(
			array_merge( $result, array( 'infinite-scroll' ) ),
			$modules->filter_active_modules( $filtered )
		);
	}

	/**
	 * Testing the option handling.
	 *
	 * @dataProvider provider_unfiltered_module_arrays
	 * @param Array $enforced Enforced module list to be passed as an argument.
	 */
	public function test_module_enforcement_adds_option( $enforced ) {
		$modules = new Modules();

		Functions\when( 'get_option' )->justReturn( array() );
		Functions\expect( 'update_option' )
			->once()
			->with( 'jetpack_active_modules_enforced', $enforced, true );

		$modules->enforce( $enforced );
	}

	/**
	 * Testing the option handling.
	 *
	 * @dataProvider provider_unfiltered_module_arrays
	 * @param Array $enforced Enforced module list to be passed as an argument.
	 */
	public function test_module_enforcement_combines_with_existing_option_value( $enforced ) {
		$modules  = new Modules();
		$existing = array( 'infinite-scroll' );
		$result   = array_merge( $existing, $enforced );

		Functions\when( 'get_option' )->justReturn( $existing );
		Functions\expect( 'update_option' )
			->once()
			->with( 'jetpack_active_modules_enforced', $result, true );

		$modules->enforce( $enforced );
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
				array( 'publicize', 'sharing', 'stats' ),
				array( 'monitor' ),
				array( 'monitor', 'publicize', 'sharing', 'stats' ),
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
