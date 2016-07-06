<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-functions.php';

require_once 'test_class.jetpack-sync-base.php';

function jetpack_foo_is_callable() {
	return 'bar';
}

/**
 * Testing Functions
 */
class WP_Test_Jetpack_Sync_Functions extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $callable_module;

	public function setUp() {
		parent::setUp();

		$this->callable_module = Jetpack_Sync_Modules::get_module( "callables" );
	}

	function test_white_listed_function_is_synced() {

		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );

		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( jetpack_foo_is_callable(), $synced_value );
	}

	public function test_sync_jetpack_updates() {
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_callable( 'updates' );
		$this->assertEqualsObject( Jetpack::get_updates(), $updates );
	}


	function test_wp_version_is_synced() {
		global $wp_version;
		$this->sender->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'wp_version' );
		$this->assertEquals( $synced_value, $wp_version );
	}

	public function test_sync_callable_whitelist() {
		$this->setSyncClientDefaults();

		$callables = array(
			'wp_max_upload_size'              => wp_max_upload_size(),
			'is_main_network'                 => Jetpack::is_multi_network(),
			'is_multi_site'                   => is_multisite(),
			'main_network_site'               => Jetpack_Sync_Functions::main_network_site_url(),
			'single_user_site'                => Jetpack::is_single_user_site(),
			'updates'                         => Jetpack::get_updates(),
			'home_url'                        => Jetpack_Sync_Functions::home_url(),
			'site_url'                        => Jetpack_Sync_Functions::site_url(),
			'has_file_system_write_access'    => Jetpack_Sync_Functions::file_system_write_access(),
			'is_version_controlled'           => Jetpack_Sync_Functions::is_version_controlled(),
			'taxonomies'                      => Jetpack_Sync_Functions::get_taxonomies(),
			'post_types'                      => Jetpack_Sync_Functions::get_post_types(),
			'rest_api_allowed_post_types'     => Jetpack_Sync_Functions::rest_api_allowed_post_types(),
			'rest_api_allowed_public_metadata'=> Jetpack_Sync_Functions::rest_api_allowed_public_metadata(),
			'sso_is_two_step_required'        => Jetpack_SSO_Helpers::is_two_step_required(),
			'sso_should_hide_login_form'      => Jetpack_SSO_Helpers::should_hide_login_form(),
			'sso_match_by_email'              => Jetpack_SSO_Helpers::match_by_email(),
			'sso_new_user_override'           => Jetpack_SSO_Helpers::new_user_override(),
			'sso_bypass_default_login_form'   => Jetpack_SSO_Helpers::bypass_login_forward_wpcom(),
			'wp_version'                      => Jetpack_Sync_Functions::wp_version(),
			'get_plugins'                      => Jetpack_Sync_Functions::get_plugins(),
		);

		if ( is_multisite() ) {
			$callables[ 'network_name' ] = Jetpack::network_name();
			$callables[ 'network_allow_new_registrations' ] = Jetpack::network_allow_new_registrations();
			$callables[ 'network_add_new_users' ] = Jetpack::network_add_new_users();
			$callables[ 'network_site_upload_space' ] = Jetpack::network_site_upload_space();
			$callables[ 'network_upload_file_types' ] = Jetpack::network_upload_file_types();
			$callables[ 'network_enable_administration_menus' ] = Jetpack::network_enable_administration_menus();
		}

		$this->sender->do_sync();

		foreach( $callables as $name => $value ) {
			// TODO: figure out why _sometimes_ the 'support' value of
			// the post_types value is being removed from the output
			if ( $name === 'post_types' ) {
				continue;
			}

			$this->assertCallableIsSynced( $name, $value );
		}

		$whitelist_keys = array_keys( $this->callable_module->get_callable_whitelist() );
		$callables_keys = array_keys( $callables );

		// Are we testing all the callables in the defaults?
		$whitelist_and_callable_keys_difference = array_diff( $whitelist_keys, $callables_keys );
		$this->assertTrue( empty( $whitelist_and_callable_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_callable_keys_difference, 1 )  );

		// Are there any duplicate keys?
		$unique_whitelist = array_unique( $whitelist_keys );
		$this->assertEquals( count( $unique_whitelist ), count( $whitelist_keys ), 'The duplicate keys are: '. print_r( array_diff_key( $whitelist_keys , array_unique( $whitelist_keys ) ) ,1 ) );

	}

	function assertCallableIsSynced( $name, $value ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_callable( $name ), 'Function '. $name .' didn\'t have the expected value of ' . json_encode( $value ) );
	}

	function test_white_listed_callables_doesnt_get_synced_twice() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( 'bar', $synced_value );

		$this->server_replica_storage->reset();

		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

	function test_scheme_switching_does_not_cause_sync() {
		$this->setSyncClientDefaults();
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$_SERVER['HTTPS'] = 'off';
		$home_url = home_url();
		$this->sender->do_sync();

		$this->assertEquals( $home_url, $this->server_replica_storage->get_callable( 'home_url' ) );

		// this sets is_ssl() to return true.
		$_SERVER['HTTPS'] = 'on';
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		unset( $_SERVER['HTTPS'] );
		$this->assertEquals( $home_url, $this->server_replica_storage->get_callable( 'home_url' ) );
	}

	function test_preserve_scheme() {
		update_option( 'banana', 'http://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'http://example.com' ), 'http://example.com' );

		// the same host so lets preseve the scheme
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'https://example.com' ), 'http://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'https://example.com/blog' ), 'http://example.com/blog' );

		// lets change the scheme to https
		update_option( 'banana', 'https://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'http://example.com' ), 'https://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'http://example.com/blog' ), 'https://example.com/blog' );

		// a different host lets preseve the scheme from the host
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'http://site.com' ), 'http://site.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'https://site.com' ), 'https://site.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'https://site.com/blog' ), 'https://site.com/blog' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', 'https://example.org' ), 'https://example.org' );
	}
}
