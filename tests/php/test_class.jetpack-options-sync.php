<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-options-sync.php';
//require_once dirname( __FILE__ ) . '/../../json-endpoints/jetpack/class.jetpack-json-api-get-options-endpoint.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Options_Sync extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		parent::setUp();

		Jetpack_Options_Sync::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_add_new_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );

		add_option( $option, 1 );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	public function test_sync_update_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );
		add_option( $option, 1 );

		self::reset_sync();
		update_option( $option, 2 );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	public function test_sync_delete_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );
		add_option( $option, 1 );

		self::reset_sync();
		delete_option( $option );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_delete() );
	}

	public function test_sync_mock_option_return_callback() {
		$option = 'new_mock_option';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback' ) );

		$this->assertEquals( get_option( 'jetpack_' .$option ), self::new_mock_option_callback() );
	}

	public function test_sync_mock_option_sync() {
		$option = 'new_mock_option_sync';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback' ) );
		Jetpack_Options_Sync::sync_mock_option( $option );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	public function test_sync_mock_option_sync_trigger() {
		$option = 'new_mock_option_trigger_action';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback' ) );
		add_action( 'test_sync_mock_option', array( __CLASS__, 'trigger_mock_option_sync' ) );
		do_action( 'test_sync_mock_option' );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	static function trigger_mock_option_sync() {
		Jetpack_Options_Sync::sync_mock_option( 'new_mock_option_trigger_action' );
	}

	public function test_sync_mock_option_return_callback_return_false() {
		$option = 'new_mock_option_return_false';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback_return_false' ) );

		$this->assertEquals( get_option( 'jetpack_' .$option ), self::new_mock_option_callback_return_false() );
	}

	public function test_sync_blogname() {
		$option = 'blogname';
		$new_blogname = 'updated blog name';
		update_option( $option, $new_blogname );
		$api_output = Jetpack_Options_Sync::get_settings();

		$this->assertEquals( $new_blogname, $api_output['options'][$option] );
	}

	static function new_mock_option_callback() {
		return '41';
	}

	static function new_mock_option_callback_return_false() {
		return false;
	}

	private function reset_sync() {
		Jetpack_Options_Sync::$sync = array();
		Jetpack_Options_Sync::$delete = array();
	}
}