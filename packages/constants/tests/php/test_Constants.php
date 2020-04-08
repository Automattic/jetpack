<?php

use Automattic\Jetpack\Constants;
use phpmock\Mock;
use phpmock\spy\Spy;
use PHPUnit\Framework\TestCase;

class Test_Constants extends TestCase {
	public function setUp() {
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '7.5' );
		}

		$this->apply_filters_spy = new Spy(
			'Automattic\Jetpack',
			'apply_filters',
			function ( $filter_name, $value, $name ) {
				return $value;
			}
		);
	}

	public function tearDown() {
		parent::tearDown();
		Constants::$set_constants = array();
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Constants::is_defined
	 */
	function test_jetpack_constants_is_defined_when_constant_set_via_class() {
		Constants::set_constant( 'TEST', 'hello' );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::is_defined
	 */
	function test_jetpack_constants_is_defined_false_when_constant_not_set() {
		$this->assertFalse( Constants::is_defined( 'UNDEFINED' ) );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::is_defined
	 */
	function test_jetpack_constants_is_defined_true_when_set_with_define() {
		$this->assertTrue( Constants::is_defined( 'JETPACK__VERSION' ) );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::is_defined
	 */
	function test_jetpack_constants_is_defined_when_constant_set_to_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::get_constant
	 */
	function test_jetpack_constants_default_to_constant() {
		$this->apply_filters_spy->enable();
		$actual_output = Constants::get_constant( 'JETPACK__VERSION' );

		// apply_filters() should not have been called.
		$this->assertEquals( array(), $this->apply_filters_spy->getInvocations() );
		$this->assertEquals( JETPACK__VERSION, $actual_output );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::get_constant
	 */
	function test_jetpack_constants_get_constant_null_when_not_set() {
		$this->apply_filters_spy->enable();
		$test_constant_name = 'UNDEFINED';

		$actual_output = Constants::get_constant( $test_constant_name );

		list($filter_name, $filter_constant_value, $filter_constant_name )
			= $this->apply_filters_spy->getInvocations()[0]->getArguments();

		$this->assertEquals( 'jetpack_constant_default_value', $filter_name );
		$this->assertNull( $filter_constant_value );
		$this->assertEquals( $test_constant_name, $filter_constant_name );

		$this->assertNull( $actual_output );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::get_constant
	 */
	function test_jetpack_constants_can_override_previously_defined_constant() {
		$this->apply_filters_spy->enable();
		$test_version = '1.0.0';
		Constants::set_constant( 'JETPACK__VERSION', $test_version );

		// apply_filters() should not have been called.
		$this->assertEquals( array(), $this->apply_filters_spy->getInvocations() );
		$this->assertEquals( Constants::get_constant( 'JETPACK__VERSION' ), $test_version );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::get_constant
	 */
	function test_jetpack_constants_override_to_null_gets_null() {
		$this->apply_filters_spy->enable();
		Constants::set_constant( 'JETPACK__VERSION', null );

		// apply_filters() should not have been called.
		$this->assertEquals( array(), $this->apply_filters_spy->getInvocations() );
		$this->assertNull( Constants::get_constant( 'JETPACK__VERSION' ) );
	}


	/**
	 * @covers Automattic\Jetpack\Constants::get_constant
	 */
	function test_jetpack_constants_get_constant_use_filter_value() {
		$test_constant_name  = 'TEST_CONSTANT';
		$test_constant_value = 'test value';

		// Create a new apply_filters spy for this test.
		$apply_filters_spy = new Spy(
			'Automattic\Jetpack',
			'apply_filters',
			function ( $filter_name, $value, $name ) use ( $test_constant_value ) {
				return $test_constant_value;
			}
		);
		$apply_filters_spy->enable();

		$actual_output = Constants::get_constant( $test_constant_name );

		list($filter_name, $filter_constant_value, $filter_constant_name )
			= $apply_filters_spy->getInvocations()[0]->getArguments();

		$this->assertEquals( 'jetpack_constant_default_value', $filter_name );
		$this->assertNull( $filter_constant_value );
		$this->assertEquals( $test_constant_name, $filter_constant_name );

		$this->assertEquals( $test_constant_value, $actual_output );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::set_constant
	 */
	function test_jetpack_constants_set_constants_adds_to_set_constants_array() {
		$key = 'TEST';
		Constants::set_constant( $key, '1' );
		$this->assertArrayHasKey( $key, Constants::$set_constants );
		$this->assertEquals( '1', Constants::$set_constants[ $key ] );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::clear_constants
	 */
	function test_jetpack_constants_can_clear_all_constants() {
		Constants::set_constant( 'JETPACK__VERSION', '1.0.0' );
		Constants::clear_constants();
		$this->assertEmpty( Constants::$set_constants );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::clear_single_constant
	 */
	function test_jetpack_constants_can_clear_single_constant() {
		Constants::set_constant( 'FIRST', '1' );
		Constants::set_constant( 'SECOND', '2' );

		$this->assertCount( 2, Constants::$set_constants );

		Constants::clear_single_constant( 'FIRST' );

		$this->assertCount( 1, Constants::$set_constants );
		$this->assertContains( 'SECOND', array_keys( Constants::$set_constants ) );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::clear_single_constant
	 */
	function test_jetpack_constants_can_clear_single_constant_when_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertCount( 1, Constants::$set_constants );

		Constants::clear_single_constant( 'TEST' );

		$this->assertEmpty( Constants::$set_constants );
	}

	/**
	 * @covers Automattic\Jetpack\Constants::is_true
	 */
	function test_jetpack_constants_is_true_method() {
		$this->assertFalse( Constants::is_true( 'FOO' ), 'unset constant returns true' );
		Constants::set_constant( 'FOO', false );

		$this->assertFalse( Constants::is_true( 'FOO' ), 'false constant returns true' );
		Constants::set_constant( 'FOO', true );

		$this->assertTrue( Constants::is_true( 'FOO' ), 'true constant returns false');
	}
}
