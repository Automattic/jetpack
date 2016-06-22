<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-functions.php';

require_once 'test_class.jetpack-sync-client.php';

function jetpack_foo_is_callable() {
	return 'bar';
}

/**
 * Testing Functions
 */
class WP_Test_Jetpack_New_Sync_Functions extends WP_Test_Jetpack_New_Sync_Base {
	protected $post;

	public function setUp() {
		parent::setUp();
	}

	function test_white_listed_function_is_synced() {

		$this->client->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );

		$this->client->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( jetpack_foo_is_callable(), 'bar' );
	}

	public function test_sync_jetpack_updates() {
		$this->client->do_sync();
		$updates = $this->server_replica_storage->get_callable( 'updates' );
		$this->assertEquals( Jetpack::get_updates(), $updates );
	}


	function test_wp_version_is_synced() {
		global $wp_version;
		$this->client->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'wp_version' );
		$this->assertEquals( $synced_value, $wp_version );
	}

	public function test_sync_callable_whitelist() {
		$this->setSyncClientDefaults();

		$callables = array(
			'wp_max_upload_size'              => wp_max_upload_size(),
			'is_main_network'                 => Jetpack::is_multi_network(),
			'is_multi_site'                   => is_multisite(),
			'main_network_site'               => network_site_url(),
			'single_user_site'                => Jetpack::is_single_user_site(),
			'updates'                         => Jetpack::get_updates(),
			'home_url'                        => home_url(),
			'site_url'                        => site_url(),
			'has_file_system_write_access'    => Jetpack_Sync_Functions::file_system_write_access(),
			'is_version_controlled'           => Jetpack_Sync_Functions::is_version_controlled(),
			'taxonomies'                      => Jetpack_Sync_Functions::get_taxonomies(),
			'post_types'                      => Jetpack_Sync_Functions::get_post_types(),
			'sso_is_two_step_required'        => Jetpack_SSO_Helpers::is_two_step_required(),
			'sso_should_hide_login_form'      => Jetpack_SSO_Helpers::should_hide_login_form(),
			'sso_match_by_email'              => Jetpack_SSO_Helpers::match_by_email(),
			'sso_new_user_override'           => Jetpack_SSO_Helpers::new_user_override(),
			'sso_bypass_default_login_form'   => Jetpack_SSO_Helpers::bypass_login_forward_wpcom(),
			'wp_version'                      => Jetpack_Sync_Functions::wp_version(),
		);

		$this->client->do_sync();

		foreach( $callables as $name => $value ) {
			$this->assertCallableIsSynced( $name, $value );
		}

		$whitelist_keys = array_keys( $this->client->get_callable_whitelist() );
		$callables_keys = array_keys( $callables );
		
		// Are we testing all the callables in the defaults?
		$whitelist_and_callable_keys_difference = array_diff( $whitelist_keys, $callables_keys );
		$this->assertTrue( empty( $whitelist_and_callable_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_callable_keys_difference, 1 )  );

		// Are there any duplicate keys?
		$unique_whitelist = array_unique( $whitelist_keys );
		$this->assertEquals( count( $unique_whitelist ), count( $whitelist_keys ), 'The duplicate keys are: '. print_r( array_diff_key( $whitelist_keys , array_unique( $whitelist_keys ) ) ,1 ) );

	}

	function assertCallableIsSynced( $name, $value ) {
		$this->assertEquals( $value, $this->server_replica_storage->get_callable( $name ), 'Function '. $name .' didn\'t have the expected value of ' . json_encode( $value ) );
	}


	function test_white_listed_callables_doesnt_get_synced_twice() {
		delete_transient( Jetpack_Sync_Client::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Client::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->client->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );
		$this->client->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( 'bar', $synced_value );

		$this->server_replica_storage->reset();

		delete_transient( Jetpack_Sync_Client::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->client->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

}