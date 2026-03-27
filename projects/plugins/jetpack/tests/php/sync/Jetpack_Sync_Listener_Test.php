<?php

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Settings;

require_once __DIR__ . '/Jetpack_Sync_TestBase.php';

class Jetpack_Sync_Listener_Test extends Jetpack_Sync_TestBase {
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

	public function test_never_queues_if_current_action_is_blacklisted() {
		$original_sync_actions_blacklist = Settings::get_setting( 'sync_actions_blacklist' );
		try {
			Settings::update_settings( array( 'sync_actions_blacklist' => array( 'jetpack_sync_save_post' ) ) );
			$queue = $this->listener->get_sync_queue();
			$queue->reset(); // remove any actions that already got queued
			self::factory()->post->create();
			$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
			$this->assertFalse( $event );
		} finally {
			Settings::update_settings(
				array(
					'sync_actions_blacklist' => $original_sync_actions_blacklist,
				)
			);
		}
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

		$this->listener->sync_data_loss( $this->listener->get_sync_queue(), 'test_action' );
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_data_loss' );

		$this->assertTrue( isset( $event->args['timestamp'] ) );
		$this->assertTrue( isset( $event->args['queue_size'] ) );
		$this->assertTrue( isset( $event->args['queue_lag'] ) );
		$this->assertTrue( isset( $event->args['extra'] ) );
		$this->assertIsArray( $event->args['extra'] );
		$this->assertEquals( array( 'current_filter' => 'test_action' ), $event->args['extra'] );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, Health::get_status() );
	}

	public function test_data_loss_action_ignored_if_already_out_of_sync() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$this->listener->sync_data_loss( $this->listener->get_sync_queue(), 'test_action' );
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_data_loss' );

		$this->assertFalse( $event );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, Health::get_status() );
	}

	public function test_does_listener_add_mcp_actor_fields_when_header_present() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$queue = $this->listener->get_sync_queue();
		$queue->reset();

		$mcp_data                    = array(
			'mcp_client_name'    => 'test-client',
			'mcp_client_version' => '1.0.0',
		);
		$_SERVER['HTTP_X_WPCOM_MCP'] = base64_encode( wp_json_encode( $mcp_data, JSON_UNESCAPED_SLASHES ) );
		self::factory()->post->create();

		$all = $queue->get_all();
		$this->assertNotEmpty( $all );

		foreach ( $all as $queue_item ) {
			list( , , , , , $actor ) = $queue_item->value;
			$this->assertArrayHasKey( 'mcp_client_name', $actor );
			$this->assertArrayHasKey( 'mcp_client_version', $actor );
			$this->assertArrayHasKey( 'is_mcp_agent', $actor );
			$this->assertEquals( 'test-client', $actor['mcp_client_name'] );
			$this->assertEquals( '1.0.0', $actor['mcp_client_version'] );
			$this->assertTrue( $actor['is_mcp_agent'] );
		}
	}

	public function test_does_listener_not_add_mcp_actor_fields_when_header_invalid() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$queue = $this->listener->get_sync_queue();
		$queue->reset();

		$_SERVER['HTTP_X_WPCOM_MCP'] = '!!!invalid-base64!!!';

		self::factory()->post->create();

		$all = $queue->get_all();
		$this->assertNotEmpty( $all );

		foreach ( $all as $queue_item ) {
			list( , , , , , $actor ) = $queue_item->value;
			$this->assertArrayNotHasKey( 'mcp_client_name', $actor );
			$this->assertArrayNotHasKey( 'mcp_client_version', $actor );
			$this->assertArrayNotHasKey( 'is_mcp_agent', $actor );
		}
	}

	public function test_does_listener_add_mcp_actor_fields_with_partial_data() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$queue = $this->listener->get_sync_queue();
		$queue->reset();

		$mcp_data                    = array(
			'mcp_client_name' => 'partial-client',
		);
		$_SERVER['HTTP_X_WPCOM_MCP'] = base64_encode( wp_json_encode( $mcp_data, JSON_UNESCAPED_SLASHES ) );
		self::factory()->post->create();

		$all = $queue->get_all();
		$this->assertNotEmpty( $all );

		foreach ( $all as $queue_item ) {
			list( , , , , , $actor ) = $queue_item->value;
			$this->assertArrayHasKey( 'mcp_client_name', $actor );
			$this->assertArrayNotHasKey( 'mcp_client_version', $actor );
			$this->assertArrayHasKey( 'is_mcp_agent', $actor );
			$this->assertEquals( 'partial-client', $actor['mcp_client_name'] );
			$this->assertTrue( $actor['is_mcp_agent'] );
		}
	}

	public function test_request_cache_reduces_get_transient_calls() {
		$transient_calls = 0;
		add_filter(
			'pre_transient_jetpack_sync_last_checked_queue_state_sync',
			function ( $pre ) use ( &$transient_calls ) {
				$transient_calls++;
				return $pre;
			},
			0
		);

		add_action( 'my_action', array( $this->listener, 'action_handler' ) );
		$this->listener->force_recheck_queue_limit();

		do_action( 'my_action' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement - intentional for testing.
		do_action( 'my_action' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement - intentional for testing.
		do_action( 'my_action' );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );

		$this->assertSame( 1, $transient_calls );
	}

	public function test_request_cache_invalidates_after_threshold() {
		$transient_calls = 0;
		add_filter(
			'pre_transient_jetpack_sync_last_checked_queue_state_sync',
			function ( $pre ) use ( &$transient_calls ) {
				$transient_calls++;
				return $pre;
			},
			0
		);

		add_action( 'my_action', array( $this->listener, 'action_handler' ) );
		$this->listener->force_recheck_queue_limit();

		// Fire one more than the invalidation threshold: the first item causes a transient
		// read, items 2–50 hit the in-memory cache, and item 51 causes a second
		// transient read after the cache is invalidated at the 50-item threshold.
		$threshold = \Automattic\Jetpack\Sync\Listener::REQUEST_STATE_CACHE_INVALIDATE_AFTER;
		for ( $i = 0; $i < $threshold + 1; $i++ ) {
			do_action( 'my_action' );
		}

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );

		$this->assertSame( 2, $transient_calls );
	}

	public function test_jetpack_sync_actor_data_filter() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$queue = $this->listener->get_sync_queue();
		$queue->reset();

		$callback = function ( $actor ) {
			$actor['client_name'] = '<script>xss</script>woo_ai';
			return $actor;
		};
		add_filter( 'jetpack_sync_actor_data', $callback );
		self::factory()->post->create();
		remove_filter( 'jetpack_sync_actor_data', $callback );

		$all = $queue->get_all();
		$this->assertNotEmpty( $all );

		$actor = $all[0]->value[5];
		$this->assertEquals( 'woo_ai', $actor['client_name'] );
	}

	public function get_page_url() {
		return 'http' . ( isset( $_SERVER['HTTPS'] ) ? 's' : '' ) . '://' . "{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}";
	}
}
