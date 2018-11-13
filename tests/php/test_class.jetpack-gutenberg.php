<?php

class WP_Test_Jetpack_Gutenberg extends WP_UnitTestCase {

	public function add_test_block( $blocks ) {
		return array_merge( $blocks, array( 'test' ) );
	}

	public function test_jetpack_register_block_registers_a_gutenberg_block() {

		if ( ! function_exists( 'register_block_type' ) ) {
			$this->markTestSkipped( 'register_block_type not available' );
			return;
		}

		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			$this->markTestSkipped( 'WP_Block_Type_Registry not available' );
			return;
		}

		// Create a user and set it up as current.
		$current_master_id = $this->factory->user->create( array( 'user_login' => 'current_master' ) );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $current_master_id );
		Jetpack_Options::update_option( 'user_tokens', array( $current_master_id => "honey.badger.$current_master_id" ) );
		add_filter( 'jetpack_set_available_blocks',  array( $this, 'add_test_block' ) );
		jetpack_register_block( 'test' );
		Jetpack_Gutenberg::load_blocks();
		$test_block = WP_Block_Type_Registry::get_instance()->get_registered( 'jetpack/test' );
		$this->assertEquals( 'jetpack/test', $test_block->name );
	}

}
