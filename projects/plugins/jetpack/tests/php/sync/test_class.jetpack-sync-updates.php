<?php

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Modules;

/**
 * Testing Updates Sync
 */
class WP_Test_Jetpack_Sync_Updates extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->sender->reset_data();
		wp_set_current_user( 1 );
		$this->sender->do_sync();
	}

	public function check_for_updates_to_sync() {
		$updates_module = Modules::get_module( 'updates' );
		$updates_module->sync_last_event();
	}

	public function test_update_plugins_is_synced() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		wp_update_plugins();
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );

		$this->check_for_updates_to_sync();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'plugins' );

		$this->assertFalse( isset( $updates->no_update ) );
		$this->assertTrue( is_int( $updates->last_checked ) );

		$this->assertArrayHasKey( 'hello', $updates->response );
	}

	public function test_update_plugins_is_synced_once() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}
		$this->server_event_storage->reset();
		$current = get_site_transient( 'update_plugins' );

		$response = $this->new_plugin_response( '1' );
		set_site_transient( 'update_plugins', $response );

		$response = $this->new_plugin_response( '2' );
		set_site_transient( 'update_plugins', $response );

		$response = $this->new_plugin_response( '3' );
		set_site_transient( 'update_plugins', $response );

				$updates_module = Modules::get_module( 'updates' );
		$updates_module->sync_last_event();
		$has_action = has_action( 'shutdown', array( $updates_module, 'sync_last_event' ) );
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_update_plugins_change' );

		set_site_transient( 'update_plugins', $current );

		// Only 1 event should be recorded..
		$this->assertCount( 1, $events );
		$this->assertEquals( $events[0]->args[0], $response );
		$this->assertTrue( (bool) $has_action );
	}

	public function new_plugin_response( $new_version ) {
		return (object) array(
			'response'  => array(
				'hello' => (object) array(
					'new_version' => $new_version,
				),
			),
			'no_update' => array(
				'jetpack/jetpack.php' => true,
			),
		);
	}

	public function test_sync_update_themes() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}
		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		wp_update_themes();
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );

		$this->check_for_updates_to_sync();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$theme   = reset( $updates->response );

		$this->assertSame( 'hello', $theme['name'] );
		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_update_themes_is_synced_once() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}
		$this->server_event_storage->reset();
		$current = get_site_transient( 'update_themes' );

		$response = $this->new_theme_response( '1' );
		set_site_transient( 'update_themes', $response );

		$response = $this->new_theme_response( '2' );
		set_site_transient( 'update_themes', $response );

		$response = $this->new_theme_response( '3' );
		set_site_transient( 'update_themes', $response );

				$updates_module = Modules::get_module( 'updates' );
		$updates_module->sync_last_event();

		$has_action = has_action( 'shutdown', array( $updates_module, 'sync_last_event' ) );

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_update_themes_change' );

		set_site_transient( 'update_plugins', $current );

		// Only 1 event should be recorded..
		$this->assertCount( 1, $events );
		$this->assertEquals( $events[0]->args[0], $response );
		$this->assertTrue( (bool) $has_action );
	}

	public function new_theme_response( $new_version ) {
		return (object) array(
			'response' => array(
				'hello' => array(
					'new_version' => $new_version,
					'name'        => 'hello',
				),
			),
			'checked'  => true,
		);
	}

	public function test_sync_maybe_update_core() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		$this->sender->do_sync();
		delete_site_transient( 'update_core' );
		$this->server_event_storage->reset();

		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		_maybe_update_core();
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );

		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( is_int( $updates->last_checked ) );

		// Since the transient gets updates twice and we only care about the
		// last update we only want to see 1 sync event.
		$events = $this->server_event_storage->get_all_events( 'jetpack_update_core_change' );
		$this->assertCount( 1, $events );

	}

	public function test_sync_wp_version() {
		global $wp_version;
		$previous_version = $wp_version;
		$this->sender->do_sync();
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );

		// Lets pretend that we updated the wp_version to bar.

		$wp_version = 'bar';

		add_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ), 10, 3 );
		do_action(
			'upgrader_process_complete',
			null,
			array(
				'action' => 'update',
				'type'   => 'core',
			)
		);
		remove_filter( 'pre_http_request', array( 'WP_Test_Jetpack_Sync_Base', 'pre_http_request_wordpress_org_updates' ) );

		$this->sender->do_sync();
		$wp_version = $previous_version;

		$this->assertEquals( 'bar', $this->server_replica_storage->get_callable( 'wp_version' ) );
	}

	public function test_automatic_updates_complete_sync_action() {
		// Commenting this out for now. wp_maybe_auto_update();
		do_action(
			'automatic_updates_complete',
			array(
				'core' => array(
					'item'     => array( 'somedata' ),
					'result'   => 'some more data',
					'name'     => 'WordPress 4.7',
					'messages' => array( 'it worked.' ),
				),
			)
		);
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'automatic_updates_complete' );
		$this->assertTrue( (bool) $event );
	}

	public function test_network_core_update_sync_action() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with single site mode' );
		}

		global $wp_db_version, $wp_version;
		update_site_option( 'wpmu_upgrade_site', (int) $wp_db_version + 1 );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_update_network' );
		$this->assertTrue( (bool) $event );
		$this->assertEquals( $event->args[0], $wp_db_version + 1 );
		$this->assertEquals( $event->args[1], $wp_db_version );
		$this->assertEquals( $event->args[2], $wp_version );
	}

	public function test_update_core_successfully_sync_action() {
		global $wp_version, $pagenow;
		$current_page = $pagenow;

		$pagenow = 'update-core.php';
		// Remove the _redirect_to_about_wordpress action
		remove_action( '_core_updated_successfully', '_redirect_to_about_wordpress' );
		do_action( '_core_updated_successfully', 'foo' );
		$pagenow = $current_page; // revert page now
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_updated_successfully' );

		$this->assertTrue( (bool) $event );
		$this->assertEquals( 'foo', $event->args[0] ); // Old Version
		$this->assertEquals( $event->args[1], $wp_version ); // New version
	}

	public function test_autoupdate_core_successfully_sync_action() {
		global $wp_version;

		// Remove the _redirect_to_about_wordpress action
		remove_action( '_core_updated_successfully', '_redirect_to_about_wordpress' );
		do_action( '_core_updated_successfully', 'foo' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_autoupdated_successfully' );

		$this->assertTrue( (bool) $event );
		$this->assertEquals( 'foo', $event->args[0] ); // Old Version
		$this->assertEquals( $event->args[1], $wp_version ); // New version
	}

	public function test_update_core_successfully_sync_action_using_wpcom_rest_api() {
		global $wp_version, $pagenow;

		$this->assertFalse( $pagenow === 'update-core.php' );
		Constants::set_constant( 'REST_API_REQUEST', true );
		Modules::get_module( 'updates' )->update_core( 'new_version' );
		$this->sender->do_sync();

		Constants::clear_single_constant( 'REST_API_REQUEST' );

		$autoupdate_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_autoupdated_successfully' );
		$event            = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_updated_successfully' );
		$this->assertFalse( (bool) $autoupdate_event );
		$this->assertTrue( (bool) $event );
		$this->assertEquals( 'new_version', $event->args[0] ); // Old Version
		$this->assertEquals( $event->args[1], $wp_version ); // New version
	}

	public function test_reinstall_core_successfully_sync_action() {
		global $_GET;
		$_GET['action'] = 'do-core-reinstall';

		// Remove the _redirect_to_about_wordpress action
		remove_action( '_core_updated_successfully', '_redirect_to_about_wordpress' );
		do_action( '_core_updated_successfully', 'foo' );
		$this->sender->do_sync();

		unset( $_GET['action'] );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_core_reinstalled_successfully' );

		$this->assertTrue( (bool) $event );
		$this->assertEquals( 'foo', $event->args[0] ); // New version
	}

	/**
	 * Verify that all updates are returned by get_objects_by_id.
	 */
	public function test_get_objects_by_id_all() {
		$module      = Modules::get_module( 'updates' );
		$all_updates = $module->get_objects_by_id( 'update', array( 'all' ) );
		$this->assertEquals( $module->get_all_updates(), $all_updates );
	}

	/**
	 * Verify that get_object_by_id returns an allowed update.
	 */
	public function test_get_objects_by_id_singular() {
		$module      = Modules::get_module( 'updates' );
		$updates     = $module->get_all_updates();
		$get_updates = $module->get_objects_by_id( 'update', array( 'core' ) );
		$this->assertEquals( $updates['core'], $get_updates['core'] );
	}
}
