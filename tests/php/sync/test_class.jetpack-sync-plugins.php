<?php

/**
 * Testing CRUD on Plugins
 */
class WP_Test_Jetpack_Sync_Plugins extends WP_Test_Jetpack_Sync_Base {
	protected $theme;

	public function setUp() {
		parent::setUp();
	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_installing_and_removing_plugin_is_synced() {
		if ( defined( 'PHP_VERSION_ID' ) && PHP_VERSION_ID < 50300 ) {
			$this->markTestIncomplete("Right now this doesn't work on PHP 5.2");	
		}
		$this->remove_plugin(); // make sure that we start with no plugin.
		$this->install_wp_super_cache();
		$this->sender->do_sync();

		$plugins = $this->server_replica_storage->get_callable( 'get_plugins' );
		$this->assertEquals( get_plugins(), $plugins );
		$this->assertTrue( isset( $plugins['wp-super-cache/wp-cache.php'] ) );
		// gets called via callable.
		$this->assertEquals( get_option( 'uninstall_plugins', array() ), $this->server_replica_storage->get_option( 'uninstall_plugins', array() ) );


		// Remove plugin
		$this->remove_plugin();
		$this->sender->do_sync();
		$plugins = $this->server_replica_storage->get_callable( 'get_plugins' );
		$this->assertEquals( get_plugins(), $plugins );
		$this->assertFalse( isset( $plugins['wp-super-cache/wp-cache.php'] ) );

	}

	public function test_activate_and_deactivating_plugin_is_synced() {
		activate_plugin( 'hello.php' );
		$this->sender->do_sync();

		$active_plugins = $this->server_replica_storage->get_option( 'active_plugins' );
		$this->assertEquals( get_option( 'active_plugins' ), $active_plugins );
		$this->assertTrue( in_array( 'hello.php', $active_plugins ) );

		deactivate_plugins( 'hello.php' );
		$this->sender->do_sync();

		$active_plugins = $this->server_replica_storage->get_option( 'active_plugins' );
		$this->assertEquals( get_option( 'active_plugins' ), $active_plugins );
		$this->assertFalse( in_array( 'hello.php', $active_plugins ) );
	}

	public function test_autoupdate_enabled_and_disabled_is_synced() {
		// enable autoupdates
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$autoupdate_plugins = array_unique( array_merge( $autoupdate_plugins, array( 'hello' ) ) );
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
		$this->sender->do_sync();

		$set_autoupdate_plugin = $this->server_replica_storage->get_option( 'jetpack_autoupdate_plugins', array() );

		$this->assertEquals( Jetpack_Options::get_option( 'autoupdate_plugins', array() ), $set_autoupdate_plugin );
		$this->assertTrue( in_array( 'hello', $set_autoupdate_plugin ) );

		// disable autoupdates
		$autoupdate_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$autoupdate_plugins = array_diff( $autoupdate_plugins, array( 'hello' ) );
		Jetpack_Options::update_option( 'autoupdate_plugins', $autoupdate_plugins );
		$this->sender->do_sync();

		$set_autoupdate_plugin = $this->server_replica_storage->get_option( 'jetpack_autoupdate_plugins' );
		$this->assertEquals( Jetpack_Options::get_option( 'autoupdate_plugins', array() ), $set_autoupdate_plugin );
		$this->assertFalse( in_array( 'hello', $set_autoupdate_plugin ) );
	}

	function install_wp_super_cache() {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// code from wp-admin/update.php
		$api = plugins_api( 'plugin_information', array(
			'slug'   => 'wp-super-cache',
			'fields' => array(
				'short_description' => false,
				'sections'          => false,
				'requires'          => false,
				'rating'            => false,
				'ratings'           => false,
				'downloaded'        => false,
				'last_updated'      => false,
				'added'             => false,
				'tags'              => false,
				'compatibility'     => false,
				'homepage'          => false,
				'donate_link'       => false,
			),
		) );

		if ( is_wp_error( $api ) ) {
			wp_die( $api );
		}
		$upgrader = new Plugin_Upgrader(
			new Automatic_Upgrader_Skin( compact( 'title', 'url', 'nonce', 'plugin', 'api' ) )
		);

		$upgrader->install( $api->download_link );

	}

	function test_plugin_activation_action_is_synced() {
		activate_plugin( 'hello.php' );
		$this->sender->do_sync();

		$activated_plugin = $this->server_event_storage->get_most_recent_event( 'activated_plugin' );

		$this->assertTrue( isset( $activated_plugin->args ) );
		$this->assertEquals( 'hello.php', $activated_plugin->args[0] );
		$this->assertFalse( $activated_plugin->args[1] );
	}

	function test_plugin_deactivation_action_is_synced() {
		activate_plugin( 'hello.php' );
		deactivate_plugins( 'hello.php' );
		$this->sender->do_sync();

		$deactivated_plugin = $this->server_event_storage->get_most_recent_event( 'deactivated_plugin' );
		$this->assertTrue( isset( $deactivated_plugin->args ) );
		$this->assertEquals( 'hello.php', $deactivated_plugin->args[0] );
		$this->assertFalse( $deactivated_plugin->args[1] );
	}

	function test_all_plugins_filter_is_respected() {
		$this->sender->do_sync();
		$plugins = get_plugins();

		if ( ! isset( $plugins['hello.php'] ) ) {
			$this->markTestSkipped( 'Plugin hello dolly is not available' );
		}
		add_filter( 'all_plugins', array( $this, 'remove_hello_dolly' ) );
		$this->resetCallableAndConstantTimeouts();
		$this->sender->do_sync();

		remove_filter( 'all_plugins', array( $this, 'remove_hello_dolly' ) );

		$synced_plugins = $this->server_replica_storage->get_callable( 'get_plugins' );
		$not_synced     = array_diff_key( $plugins, $synced_plugins );

		$this->assertTrue( isset( $not_synced['hello.php'] ) );
	}

	function remove_plugin() {
		delete_plugins( array( 'wp-super-cache/wp-cache.php' ) );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	function remove_hello_dolly( $plugins ) {
		unset( $plugins['hello.php'] );

		return $plugins;
	}

}
