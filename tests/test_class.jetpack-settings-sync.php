<?php

class WP_Test_Jetpack_Setting extends WP_UnitTestCase {

	public function test_Jetpack_Setting_call_get_all() {

		try {
			Jetpack_Sync_Settings::get_all();
		} catch (Exception $e) {
			// var_dump( $e->getMessage() );
    		$this->assertTrue( false );
    		return;
		}

		$this->assertTrue( true );
	}

	public function test_Jetpack_Setting_call_get_all_mock() {

		try {
			Jetpack_Sync_Settings::get_all( 'mock_options' );
		} catch (Exception $e) {
			// var_dump( $e->getMessage() );
    		$this->assertTrue( false );
    		return;
		}

		$this->assertTrue( true );
	}

	public function test_Jetpack_Setting_call_get_all_options() {

		try {
			Jetpack_Sync_Settings::get_all( 'options' );
		} catch (Exception $e) {
    		$this->assertTrue( false );
    		return;
		}

		$this->assertTrue( true );
	}

	public function test_Jetpack_Setting_call_get_all_constants() {

		try {
			Jetpack_Sync_Settings::get_all( 'constants' );
		} catch (Exception $e) {
    		$this->assertTrue( false );
    		return;
		}

		$this->assertTrue( true );
	}

	public function test_Jetpack_Setting_string_type() {

		$option = 'test_string';
		$type = 'string';

		$value = 'hello 123';
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_int_type() {

		$option = 'test_int';
		$type = 'int';

		$value = 123;
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_bool_type() {

		$option = 'test_bool';
		$type = 'bool';

		$value = true;
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_on_type() {

		$option = 'test_on';
		$type = 'on';

		$value = 'on';
		$expected = true;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_closed_type() {

		$option = 'test_closed';
		$type = 'closed';

		$value = 'closed';
		$expected = false;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_string_array_type() {

		$option = 'test_array';
		$type = 'array';

		$value = array( 1, 2, 3 );
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_string_array_type_not_array() {

		$option = 'test_array';
		$type = 'array';

		$value = 'not an array';
		$expected = array();

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}


	public function test_Jetpack_Setting_array_list_type() {

		$option = 'test_list';
		$type = array( 'newest', 'oldest' );

		$value = 'oldest';
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );
	}


	public function test_Jetpack_Setting_array_list_type_not_in_array() {

		$option = 'test_list';
		$type = array( 'newest', 'oldest' );

		$value = 'stuff';
		$expected = 'newest';

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );
	}

	public function test_Jetpack_Setting_array_list_type_empty_not_in_array() {

		$option = 'test_list';
		$type = array( 'newest', 'oldest' );

		$value = '';
		$expected = 'newest';

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );
	}

	public function test_Jetpack_Setting_string_array_type_nested() {

		$option = 'test_nested_array';
		$type = array( 'local' => 'array', 'globalz' => 'array' );

		$value = self::callback_function( 'array' );
		$expected = $value;

		update_option( $option, $value);
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_array_data() {
		$option = 'test_nested_data';

		$type = array(
			'hello' => 'string',
			'number' => 'int',
			'boolean' => 'bool',
			'arraying'=> array(
				'hello2' => 'string',
				'number2' => 'int',
				'boolean2' => 'bool'
				)
			);

		$value = array(
			'hello' => 'world',
			'number' => 123,
			'boolean' => false,
			'arraying' => array(
				'hello2' => 'world',
				'number2' => 321,
				'boolean2' => true,
				)
			);

		$expected = $value;

		update_option( $option, $value );
		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}



	static function callback_function( $name = null ){

		switch( $name ) {
			case 'hello':
				return 100;
			case 'array':
				return array( 'globalz' => array( 1, 2, 3 ) , 'local' => array( 'string A', 'string B' ) );
			default:
				return 99;
		}
	}

	public function test_Jetpack_Setting_callback() {

		$option = 'test_callback';

		$type = array(
			'type' => 'int',
			'callback' => array( 'WP_Test_Jetpack_Setting', 'callback_function' )
			);

		$expected = self::callback_function();

		Jetpack_Sync_Settings::add_setting( $option , 'mock_option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_callback_with_args() {

		$option = 'test_callback_with_callback';

		$type = array(
			'type' => 'int',
			'callback' => array( 'WP_Test_Jetpack_Setting', 'callback_function' ),
			'callback_args' => array( 'hello' )
			);

		$expected = self::callback_function( 'hello' );

		Jetpack_Sync_Settings::add_setting( $option, 'mock_option', $type );
		$actual = Jetpack_Sync_Settings::get( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_constant() {

		define( 'TEST_JETPACK_SETTINGS_CONSTANT', 101 );

		$option = 'TEST_JETPACK_SETTINGS_CONSTANT';

		$type = 'int';
		$expected = TEST_JETPACK_SETTINGS_CONSTANT;

		Jetpack_Sync_Settings::add_setting( $option, 'constant', $type );
		$actual = Jetpack_Sync_Settings::get( $option );

		$this->assertEquals( $actual, $expected );
	}

	public function test_Jetpack_Setting_get_all() {

		// Constant
		define( 'TEST_JETPACK_SETTINGS_CONSTANT_TWO', 101 );
		Jetpack_Sync_Settings::add_setting( 'TEST_JETPACK_SETTINGS_CONSTANT_TWO', 'constant', 'int' );

		// Mock Option
		Jetpack_Sync_Settings::add_setting( 'callback_test' , 'mock_option', array(
				'type' => array( 'local' => 'array', 'globalz' => 'array' ),
				'callback' => array( 'WP_Test_Jetpack_Setting', 'callback_function' ),
				'callback_args' => array( 'array' )
				)
			);

		// Option
		$option_name = 'test_setting_all';
		$option_value = 'hello world';
		Jetpack_Sync_Settings::add_setting( $option_name, 'option', 'string' );

		update_option( $option_name, $option_value );

		$actual = array(
			'callback_test' => self::callback_function( 'array' ),
			'test_setting_all' => get_option( $option_name ),
			'TEST_JETPACK_SETTINGS_CONSTANT_TWO' => TEST_JETPACK_SETTINGS_CONSTANT_TWO
			);

		$expected = Jetpack_Sync_Settings::get_all( array_keys( $actual ) );
		delete_option( $option_name );

		$this->assertEquals( $actual, $expected );

	}

	public function test_Jetpack_Setting_update_setting() {

		$option = 'test_update';
		$type = array( 'newest', 'oldest' );

		$value = 'oldest';
		$expected = $value;

		Jetpack_Sync_Settings::add_setting( $option, 'option', $type );
		Jetpack_Sync_Settings::update( $option, $value );

		$actual = Jetpack_Sync_Settings::get( $option );
		delete_option( $option );

		$this->assertEquals( $actual, $expected );
	}

} // end class
