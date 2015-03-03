<?php

class WP_Test_Jetpack_Setting extends WP_UnitTestCase {


	public function test_Jetpack_Setting_string_type() {
		$blogname = get_bloginfo( 'name' );

		$expected = Jetpack_Settings::get( 'blogname', 'string' );

		$this->assertEquals( $expected, $blogname );
	}

	public function test_Jetpack_Setting_int_type() {

		$days_old = get_option( 'close_comments_days_old' );

		$expected = Jetpack_Settings::get( 'close_comments_days_old', 'int' );

		$this->assertEquals( $expected, (int) $days_old );
	}

	public function test_Jetpack_Setting_bool_type() {

		$moderation_notify = get_option( 'moderation_notify' );

		$expected = Jetpack_Settings::get( 'moderation_notify', 'bool' );

		$this->assertEquals( $expected, (bool) $moderation_notify );
	}

	public function test_Jetpack_Setting_on_type() {

		$social_notifications_like = get_option( 'social_notifications_like' );

		$expected = Jetpack_Settings::get( 'social_notifications_like', 'on' );

		$this->assertEquals( $expected, (bool) $social_notifications_like );

	}

	public function test_Jetpack_Setting_closed_type() {

		$default_ping_status = get_option( 'default_ping_status' );

		$expected = Jetpack_Settings::get( 'default_ping_status', 'closed' );

		$this->assertEquals( $expected, (bool) $default_ping_status );

	}

	public function test_Jetpack_Setting_array_type() {

		$data_array = array(
			'hello' => 'world',
			'number' => 123,
			'boolian' => false,
			'arraying' => array(
				'hello2' => 'world',
				'number2' => 321,
				'boolian2' => true,
				)
			);

		update_option( 'test_jetpack_settings_array_type', $data_array );

		$expected = Jetpack_Settings::get( 'test_jetpack_settings_array_type', array(
				'hello' => 'string',
				'number' => 'int',
				'boolian' => 'bool',
				'arraying'=> array(
					'hello2' => 'string',
					'number2' => 'int',
					'boolian2' => 'bool'
					)
				)
			);

		$this->assertSame( $data_array, $expected );

		delete_option( 'test_jetpack_settings_array_type' );

	}

	static function callback_function( $name ){
		if ( $name == 'hello' ) {
			return 100;

		} else {
			return 99;
		}
	}

	public function test_Jetpack_Setting_callback() {

		$one_hundred = self::callback_function( 'hello' );

		$expected = Jetpack_Settings::get( 'hello', 'int', array( 'WP_Test_Jetpack_Setting', 'callback_function' ), array( 'hello' ) );

		$this->assertEquals( $one_hundred, $expected );

	}

	public function test_Jetpack_Setting_constant() {

		$expected = Jetpack_Settings::get( 'DB_NAME', 'string', null, null, true );

		$this->assertEquals( DB_NAME, $expected );

	}


	public function test_Jetpack_Setting_get_all() {

		$actual = array(
			'hello' => self::callback_function( 'hello' ),
			'blogname' => get_bloginfo( 'name' ),
			'DB_NAME' => DB_NAME
			);

		$data = array(
			'hello' => array(
				'type' => 'int',
				'callback' => array( 'WP_Test_Jetpack_Setting', 'callback_function' ),
				'callback_args' => array( 'hello' ),
				'is_constant' => false
				),
			'blogname' => array(
				'type' => 'string',
				'callback' => null,
				'callback_args' => null,
				'is_constant' => false
				),
			'DB_NAME' => array(
				'type' => 'string',
				'callback' => null,
				'callback_args' => null,
				'is_constant' => true
				)
			);

		$expected = Jetpack_Settings::get_all( $data );
		$this->assertEquals( $actual, $expected );

	}


} // end class
