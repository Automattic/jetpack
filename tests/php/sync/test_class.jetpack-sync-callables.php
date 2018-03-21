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

	protected static $admin_id; // used in mock_xml_rpc_request

	public function setUp() {
		parent::setUp();

		$this->resetCallableAndConstantTimeouts();

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
		// $this->setSyncClientDefaults();

		add_filter( 'jetpack_set_available_extensions',  array( $this, 'add_test_block' ) );
		Jetpack_Gutenberg::init();
		jetpack_register_block( 'jetpack/test' );

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
			'get_plugins_action_links'         => Jetpack_Sync_functions::get_plugins_action_links(),
			'active_modules'                   => Jetpack::get_active_modules(),
			'hosting_provider'                 => Jetpack_Sync_Functions::get_hosting_provider(),
			'locale'                           => get_locale(),
			'site_icon_url'                    => Jetpack_Sync_Functions::site_icon_url(),
			'shortcodes'                       => Jetpack_Sync_Functions::get_shortcodes(),
			'roles'                            => Jetpack_Sync_Functions::roles(),
			'timezone'                         => Jetpack_Sync_Functions::get_timezone(),
			'available_jetpack_blocks'         => Jetpack_Gutenberg::get_availability(),
			'paused_themes'                    => Jetpack_Sync_Functions::get_paused_themes(),
			'paused_plugins'                   => Jetpack_Sync_Functions::get_paused_plugins(),
		);

		if ( function_exists( 'wp_cache_is_enabled' ) ) {
			$callables['wp_super_cache_globals'] = Jetpack_Sync_Module_WP_Super_Cache::get_wp_super_cache_globals();
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
		$this->assertTrue( empty( $whitelist_and_callable_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_callable_keys_difference, 1 ) );

		// Are there any duplicate keys?
		$unique_whitelist = array_unique( $whitelist_keys );
		$this->assertEquals( count( $unique_whitelist ), count( $whitelist_keys ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist_keys, array_unique( $whitelist_keys ) ), 1 ) );

		remove_filter( 'jetpack_set_available_extensions',  array( $this, 'add_test_block' ) );
		Jetpack_Gutenberg::reset();
	}

	public function add_test_block() {
		return array( 'test' );
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

	function test_sync_jetpack_sync_unlock_sync_callable_action_allows_syncing_siteurl_changes() {
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

	function test_home_site_urls_synced_while_migrate_for_idc_set() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_option( Jetpack_Sync_Module_Callables::CALLABLES_CHECKSUM_OPTION_NAME );

		$home_option    = get_option( 'home' );
		$siteurl_option = get_option( 'siteurl' );
		$main_network   = network_site_url();

		// First, let's see if the original values get synced
		$this->sender->do_sync();

		$this->assertEquals( $home_option,  $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertEquals( $siteurl_option, $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertEquals( $main_network, $this->server_replica_storage->get_callable( 'main_network_site' ) );

		// Second, let's make sure that values don't get synced again if the migrate_for_idc option is not set
		$this->server_replica_storage->reset();
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'main_network_site' ) );

		// Third, let's test that values get syncd with the option set
		Jetpack_Options::update_option( 'migrate_for_idc', true );

		$this->server_replica_storage->reset();
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertEquals( $home_option,  $this->server_replica_storage->get_callable( 'home_url' ) );
		$this->assertEquals( $siteurl_option, $this->server_replica_storage->get_callable( 'site_url' ) );
		$this->assertEquals( $main_network, $this->server_replica_storage->get_callable( 'main_network_site' ) );

		Jetpack_Options::delete_option( 'migrate_for_idc' );
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

	function test_get_protocol_normalized_url_works_with_no_history() {
		$callable_type = 'home_url';
		$option_key = Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );

		$this->assertStringStartsWith(
			'http://',
			Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
		);

		delete_option( $option_key );

		$this->assertStringStartsWith(
			'https://',
			Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_https_example_com() )
		);

		$this->assertCount( 1, get_option( $option_key ) );

		delete_option( $option_key );
	}

	function test_get_protocol_normalized_url_stores_max_history() {
		$callable_type = 'home_url';
		$option_key = Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );
		for ( $i = 0; $i < 20; $i++ ) {
			Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_example_com() );
		}

		$this->assertCount( Jetpack_Sync_Functions::HTTPS_CHECK_HISTORY, get_option( $option_key ) );
		delete_option( $option_key );
	}

	function test_get_protocol_normalized_url_returns_http_when_https_falls_off() {
		$callable_type = 'home_url';
		$option_key = Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable_type;
		delete_option( $option_key );

		// Start with one https scheme
		$this->assertStringStartsWith(
			'https://',
			Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_https_example_com() )
		);

		// Now add enough http schemes to fill up the history
		for ( $i = 1; $i < Jetpack_Sync_Functions::HTTPS_CHECK_HISTORY; $i++ ) {
			$this->assertStringStartsWith(
				'https://',
				Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
			);
		}

		// Now that the history is full, this one should cause the function to return false.
		$this->assertStringStartsWith(
			'http://',
			Jetpack_Sync_Functions::get_protocol_normalized_url( $callable_type, $this->return_example_com() )
		);
	}

	function test_get_protocol_normalized_url_returns_new_value_cannot_parse() {
		$test_url = 'http:///example.com';
		$this->assertEquals(
			$test_url,
			Jetpack_Sync_Functions::get_protocol_normalized_url( 'home_url', $test_url )
		);
	}

	function test_get_protocol_normalized_url_cleared_on_reset_data() {
		Jetpack_Sync_Functions::get_protocol_normalized_url( 'home_url', get_home_url() );
		Jetpack_Sync_Functions::get_protocol_normalized_url( 'site_url', get_site_url() );
		Jetpack_Sync_Functions::get_protocol_normalized_url( 'main_network_site_url', network_site_url() );

		$url_callables = array( 'home_url', 'site_url', 'main_network_site_url' );
		foreach( $url_callables as $callable ) {
			$this->assertInternalType( 'array', get_option( Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable) );
		}

		Jetpack_Sync_Sender::get_instance()->uninstall();

		foreach( $url_callables as $callable ) {
			$this->assertFalse( get_option( Jetpack_Sync_Functions::HTTPS_CHECK_OPTION_PREFIX . $callable ) );
		}
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

	function test_calling_taxonomies_do_not_modify_global() {
		global $wp_taxonomies;
		// adds taxonomies.
		$test = new ABC_FOO_TEST_Taxonomy_Example();
		$this->setSyncClientDefaults();
		$sync_callable_taxonomies = Jetpack_Sync_Functions::get_taxonomies();

		$this->assertNull( $sync_callable_taxonomies['example']->update_count_callback );
		$this->assertNull( $sync_callable_taxonomies['example']->meta_box_cb );

		$this->assertNotNull( $wp_taxonomies['example']->update_count_callback );
		$this->assertNotNull( $wp_taxonomies['example']->meta_box_cb );

	}

	function test_sanitize_sync_taxonomies_method() {

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'post_tags_meta_box' ) );
		$this->assertEquals( $sanitized->meta_box_cb, 'post_tags_meta_box' );

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'post_categories_meta_box' ) );
		$this->assertEquals( $sanitized->meta_box_cb, 'post_categories_meta_box' );

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'meta_box_cb' => 'banana' ) );
		$this->assertEquals( $sanitized->meta_box_cb, null );

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'update_count_callback' => 'banana' ) );
		$this->assertFalse( isset( $sanitized->update_count_callback ) );

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'rest_controller_class' => 'banana' ) );
		$this->assertEquals( $sanitized->rest_controller_class, null );

		$sanitized = Jetpack_Sync_Functions::sanitize_taxonomy( (object) array( 'rest_controller_class' => 'WP_REST_Terms_Controller' ) );

		$this->assertEquals( $sanitized->rest_controller_class, 'WP_REST_Terms_Controller' );
	}

	function test_sanitize_sync_post_type_method_default() {
		$label = 'foo_default';
		$post_type_object = new WP_Post_Type( $label );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Jetpack_Sync_Functions::sanitize_post_type( $post_type_object );
		$this->assert_sanitized_post_type_default( $sanitized, $label );

	}

	function test_sanitize_sync_post_type_method_remove_unknown_values_set() {
		$label = 'foo_strange';
		$post_type_object = new WP_Post_Type( $label, array( 'foo' => 'bar' ) );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Jetpack_Sync_Functions::sanitize_post_type( $post_type_object );
		$this->assert_sanitized_post_type_default( $sanitized, $label );
	}

	function assert_sanitized_post_type_default( $sanitized, $label ) {
		$this->assertEquals( $label, $sanitized->name );
		$this->assertEquals( 'Posts', $sanitized->label );
		$this->assertEquals( '', $sanitized->description );
		$this->assertEquals( $label, $sanitized->rewrite['slug'] );
		$this->assertEquals( $label, $sanitized->query_var );
		$this->assertEquals( 'post', $sanitized->capability_type );
		$this->assertEquals( array(), $sanitized->taxonomies );
		$this->assertEquals( array(), $sanitized->supports );
		$this->assertEquals( '', $sanitized->_edit_link );

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
		$this->assertTrue( is_array( $sanitized->rewrite ) );
		$this->assertTrue( is_object( $sanitized->cap ) );

	}

	function test_sanitize_sync_post_type_method_all_values_set() {
		$args = array(
			'labels'                => array(
				'stuff' => 'apple',
			),
			'description'           => 'banana',
			'public'                => true,
			'hierarchical'          => true,
			'exclude_from_search'   => false,
			'publicly_queryable'    => true,
			'show_ui'               => true,
			'show_in_menu'          => true,
			'show_in_nav_menus'     => true,
			'show_in_admin_bar'     => true,
			'menu_position'         => 10,
			'menu_icon'             => 'jetpack',
			'capability_type'       => 'foo',
			'capabilities'          => array( 'banana' => true ),
			'map_meta_cap'          => false,
			'supports'              => array( 'everything' ),
			'taxonomies'            => array( 'orange'),
			'has_archive'           => true,
			'rewrite'               => false,
			'query_var'             => 'foo_all_stuff',
			'can_export'            => false,
			'delete_with_user'      => true,
			'show_in_rest'          => true,
			'rest_base'             => 'foo_all_stuffing',
		);
		$post_type_object = new WP_Post_Type( 'foo_all', $args );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->register_meta_boxes();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();

		$sanitized = Jetpack_Sync_Functions::sanitize_post_type( $post_type_object );
		foreach( $args as $arg_key => $arg_value ) {
			//
			if ( in_array( $arg_key, array( 'labels', 'capabilities', 'supports' ) ) ) {
				continue;
			}
			$this->assertEquals( $arg_value, $sanitized->{ $arg_key }, 'Value for ' . $arg_key . 'not as expected' );
		}
	}

	function test_get_post_types_method() {
		global $wp_post_types;
		$synced = Jetpack_Sync_Functions::get_post_types();
		foreach( $wp_post_types as $post_type => $post_type_object ) {
			$post_type_object->rest_controller_class = false;
			if ( ! isset( $post_type_object->supports ) ) {
				$post_type_object->supports = array();
			}
			$synced_post_type = Jetpack_Sync_Functions::expand_synced_post_type( $synced[ $post_type ], $post_type );
			$this->assertEqualsObject( $post_type_object, $synced_post_type, 'POST TYPE :'. $post_type . ' not equal' );
		}
	}

	function test_register_post_types_callback_error() {
		if ( version_compare(PHP_VERSION, '5.4', '<' ) ) {
			$this->markTestSkipped( 'Callbacks are only available in PHP 5.4 and greater' );
			return;
		}
		// This file needs to be included conditionally so PHP 5.2 does not error due to static analysis of this file.
		require_once dirname( __FILE__ ) . '/anonymous_function_test_for_register_post_types_callback_error.php';
		$this->sender->do_sync();

		$post_types =  $this->server_replica_storage->get_callable( 'post_types' );
		$this->assertTrue( isset( $post_types['testing'] ) );
	}

	function test_get_raw_url_by_option_bypasses_filters() {
		add_filter( 'option_home', array( $this, '__return_filtered_url' ) );
		$this->assertTrue( 'http://filteredurl.com' !== Jetpack_Sync_Functions::get_raw_url( 'home' ) );
		remove_filter( 'option_home', array( $this, '__return_filtered_url' ) );
	}

	function test_get_raw_url_by_constant_bypasses_filters() {
		Jetpack_Constants::set_constant( 'WP_HOME', 'http://constanturl.com' );
		Jetpack_Constants::set_constant( 'WP_SITEURL', 'http://constanturl.com' );
		add_filter( 'option_home', array( $this, '__return_filtered_url' ) );
		add_filter( 'option_siteurl', array( $this, '__return_filtered_url' ) );

		if ( is_multisite() ) {
			$this->assertTrue( $this->__return_filtered_url() !== Jetpack_Sync_Functions::get_raw_url( 'home' ) );
			$this->assertTrue( $this->__return_filtered_url() !== Jetpack_Sync_Functions::get_raw_url( 'siteurl' ) );
		} else {
			$this->assertEquals( 'http://constanturl.com', Jetpack_Sync_Functions::get_raw_url( 'home' ) );
			$this->assertEquals( 'http://constanturl.com', Jetpack_Sync_Functions::get_raw_url( 'siteurl' ) );
		}

		remove_filter( 'option_home', array( $this, '__return_filtered_url' ) );
		remove_filter( 'option_siteurl', array( $this, '__return_filtered_url' ) );
		Jetpack_Constants::clear_constants();
	}

	function test_get_raw_url_returns_with_http_if_is_ssl() {
		$home_option = get_option( 'home' );

		// Test without https first
		$this->assertEquals( $home_option, Jetpack_Sync_Functions::get_raw_url( 'home' ) );

		// Now, with https
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals(
			set_url_scheme( $home_option, 'http' ),
			Jetpack_Sync_Functions::get_raw_url( 'home' )
		);
		unset( $_SERVER['HTTPS'] );
	}

	function test_raw_home_url_is_https_when_is_ssl() {
		Jetpack_Constants::set_constant( 'JETPACK_SYNC_USE_RAW_URL', true );

		$home_option = get_option( 'home' );

		// Test without https first
		$this->assertEquals(
			$home_option,
			Jetpack_Sync_Functions::home_url()
		);

		// Now, with https
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals(
			set_url_scheme( $home_option, 'https' ),
			Jetpack_Sync_Functions::home_url()
		);
		unset( $_SERVER['HTTPS'] );
	}

	function test_user_can_stop_raw_urls() {
		add_filter( 'option_home', array( $this, '__return_filtered_url' ) );
		add_filter( 'option_siteurl', array( $this, '__return_filtered_url' ) );

		// Test with constant first
		$this->assertTrue( 'http://filteredurl.com' !== Jetpack_Sync_Functions::home_url() );

		// Now, without, which should return the filtered URL
		Jetpack_Constants::set_constant( 'JETPACK_SYNC_USE_RAW_URL', false );
		$this->assertEquals( $this->__return_filtered_url(), Jetpack_Sync_Functions::home_url() );
		Jetpack_Constants::clear_constants();

		remove_filter( 'option_home', array( $this, '__return_filtered_url' ) );
		remove_filter( 'option_siteurl', array( $this, '__return_filtered_url' ) );
	}

	function test_plugin_action_links_get_synced() {
		// Makes sure that we start fresh
		delete_transient( 'jetpack_plugin_api_action_links_refresh' );
		$helper_all = new Jetpack_Sync_Test_Helper();

		$helper_all->array_override = array( '<a href="fun.php">fun</a>' );
		add_filter( 'plugin_action_links', array( $helper_all, 'filter_override_array' ), 10 );

		$helper_jetpack = new Jetpack_Sync_Test_Helper();
		$helper_jetpack->array_override = array( '<a href="settings.php">settings</a>', '<a href="https://jetpack.com/support">support</a>' );
		add_filter( 'plugin_action_links_jetpack/jetpack.php', array( $helper_jetpack, 'filter_override_array' ), 10 );

		set_current_screen( 'banana' );
		// Let's see if the original values get synced
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		$expected_array = array(
			'hello.php' => array(
				'fun' => admin_url( 'fun.php' )
			),
			'jetpack/jetpack.php' => array(
				'settings' => admin_url( 'settings.php' ),
				'support' => 'https://jetpack.com/support'
			)
		);

		$this->assertEquals( $expected_array, $this->extract_plugins_we_are_testing( $plugins_action_links )  );

		$helper_all->array_override = array( '<a href="not-fun.php">not fun</a>' );

		$this->resetCallableAndConstantTimeouts();

		set_current_screen( 'banana' );
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		// Nothing should have changed since we cache the results.
		$this->assertEquals( $this->extract_plugins_we_are_testing( $plugins_action_links ), $expected_array );

		if ( file_exists( WP_CONTENT_DIR . '/plugins/hello.php' )  ) {
			activate_plugin('hello.php', '', false, true );
		}
		if ( file_exists( WP_CONTENT_DIR . '/plugins/hello-dolly/hello.php' ) ) {
			activate_plugin('hello-dolly/hello.php', '', false, true );
		}

		$this->resetCallableAndConstantTimeouts();
		set_current_screen( 'banana' );
		$this->sender->do_sync();

		$plugins_action_links = $this->server_replica_storage->get_callable( 'get_plugins_action_links' );

		// Links should have changes now since we activated the plugin.
		$expected_array['hello.php'] = array( 'not fun' => admin_url( 'not-fun.php' ) );
		$this->assertEquals( $this->extract_plugins_we_are_testing( $plugins_action_links ), $expected_array, 'Array was not updated to the new value as expected' );
	}

	function extract_plugins_we_are_testing( $plugins_action_links ) {
		$only_plugins_we_care_about = array();
		if ( isset( $plugins_action_links['hello.php'] ) ) {
			$only_plugins_we_care_about['hello.php'] = isset( $plugins_action_links['hello.php'] ) ? $plugins_action_links['hello.php'] : '';
		} else {
			$only_plugins_we_care_about['hello.php'] = isset( $plugins_action_links['hello-dolly/hello.php'] ) ? $plugins_action_links['hello-dolly/hello.php'] : '';
		}

		$only_plugins_we_care_about['jetpack/jetpack.php'] = isset( $plugins_action_links['jetpack/jetpack.php'] ) ? $plugins_action_links['jetpack/jetpack.php'] : '';
		return $only_plugins_we_care_about;
	}

	function cause_fatal_error( $actions ) {
		unset( $actions['activate'] );
		$actions[] = '<a href="/hello">world</a>';
		return $actions;
	}

	function test_fixes_fatal_error( ) {

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

	function __return_filtered_url() {
		return 'http://filteredurl.com';
	}

	function add_www_subdomain_to_siteurl( $url ) {
		$parsed_url = parse_url( $url );

		return "{$parsed_url['scheme']}://www.{$parsed_url['host']}";
	}

	function test_taxonomies_objects_do_not_have_meta_box_callback() {

		new ABC_FOO_TEST_Taxonomy_Example();
		$taxonomies = Jetpack_Sync_Functions::get_taxonomies();
		$taxonomy = $taxonomies['example'];

		$this->assertInternalType( 'object', $taxonomy );
		// Did we get rid of the expected attributes?
		$this->assertNull( $taxonomy->update_count_callback, "example has the update_count_callback attribute, which should be removed since it is a callback" );
		$this->assertNull( $taxonomy->meta_box_cb, "example has the meta_box_cb attribute, which should be removed since it is a callback" );
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
			$this->assertObjectHasAttribute( $test, $taxonomy, "Taxonomy does not have expected {$test} attribute." );
		}
	}

	function test_force_sync_callabled_on_plugin_update() {
		// fake the cron so that we really prevent the callables from being called
		Jetpack_Sync_Settings::$is_doing_cron = true;

		$this->callable_module->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable_random' ) );
		$this->sender->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );

		$this->server_replica_storage->reset();

		$synced_value2 = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEmpty( $synced_value2 );

		$upgrader = (object) array(
			'skin' => (object) array(
				'result' => new WP_Error( 'fail', 'Fail' )
			)
		);

		do_action( 'upgrader_process_complete', $upgrader, array(
			'action' => 'update',
			'type' => 'plugin',
			'bulk' => true,
			'plugins' => array( 'the/the.php' ),
		) );

		$this->sender->do_sync();
		$synced_value3 = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		Jetpack_Sync_Settings::$is_doing_cron = false;
		$this->assertNotEmpty( $synced_value3, 'value is empty!' );

	}

	function test_xml_rpc_request_callables_has_actor() {
		$this->server_event_storage->reset();
		$user = wp_get_current_user();
		wp_set_current_user( 0 ); //
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_callable' );
		$this->assertEquals( $event->user_id, 0, ' Callables user_id is null' );

		$this->resetCallableAndConstantTimeouts();
		$this->mock_authenticated_xml_rpc(); // mock requet
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_callable' );
		// clean up by unsetting globals, etc. set previously by $this->mock_authenticated_xml_rpc()
		$this->mock_authenticated_xml_rpc_cleanup( $user->ID );

		$this->assertEquals( $event->user_id, self::$admin_id, ' Callables XMLRPC_Reqeust not equal to event user_id' );
	}

	function mock_authenticated_xml_rpc() {
		self::$admin_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token'] = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce'] = 'testing123';

		$_SERVER['REQUEST_URI'] = '/xmlrpc.php';
		$_GET['body'] = 'abc';
		$_GET['body-hash'] = base64_encode( sha1( 'abc', true ) );
		$GLOBALS['HTTP_RAW_POST_DATA'] = 'abc';
		$_SERVER['REQUEST_METHOD']  = 'POST';

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
		$normalize = join( "\n", $normalized_request_pieces ) . "\n";

		$_GET['signature'] = base64_encode( hash_hmac( 'sha1', $normalize , 'secret', true ) );

		// call one of the authenticated endpoints
		Jetpack_Constants::set_constant( 'XMLRPC_REQUEST', true );
		$jetpack = Jetpack::init();
		$jetpack->xmlrpc_methods( array() );
		$jetpack->require_jetpack_authentication();
		$jetpack->verify_xml_rpc_signature();
	}

	function mock_authenticated_xml_rpc_cleanup( $user_id ) {
		Jetpack_Constants::clear_constants();
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10 );

		unset( $_GET['token'] );
		unset( $_GET['timestamp'] );
		unset( $_GET['nonce'] );
		$_SERVER['REQUEST_URI'] = '';
		unset( $_GET['body'] );
		unset( $_GET['body-hash'] ) ;
		unset( $GLOBALS['HTTP_RAW_POST_DATA'] );
		unset( $_SERVER['REQUEST_METHOD'] );
		$jetpack = Jetpack::init();
		$jetpack->reset_saved_auth_state();
		wp_set_current_user( $user_id );
		self::$admin_id = null;
	}

	function mock_jetpack_private_options() {
		$user_tokens = array();
		$user_tokens[ self::$admin_id ] = 'pretend_this_is_valid.secret.' . self::$admin_id;
		return array(
			'user_tokens' => $user_tokens,
		);
	}

	function test_get_timezone_from_timezone_string() {
		update_option( 'timezone_string', 'America/Rankin_Inlet' );
		update_option( 'gmt_offset', '' );
		$this->assertEquals( 'America/Rankin Inlet', Jetpack_Sync_Functions::get_timezone() );
	}

	function test_get_timezone_from_gmt_offset_zero() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '0' );
		$this->assertEquals( 'UTC+0', Jetpack_Sync_Functions::get_timezone() );
	}

	function test_get_timezone_from_gmt_offset_plus() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '1' );
		$this->assertEquals( 'UTC+1', Jetpack_Sync_Functions::get_timezone() );
	}

	function test_get_timezone_from_gmt_offset_fractions() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '5.5' );
		$this->assertEquals( 'UTC+5:30', Jetpack_Sync_Functions::get_timezone() );
	}

	function test_get_timezone_from_gmt_offset_minus() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', '-1' );
		$this->assertEquals( 'UTC-1', Jetpack_Sync_Functions::get_timezone() );
	}

	public function test_sync_callable_recursive_gets_checksum() {

		$this->callable_module->set_callable_whitelist( array( 'jetpack_banana' => 'jetpack_recursive_banana' ) );
		$this->sender->do_sync();
		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_banana' );
		$this->assertTrue( ! empty( $synced_value ), 'We couldn\'t synced a value!' );
	}

}

function jetpack_recursive_banana() {
	$banana = new StdClass;
	$banana->arr = array();
	$banana->arr[] = $banana;
	return $banana;
}

function jetpack_foo_is_callable_random() {
	return rand();
}
/* Example Test Taxonomy */
class ABC_FOO_TEST_Taxonomy_Example {
	function __construct() {

		register_taxonomy(
			'example',
			'posts',
			array(
				'meta_box_cb' => 'bob',
				'update_count_callback' => array( $this, 'callback_update_count_callback_tags' ),
				'rest_controller_class' => 'tom'
			)
		);
	}
	function callback_update_count_callback_tags() {
		return 123;
	}

	// Prevent this class being used as part of a Serialization injection attack
	public function __clone() {
		wp_die( __( 'Cheatin’ uh?' ) );
	}
	public function __wakeup() {
		wp_die( __( 'Cheatin’ uh?' ) );
	}
}
