<?php

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

class Test_Manager extends TestCase {
	public function setUp() {
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '7.5' );
		}
	}

	public function tearDown() {
		parent::tearDown();
		Constants::$set_constants = array();
	}

	// Constants::is_defined()

	function test_jetpack_constants_is_defined_when_constant_set_via_class() {
		Constants::set_constant( 'TEST', 'hello' );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	function test_jetpack_constants_is_defined_false_when_constant_not_set() {
		$this->assertFalse( Constants::is_defined( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_is_defined_true_when_set_with_define() {
		$this->assertTrue( Constants::is_defined( 'JETPACK__VERSION' ) );
	}

	function test_jetpack_constants_is_defined_when_constant_set_to_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertTrue( Constants::is_defined( 'TEST' ) );
	}

	// Constants::get_constant()

	function test_jetpack_constants_default_to_constant() {
		$this->assertEquals( Constants::get_constant( 'JETPACK__VERSION' ), JETPACK__VERSION );
	}

	function test_jetpack_constants_get_constant_null_when_not_set() {
		$this->assertNull( Constants::get_constant( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_can_override_previously_defined_constant() {
		$test_version = '1.0.0';
		Constants::set_constant( 'JETPACK__VERSION', $test_version );
		$this->assertEquals( Constants::get_constant( 'JETPACK__VERSION' ), $test_version );
	}

	function test_jetpack_constants_override_to_null_gets_null() {
		Constants::set_constant( 'JETPACK__VERSION', null );
		$this->assertNull( Constants::get_constant( 'JETPACK__VERSION' ) );
	}

	// Constants::set_constant()

	function test_jetpack_constants_set_constants_adds_to_set_constants_array() {
		$key = 'TEST';
		Constants::set_constant( $key, '1' );
		$this->assertArrayHasKey( $key, Constants::$set_constants );
		$this->assertEquals( '1', Constants::$set_constants[ $key ] );
	}

	// Constants::clear_constants()

	function test_jetpack_constants_can_clear_all_constants() {
		Constants::set_constant( 'JETPACK__VERSION', '1.0.0' );
		Constants::clear_constants();
		$this->assertEmpty( Constants::$set_constants );
	}

	// Constants::clear_single_constant()

	function test_jetpack_constants_can_clear_single_constant() {
		Constants::set_constant( 'FIRST', '1' );
		Constants::set_constant( 'SECOND', '2' );

		$this->assertCount( 2, Constants::$set_constants );

		Constants::clear_single_constant( 'FIRST' );

		$this->assertCount( 1, Constants::$set_constants );
		$this->assertContains( 'SECOND', array_keys( Constants::$set_constants ) );
	}

	function test_jetpack_constants_can_clear_single_constant_when_null() {
		Constants::set_constant( 'TEST', null );
		$this->assertCount( 1, Constants::$set_constants );

		Constants::clear_single_constant( 'TEST' );

		$this->assertEmpty( Constants::$set_constants );
	}

	// Jetpack_Constant::is_true
	function test_jetpack_constants_is_true_method() {
		$this->assertFalse( Constants::is_true( 'FOO' ), 'unset constant returns true' );
		Constants::set_constant( 'FOO', false );

		$this->assertFalse( Constants::is_true( 'FOO' ), 'false constant returns true' );
		Constants::set_constant( 'FOO', true );

		$this->assertTrue( Constants::is_true( 'FOO' ), 'true constant returns false');
	}
}
