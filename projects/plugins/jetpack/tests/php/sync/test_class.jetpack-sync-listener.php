<?php

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Listener extends WP_Test_Jetpack_Sync_Base {
	public function test_never_queues_if_development() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );
		// @phan-suppress-next-line PhanPluginUnreachableCode
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		self::factory()->post->create();

		$this->assertSame( 0, $queue->size() );
	}

	public function test_never_queues_if_staging() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );
		// @phan-suppress-next-line PhanPluginUnreachableCode
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );

		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		self::factory()->post->create();

		$this->assertSame( 0, $queue->size() );
	}

	public function test_detects_if_exceeded_queue_size_limit_and_oldest_item_gt_15_mins() {
		// This is trickier than you would expect because we only check against
		// maximum queue size periodically (to avoid a counts on every request), and then
		// we cache the "blocked on queue size" status.
		// In addition, we should only enforce the queue size limit if the oldest (aka frontmost)
		// item in the queue is gt 15 minutes old.

		$this->listener->get_sync_queue()->reset();

		// first, let's try overriding the default queue limit
		$this->assertEquals( Defaults::$default_max_queue_size, $this->listener->get_queue_size_limit() );
		$this->assertEquals( Defaults::$default_max_queue_lag, $this->listener->get_queue_lag_limit() );

		// set max queue size to 2 items
		Settings::update_settings( array( 'max_queue_size' => 2 ) );

		// set max queue age to 3 seconds
		Settings::update_settings( array( 'max_queue_lag' => 3 ) );

		$this->listener->set_defaults(); // should pick up new queue size limit

		try {

			$this->assertEquals( 2, $this->listener->get_queue_size_limit() );
			$this->assertEquals( 3, $this->listener->get_queue_lag_limit() );
			$this->assertSame( 0, $this->listener->get_sync_queue()->size() );

			// now let's try exceeding the new limit.
			add_action( 'my_action', array( $this->listener, 'action_handler' ) );

			$this->listener->force_recheck_queue_limit();
			do_action( 'my_action' );
			$this->assertSame( 1, $this->listener->get_sync_queue()->size() );

			$this->listener->force_recheck_queue_limit();
			do_action( 'my_action' );
			$this->assertEquals( 2, $this->listener->get_sync_queue()->size() );

			$this->listener->force_recheck_queue_limit();
			do_action( 'my_action' );
			$this->assertEquals( 3, $this->listener->get_sync_queue()->size() );

			// sleep for 3 seconds, so the oldest item in the queue is at least 3 seconds old.
			// now our queue limit should kick in.
			sleep( 3 );

			$this->listener->force_recheck_queue_limit();
			do_action( 'my_action' );
			$this->assertEquals( 3, $this->listener->get_sync_queue()->size() );

		} finally {
			// reset queue settings.
			Settings::update_settings( array( 'max_queue_size' => Defaults::$default_max_queue_size ) );
			Settings::update_settings( array( 'max_queue_lag' => Defaults::$default_max_queue_lag ) );
			$this->listener->set_defaults(); // should reset queue size limit.

			remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
		}
	}

	public function test_does_listener_add_actor_to_queue() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->listener->get_sync_queue()->reset();
		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		self::factory()->post->create();
		$current_user = wp_get_current_user();

		$roles         = new Roles();
		$example_actor = array(
			'wpcom_user_id'    => null,
			'external_user_id' => $current_user->ID,
			'display_name'     => $current_user->display_name,
			'user_email'       => $current_user->user_email,
			'user_roles'       => $current_user->roles,
			'translated_role'  => $roles->translate_current_user_to_role(),
			'is_cron'          => defined( 'DOING_CRON' ) ? DOING_CRON : false,
			'is_wp_admin'      => is_admin(),
			'is_rest'          => defined( 'REST_API_REQUEST' ) ? REST_API_REQUEST : false,
			'is_xmlrpc'        => defined( 'XMLRPC_REQUEST' ) ? XMLRPC_REQUEST : false,
			'is_wp_rest'       => defined( 'REST_REQUEST' ) ? REST_REQUEST : false,
			'is_ajax'          => defined( 'DOING_AJAX' ) ? DOING_AJAX : false,
			'is_cli'           => defined( 'WP_CLI' ) ? WP_CLI : false,
			'from_url'         => $this->get_page_url(),
		);

		$all = $queue->get_all();
		foreach ( $all as $queue_item ) {
			list( $current_filter, $args, $current_user_id, $microtime, $is_importing, $actor ) = $queue_item->value; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$this->assertEquals( $actor, $example_actor );
		}
	}

	public function test_does_listener_add_actor_user_data_for_login_events() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->listener->get_sync_queue()->reset();
		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued
		$current_user = wp_get_current_user();
		wp_signon(
			array(
				'user_login'    => $current_user->data->user_login,
				'user_password' => 'password',
			)
		);

		$roles         = new Roles();
		$example_actor = array(
			'wpcom_user_id'    => null,
			'external_user_id' => $current_user->ID,
			'display_name'     => $current_user->display_name,
			'user_email'       => $current_user->user_email,
			'user_roles'       => $current_user->roles,
			'translated_role'  => $roles->translate_current_user_to_role(),
			'is_cron'          => defined( 'DOING_CRON' ) ? DOING_CRON : false,
			'is_wp_admin'      => is_admin(),
			'is_rest'          => defined( 'REST_API_REQUEST' ) ? REST_API_REQUEST : false,
			'is_xmlrpc'        => defined( 'XMLRPC_REQUEST' ) ? XMLRPC_REQUEST : false,
			'is_wp_rest'       => defined( 'REST_REQUEST' ) ? REST_REQUEST : false,
			'is_ajax'          => defined( 'DOING_AJAX' ) ? DOING_AJAX : false,
			'ip'               => IP_Utils::get_ip(),
			'user_agent'       => 'Jetpack Unit Tests',
			'is_cli'           => defined( 'WP_CLI' ) ? WP_CLI : false,
			'from_url'         => $this->get_page_url(),
		);

		$all = $queue->get_all();
		foreach ( $all as $queue_item ) {
			list( $current_filter, $args, $current_user_id, $microtime, $is_importing, $actor ) = $queue_item->value; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$this->assertEquals( $actor, $example_actor );
		}
	}

	public function test_does_listener_exclude_actor_ip_if_filter_is_present() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->listener->get_sync_queue()->reset();
		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued
		$current_user = wp_get_current_user();
		add_filter( 'jetpack_sync_actor_user_data', '__return_false' );
		wp_signon(
			array(
				'user_login'    => $current_user->data->user_login,
				'user_password' => 'password',
			)
		);
		remove_filter( 'jetpack_sync_actor_user_data', '__return_false' );

		$roles         = new Roles();
		$example_actor = array(
			'wpcom_user_id'    => null,
			'external_user_id' => $current_user->ID,
			'display_name'     => $current_user->display_name,
			'user_email'       => $current_user->user_email,
			'user_roles'       => $current_user->roles,
			'translated_role'  => $roles->translate_current_user_to_role(),
			'is_cron'          => defined( 'DOING_CRON' ) ? DOING_CRON : false,
			'is_wp_admin'      => is_admin(),
			'is_rest'          => defined( 'REST_API_REQUEST' ) ? REST_API_REQUEST : false,
			'is_xmlrpc'        => defined( 'XMLRPC_REQUEST' ) ? XMLRPC_REQUEST : false,
			'is_wp_rest'       => defined( 'REST_REQUEST' ) ? REST_REQUEST : false,
			'is_ajax'          => defined( 'DOING_AJAX' ) ? DOING_AJAX : false,
			'is_cli'           => defined( 'WP_CLI' ) ? WP_CLI : false,
			'from_url'         => $this->get_page_url(),
		);

		$all = $queue->get_all();
		foreach ( $all as $queue_item ) {
			list( $current_filter, $args, $current_user_id, $microtime, $is_importing, $actor ) = $queue_item->value; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$this->assertEquals( $actor, $example_actor );
		}
	}

	public function test_does_set_silent_flag_true_while_importing() {
		Settings::set_importing( true );

		self::factory()->post->create();

		$this->sender->do_sync();

		$this->assertObjectHasProperty( 'silent', $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' ) );
		$this->assertTrue( $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' )->silent );
	}

	public function test_data_loss_action_sent_and_health_updated() {
		Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertEquals( Health::STATUS_IN_SYNC, Health::get_status() );

		$this->listener->sync_data_loss( $this->listener->get_sync_queue() );
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_data_loss' );

		$this->assertTrue( isset( $event->args['timestamp'] ) );
		$this->assertTrue( isset( $event->args['queue_size'] ) );
		$this->assertTrue( isset( $event->args['queue_lag'] ) );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, Health::get_status() );
	}

	public function test_data_loss_action_ignored_if_already_out_of_sync() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$this->listener->sync_data_loss( $this->listener->get_sync_queue() );
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_data_loss' );

		$this->assertFalse( $event );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, Health::get_status() );
	}

	public function get_page_url() {
		return 'http' . ( isset( $_SERVER['HTTPS'] ) ? 's' : '' ) . '://' . "{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}";
	}
}
