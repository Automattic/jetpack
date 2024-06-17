<?php

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Connection\SSO\Helpers;
use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Functions;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\Callables;
use Automattic\Jetpack\Sync\Modules\WP_Super_Cache;
use Automattic\Jetpack\Sync\Sender;
use Automattic\Jetpack\Sync\Settings;

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

require_once __DIR__ . '/test_class.jetpack-sync-base.php';

function jetpack_foo_is_callable() {
	return 'bar';
}

/**
 * Returns an anonymous function for use in testing .
 */
function jetpack_foo_is_anon_callable() {
	$function = function () {
		return 'red';
	};
	return $function;
}

/**
 * Testing Functions
 */
class WP_Test_Jetpack_Sync_Functions extends WP_Test_Jetpack_Sync_Base {

	protected $post;

	/** @var \Automattic\Jetpack\Sync\Modules\Callables */
	protected $callable_module;

	protected static $admin_id; // used in mock_xml_rpc_request

	/**
	 * Placeholder for reverting $_SERVER['HTTP_HOST'] to it's default value.
	 * User in mock_xml_rpc_request.
	 *
	 * @var string
	 */
	protected static $http_host;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->resetCallableAndConstantTimeouts();

		$this->callable_module = Modules::get_module( 'functions' );
		set_current_screen( 'post-user' ); // this only works in is_admin()
	}

	public function test_white_listed_function_is_synced() {
		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );

		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( jetpack_foo_is_callable(), $synced_value );
	}

	/**
	 * Verify that when a callable returns an anonymous function we don't fatal.
	 */
	public function test_anonymous_function_callable() {
		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo_anon' => 'jetpack_foo_is_anon_callable' ) );

		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo_anon' );
		$this->assertNull( $synced_value );
	}

	public function test_sync_jetpack_updates() {
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_callable( 'updates' );
		$this->assertEqualsObject( Jetpack::get_updates(), $updates, 'The updates object should match' );
	}

	public function test_wp_version_is_synced() {
		global $wp_version;
		$this->sender->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'wp_version' );
		$this->assertEquals( $synced_value, $wp_version );
	}

	public function test_sync_callable_whitelist() {
		add_filter( 'jetpack_set_available_extensions', array( $this, 'add_test_block' ) );
		Blocks::jetpack_register_block( 'jetpack/test' );

		$callables = array(
			'wp_max_upload_size'               => wp_max_upload_size(),
			'is_main_network'                  => Jetpack::is_multi_network(),
			'is_multi_site'                    => is_multisite(),
			'main_network_site'                => Urls::main_network_site_url(),
			'single_user_site'                 => Jetpack::is_single_user_site(),
			'updates'                          => Jetpack::get_updates(),
			'home_url'                         => Urls::home_url(),
			'site_url'                         => Urls::site_url(),
			'has_file_system_write_access'     => Functions::file_system_write_access(),
			'is_version_controlled'            => Functions::is_version_controlled(),
			'taxonomies'                       => Functions::get_taxonomies(),
			'post_types'                       => Functions::get_post_types(),
			'post_type_features'               => Functions::get_post_type_features(),
			'rest_api_allowed_post_types'      => Functions::rest_api_allowed_post_types(),
			'rest_api_allowed_public_metadata' => Functions::rest_api_allowed_public_metadata(),
			'sso_is_two_step_required'         => Helpers::is_two_step_required(),
			'sso_should_hide_login_form'       => Helpers::should_hide_login_form(),
			'sso_match_by_email'               => Helpers::match_by_email(),
			'sso_new_user_override'            => Helpers::new_user_override(),
			'sso_bypass_default_login_form'    => Helpers::bypass_login_forward_wpcom(),
			'wp_version'                       => Functions::wp_version(),
			'get_plugins'                      => Functions::get_plugins(),
			'get_plugins_action_links'         => Functions::get_plugins_action_links(),
			'active_modules'                   => Jetpack::get_active_modules(),
			'hosting_provider'                 => Functions::get_hosting_provider(),
			'locale'                           => get_locale(),
			'site_icon_url'                    => Functions::site_icon_url(),
			'shortcodes'                       => Functions::get_shortcodes(),
			'roles'                            => Functions::roles(),
			'timezone'                         => Functions::get_timezone(),
			'available_jetpack_blocks'         => Jetpack_Gutenberg::get_availability(),
			'paused_themes'                    => Functions::get_paused_themes(),
			'paused_plugins'                   => Functions::get_paused_plugins(),
			'main_network_site_wpcom_id'       => Functions::main_network_site_wpcom_id(),
			'theme_support'                    => Functions::get_theme_support(),
			'wp_get_environment_type'          => wp_get_environment_type(),
			'is_fse_theme'                     => Functions::get_is_fse_theme(),
			'get_themes'                       => Functions::get_themes(),
			'get_loaded_extensions'            => Functions::get_loaded_extensions(),
		);

		if ( function_exists( 'wp_cache_is_enabled' ) ) {
			$callables['wp_super_cache_globals'] = WP_Super_Cache::get_wp_super_cache_globals();
		}

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
		$this->assertEmpty( $whitelist_and_callable_keys_difference, 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_callable_keys_difference, 1 ) );

		// Are there any duplicate keys?
		$unique_whitelist = array_unique( $whitelist_keys );
		$this->assertSameSize( $unique_whitelist, $whitelist_keys, 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist_keys, array_unique( $whitelist_keys ) ), 1 ) );

		remove_filter( 'jetpack_set_available_extensions', array( $this, 'add_test_block' ) );
		Jetpack_Gutenberg::reset();
	}

	public function add_test_block() {
		return array( 'test' );
	}

	public function assertCallableIsSynced( $name, $value ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_callable( $name ), 'Function ' . $name . ' didn\'t have the expected value of ' . json_encode( $value ) );
	}

	public function test_white_listed_callables_doesnt_get_synced_twice() {
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( 'bar', $synced_value );

		$this->server_replica_storage->reset();

		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

	/**
	 * Tests that calling unlock_sync_callable_next_tick works as expected.
	 *
	 * Return null
	 */
	public function test_white_listed_callable_sync_on_next_tick() {
		// Setup...
		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable_random' ) );
		$this->sender->do_sync();
		$initial_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );

		// Action happends that should has the correct data only on the next page load.
		$this->callable_module->unlock_sync_callable_next_tick(); // Calling this should have no effect on this sync.
		$this->sender->do_sync();
		$should_be_initial_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( $initial_value, $should_be_initial_value );

		// Next tick...
		$this->sender->do_sync(); // This sync sends the updated data...
		$new_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertNotEquals( $initial_value, $new_value );
	}

	/**
	 * Tests that calling set_late_default works as expected.
	 *
	 * Return null
	 */
	public function test_sync_callable_set_late_default() {
		$this->callable_module->set_callable_whitelist( array() );

		add_filter( 'jetpack_sync_callable_whitelist', array( $this, 'filter_sync_callable_whitelist' ) );

		$this->callable_module->set_late_default();

		remove_filter( 'jetpack_sync_callable_whitelist', array( $this, 'filter_sync_callable_whitelist' ) );

		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( jetpack_foo_is_callable(), $synced_value );
	}

	/**
	 * Tests that updating the theme should result in the no callabled transient being set.
	 *
	 * Return null
	 */
	public function test_updating_stylesheet_sends_the_theme_data() {

		// Make sure we don't already use this theme.
		$this->assertNotEquals( 'twentythirteen', get_option( 'stylesheet' ) );

		switch_theme( 'twentythirteen' );
		$this->sender->do_sync();

		// Since we can load up the data to see if new data will get send
		// this tests if we remove the transiant so that the data can get synced on the next tick.
		$this->assertFalse( get_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME ) );
	}

	public function test_sync_always_sync_changes_to_modules_right_away() {
		Jetpack::update_active_modules( array( 'stats' ) );

		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'active_modules' );
		$this->assertEquals( array( 'stats' ), $synced_value );

		$this->server_replica_storage->reset();

		Jetpack::update_active_modules( array( 'json-api' ) );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'active_modules' );
		$this->assertEquals( array( 'json-api' ), $synced_value );
	}

	public function test_sync_always_sync_changes_to_home_siteurl_right_away() {
		$original_home_option    = get_option( 'home' );
		$original_siteurl_option = get_option( 'siteurl' );

		// Let's see if the original values get synced
		$this->sender->do_sync();
		$synced_home_url = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $original_home_option, $synced_home_url );
		$this->assertEquals( $original_siteurl_option, $synced_site_url );

		$this->server_replica_storage->reset();

		$updated_home_option    = 'http://syncrocks.com';
		$updated_siteurl_option = 'http://syncrocks.com';

		update_option( 'home', $updated_home_option );
		update_option( 'siteurl', $updated_siteurl_option );

		$this->sender->do_sync();

		$synced_home_url = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $updated_home_option, $synced_home_url );
		$this->assertEquals( $updated_siteurl_option, $synced_site_url );

		// Cleanup
		update_option( 'home', $original_home_option );
		update_option( 'siteurl', $original_siteurl_option );
	}

	public function test_sync_jetpack_sync_unlock_sync_callable_action_allows_syncing_siteurl_changes() {
		$original_home_option    = get_option( 'home' );
		$original_siteurl_option = get_option( 'siteurl' );

		// Let's see if the original values get synced. This will also set the await transient.
		$this->sender->do_sync();
		$synced_home_url = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $original_home_option, $synced_home_url );
		$this->assertEquals( $original_siteurl_option, $synced_site_url );

		$this->server_replica_storage->reset();

		update_option( 'home', $this->return_https_site_com_blog() );
		update_option( 'siteurl', $this->return_https_site_com_blog() );

		/**
		 * Used to signal that the callables await transient should be cleared. Clearing the await transient is useful
		 * in cases where we need to sync values to WordPress.com sooner than the default wait time.
		 *
		 * @since 4.4.0
		 */
		do_action( 'jetpack_sync_unlock_sync_callable' );

		$_SERVER['HTTPS'] = 'on';

		$this->sender->do_sync();

		$synced_home_url = $this->server_replica_storage->get_callable( 'home_url' );
		$synced_site_url = $this->server_replica_storage->get_callable( 'site_url' );

		$this->assertEquals( $this->return_https_site_com_blog(), $synced_home_url );
		$this->assertEquals( $this->return_https_site_com_blog(), $synced_site_url );

		// Cleanup
		unset( $_SERVER['HTTPS'] );

		update_option( 'home', $original_home_option );
		update_option( 'siteurl', $original_siteurl_option );
	}

	public function test_home_site_urls_synced_while_migrate_for_idc_set() {
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Callables::CALLABLES_CHECKSUM_OPTION_NAME );

		$home_option    = get_option( 'home' );
		$siteurl_option = get_option( 'siteurl' );
		$main_network   = network_site_url();

		// First, let's see if the original values get synced
		$this->sender->do_sync();

		$this->assertEquals( $home_option, $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertEquals( $siteurl_option, $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertEquals( $main_network, $this->server_replica_storage->get_callable( 'main_network_site' ) );

		// Second, let's make sure that values don't get synced again if the migrate_for_idc option is not set
		$this->server_replica_storage->reset();
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertNull( $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertNull( $this->server_replica_storage->get_callable( 'main_network_site' ) );

		// Third, let's test that values get syncd with the option set
		Jetpack_Options::update_option( 'migrate_for_idc', true );

		$this->server_replica_storage->reset();
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertEquals( $home_option, $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertEquals( $siteurl_option, $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertEquals( $main_network, $this->server_replica_storage->get_callable( 'main_network_site' ) );

		Jetpack_Options::delete_option( 'migrate_for_idc' );
	}

	public function return_example_com() {
		return 'http://example.com';
	}

	public function return_example_com_blog() {
		return 'http://example.com/blog';
	}

	public function return_https_example_com() {
		return 'https://example.com';
	}

	public function return_https_example_org() {
		return 'https://example.org';
	}

	public function return_site_com() {
		return 'http://site.com';
	}

	public function return_https_site_com() {
		return 'https://site.com';
	}

	public function return_https_site_com_blog() {
		return 'https://site.com/blog';
	}

	public function return_https_www_example_com() {
		return 'https://www.example.com';
	}

	public function return_https_foo_example_com() {
		return 'https://foo.example.com';
	}

	public function test_get_protocol_normalized_url_works_with_no_history() {
		$callable_type = 'home_url';
		$option_key    = Urls::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );

		$this->assertStringStartsWith(
			'http://',
			Urls::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
		);

		delete_option( $option_key );

		$this->assertStringStartsWith(
			'https://',
			Urls::get_protocol_normalized_url( $callable_type, $this->return_https_example_com() )
		);

		$this->assertCount( 1, get_option( $option_key ) );

		delete_option( $option_key );
	}

	public function test_get_protocol_normalized_url_stores_max_history() {
		$callable_type = 'home_url';
		$option_key    = Urls::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );
		for ( $i = 0; $i < 20; $i++ ) {
			Urls::get_protocol_normalized_url( $callable_type, $this->return_example_com() );
		}

		$this->assertCount( Urls::HTTPS_CHECK_HISTORY, get_option( $option_key ) );
		delete_option( $option_key );
	}

	public function test_get_protocol_normalized_url_returns_http_when_https_falls_off() {
		$callable_type = 'home_url';
		$option_key    = Urls::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );

		// Start with one https scheme
		$this->assertStringStartsWith(
			'https://',
			Urls::get_protocol_normalized_url( $callable_type, $this->return_https_example_com() )
		);

		// Now add enough http schemes to fill up the history
		for ( $i = 1; $i < Urls::HTTPS_CHECK_HISTORY; $i++ ) {
			$this->assertStringStartsWith(
				'https://',
				Urls::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
			);
		}

		// Now that the history is full, this one should cause the function to return false.
		$this->assertStringStartsWith(
			'http://',
			Urls::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
		);
	}

	public function test_get_protocol_normalized_url_returns_new_value_cannot_parse() {
		$test_url = 'http:///example.com';
		$this->assertEquals(
			$test_url,
			Urls::get_protocol_normalized_url( 'home_url', $test_url )
		);
	}

	public function test_get_protocol_normalized_url_cleared_on_reset_data() {
		Urls::get_protocol_normalized_url( 'home_url', get_home_url() );
		Urls::get_protocol_normalized_url( 'site_url', get_site_url() );
		Urls::get_protocol_normalized_url( 'main_network_site_url', network_site_url() );

		$url_callables = array( 'home_url', 'site_url', 'main_network_site_url' );
		foreach ( $url_callables as $callable ) {
			$this->assertIsArray( get_option( Urls::HTTPS_CHECK_OPTION_PREFIX . $callable ) );
		}

		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );

		Sender::get_instance()->uninstall();

		add_filter( 'query', array( $this, '_create_temporary_tables' ) );
		add_filter( 'query', array( $this, '_drop_temporary_tables' ) );

		foreach ( $url_callables as $callable ) {
			$this->assertFalse( get_option( Urls::HTTPS_CHECK_OPTION_PREFIX . $callable ) );
		}
	}

	public function test_subdomain_switching_to_www_does_not_cause_sync() {
		// a lot of sites accept www.domain.com or just domain.com, and we want to prevent lots of
		// switching back and forth, so we force the domain to be the one in the siteurl option
		$this->setSyncClientDefaults();
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Callables::CALLABLES_CHECKSUM_OPTION_NAME );

		$original_site_url = site_url();

		// sync original value
		$this->sender->do_sync();

		$this->assertEquals( $original_site_url, $this->server_replica_storage->get_callable( 'site_url' ) );

		add_filter( 'site_url', array( $this, 'add_www_subdomain_to_siteurl' ) );

		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Callables::CALLABLES_CHECKSUM_OPTION_NAME );
		$this->sender->do_sync();

		$this->assertEquals( $original_site_url, $this->server_replica_storage->get_callable( 'site_url' ) );
	}

	public function test_sync_limited_set_of_callables_if_cron() {
		$all_callables  = array_keys( Defaults::get_callable_whitelist() );
		$always_updated = Callables::ALWAYS_SEND_UPDATES_TO_THESE_OPTIONS;

		foreach ( $always_updated as $key => $option ) {
			if ( array_key_exists( $option, Callables::OPTION_NAMES_TO_CALLABLE_NAMES ) ) {
				$always_updated[ $key ] = Callables::OPTION_NAMES_TO_CALLABLE_NAMES[ $option ];
			}
		}

		// non-admin
		set_current_screen( 'front' );
		Settings::set_doing_cron( true );

		$this->sender->do_sync();

		foreach ( $all_callables as $callable ) {
			if ( in_array( $callable, $always_updated, true ) ) {
				$this->assertNotNull( $this->server_replica_storage->get_callable( $callable ) );
			} else {
				$this->assertNull( $this->server_replica_storage->get_callable( $callable ) );
			}
		}

		Settings::set_doing_cron( false );
	}

	public function test_sync_limited_set_of_callables_if_wp_cli() {
		$all_callables  = array_keys( Defaults::get_callable_whitelist() );
		$always_updated = Callables::ALWAYS_SEND_UPDATES_TO_THESE_OPTIONS;

		foreach ( $always_updated as $key => $option ) {
			if ( array_key_exists( $option, Callables::OPTION_NAMES_TO_CALLABLE_NAMES ) ) {
				$always_updated[ $key ] = Callables::OPTION_NAMES_TO_CALLABLE_NAMES[ $option ];
			}
		}

		// non-admin
		set_current_screen( 'front' );
		Constants::set_constant( 'WP_CLI', true );

		$this->sender->do_sync();

		foreach ( $all_callables as $callable ) {
			if ( in_array( $callable, $always_updated, true ) ) {
				$this->assertNotNull( $this->server_replica_storage->get_callable( $callable ) );
			} else {
				$this->assertNull( $this->server_replica_storage->get_callable( $callable ) );
			}
		}

		Constants::set_constant( 'WP_CLI', false );
	}

	public function test_site_icon_url_returns_false_when_no_site_icon() {
		delete_option( 'jetpack_site_icon_url' );
		$this->sender->do_sync();
		$this->assertFalse( $this->server_replica_storage->get_callable( 'site_icon_url' ) );
	}

	public function test_site_icon_url_returns_core_site_icon_url_when_set() {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/png',
			)
		);
		add_post_meta( $attachment_id, '_wp_attached_file', '2016/09/core_site_icon_url.png' );
		update_option( 'site_icon', $attachment_id );
		update_option( 'jetpack_site_icon_url', 'http://website.com/wp-content/uploads/2016/09/jetpack_site_icon.png' );

		$this->sender->do_sync();

		$this->assertStringContainsString( 'core_site_icon_url', $this->server_replica_storage->get_callable( 'site_icon_url' ) );

		delete_option( 'site_icon' );
	}

	public function test_site_icon_url_fallback_to_jetpack_site_icon_url() {
		delete_option( 'site_icon' );
		update_option( 'jetpack_site_icon_url', 'http://website.com/wp-content/uploads/2016/09/jetpack_site_icon.png' );
		$this->sender->do_sync();

		$this->assertStringContainsString( 'jetpack_site_icon', $this->server_replica_storage->get_callable( 'site_icon_url' ) );
	}

	public function test_calling_taxonomies_do_not_modify_global() {
		global $wp_taxonomies;
		// adds taxonomies.
		$test = new ABC_FOO_TEST_Taxonomy_Example(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->setSyncClientDefaults();
		$sync_callable_taxonomies = Functions::get_taxonomies();

		$this->assertNull( $sync_callable_taxonomies['example']->update_count_callback );
		$this->assertNull( $sync_callable_taxonomies['example']->meta_box_cb );

		$this->assertNotNull( $wp_taxonomies['example']->update_count_callback );
		$this->assertNotNull( $wp_taxonomies['example']->meta_box_cb );
	}

	public function test_sanitize_sync_taxonomies_method() {

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'post_tags_meta_box' ) );
		$this->assertEquals( 'post_tags_meta_box', $sanitized->meta_box_cb );

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'post_categories_meta_box' ) );
		$this->assertEquals( 'post_categories_meta_box', $sanitized->meta_box_cb );

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'banana' ) );
		$this->assertNull( $sanitized->meta_box_cb );

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'update_count_callback' => 'banana' ) );
		$this->assertFalse( isset( $sanitized->update_count_callback ) );

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'rest_controller_class' => 'banana' ) );
		$this->assertNull( $sanitized->rest_controller_class );

		$sanitized = Functions::sanitize_taxonomy( (object) array( 'rest_controller_class' => 'WP_REST_Terms_Controller' ) );

		$this->assertEquals( 'WP_REST_Terms_Controller', $sanitized->rest_controller_class );
	}

	public function test_sanitize_sync_post_type_method_default() {
		$label            = 'foo_default';
		$post_type_object = new WP_Post_Type( $label );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Functions::sanitize_post_type( $post_type_object );
		$this->assert_sanitized_post_type_default( $sanitized, $label );
	}

	public function test_sanitize_sync_post_type_method_remove_unknown_values_set() {
		$label            = 'foo_strange';
		$post_type_object = new WP_Post_Type( $label, array( 'foo' => 'bar' ) );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Functions::sanitize_post_type( $post_type_object );
		$this->assert_sanitized_post_type_default( $sanitized, $label );
	}

	public function assert_sanitized_post_type_default( $sanitized, $label ) {
		$this->assertEquals( $label, $sanitized->name );
		$this->assertEquals( 'Posts', $sanitized->label );
		$this->assertSame( '', $sanitized->description );
		$this->assertEquals( $label, $sanitized->rewrite['slug'] );
		$this->assertEquals( $label, $sanitized->query_var );
		$this->assertEquals( 'post', $sanitized->capability_type );
		$this->assertEquals( array(), $sanitized->taxonomies );
		$this->assertEquals( array(), $sanitized->supports );
		$this->assertSame( '', $sanitized->_edit_link );

		$this->assertFalse( $sanitized->public );
		$this->assertFalse( $sanitized->has_archive );
		$this->assertFalse( $sanitized->publicly_queryable );
		$this->assertFalse( $sanitized->hierarchical );
		$this->assertFalse( $sanitized->show_ui );
		$this->assertFalse( $sanitized->show_in_menu );
		$this->assertFalse( $sanitized->show_in_nav_menus );
		$this->assertFalse( $sanitized->show_in_admin_bar );
		$this->assertFalse( $sanitized->rest_base );
		$this->assertFalse( $sanitized->_builtin );

		$this->assertTrue( $sanitized->exclude_from_search );
		$this->assertTrue( $sanitized->can_export );
		$this->assertTrue( $sanitized->map_meta_cap );
		$this->assertTrue( is_object( $sanitized->labels ) );
		$this->assertIsArray( $sanitized->rewrite );
		$this->assertTrue( is_object( $sanitized->cap ) );
	}

	public function test_sanitize_sync_post_type_method_all_values_set() {
		$args             = array(
			'labels'              => array(
				'stuff' => 'apple',
			),
			'description'         => 'banana',
			'public'              => true,
			'hierarchical'        => true,
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_nav_menus'   => true,
			'show_in_admin_bar'   => true,
			'menu_position'       => 10,
			'menu_icon'           => 'jetpack',
			'capability_type'     => 'foo',
			'capabilities'        => array( 'banana' => true ),
			'map_meta_cap'        => false,
			'supports'            => array( 'everything' ),
			'taxonomies'          => array( 'orange' ),
			'has_archive'         => true,
			'rewrite'             => false,
			'query_var'           => 'foo_all_stuff',
			'can_export'          => false,
			'delete_with_user'    => true,
			'show_in_rest'        => true,
			'rest_base'           => 'foo_all_stuffing',
		);
		$post_type_object = new WP_Post_Type( 'foo_all', $args );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Functions::sanitize_post_type( $post_type_object );
		foreach ( $args as $arg_key => $arg_value ) {
			if ( in_array( $arg_key, array( 'labels', 'capabilities', 'supports' ), true ) ) {
				continue;
			}
			$this->assertEquals( $arg_value, $sanitized->{ $arg_key }, 'Value for ' . $arg_key . 'not as expected' );
		}
	}

	public function test_get_post_types_method() {
		global $wp_post_types;
		$synced = Functions::get_post_types();
		foreach ( $wp_post_types as $post_type => $post_type_object ) {
			$post_type_object->rest_controller_class = false;
			$post_type_object->rest_controller       = null;
			if ( isset( $post_type_object->revisions_rest_controller_class ) ) {
				$post_type_object->revisions_rest_controller_class = false;
			}
			if ( isset( $post_type_object->autosave_rest_controller_class ) ) {
				$post_type_object->autosave_rest_controller_class = false;
			}
			if ( isset( $post_type_object->late_route_registration ) ) {
				$post_type_object->late_route_registration = false;
			}
			if ( ! isset( $post_type_object->supports ) ) {
				$post_type_object->supports = array();
			}
			$synced_post_type = Functions::expand_synced_post_type( $synced[ $post_type ], $post_type );
			if ( isset( $synced_post_type->labels->template_name ) ) {
				$post_type_object->labels->template_name = $synced_post_type->labels->template_name;
			}
			$this->assertEqualsObject( $post_type_object, $synced_post_type, 'POST TYPE :' . $post_type . ' not equal' );
		}
	}

	public function test_register_post_types_callback_error() {
		register_post_type( 'testing', array( 'register_meta_box_cb' => function () {} ) );
		$this->sender->do_sync();

		$post_types = $this->server_replica_storage->get_callable( 'post_types' );
		$this->assertTrue( isset( $post_types['testing'] ) );
	}

	public function test_get_raw_url_by_option_bypasses_filters() {
		add_filter( 'option_home', array( $this, 'return_filtered_url' ) );
		$this->assertTrue( 'http://filteredurl.com' !== Urls::get_raw_url( 'home' ) );
		remove_filter( 'option_home', array( $this, 'return_filtered_url' ) );
	}

	public function test_get_raw_url_by_constant_bypasses_filters() {
		Constants::set_constant( 'WP_HOME', 'http://constanturl.com' );
		Constants::set_constant( 'WP_SITEURL', 'http://constanturl.com' );
		add_filter( 'option_home', array( $this, 'return_filtered_url' ) );
		add_filter( 'option_siteurl', array( $this, 'return_filtered_url' ) );

		if ( is_multisite() ) {
			$this->assertTrue( $this->return_filtered_url() !== Urls::get_raw_url( 'home' ) );
			$this->assertTrue( $this->return_filtered_url() !== Urls::get_raw_url( 'siteurl' ) );
		} else {
			$this->assertEquals( 'http://constanturl.com', Urls::get_raw_url( 'home' ) );
			$this->assertEquals( 'http://constanturl.com', Urls::get_raw_url( 'siteurl' ) );
		}

		remove_filter( 'option_home', array( $this, 'return_filtered_url' ) );
		remove_filter( 'option_siteurl', array( $this, 'return_filtered_url' ) );
		Constants::clear_constants();
	}

	public function test_get_raw_url_returns_with_http_if_is_ssl() {
		$home_option = get_option( 'home' );

		// Test without https first
		$this->assertEquals( $home_option, Urls::get_raw_url( 'home' ) );

		// Now, with https
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals(
			set_url_scheme( $home_option, 'http' ),
			Urls::get_raw_url( 'home' )
		);
		unset( $_SERVER['HTTPS'] );
	}

	public function test_raw_home_url_is_https_when_is_ssl() {
		Constants::set_constant( 'JETPACK_SYNC_USE_RAW_URL', true );

		$home_option = get_option( 'home' );

		// Test without https first
		$this->assertEquals(
			$home_option,
			Urls::home_url()
		);

		// Now, with https
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals(
			set_url_scheme( $home_option, 'https' ),
			Urls::home_url()
		);
		unset( $_SERVER['HTTPS'] );
	}

	public function test_user_can_stop_raw_urls() {
		add_filter( 'option_home', array( $this, 'return_filtered_url' ) );
		add_filter( 'option_siteurl', array( $this, 'return_filtered_url' ) );

		// Test with constant first
		$this->assertTrue( 'http://filteredurl.com' !== Urls::home_url() );

		// Now, without, which should return the filtered URL
		Constants::set_constant( 'JETPACK_SYNC_USE_RAW_URL', false );
		$this->assertEquals( $this->return_filtered_url(), Urls::home_url() );
		Constants::clear_constants();

		remove_filter( 'option_home', array( $this, 'return_filtered_url' ) );
		remove_filter( 'option_siteurl', array( $this, 'return_filtered_url' ) );
	}

	public function test_plugin_action_links_get_synced() {
		// Makes sure that we start fresh
		delete_transient( 'jetpack_plugin_api_action_links_refresh' );
		$helper_all = new Jetpack_Sync_Test_Helper();

		$helper_all->array_override = array( '<a href="fun.php">fun 😀</a>' );
		add_filter( 'plugin_action_links', array( $helper_all, 'filter_override_array' ), 10 );

		$helper_jetpack                 = new Jetpack_Sync_Test_Helper();
		$helper_jetpack->array_override = array( '<a href="settings.php">settings</a>', '<a href="https://jetpack.com/support">support</a>' );
		add_filter( 'plugin_action_links_jetpack/jetpack.php', array( $helper_jetpack, 'filter_override_array' ), 10 );

		set_current_screen( 'banana' );
		// Let's see if the original values get synced
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		$expected_array = array(
			'hello.php'           => array(
				'fun 😀' => admin_url( 'fun.php' ),
			),
			'jetpack/jetpack.php' => array(
				'settings' => admin_url( 'settings.php' ),
				'support'  => 'https://jetpack.com/support',
			),
		);

		if ( ! is_multisite() ) {
			$expected_array['jetpack/jetpack.php']['My Jetpack'] = admin_url( 'admin.php?page=my-jetpack' );
		}

		$this->assertEquals( $expected_array, $this->extract_plugins_we_are_testing( $plugins_action_links ) );

		$helper_all->array_override = array( '<a href="not-fun.php">not fun</a>' );

		$this->resetCallableAndConstantTimeouts();

		set_current_screen( 'banana' );
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		// Nothing should have changed since we cache the results.
		$this->assertEquals( $expected_array, $this->extract_plugins_we_are_testing( $plugins_action_links ) );

		if ( file_exists( WP_PLUGIN_DIR . '/hello.php' ) ) {
			activate_plugin( 'hello.php', '', false, true );
		}
		if ( file_exists( WP_PLUGIN_DIR . '/hello-dolly/hello.php' ) ) {
			activate_plugin( 'hello-dolly/hello.php', '', false, true );
		}

		$this->resetCallableAndConstantTimeouts();
		set_current_screen( 'banana' );
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		// Links should have changes now since we activated the plugin.
		$expected_array['hello.php'] = array( 'not fun' => admin_url( 'not-fun.php' ) );
		$this->assertEquals( $expected_array, $this->extract_plugins_we_are_testing( $plugins_action_links ), 'Array was not updated to the new value as expected' );
	}

	public function extract_plugins_we_are_testing( $plugins_action_links ) {
		$only_plugins_we_care_about = array();
		if ( isset( $plugins_action_links['hello.php'] ) ) {
			$only_plugins_we_care_about['hello.php'] = isset( $plugins_action_links['hello.php'] ) ? $plugins_action_links['hello.php'] : '';
		} else {
			$only_plugins_we_care_about['hello.php'] = isset( $plugins_action_links['hello-dolly/hello.php'] ) ? $plugins_action_links['hello-dolly/hello.php'] : '';
		}

		$only_plugins_we_care_about['jetpack/jetpack.php'] = isset( $plugins_action_links['jetpack/jetpack.php'] ) ? $plugins_action_links['jetpack/jetpack.php'] : '';
		return $only_plugins_we_care_about;
	}

	public function cause_fatal_error( $actions ) {
		unset( $actions['activate'] );
		$actions[] = '<a href="/hello">world</a>';
		return $actions;
	}

	public function test_fixes_fatal_error() {

		delete_transient( 'jetpack_plugin_api_action_links_refresh' );
		add_filter( 'plugin_action_links', array( $this, 'cause_fatal_error' ) );

		set_current_screen( 'plugins' );

		$this->resetCallableAndConstantTimeouts();
		set_current_screen( 'plugins' );
		$this->sender->do_sync();
		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );
		$plugins_action_links = $this->extract_plugins_we_are_testing( $plugins_action_links );
		$this->assertTrue( isset( $plugins_action_links['hello.php']['world'] ), 'World is not set' );
	}

	/**
	 * Return "http://filteredurl.com".
	 *
	 * @return string
	 */
	public function return_filtered_url() {
		return 'http://filteredurl.com';
	}

	/**
	 * Add a "www" subdomain to a URL.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	public function add_www_subdomain_to_siteurl( $url ) {
		$parsed_url = wp_parse_url( $url );

		return "{$parsed_url['scheme']}://www.{$parsed_url['host']}";
	}

	/**
	 * Filters the sync callable whitelist.
	 *
	 * @param array $whitelist The sync callable whitelist.
	 * @return array
	 */
	public function filter_sync_callable_whitelist( $whitelist ) {
		$whitelist['jetpack_foo'] = 'jetpack_foo_is_callable';

		return $whitelist;
	}

	/**
	 * Test "taxonomies_objects_do_not_have_meta_box_callback".
	 */
	public function test_taxonomies_objects_do_not_have_meta_box_callback() {

		new ABC_FOO_TEST_Taxonomy_Example();
		$taxonomies = Functions::get_taxonomies();
		$taxonomy   = $taxonomies['example'];

		$this->assertIsObject( $taxonomy );
		// Did we get rid of the expected attributes?
		$this->assertNull( $taxonomy->update_count_callback, 'example has the update_count_callback attribute, which should be removed since it is a callback' );
		$this->assertNull( $taxonomy->meta_box_cb, 'example has the meta_box_cb attribute, which should be removed since it is a callback' );
		$this->assertNull( $taxonomy->rest_controller_class );
		// Did we preserve the expected attributes?
		$check_object_vars = array(
			'labels',
			'description',
			'public',
			'publicly_queryable',
			'hierarchical',
			'show_ui',
			'show_in_menu',
			'show_in_nav_menus',
			'show_tagcloud',
			'show_in_quick_edit',
			'show_admin_column',
			'rewrite',
		);
		foreach ( $check_object_vars as $test ) {
			$this->assertObjectHasProperty( $test, $taxonomy, "Taxonomy does not have expected {$test} attribute." );
		}
	}

	/**
	 * Test "force_sync_callable_on_plugin_update".
	 */
	public function test_force_sync_callable_on_plugin_update() {
		// fake the cron so that we really prevent the callables from being called.
		Settings::$is_doing_cron = true;

		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable_random' ) );
		$this->sender->do_sync();
		$this->server_replica_storage->get_callable( 'jetpack_foo' );

		$this->server_replica_storage->reset();

		$synced_value2 = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEmpty( $synced_value2 );

		$upgrader = (object) array(
			'skin' => (object) array(
				'result' => new WP_Error( 'fail', 'Fail' ),
			),
		);

		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		do_action(
			'upgrader_process_complete',
			$upgrader,
			array(
				'action'  => 'update',
				'type'    => 'plugin',
				'bulk'    => true,
				'plugins' => array( 'the/the.php' ),
			)
		);
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );

		$this->sender->do_sync();
		$synced_value3           = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		Settings::$is_doing_cron = false;
		$this->assertNotEmpty( $synced_value3, 'value is empty!' );
	}

	/**
	 * Test "xml_rpc_request_callables_has_actor".
	 */
	public function test_xml_rpc_request_callables_has_actor() {
		$this->server_event_storage->reset();
		$user = wp_get_current_user();
		wp_set_current_user( 0 );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_callable' );
		$this->assertSame( 0, $event->user_id, ' Callables user_id is null' );

		$this->resetCallableAndConstantTimeouts();
		$this->mock_authenticated_xml_rpc(); // mock requet
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_callable' );
		// clean up by unsetting globals, etc. set previously by $this->mock_authenticated_xml_rpc()
		$this->mock_authenticated_xml_rpc_cleanup( $user->ID );

		$this->assertEquals( $event->user_id, self::$admin_id, ' Callables XMLRPC_Reqeust not equal to event user_id' );
	}

	/**
	 * Mock authenticated XML RPC.
	 */
	public function mock_authenticated_xml_rpc() {
		self::$admin_id  = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$http_host = $_SERVER['HTTP_HOST'];

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';

		$_SERVER['REQUEST_URI']        = '/xmlrpc.php';
		$_SERVER['HTTP_HOST']          = 'example.org';
		$_GET['body']                  = 'abc';
		$_GET['body-hash']             = base64_encode( sha1( 'abc', true ) );
		$GLOBALS['HTTP_RAW_POST_DATA'] = 'abc';
		$_SERVER['REQUEST_METHOD']     = 'POST';

		$normalized_request_pieces = array(
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			'POST',
			'example.org',
			'80',
			'/xmlrpc.php',
		);
		$normalize                 = implode( "\n", $normalized_request_pieces ) . "\n";

		$_GET['signature'] = base64_encode( hash_hmac( 'sha1', $normalize, 'secret', true ) );

		// call one of the authenticated endpoints
		Constants::set_constant( 'XMLRPC_REQUEST', true );
		Jetpack::init();
		$connection = Jetpack::connection();
		$connection->xmlrpc_methods( array() );
		$connection->require_jetpack_authentication();
		$connection->verify_xml_rpc_signature();
	}

	/**
	 * Mock authenticated XML RPC cleanup.
	 *
	 * @param int $user_id User ID.
	 */
	public function mock_authenticated_xml_rpc_cleanup( $user_id ) {
		Constants::clear_constants();
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10 );

		unset( $_GET['token'] );
		unset( $_GET['timestamp'] );
		unset( $_GET['nonce'] );
		$_SERVER['REQUEST_URI'] = '';
		$_SERVER['HTTP_HOST']   = self::$http_host;
		unset( $_GET['body'] );
		unset( $_GET['body-hash'] );
		unset( $GLOBALS['HTTP_RAW_POST_DATA'] );
		unset( $_SERVER['REQUEST_METHOD'] );

		Connection_Rest_Authentication::init()->reset_saved_auth_state();
		Jetpack::connection()->reset_raw_post_data();
		wp_set_current_user( $user_id );
		self::$admin_id = null;
	}

	/**
	 * Mock Jetpack private options.
	 */
	public function mock_jetpack_private_options() {
		$user_tokens                    = array();
		$user_tokens[ self::$admin_id ] = 'pretend_this_is_valid.secret.' . self::$admin_id;
		return array(
			'user_tokens' => $user_tokens,
		);
	}

	/**
	 * Test "get_timezone_from_timezone_string".
	 */
	public function test_get_timezone_from_timezone_string() {
		update_option( 'timezone_string', 'America/Rankin_Inlet' );
		update_option( 'gmt_offset', '' );
		$this->assertEquals( 'America/Rankin Inlet', Functions::get_timezone() );
	}

	/**
	 * Test "get_timezone_from_gmt_offset_zero".
	 */
	public function test_get_timezone_from_gmt_offset_zero() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '0' );
		$this->assertEquals( 'UTC+0', Functions::get_timezone() );
	}

	/**
	 * Test "get_timezone_from_gmt_offset_plus".
	 */
	public function test_get_timezone_from_gmt_offset_plus() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '1' );
		$this->assertEquals( 'UTC+1', Functions::get_timezone() );
	}

	/**
	 * Test "get_timezone_from_gmt_offset_fractions".
	 */
	public function test_get_timezone_from_gmt_offset_fractions() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '5.5' );
		$this->assertEquals( 'UTC+5:30', Functions::get_timezone() );
	}

	/**
	 * Test "get_timezone_from_gmt_offset_minus".
	 */
	public function test_get_timezone_from_gmt_offset_minus() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '-1' );
		$this->assertEquals( 'UTC-1', Functions::get_timezone() );
	}

	/**
	 * Test "sync_callable_recursive_gets_checksum".
	 */
	public function test_sync_callable_recursive_gets_checksum() {

		$this->callable_module->set_callable_whitelist( array( 'jetpack_banana' => 'jetpack_recursive_banana' ) );
		$this->sender->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_banana' );
		$this->assertTrue( ! empty( $synced_value ), 'We couldn\'t synced a value!' );
	}

	/**
	 * Test get_hosting_provider() callable to ensure that known hosts have the
	 * right hosting provider returned.
	 *
	 * @return void
	 */
	public function test_get_hosting_provider_callable_with_unknown_host() {
		$this->assertEquals( 'unknown', Functions::get_hosting_provider() );
	}

	/**
	 * Test getting a hosting provider by a known constant
	 *
	 * @return void
	 */
	public function test_get_hosting_provider_by_known_constant() {
		$functions = new Functions();
		Constants::set_constant( 'GD_SYSTEM_PLUGIN_DIR', 'set' );
		$this->assertEquals( 'gd-managed-wp', $functions->get_hosting_provider_by_known_constant() );
		Constants::clear_constants();

		Constants::set_constant( 'UNKNOWN', 'set' );
		$this->assertFalse( $functions->get_hosting_provider_by_known_constant() );
		Constants::clear_constants();
	}

	/**
	 * Test getting a hosting provider by a known class
	 *
	 * @return void
	 */
	public function test_get_hosting_provider_by_known_class() {
		$functions = new Functions();

		$this->assertFalse( $functions->get_hosting_provider_by_known_class() );

		// Fake that the class exists for the test.
		// @phan-suppress-next-line PhanUndeclaredClassReference
		$this->getMockBuilder( '\\WPaaS\\Plugin' )->getMock();

		$this->assertEquals( 'gd-managed-wp', $functions->get_hosting_provider_by_known_class() );
	}

	/**
	 * Test getting a hosting provider by a known function
	 *
	 * @return bool
	 */
	public function test_get_hosting_provider_by_known_function() {

		/**
		 * Stub is_wpe for testing function exists
		 *
		 * @return boolean
		 */
		function is_wpe() { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
			return true;
		}

		$functions = new Functions();

		// Get hosting provider by known function.
		$this->assertEquals( 'wpe', $functions->get_hosting_provider_by_known_function() );
	}

	/**
	 * Test getting the main network site wpcom ID in multisite installs
	 *
	 * @return void
	 */
	public function test_get_main_network_site_wpcom_id_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Only used on multisite' );
		}

		// set the Jetpack ID for this site.
		$main_network_wpcom_id = 12345;
		\Jetpack_Options::update_option( 'id', $main_network_wpcom_id );

		$user_id = self::factory()->user->create();

		// NOTE this is necessary because WPMU causes certain assumptions about transients.
		// to be wrong, and tests to explode. @see: https://github.com/sheabunge/WordPress/commit/ff4f1bb17095c6af8a0f35ac304f79074f3c3ff6 .
		global $wpdb;

		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', 'My Blog', $user_id );
		$wpdb->suppress_errors( $suppress );

		switch_to_blog( $other_blog_id );

		$functions = new Functions();
		$this->assertEquals( $main_network_wpcom_id, $functions->main_network_site_wpcom_id() );

		restore_current_blog();
	}

	/**
	 * Verify get_check_sum is consistent for differently ordered arrays.
	 */
	public function test_sync_does_not_send_updates_if_array_order_is_only_change() {
		$plugins = Functions::get_plugins();

		// Let's see if the original values get synced.
		$this->sender->do_sync();
		$plugins_synced = $this->server_replica_storage->get_callable( 'get_plugins' );

		$this->assertEquals( $plugins, $plugins_synced );

		add_filter( 'all_plugins', array( $this, 'reorder_array_keys' ), 100, 1 );
		do_action( 'jetpack_sync_unlock_sync_callable' );
		$this->server_event_storage->reset();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_callable' );
		$this->assertFalse( $event );
	}

	/**
	 * Verify that all options are returned by get_objects_by_id
	 */
	public function test_get_objects_by_id_all() {
		$module = Modules::get_module( 'functions' );
		'@phan-var \Automattic\Jetpack\Sync\Modules\Callables $module';
		$all_callables = $module->get_objects_by_id( 'callable', array( 'all' ) );
		$this->assertEquals( $module->get_all_callables(), $all_callables );
	}

	/**
	 * Verify that get_object_by_id returns a allowed option
	 */
	public function test_get_objects_by_id_singular() {
		$module = Modules::get_module( 'functions' );
		'@phan-var \Automattic\Jetpack\Sync\Modules\Callables $module';
		$callables    = $module->get_all_callables();
		$get_callable = $module->get_objects_by_id( 'callable', array( 'has_file_system_write_access' ) );
		$this->assertEquals( $callables['has_file_system_write_access'], $get_callable['has_file_system_write_access'] );
	}

	/**
	 * Reorder the get_plugins array keys.
	 *
	 * @param array $plugins array of plugins.
	 *
	 * @return array
	 */
	public function reorder_array_keys( $plugins ) {
		// First plugin in array.
		$plugin_key = array_keys( $plugins )[0];

		// reverse the 1st plugin's array entries.
		$plugins[ $plugin_key ] = array_reverse( $plugins[ $plugin_key ] );

		// reverse the full array.
		return array_reverse( $plugins );
	}

	/**
	 * Test getting the main network site wpcom ID in single site installs
	 *
	 * @return void
	 */
	public function test_get_main_network_site_wpcom_id_single() {
		// set the Jetpack ID for this site.
		$main_network_wpcom_id = 7891011;
		\Jetpack_Options::update_option( 'id', $main_network_wpcom_id );

		$functions = new Functions();
		$this->assertEquals( $main_network_wpcom_id, $functions->main_network_site_wpcom_id() );
	}
}

