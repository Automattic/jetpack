<?php

class WP_Test_Jetpack_Constants extends WP_UnitTestCase {
	public function tearDown() {
		parent::tearDown();
		Jetpack_Constants::$set_constants = array();
	}

	// Jetpack_Constants::is_defined()

	function test_jetpack_constants_is_defined_when_constant_set_via_class() {
		Jetpack_Constants::set_constant( 'TEST', 'hello' );
		$this->assertTrue( Jetpack_Constants::is_defined( 'TEST' ) );
	}

	function test_jetpack_constants_is_defined_false_when_constant_not_set() {
		$this->assertFalse( Jetpack_Constants::is_defined( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_is_defined_true_when_set_with_define() {
		$this->assertTrue( Jetpack_Constants::is_defined( 'JETPACK__VERSION' ) );
	}

	function test_jetpack_constants_is_defined_when_constant_set_to_null() {
		Jetpack_Constants::set_constant( 'TEST', null );
		$this->assertTrue( Jetpack_Constants::is_defined( 'TEST' ) );
	}

	// Jetpack_Constants::get_constant()

	function test_jetpack_constants_default_to_constant() {
		$this->assertEquals( Jetpack_Constants::get_constant( 'JETPACK__VERSION' ), JETPACK__VERSION );
	}

	function test_jetpack_constants_get_constant_null_when_not_set() {
		$this->assertNull( Jetpack_Constants::get_constant( 'UNDEFINED' ) );
	}

	function test_jetpack_constants_can_override_previously_defined_constant() {
		$test_version = '1.0.0';
		Jetpack_Constants::set_constant( 'JETPACK__VERSION', $test_version );
		$this->assertEquals( Jetpack_Constants::get_constant( 'JETPACK__VERSION' ), $test_version );
	}

	function test_jetpack_constants_override_to_null_gets_null() {
		Jetpack_Constants::set_constant( 'JETPACK__VERSION', null );
		$this->assertNull( Jetpack_Constants::get_constant( 'JETPACK__VERSION' ) );
	}

	// Jetpack_Constants::set_constant()

	function test_jetpack_constants_set_constants_adds_to_set_constants_array() {
		$key = 'TEST';
		Jetpack_Constants::set_constant( $key, '1' );
		$this->assertArrayHasKey( $key, Jetpack_Constants::$set_constants );
		$this->assertEquals( '1', Jetpack_Constants::$set_constants[ $key ] );
	}

	// Jetpack_Constants::clear_constants()

	function test_jetpack_constants_can_clear_all_constants() {
		Jetpack_Constants::set_constant( 'JETPACK__VERSION', '1.0.0' );
		Jetpack_Constants::clear_constants();
		$this->assertEmpty( Jetpack_Constants::$set_constants );
	}

	// Jetpack_Constants::clear_single_constant()

	function test_jetpack_constants_can_clear_single_constant() {
		Jetpack_Constants::set_constant( 'FIRST', '1' );
		Jetpack_Constants::set_constant( 'SECOND', '2' );

		$this->assertCount( 2, Jetpack_Constants::$set_constants );

		Jetpack_Constants::clear_single_constant( 'FIRST' );

		$this->assertCount( 1, Jetpack_Constants::$set_constants );
		$this->assertContains( 'SECOND', array_keys( Jetpack_Constants::$set_constants ) );
	}

	function test_jetpack_constants_can_clear_single_constant_when_null() {
		Jetpack_Constants::set_constant( 'TEST', null );
		$this->assertCount( 1, Jetpack_Constants::$set_constants );

		Jetpack_Constants::clear_single_constant( 'TEST' );

		$this->assertEmpty( Jetpack_Constants::$set_constants );
	}
}
