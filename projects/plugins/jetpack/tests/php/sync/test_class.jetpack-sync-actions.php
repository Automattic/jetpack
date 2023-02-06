<?php

use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Lock;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Actions extends WP_UnitTestCase {
	public function test_get_sync_status() {
		$no_checksum = Actions::get_sync_status();
		$this->assertArrayNotHasKey( 'posts_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'comments_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $no_checksum );

		$kitchen_sink_checksum = Actions::get_sync_status(
			'posts_checksum,comments_checksum,post_meta_checksum,comment_meta_checksum'
		);
		$this->assertArrayHasKey( 'posts_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'comments_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'post_meta_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'comment_meta_checksum', $kitchen_sink_checksum );

		$posts = Actions::get_sync_status( 'posts_checksum' );
		$this->assertArrayHasKey( 'posts_checksum', $posts );
		$this->assertArrayNotHasKey( 'comments_checksum', $posts );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $posts );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $posts );

		$comments = Actions::get_sync_status(
			'comments_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $comments );
		$this->assertArrayHasKey( 'comments_checksum', $comments );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $comments );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $comments );

		$post_meta = Actions::get_sync_status(
			'post_meta_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $post_meta );
		$this->assertArrayNotHasKey( 'comments_checksum', $post_meta );
		$this->assertArrayHasKey( 'post_meta_checksum', $post_meta );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $post_meta );

		$comment_meta = Actions::get_sync_status(
			'comment_meta_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $comment_meta );
		$this->assertArrayNotHasKey( 'comments_checksum', $comment_meta );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $comment_meta );
		$this->assertArrayHasKey( 'comment_meta_checksum', $comment_meta );
	}

	public function test_get_sync_status_with_debug_details() {
		$with_debug_details = Actions::get_sync_status( 'debug_details' );
		$this->assertArrayHasKey( 'debug_details', $with_debug_details );

		$debug_details = $with_debug_details['debug_details'];
		$this->assertArrayHasKey( 'sync_allowed', $debug_details );
		$this->assertArrayHasKey( 'sync_health', $debug_details );
		$this->assertArrayHasKey( 'dedicated_sync_enabled', $debug_details );
		$this->assertArrayHasKey( 'sync_locks', $debug_details );

		$sync_locks = $debug_details['sync_locks'];
		$this->assertArrayHasKey( 'retry_time_sync', $sync_locks );
		$this->assertArrayHasKey( 'retry_time_full_sync', $sync_locks );
		$this->assertArrayHasKey( 'next_sync_time_sync', $sync_locks );
		$this->assertArrayHasKey( 'next_sync_time_full_sync', $sync_locks );
		$this->assertArrayHasKey( 'queue_locked_sync', $sync_locks );
		$this->assertArrayHasKey( 'queue_locked_full_sync', $sync_locks );
		$this->assertArrayHasKey( 'dedicated_sync_request_lock', $sync_locks );
	}

	public function test_do_initial_sync_during_full_sync() {
		$full_sync = Modules::get_module( 'full-sync' );
		$full_sync->start();

		$initial_sync = Actions::do_initial_sync();

		$this->assertFalse( $initial_sync );

		$full_sync->reset_data();
	}

	public function test_do_initial_sync_during_no_sync() {
		$initial_sync = Actions::do_initial_sync();

		$this->assertNull( $initial_sync );
	}

	/**
	 * When Jetpack is upgraded, and no health status has been set, it should default to unknown status.
	 */
	public function test_unknown_health_on_upgrade() {
		Actions::cleanup_on_upgrade();
		$this->assertEquals( Health::get_status(), Health::STATUS_UNKNOWN );
	}

	/**
	 * When Jetpack is upgraded, health status should be set to disabled if sync is not enabled.
	 */
	public function test_initialization_status_disabled_on_upgrade() {
		Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
		Settings::update_settings( array( 'disable' => true ) );
		Actions::cleanup_on_upgrade();
		$this->assertEquals( Health::get_status(), Health::STATUS_DISABLED );
	}

	/**
	 * When Jetpack is upgraded, health status should be perserved if it's already set.
	 */
	public function test_initialization_status_ignored_on_upgrade() {
		Health::update_status( Health::STATUS_IN_SYNC );
		Actions::cleanup_on_upgrade();
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
	}

	/**
	 * Verify that cron does not loop when a site has not done a Full Sync previously.
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_cron_sync_by_type_full_sync_default_settings() {

		// delete existing options.
		delete_option( 'jetpack_sync_full_status' );

		$executions = Actions::do_cron_sync_by_type( 'full_sync' );
		$this->assertSame( 1, $executions );
	}

	/**
	 * Verify that cron does not loop when a Full Sync is in progres
	 *
	 * Note Highlights existing behavior which is broken, needs to be revised.
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_cron_sync_by_type_full_sync_in_progress() {

		// Initialize a Full Sync (all modules).
		$full_sync = Modules::get_module( 'full-sync' );
		$full_sync->start();

		$executions = Actions::do_cron_sync_by_type( 'full_sync' );
		$this->assertSame( 1, $executions );
	}

	/**
	 * Verify that cron does not loop when a Full Sync is complete.
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_cron_sync_by_type_full_sync_complete() {

		// udpate settings to Complete.
		$settings = array(
			'started'  => true,
			'finished' => true,
			'progress' => array(),
			'config'   => array(),
		);
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_status', $settings );

		$executions = Actions::do_cron_sync_by_type( 'full_sync' );
		$this->assertSame( 1, $executions );
	}

	/**
	 * Verify that that cron does not loop when a Full Sync has a send lock.
	 *
	 * Note Highlights existing behavior which may need to be revised.
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_cron_sync_by_type_full_sync_send_lock() {

		// udpate settings to In Progress.
		$settings = array(
			'started'  => true,
			'finished' => false,
			'progress' => array(),
			'config'   => array(),
		);
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_status', $settings );

		// establish lock.
		$this->assertNotFalse( ( new Lock() )->attempt( 'full_sync' ) );

		$executions = Actions::do_cron_sync_by_type( 'full_sync' );
		$this->assertSame( 1, $executions );

		( new Lock() )->remove( 'full_sync', true );
	}

	/**
	 * Validate that mark_sync_read_only sets JETPACK_SYNC_READ_ONLY constant.
	 */
	public function test_mark_sync_read_only() {
		$this->assertFalse( \Automattic\Jetpack\Constants::is_true( 'JETPACK_SYNC_READ_ONLY' ) );

		Actions::mark_sync_read_only();
		$this->assertTrue( \Automattic\Jetpack\Constants::is_true( 'JETPACK_SYNC_READ_ONLY' ) );
		\Automattic\Jetpack\Constants::clear_single_constant( 'JETPACK_SYNC_READ_ONLY' );
	}

}
