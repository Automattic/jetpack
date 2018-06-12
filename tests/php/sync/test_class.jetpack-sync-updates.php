<?php

/**
 * Testing Updates Sync
 */
class WP_Test_Jetpack_Sync_Updates extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->sender->reset_data();
		wp_set_current_user( 1 );
		$this->sender->do_sync();
	}

	public function test_update_plugins_is_synced() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_plugins();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'plugins' );

		$this->assertFalse( isset( $updates->no_update ) );
		$this->assertTrue( isset( $updates->response ) );

		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_sync_update_themes() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_themes();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$theme = reset( $updates->response );
		
		$this->assertTrue( (bool) $theme['name'] );
		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_sync_maybe_update_core() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		$this->sender->do_sync();
		delete_site_transient( 'update_core' );
		$this->server_event_storage->reset();

		_maybe_update_core();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( is_int( $updates->last_checked ) );
		
		// Since the transient gets updates twice and we only care about the
		// last update we only want to see 1 sync event.
		$events = $this->server_event_storage->get_all_events( 'jetpack_update_core_change' );
		$this->assertEquals( count( $events ) , 1 );

	}

	public function test_sync_wp_version() {
		global $wp_version;
		$previous_version = $wp_version;
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );

		// Lets pretend that we updated the wp_version to bar.
		$wp_version = 'bar';
		do_action( 'upgrader_process_complete', null, array( 'action' => 'update', 'type' => 'core' ) );
		$this->sender->do_sync();
		$wp_version = $previous_version;
		$this->assertEquals( 'bar', $this->server_replica_storage->get_callable( 'wp_version' ) );
	}

	public function test_automatic_updates_complete_sync_action() {
		// wp_maybe_auto_update();
		do_action( 'automatic_updates_complete', array( 'core' => array(
			'item'     => array( 'somedata' ),
			'result'   => 'some more data',
			'name'     => 'WordPress 4.7',
			'messages' => array( 'it worked.' ) ) ) );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'automatic_updates_complete' );
		$this->assertTrue( (bool) $event );
	}


	public function test_network_core_update_sync_action() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with single site mode' );
		}

		global $wp_db_version, $wp_version;
		update_site_option( 'wpmu_upgrade_site', (int)$wp_db_version + 1 );
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
		$this->assertEquals( $event->args[0], 'foo' ); // Old Version
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
		$this->assertEquals( $event->args[0], 'foo' ); // Old Version
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
		$this->assertEquals( $event->args[0], 'foo' ); // New version
	}
}
