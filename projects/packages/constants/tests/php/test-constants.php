<?php
/**
 * Tests the Contacts package.
 *
 * @package automattic/jetpack-constants
 */

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Filters;
use PHPUnit\Framework\TestCase;

/**
 * Class Test_Constants
 */
class Test_Constants extends TestCase {
	/**
	 * Sets up the test.
	 *
	 * @before
	 */
	public function set_up() {
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '7.5' );
		}
		Monkey\setUp();
	}

	/**
	 * Tears down the test.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		Constants::$set_constants = array();
	}

	/**
	 * Tests when a constant is defined via class.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_is_defined_when_constant_set_via_class() {
		Constants::set_constant( 'TEST', 'hello' );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	/**
	 * Tests when a constant is not set.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_is_defined_false_when_constant_not_set() {
		$this->assertFalse( Constants::is_defined( 'UNDEFINED' ) );
	}

	/**
	 * Tests when a constant is defined as true.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_is_defined_true_when_set_with_define() {
		$this->assertTrue( Constants::is_defined( 'JETPACK__VERSION' ) );
	}

	/**
	 * Tests when a constant is defined as null.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_is_defined_when_constant_set_to_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	/**
	 * Tests when a constant defaults to a constant.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_default_to_constant() {
		Filters\expectApplied( 'jetpack_constant_default_value' )->never();

		$actual_output = Constants::get_constant( 'JETPACK__VERSION' );

		$this->assertEquals( JETPACK__VERSION, $actual_output );
	}

	/**
	 * Tests that null is returned when a constant is not set.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_get_constant_null_when_not_set() {
		$test_constant_name = 'UNDEFINED';

		Filters\expectApplied( 'jetpack_constant_default_value' )->once()->with( null, $test_constant_name );

		$actual_output = Constants::get_constant( $test_constant_name );

		$this->assertNull( $actual_output );
	}

	/**
	 * Tests that the class can override an existing constant.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_can_override_previously_defined_constant() {
		Filters\expectApplied( 'jetpack_constant_default_value' )->never();

		$test_version = '1.0.0';
		Constants::set_constant( 'JETPACK__VERSION', $test_version );

		$this->assertEquals( Constants::get_constant( 'JETPACK__VERSION' ), $test_version );
	}

	/**
	 * Tests that an override to null returns null.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_override_to_null_gets_null() {
		Filters\expectApplied( 'jetpack_constant_default_value' )->never();

		Constants::set_constant( 'JETPACK__VERSION', null );

		$this->assertNull( Constants::get_constant( 'JETPACK__VERSION' ) );
	}

	/**
	 * Tests that constant will use the filter value.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_get_constant_use_filter_value() {
		$test_constant_name  = 'TEST_CONSTANT';
		$test_constant_value = 'test value';

		Filters\expectApplied( 'jetpack_constant_default_value' )->once()->with( null, $test_constant_name )->andReturn( $test_constant_value );

		$actual_output = Constants::get_constant( $test_constant_name );

		$this->assertEquals( $test_constant_value, $actual_output );
	}

	/**
	 * Tests that a constant can add to an array.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_set_constants_adds_to_set_constants_array() {
		$key = 'TEST';
		Constants::set_constant( $key, '1' );
		$this->assertArrayHasKey( $key, Constants::$set_constants );
		$this->assertSame( '1', Constants::$set_constants[ $key ] );
	}

	/**
	 * Tests that all constants can be cleared.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_can_clear_all_constants() {
		Constants::set_constant( 'JETPACK__VERSION', '1.0.0' );
		Constants::clear_constants();
		$this->assertEmpty( Constants::$set_constants );
	}

	/**
	 * Tests that a single constant can be cleared.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_can_clear_single_constant() {
		Constants::set_constant( 'FIRST', '1' );
		Constants::set_constant( 'SECOND', '2' );

		$this->assertCount( 2, Constants::$set_constants );

		Constants::clear_single_constant( 'FIRST' );

		$this->assertCount( 1, Constants::$set_constants );
		$this->assertContains( 'SECOND', array_keys( Constants::$set_constants ) );
	}

	/**
	 * Tests that a single constant can be cleared with null.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_can_clear_single_constant_when_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertCount( 1, Constants::$set_constants );

		Constants::clear_single_constant( 'TEST' );

		$this->assertEmpty( Constants::$set_constants );
	}

	/**
	 * Tests is_true.
	 *
	 * @covers Automattic\Jetpack\Constants
	 */
	public function test_jetpack_constants_is_true_method() {
		$this->assertFalse( Constants::is_true( 'FOO' ), 'unset constant returns true' );
		Constants::set_constant( 'FOO', false );

		$this->assertFalse( Constants::is_true( 'FOO' ), 'false constant returns true' );
		Constants::set_constant( 'FOO', true );

		$this->assertTrue( Constants::is_true( 'FOO' ), 'true constant returns false' );
	}
}
