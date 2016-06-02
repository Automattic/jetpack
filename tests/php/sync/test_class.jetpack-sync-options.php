<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_New_Sync_Options extends WP_Test_Jetpack_New_Sync_Base {
	protected $post;

	public function setUp() {
		parent::setUp();

		$this->client->set_options_whitelist( array( 'test_option' ) );

		add_option( 'test_option', 'foo' );

		$this->client->do_sync();
	}

	public function test_added_option_is_synced() {
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertEquals( 'foo', $synced_option_value );
	}

	public function test_updated_option_is_synced() {
		update_option( 'test_option', 'bar' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertEquals( 'bar', $synced_option_value );
	}

	public function test_deleted_option_is_synced() {
		delete_option( 'test_option' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'test_option' );
		$this->assertEquals( false, $synced_option_value );
	}

	public function test_don_t_sync_option_if_not_on_whitelist() {
		add_option( 'don_t_sync_test_option', 'foo' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_option( 'don_t_sync_test_option' );
		$this->assertEquals( false, $synced_option_value );
	}
	
	public function test_sync_options_that_use_filter() {
		add_filter( 'jetpack_options_whitelist', array( $this, 'add_jetpack_options_whitelist_filter' ) );
		$this->client->update_options_whitelist();
		update_option( 'foo_option_bar', '123' );
		$this->client->do_sync();

		$this->assertEquals( '123', $this->server_replica_storage->get_option( 'foo_option_bar' ) );
	}

	public function test_sync_initalize_Jetpack_Sync_Action_on_init() {
		// prioroty should be set to 11 so that Plugins by default (10) initialize the whitelist_filter before.
		$this->assertEquals( 11, has_action('init', array( 'Jetpack_Sync_Actions', 'init' ) ) );
	}


	function add_fiter_on_init() {
		add_filter( 'jetpack_options_whitelist', array( $this, 'add_jetpack_options_whitelist_filter' ) );
	}

	public function add_jetpack_options_whitelist_filter( $options ) {
		$options[] = 'foo_option_bar';
		return $options;
	}
}