/**
 * Create a recursive object.
 *
 * @return object
 */
function jetpack_recursive_banana() {
	$banana        = new stdClass();
	$banana->arr   = array();
	$banana->arr[] = $banana;
	return $banana;
}

/**
 * Return a "random" number.
 *
 * Previously just returned `rand()`. I'm guessing something is trying to test
 * caching or cache busting by having a different value returned each time, so
 * let's do that reliably.
 *
 * @return int
 */
function jetpack_foo_is_callable_random() {
	static $value = null;

	if ( null === $value ) {
		$value = wp_rand();
	}

	return $value++;
}

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
/**
 * Example Test Taxonomy
 */
class ABC_FOO_TEST_Taxonomy_Example {

	/**
	 * Constructor. Duh.
	 */
	public function __construct() {

		register_taxonomy(
			'example',
			'posts',
			array(
				'meta_box_cb'           => 'bob',
				'update_count_callback' => array( $this, 'callback_update_count_callback_tags' ), // phpcs:ignore WordPress.Arrays.CommaAfterArrayItem.NoComma
				'rest_controller_class' => 'tom',
			)
		);
	}

	/**
	 * `update_count_callback` callback.
	 *
	 * @return int
	 */
	public function callback_update_count_callback_tags() {
		return 123;
	}

	/**
	 * Prevent this class being used as part of a Serialization injection attack
	 */
	public function __clone() {
		wp_die( 'Please don\'t __clone ' . __CLASS__ );
	}

	/**
	 * Prevent this class being used as part of a Serialization injection attack
	 */
	public function __wakeup() {
		wp_die( 'Please don\'t __wakeup ' . __CLASS__ );
	}
}
