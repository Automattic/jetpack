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

		$this->callable_module = Jetpack_Sync_Modules::get_module( "functions" );
		set_current_screen( 'post-user' ); // this only works in is_admin()
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
			'wp_max_upload_size'               => wp_max_upload_size(),
			'is_main_network'                  => Jetpack::is_multi_network(),
			'is_multi_site'                    => is_multisite(),
			'main_network_site'                => Jetpack_Sync_Functions::main_network_site_url(),
			'single_user_site'                 => Jetpack::is_single_user_site(),
			'updates'                          => Jetpack::get_updates(),
			'home_url'                         => Jetpack_Sync_Functions::home_url(),
			'site_url'                         => Jetpack_Sync_Functions::site_url(),
			'has_file_system_write_access'     => Jetpack_Sync_Functions::file_system_write_access(),
			'is_version_controlled'            => Jetpack_Sync_Functions::is_version_controlled(),
			'taxonomies'                       => Jetpack_Sync_Functions::get_taxonomies(),
			'post_types'                       => Jetpack_Sync_Functions::get_post_types(),
			'post_type_features'               => Jetpack_Sync_Functions::get_post_type_features(),
			'rest_api_allowed_post_types'      => Jetpack_Sync_Functions::rest_api_allowed_post_types(),
			'rest_api_allowed_public_metadata' => Jetpack_Sync_Functions::rest_api_allowed_public_metadata(),
			'sso_is_two_step_required'         => Jetpack_SSO_Helpers::is_two_step_required(),
			'sso_should_hide_login_form'       => Jetpack_SSO_Helpers::should_hide_login_form(),
			'sso_match_by_email'               => Jetpack_SSO_Helpers::match_by_email(),
			'sso_new_user_override'            => Jetpack_SSO_Helpers::new_user_override(),
			'sso_bypass_default_login_form'    => Jetpack_SSO_Helpers::bypass_login_forward_wpcom(),
			'wp_version'                       => Jetpack_Sync_Functions::wp_version(),
			'get_plugins'                      => Jetpack_Sync_Functions::get_plugins(),
			'active_modules'                   => Jetpack::get_active_modules(),
			'hosting_provider'                 => Jetpack_Sync_Functions::get_hosting_provider(),
			'locale'                           => get_locale(),
			'site_icon_url'                    => Jetpack_Sync_Functions::site_icon_url(),
		);

		if ( is_multisite() ) {
			$callables['network_name']                        = Jetpack::network_name();
			$callables['network_allow_new_registrations']     = Jetpack::network_allow_new_registrations();
			$callables['network_add_new_users']               = Jetpack::network_add_new_users();
			$callables['network_site_upload_space']           = Jetpack::network_site_upload_space();
			$callables['network_upload_file_types']           = Jetpack::network_upload_file_types();
			$callables['network_enable_administration_menus'] = Jetpack::network_enable_administration_menus();
		}

		$this->sender->do_sync();

		foreach ( $callables as $name => $value ) {
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
		$this->assertTrue( empty( $whitelist_and_callable_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_callable_keys_difference, 1 ) );

		// Are there any duplicate keys?
		$unique_whitelist = array_unique( $whitelist_keys );
		$this->assertEquals( count( $unique_whitelist ), count( $whitelist_keys ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist_keys, array_unique( $whitelist_keys ) ), 1 ) );

	}

	function assertCallableIsSynced( $name, $value ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_callable( $name ), 'Function ' . $name . ' didn\'t have the expected value of ' . json_encode( $value ) );
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

	function test_sync_always_sync_changes_to_modules_right_away() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->setSyncClientDefaults();
		Jetpack::update_active_modules( array( 'stats' ) );

		$this->sender->do_sync();
		
		$synced_value = $this->server_replica_storage->get_callable( 'active_modules' );
		$this->assertEquals(  array( 'stats' ), $synced_value  );

		$this->server_replica_storage->reset();

		Jetpack::update_active_modules( array( 'json-api' ) );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'active_modules' );
		$this->assertEquals( array( 'json-api' ), $synced_value );
	}

	function test_sync_always_sync_changes_to_home_siteurl_right_away() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->setSyncClientDefaults();

		$original_home_option    = get_option( 'home' );
		$original_siteurl_option = get_option( 'siteurl' );

		// Let's see if the original values get synced
		$this->sender->do_sync();
		$synced_home_url = $synced_value = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url   = $synced_value = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $original_home_option, $synced_home_url );
		$this->assertEquals( $original_siteurl_option, $synced_site_url );

		$this->server_replica_storage->reset();

		$updated_home_option    = 'http://syncrocks.com';
		$updated_siteurl_option = 'http://syncrocks.com';

		update_option( 'home', $updated_home_option );
		update_option( 'siteurl', $updated_siteurl_option );

		$this->sender->do_sync();

		$synced_home_url = $synced_value = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url   = $synced_value = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $updated_home_option, $synced_home_url );
		$this->assertEquals( $updated_siteurl_option, $synced_site_url );

		// Cleanup
		update_option( 'home', $original_home_option );
		update_option( 'siteurl', $original_siteurl_option );
	}

	function test_scheme_switching_does_not_cause_sync() {
		$this->setSyncClientDefaults();
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$_SERVER['HTTPS'] = 'off';
		$home_url         = home_url();
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
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_example_com' ) ), 'http://example.com' );

		// the same host so lets preseve the scheme
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_example_com' ) ), 'http://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_example_com_blog' ) ), 'http://example.com/blog' );

		// lets change the scheme to https
		update_option( 'banana', 'https://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_example_com' ) ), 'https://example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_example_com_blog' ) ), 'https://example.com/blog' );

		// a different host lets preseve the scheme from the host
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_site_com' ) ), 'http://site.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_site_com' ) ), 'https://site.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_site_com_blog' ) ), 'https://site.com/blog' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_example_org' ) ), 'https://example.org' );

		// adding www subdomain reverts to original domain
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_www_example_com' ), true ), 'https://example.com' );
		// other subdomains are preserved
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_foo_example_com' ), true ), 'https://foo.example.com' );

		// if original domain is www, prefer that
		update_option( 'banana', 'https://www.example.com' );
		$this->assertEquals( Jetpack_Sync_Functions::preserve_scheme( 'banana', array( $this, 'return_https_example_com' ), true ), 'https://www.example.com' );
	}

	function return_example_com() {
		return 'http://example.com';
	}

	function return_example_com_blog() {
		return 'http://example.com/blog';
	}

	function return_https_example_com() {
		return 'https://example.com';
	}

	function return_https_example_org() {
		return 'https://example.org';
	}

	function return_site_com() {
		return 'http://site.com';
	}

	function return_https_site_com() {
		return 'https://site.com';
	}

	function return_https_site_com_blog() {
		return 'https://site.com/blog';
	}

	function return_https_www_example_com() {
		return 'https://www.example.com';
	}

	function return_https_foo_example_com() {
		return 'https://foo.example.com';
	}

	function test_ignores_but_preserves_https_value() {
		$non_https_site_url = site_url();

		$this->assertTrue( !! preg_match( '/^http:/', site_url() ) );

		$_SERVER['HTTPS'] = 'on';

		$this->assertTrue( !! preg_match( '/^https:/', site_url() ) );

		$this->assertEquals( $non_https_site_url, Jetpack_Sync_Functions::preserve_scheme( 'siteurl', 'site_url') );

		$this->assertEquals( $_SERVER['HTTPS'], 'on' );

		unset( $_SERVER['HTTPS'] );
	}

	function test_subdomain_switching_to_www_does_not_cause_sync() {
		// a lot of sites accept www.domain.com or just domain.com, and we want to prevent lots of 
		// switching back and forth, so we force the domain to be the one in the siteurl option
		$this->setSyncClientDefaults();
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );

		$original_site_url = site_url();

		// sync original value
		$this->sender->do_sync();

		$this->assertEquals( $original_site_url, $this->server_replica_storage->get_callable( 'site_url' ) );

		add_filter( 'site_url', array( $this, 'add_www_subdomain_to_siteurl' ) );

		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->sender->do_sync();

		$this->assertEquals( $original_site_url, $this->server_replica_storage->get_callable( 'site_url' ) );
	}

	function test_only_syncs_if_is_admin_and_not_cron() {
		// non-admin
		set_current_screen( 'front' );
		$this->sender->do_sync();
		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'site_url' ) );

		set_current_screen( 'post-user' );

		// admin but in cron (for some reason)
		Jetpack_Sync_Settings::set_doing_cron( true );

		$this->sender->do_sync();
		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'site_url' ) );
		
		Jetpack_Sync_Settings::set_doing_cron( false );
		$this->sender->do_sync();
		$this->assertEquals( site_url(), $this->server_replica_storage->get_callable( 'site_url' ) );
	}

	function test_site_icon_url_returns_false_when_no_site_icon() {
		delete_option( 'jetpack_site_icon_url' );
		$this->sender->do_sync();
		$this->assertFalse( $this->server_replica_storage->get_callable( 'site_icon_url' ) );
	}

	function test_site_icon_url_returns_core_site_icon_url_when_set() {
		$attachment_id = $this->factory->post->create( array(
			'post_type'      => 'attachment',
			'post_mime_type' => 'image/png',
		) );
		add_post_meta( $attachment_id, '_wp_attached_file', '2016/09/core_site_icon_url.png' );
		update_option( 'site_icon', $attachment_id );
		update_option( 'jetpack_site_icon_url', 'http://website.com/wp-content/uploads/2016/09/jetpack_site_icon.png' );

		$this->sender->do_sync();

		$this->assertContains( 'core_site_icon_url', $this->server_replica_storage->get_callable( 'site_icon_url' ) );

		delete_option( 'site_icon' );
	}

	function test_site_icon_url_fallback_to_jetpack_site_icon_url() {
		delete_option( 'site_icon' );
		update_option( 'jetpack_site_icon_url', 'http://website.com/wp-content/uploads/2016/09/jetpack_site_icon.png' );
		$this->sender->do_sync();

		$this->assertContains( 'jetpack_site_icon', $this->server_replica_storage->get_callable( 'site_icon_url' ) );
	}
	
	function add_www_subdomain_to_siteurl( $url ) {
		$parsed_url = parse_url( $url );

		return "{$parsed_url['scheme']}://www.{$parsed_url['host']}";
	}
}
