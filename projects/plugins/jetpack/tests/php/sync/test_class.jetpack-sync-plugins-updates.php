<?php

use Automattic\Jetpack\Constants;

require_once __DIR__ . '/test_class.jetpack-sync-plugins.php';
require_once __DIR__ . '/class.silent-upgrader-skin.php';

/**
 * Testing CRUD on Plugins
 */
class WP_Test_Jetpack_Sync_Plugins_Updates extends WP_Test_Jetpack_Sync_Base {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		require ABSPATH . 'wp-includes/version.php';
		$this->server_event_storage->reset();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();
		Constants::clear_constants();
	}

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		if ( ! file_exists( WP_PLUGIN_DIR . '/the/the.php' ) ) {
			WP_Test_Jetpack_Sync_Plugins::install_the_plugin();
		}
	}

	/**
	 * Tear down after class.
	 */
	public static function tear_down_after_class() {
		parent::tear_down_after_class();
		if ( file_exists( WP_PLUGIN_DIR . '/the/the.php' ) ) {
			WP_Test_Jetpack_Sync_Plugins::remove_plugin();
		}
	}

	public function test_updating_a_plugin_is_synced() {
		$this->update_the_plugin( new Silent_Upgrader_Skin() );
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );

		$this->assertEquals( 'the/the.php', $updated_plugin->args[0][0]['slug'] );
		$this->server_event_storage->reset();
	}

	public function test_updating_plugin_in_bulk_is_synced() {
		$this->update_bulk_plugins( new Silent_Upgrader_Skin() );
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );
		$this->assertEquals( 'the/the.php', $updated_plugin->args[0][0]['slug'] );
		$this->server_event_storage->reset();
	}

	public function test_updating_a_plugin_error_is_synced() {
		/**
		 * In WP Plugin_Upgrader->update() doesn't fire the upgrader_process_complete action
		 * when it encounters an error so right now we do not have a way to hook into why a plugin failed.
		 */
		$this->markTestIncomplete( "Right now this doesn't work." );

		$this->server_event_storage->reset();
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);
		$skins           = array(
			new Plugin_Upgrader_Skin( $plugin_defaults ),
			new Automatic_Upgrader_Skin( $plugin_defaults ),
			new WP_Ajax_Upgrader_Skin( $plugin_defaults ),
		);
		foreach ( $skins as $skin ) {
			$this->set_error();
			$this->update_the_plugin( $skin );
			$this->remove_error();
			$this->sender->do_sync();
			$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_update_failed' );
			$this->assertEquals( array( 'the/the.php' ), $updated_plugin->args[0]['slug'] );
			$this->server_event_storage->reset();
		}
	}

	public function test_updating_plugin_error_in_bulk_is_synced() {
		$this->set_error();
		$this->update_bulk_plugins( new Silent_Upgrader_Skin() );
		$this->remove_error();
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_update_failed' );
		$this->assertEquals( 'the/the.php', $updated_plugin->args[0]['slug'], 'Silent_Upgrader_Skin Wasn\'t able to sync failed login attempt' );
		$this->server_event_storage->reset();
	}

	public function test_updating_error_with_autoupdate_constant_results_in_proper_state() {
		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );

		$this->set_error();
		$this->update_bulk_plugins( new Silent_Upgrader_Skin() );
		$this->remove_error();
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_update_failed' );
		$this->assertTrue( $updated_plugin->args[3]['is_autoupdate'] );
		$this->server_event_storage->reset();
	}

	public function test_updating_with_autoupdate_constant_results_in_proper_state() {
		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );
		$this->update_bulk_plugins( new Silent_Upgrader_Skin() );
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );
		$this->assertTrue( $updated_plugin->args[1]['is_autoupdate'] );
		$this->server_event_storage->reset();
	}

	public function update_the_plugin( $skin ) {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		add_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient' ) );
		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		$upgrader = new Plugin_Upgrader( $skin );
		// 'https://downloads.wordpress.org/plugin/the.1.1.zip' Install it from local disk
		$upgrader->upgrade( 'the/the.php' );
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );
		remove_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient' ) );
	}

	public function update_bulk_plugins( $skin ) {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		add_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient' ) );
		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->bulk_upgrade( array( 'the/the.php' ) );
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );
		remove_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient' ) );
	}

	public function set_update_plugin_transient() {
		return (object) array(
			'response' => array(
				'the/the.php' => (object) array(
					'package' => WP_Test_Jetpack_Sync_Plugins::PLUGIN_ZIP,
				),
			),
		);
	}

	public function set_error() {
		add_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient_with_error' ), 11 );
	}

	public function remove_error() {
		remove_filter( 'site_transient_update_plugins', array( $this, 'set_update_plugin_transient_with_error' ), 11 );
	}

	public function set_update_plugin_transient_with_error() {
		return (object) array(
			'response' => array(
				'the/the.php' => (object) array(
					'package' => WP_Test_Jetpack_Sync_Plugins::PLUGIN_ZIP . '-doesnotexitst.zip',
				),
			),
		);
	}
}
