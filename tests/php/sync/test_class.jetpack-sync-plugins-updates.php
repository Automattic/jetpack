<?php

use Automattic\Jetpack\Constants;

if ( ! class_exists( 'WP_Test_Jetpack_Sync_Plugins' ) ) {
	$sync_dir        = dirname( __FILE__ );
	require_once $sync_dir . '/test_class.jetpack-sync-plugins.php';
}
/**
 * Testing CRUD on Plugins
 */
class WP_Test_Jetpack_Sync_Plugins_Updates extends WP_Test_Jetpack_Sync_Base {

	public function setUp() {
		parent::setUp();

		require ABSPATH . 'wp-includes/version.php';
		if ( defined( 'PHP_VERSION_ID' ) && PHP_VERSION_ID < 50300 ) {
			$this->markTestIncomplete( "Right now this doesn't work on PHP 5.2" );
		}

		if (
			version_compare( $wp_version, '4.9.0', '<' )
			&& defined( 'PHP_VERSION_ID' )
			&& PHP_VERSION_ID >= 70200
		) {
			$this->markTestIncomplete( "Right now this doesn't work on PHP 7.2 with WordPress < 4.9" );
		}

		$this->server_event_storage->reset();
	}

	public function tearDown() {
		parent::tearDown();
		Constants::clear_constants();
	}

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		if ( ! file_exists( WP_PLUGIN_DIR . '/the/the.php' ) ) {
			WP_Test_Jetpack_Sync_Plugins::install_the_plugin();
		}
	}

	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();
		if ( file_exists( WP_PLUGIN_DIR . '/the/the.php' ) ) {
			WP_Test_Jetpack_Sync_Plugins::remove_plugin();
		}
	}

	public function test_updating_a_plugin_is_synced() {
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);

		$skins = array(
			new Plugin_Upgrader_Skin( $plugin_defaults ),
			new Automatic_Upgrader_Skin( $plugin_defaults ),
			new WP_Ajax_Upgrader_Skin( $plugin_defaults ),
		);
		foreach( $skins as $skin ) {
			$this->update_the_plugin( $skin );
			$this->sender->do_sync();
			$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );

			$this->assertEquals( 'the/the.php', $updated_plugin->args[0][0]['slug'] );
			$this->server_event_storage->reset();
		}
	}

	public function test_updating_plugin_in_bulk_is_synced() {
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);
		$skins = array(
			new Plugin_Upgrader_Skin( $plugin_defaults ),
			new Automatic_Upgrader_Skin( $plugin_defaults ),
			new WP_Ajax_Upgrader_Skin( $plugin_defaults ),
			new Bulk_Plugin_Upgrader_Skin( $plugin_defaults ),
		);
		foreach ( $skins as $skin ) {
			$this->update_bulk_plugins( $skin );
			$this->sender->do_sync();
			$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );
			$this->assertEquals(  'the/the.php', $updated_plugin->args[0][0]['slug'] );
			$this->server_event_storage->reset();
		}
	}

	public function test_updating_a_plugin_error_is_synced() {
		/**
		 * in WP Plugin_Upgrader->update() doesn't fire the upgrader_process_complete action
		 * when it encounters an error so right now we do not have a way to hook into why a plugin failed.
		 */
		$this->markTestIncomplete( "Right now this doesn't work on PHP 5.2" );

		$this->server_event_storage->reset();
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);
		$skins = array(
			new Plugin_Upgrader_Skin( $plugin_defaults ),
			new Automatic_Upgrader_Skin( $plugin_defaults ),
			new WP_Ajax_Upgrader_Skin( $plugin_defaults ),
		);
		foreach( $skins as $skin ) {
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
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);
		$skins = array(
			new Plugin_Upgrader_Skin( $plugin_defaults ),
			new Automatic_Upgrader_Skin( $plugin_defaults ),
			new WP_Ajax_Upgrader_Skin( $plugin_defaults ),
			new Bulk_Plugin_Upgrader_Skin( $plugin_defaults ),
		);
		foreach ( $skins as $skin ) {
			$this->set_error();
			$this->update_bulk_plugins( $skin );
			$this->remove_error();
			$this->sender->do_sync();
			$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_update_failed' );
			$this->assertEquals(  'the/the.php', $updated_plugin->args[0]['slug'], get_class( $skin ) . ' Wasn\'t able to sync failed login attempt' );
			$this->server_event_storage->reset();
		}
	}

	function test_updating_error_with_autoupdate_constant_results_in_proper_state() {
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);

		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );

		$this->set_error();
		$this->update_bulk_plugins( new WP_Ajax_Upgrader_Skin( $plugin_defaults ) );
		$this->remove_error();
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_update_failed' );
		$this->assertTrue( $updated_plugin->args[3]['is_autoupdate'] );
		$this->server_event_storage->reset();
	}

	function test_updating_with_autoupdate_constant_results_in_proper_state() {
		$plugin_defaults = array(
			'title'  => '',
			'url'    => '',
			'nonce'  => '',
			'plugin' => '',
			'api'    => '',
		);

		Constants::set_constant( 'JETPACK_PLUGIN_AUTOUPDATE', true );
		$this->update_bulk_plugins( new WP_Ajax_Upgrader_Skin( $plugin_defaults ) );
		$this->sender->do_sync();
		$updated_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugins_updated' );
		$this->assertTrue( $updated_plugin->args[1]['is_autoupdate'] );
		$this->server_event_storage->reset();
	}

	function update_the_plugin( $skin ) {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		add_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient' ) );
		$upgrader = new Plugin_Upgrader( $skin );
		// 'https://downloads.wordpress.org/plugin/the.1.1.zip' Install it from local disk
		$upgrader->upgrade( 'the/the.php' );
		remove_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient' ) );
	}

	function update_bulk_plugins( $skin ) {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		add_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient' ) );
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->bulk_upgrade( array( 'the/the.php' ) );
		remove_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient' ) );
	}

	function set_update_plugin_transient( $transient ) {
		return (object) array(
			'response' => array(
				'the/the.php' => (object) array(
					'package' => ABSPATH . WP_Test_Jetpack_Sync_Plugins::PLUGIN_ZIP
				)
			)
		);
	}

	public function set_error() {
		add_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient_with_error' ), 11 );
	}

	public function remove_error() {
		remove_filter( 'site_transient_update_plugins' , array( $this, 'set_update_plugin_transient_with_error' ), 11 );
	}
	function set_update_plugin_transient_with_error( $transient ) {
		return (object) array(
			'response' => array(
				'the/the.php' => (object) array(
					'package' => ABSPATH . WP_Test_Jetpack_Sync_Plugins::PLUGIN_ZIP . '-doesnotexitst.zip'
				)
			)
		);
	}
}
