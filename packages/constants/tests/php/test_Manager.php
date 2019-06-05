<?php

use Automattic\Jetpack\Constants\Manager as Constants_Manager;
use PHPUnit\Framework\TestCase;

class Test_Manager extends TestCase {
	public function setUp() {
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '7.5' );
		}
	}

	public function tearDown() {
		parent::tearDown();
		Constants_Manager::$set_constants = array();
	}

	// Constants_Manager::is_defined()

	function test_jetpack_constants_is_defined_when_constant_set_via_class() {
		Constants_Manager::set_constant( 'TEST', 'hello' );
		$this->assertTrue( Constants_Manager::is_defined( 'TEST' ) );
	}

	function test_jetpack_constants_is_defined_false_when_constant_not_set() {
		$this->assertFalse( Constants_Manager::is_defined( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_is_defined_true_when_set_with_define() {
		$this->assertTrue( Constants_Manager::is_defined( 'JETPACK__VERSION' ) );
	}

	function test_jetpack_constants_is_defined_when_constant_set_to_null() {
		Constants_Manager::set_constant( 'TEST', null );
		$this->assertTrue( Constants_Manager::is_defined( 'TEST' ) );
	}

	// Constants_Manager::get_constant()

	function test_jetpack_constants_default_to_constant() {
		$this->assertEquals( Constants_Manager::get_constant( 'JETPACK__VERSION' ), JETPACK__VERSION );
	}

	function test_jetpack_constants_get_constant_null_when_not_set() {
		$this->assertNull( Constants_Manager::get_constant( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_can_override_previously_defined_constant() {
		$test_version = '1.0.0';
		Constants_Manager::set_constant( 'JETPACK__VERSION', $test_version );
		$this->assertEquals( Constants_Manager::get_constant( 'JETPACK__VERSION' ), $test_version );
	}

	function test_jetpack_constants_override_to_null_gets_null() {
		Constants_Manager::set_constant( 'JETPACK__VERSION', null );
		$this->assertNull( Constants_Manager::get_constant( 'JETPACK__VERSION' ) );
	}

	// Constants_Manager::set_constant()

	function test_jetpack_constants_set_constants_adds_to_set_constants_array() {
		$key = 'TEST';
		Constants_Manager::set_constant( $key, '1' );
		$this->assertArrayHasKey( $key, Constants_Manager::$set_constants );
		$this->assertEquals( '1', Constants_Manager::$set_constants[ $key ] );
	}

	// Constants_Manager::clear_constants()

	function test_jetpack_constants_can_clear_all_constants() {
		Constants_Manager::set_constant( 'JETPACK__VERSION', '1.0.0' );
		Constants_Manager::clear_constants();
		$this->assertEmpty( Constants_Manager::$set_constants );
	}

	// Constants_Manager::clear_single_constant()

	function test_jetpack_constants_can_clear_single_constant() {
		Constants_Manager::set_constant( 'FIRST', '1' );
		Constants_Manager::set_constant( 'SECOND', '2' );

		$this->assertCount( 2, Constants_Manager::$set_constants );

		Constants_Manager::clear_single_constant( 'FIRST' );

		$this->assertCount( 1, Constants_Manager::$set_constants );
		$this->assertContains( 'SECOND', array_keys( Constants_Manager::$set_constants ) );
	}

	function test_jetpack_constants_can_clear_single_constant_when_null() {
		Constants_Manager::set_constant( 'TEST', null );
		$this->assertCount( 1, Constants_Manager::$set_constants );

		Constants_Manager::clear_single_constant( 'TEST' );

		$this->assertEmpty( Constants_Manager::$set_constants );
	}

	// Jetpack_Constant::is_true
	function test_jetpack_constants_is_true_method() {
		$this->assertFalse( Constants_Manager::is_true( 'FOO' ), 'unset constant returns true' );
		Constants_Manager::set_constant( 'FOO', false );

		$this->assertFalse( Constants_Manager::is_true( 'FOO' ), 'false constant returns true' );
		Constants_Manager::set_constant( 'FOO', true );

		$this->assertTrue( Constants_Manager::is_true( 'FOO' ), 'true constant returns false');
	}
}
