<?php

class WP_Test_Jetpack_Gutenberg extends WP_UnitTestCase {

	public $master_user_id = false;

	public function setUp() {
		parent::setUp();
		if ( ! function_exists( 'register_block_type' ) ) {
			$this->markTestSkipped( 'register_block_type not available' );
			return;
		}

		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			$this->markTestSkipped( 'WP_Block_Type_Registry not available' );
			return;
		}
		// Create a user and set it up as current.
		$this->master_user_id = $this->factory->user->create( array( 'user_login' => 'current_master' ) );
		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $this->master_user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $this->master_user_id => "honey.badger.$this->master_user_id" ) );
	}

	public function tearDown() {
		parent::tearDown();

		if ( $this->master_user_id ) {
			Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
			wp_delete_user( $this->master_user_id );
		}

		if ( class_exists( 'WP_Block_Type_Registry' ) ) {
			$blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();
			foreach ( $blocks as $block_name => $block ) {
				if ( strpos( $block_name, 'jetpack/' ) !== false ) {
					unregister_block_type( $block_name );
				}
			}
		}
	}

	public function add_test_block( $blocks ) {
		return array_merge( $blocks, array( 'test' ) );
	}

	public function add_missing_module_block( $blocks ) {
		return array_merge( $blocks, array( 'missing' ) );
	}

	public function add_banana_block( $blocks ) {
		return array_merge( $blocks, array( 'banana' ) );
	}

	public function add_coconut_block( $blocks ) {
		return array_merge( $blocks, array( 'coconut' ) );
	}

	public function add_foo_plugin( $plugins ) {
		return array_merge( $plugins, array( 'foo' ) );
	}

	public function add_unavailable_plugin( $plugins ) {
		return array_merge( $plugins, array( 'unavailable' ) );
	}

	public function add_coconut_plugin( $plugins ) {
		return array_merge( $plugins, array( 'coconut-plugin' ) );
	}

	public function add_banana_plugin( $plugins ) {
		return array_merge( $plugins, array( 'banana-plugin' ) );
	}

	public function add_orange_plugin( $plugins ) {
		return array_merge( $plugins, array( 'orange-plugin' ) );
	}

	function test_registered_block_is_available() {
		jetpack_register_block( 'test' );
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		$this->assertTrue( $availability['test']['available'] );
	}

	function test_registered_block_is_not_available() {
		jetpack_register_block( 'test', array(), array( 'available' => false, 'unavailable_reason' => 'bar' ) );
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		$this->assertFalse( $availability['test']['available'], 'Test is available!' );
		$this->assertEquals( $availability['test']['unavailable_reason'], 'bar', 'unavailable_reason is not bar' );
	}

	function test_registered_block_is_not_available_when_not_defined_in_avaialable_blocks() {
		jetpack_register_block( 'rocks' );
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_test_block') );

		// Should not exits in the $availability...
		$this->assertTrue( ! isset( $availability['rocks']['available'] ), 'Availability info exists' );
	}

	function test_registered_block_is_not_available_when_not_registed_returns_missing_module() {
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_missing_module_block') );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_missing_module_block') );

		// Should not exits in the Module is not active
		$this->assertFalse( $availability['missing']['available'], 'Avaiability is not false exists' );
		$this->assertEquals( $availability['missing']['unavailable_reason'], 'missing_module',  'Availability is not missing_module'  );
	}

	function test_registered_block_is_not_available_unknown_reason_is_missing_reason() {
		jetpack_register_block( 'banana', array(), array('available' => false ) );
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_banana_block' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_banana_block' ) );

		// Should not exits in the Module is not active
		$this->assertFalse( $availability['banana']['available'],  'Avaiability is not false' );
		$this->assertEquals( $availability['banana']['unavailable_reason'], 'unknown', 'Availability Reason is not unknown' );
	}

	function get_coconut_availability() {
		return array( 'available' => false, 'unavailable_reason' => 'roccoconut' );
	}

	function test_registered_block_supports_callback_availability() {
		jetpack_register_block( 'coconut', array(), array(
			'callback' => array( $this, 'get_coconut_availability' ) ) );
		add_filter( 'jetpack_set_available_blocks', array( $this, 'add_coconut_block' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_blocks', array( $this, 'add_coconut_block' ) );

		// Should not exits in the Module is not active
		$this->assertFalse( $availability['coconut']['available'],  'Avaiability is not false' );
		$this->assertEquals( $availability['coconut']['unavailable_reason'], 'roccoconut', 'Availability Reason is not roccoconut' );
	}

	// Plugins
	function test_registered_plugin_is_available() {
		jetpack_register_plugin( 'foo' );
		add_filter( 'jetpack_set_available_plugins', array( $this, 'add_foo_plugin' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_plugins', array( $this, 'add_foo_plugin' ) );

		$this->assertTrue( $availability['foo']['available'] );
	}

	function test_registered_plugin_is_not_available() {
		jetpack_register_plugin( 'unavailable', array( 'available' => false, 'unavailable_reason' => 'bar' ) );
		add_filter( 'jetpack_set_available_plugins', array( $this, 'add_unavailable_plugin' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_plugins', array( $this, 'add_unavailable_plugin' ) );

		$this->assertFalse( $availability['unavailable']['available'], 'Foo is available!' );
		$this->assertEquals( $availability['unavailable']['unavailable_reason'], 'bar', 'unavailable_reason is not bar' );
	}

	function test_registered_plugin_is_not_available_when_not_defined_in_avaialable_plugins() {
		jetpack_register_plugin( 'rocks-plugin' );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();

		// Should not exits in the $availability...
		$this->assertTrue( ! isset( $availability['rocks-plugin']['available'] ), 'Availability info exists' );
	}

	function test_registered_plugin_is_not_available_when_not_registed_returns_missing_module() {
		add_filter( 'jetpack_set_available_plugins', array( $this, 'add_coconut_plugin' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_plugins', array( $this, 'add_coconut_plugin' ) );
		// Should not exits in the Module is not active
		$this->assertFalse( $availability['coconut-plugin']['available'], 'Avaiability is not false exists' );
		$this->assertEquals( $availability['coconut-plugin']['unavailable_reason'], 'missing_module',  'Availability is not missing_module'  );
	}

	function test_registered_plugin_is_not_available_unknown_reason_is_missing_reason() {
		jetpack_register_plugin( 'banana-plugin', array( 'available' => false ) );
		add_filter( 'jetpack_set_available_plugins', array( $this, 'add_banana_plugin' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_plugins', array( $this, 'add_banana_plugin' ) );

		// Should not exits in the Module is not active
		$this->assertFalse( $availability['banana-plugin']['available'],  'Avaiability is not false' );
		$this->assertEquals( $availability['banana-plugin']['unavailable_reason'], 'unknown', 'Availability Reason is not unknown' );
	}

	function orange_availability() {
		return array( 'available' => false, 'unavailable_reason' => 'orange_you_glad' );
	}

	function test_registered_plugin_supports_callback_availability() {
		jetpack_register_plugin( 'orange-plugin', array(
			'callback' => array( $this, 'orange_availability' ) ) );
		add_filter( 'jetpack_set_available_plugins', array( $this, 'add_orange_plugin' ) );

		Jetpack_Gutenberg::init();
		$availability = Jetpack_Gutenberg::get_availability();
		remove_filter( 'jetpack_set_available_plugins', array( $this, 'add_orange_plugin' ) );

		// Should not exits in the Module is not active
		$this->assertFalse( $availability['orange-plugin']['available'],  'Avaiability is not false' );
		$this->assertEquals( $availability['orange-plugin']['unavailable_reason'], 'orange_you_glad', 'Availability Reason is not orange_you_glad' );
	}

}
