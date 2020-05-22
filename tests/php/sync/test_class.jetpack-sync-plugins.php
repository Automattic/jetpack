<?php
/**
 * Testing CRUD on Plugins
 */
class WP_Test_Jetpack_Sync_Plugins extends WP_Test_Jetpack_Sync_Base {
	protected $theme;
	const PLUGIN_ZIP = 'wp-content/plugins/jetpack/tests/php/files/the.1.1.zip';

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

		$this->resetCallableAndConstantTimeouts();
		$this->sender->do_sync();
		$this->server_event_storage->reset();
		$this->resetCallableAndConstantTimeouts();

		self::remove_plugin(); // make sure that we start with no plugin.

		$this->server_event_storage->reset();

		self::install_the_plugin();
		$this->sender->do_sync();
		//Determine which action came first as between jetpack_installed_plugin and jetpack_sync_callable
		$events = $this->server_event_storage->get_all_events();

		$first_action = false;
		foreach( $events as $event ) {
			if ( 'jetpack_plugin_installed' === $event->action ||
			'jetpack_sync_callable' === $event->action ) {
				$first_action = $event->action;
				break;
			}
		}
		$this->assertEquals( 'jetpack_plugin_installed', $first_action, 'First action is not jetpack plugin installed' );

		$installed_plugin = $this->server_event_storage->get_most_recent_event( 'jetpack_plugin_installed' );
		$this->assertEquals( 'the/the.php', $installed_plugin->args[0][0]['slug'] );
		$this->assertEquals( 'The', $installed_plugin->args[0][0]['Name'] );

		$plugins = $this->server_replica_storage->get_callable( 'get_plugins' );
		$this->assertEquals( get_plugins(), $plugins );
		$this->assertTrue( isset( $plugins['the/the.php'] ) );
		// gets called via callable.
		$this->assertEquals( get_option( 'uninstall_plugins', array() ), $this->server_replica_storage->get_option( 'uninstall_plugins', array() ) );


		// Remove plugin
		self::remove_plugin();
		$this->sender->do_sync();
		$plugins = $this->server_replica_storage->get_callable( 'get_plugins' );
		$this->assertEquals( get_plugins(), $plugins );
		$this->assertFalse( isset( $plugins['the/the.php'] ) );
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

	public function test_edit_plugin() {
		$_POST = array(
			'action' => 'update',
			'plugin' => 'hello.php',
			'newcontent' => 'stuff',
		);
		set_current_screen( 'plugin-editor' );

		/**
		 * This action is already documented in wp-admin/admin.php
		 *
		 * The 'update' portion of the hook name is from `$_REQUEST['action']`,
		 * e.g. 'admin_action_' . $_REQUEST['action']
		 *
		 * @since 2.6.0
		 */
		do_action( 'admin_action_update' );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_edited_plugin' );

		$plugins = get_plugins();
		$this->assertEquals( 'hello.php', $event->args[0] );
		$this->assertEquals( $plugins['hello.php'], $event->args[1] );
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

	function test_plugin_activation_action_is_synced() {
		activate_plugin( 'hello.php' );
		$this->sender->do_sync();

		$activated_plugin = $this->server_event_storage->get_most_recent_event( 'activated_plugin' );

		$this->assertTrue( isset( $activated_plugin->args ) );
		$this->assertEquals( 'hello.php', $activated_plugin->args[0] );
		$this->assertFalse( $activated_plugin->args[1] );
		$this->assertEquals( 'Hello Dolly', $activated_plugin->args[2]['name'] );
		$this->assertTrue( (bool) $activated_plugin->args[2]['version'] );
	}

	function test_plugin_deactivation_action_is_synced() {
		activate_plugin( 'hello.php' );
		deactivate_plugins( 'hello.php' );
		$this->sender->do_sync();

		$deactivated_plugin = $this->server_event_storage->get_most_recent_event( 'deactivated_plugin' );
		$this->assertTrue( isset( $deactivated_plugin->args ) );
		$this->assertEquals( 'hello.php', $deactivated_plugin->args[0] );
		$this->assertFalse( $deactivated_plugin->args[1] );
		$this->assertEquals( 'Hello Dolly', $deactivated_plugin->args[2]['name'] );
		$this->assertTrue( (bool) $deactivated_plugin->args[2]['version'] );
	}

	function test_plugin_deletion_is_synced() {
		do_action( 'delete_plugin', 'hello.php' );
		do_action( 'deleted_plugin', 'hello.php', true );
		$this->sender->do_sync();

		$delete_plugin = $this->server_event_storage->get_most_recent_event( 'deleted_plugin' );
		$this->assertTrue( isset( $delete_plugin->args ) );
		$this->assertEquals( 'hello.php', $delete_plugin->args[0] );
		$this->assertTrue( $delete_plugin->args[1] );
		$this->assertEquals( 'Hello Dolly', $delete_plugin->args[2]['name'] );
		$this->assertTrue( (bool) $delete_plugin->args[2]['version'] );

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

	static function install_the_plugin() {
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		$upgrader = new Plugin_Upgrader(
			new Automatic_Upgrader_Skin( compact( 'title', 'url', 'nonce', 'plugin', 'api' ) )
		);
		// 'https://downloads.wordpress.org/plugin/the.1.1.zip' Install it from local disk
		$upgrader->install( ABSPATH . self::PLUGIN_ZIP );
	}

	function set_update_plugin_transient( $transient ) {
		return (object) array(
			'response' => array(
				'the/the.php' => (object) array(
					'package' => ABSPATH . self::PLUGIN_ZIP
				)
			)
		);
	}

	static function remove_plugin() {
		if ( file_exists( ABSPATH .  'wp-content/plugins/the/the.php' ) ) {
			delete_plugins( array( 'the/the.php' ) );
			wp_cache_delete( 'plugins', 'plugins' );
		}
	}

	function remove_hello_dolly( $plugins ) {
		unset( $plugins['hello.php'] );
		return $plugins;
	}

}
