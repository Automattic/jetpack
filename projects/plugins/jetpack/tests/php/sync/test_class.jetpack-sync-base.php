<?php

use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Sync\Listener;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\Callables;
use Automattic\Jetpack\Sync\Modules\Constants;
use Automattic\Jetpack\Sync\Modules\Posts;
use Automattic\Jetpack\Sync\Replicastore;
use Automattic\Jetpack\Sync\Sender;
use Automattic\Jetpack\Sync\Server;

$sync_server_dir = __DIR__ . '/server/';

require_once $sync_server_dir . 'class.jetpack-sync-test-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';
require_once $sync_server_dir . 'class.jetpack-sync-test-helper.php';

/*
 * Base class for Sync tests - establishes connection between local
 * Automattic\Jetpack\Sync\Sender and dummy server implementation,
 * and registers a Replicastore and Eventstore implementation to
 * process events.
 */

class WP_Test_Jetpack_Sync_Base extends WP_UnitTestCase {
	protected $listener;
	protected $sender;

	protected $server;
	protected $server_replicator;
	protected $server_replica_storage;
	protected $server_event_storage;

	/**
	 * Set up.
	 */
	public function set_up() {

		$_SERVER['HTTP_USER_AGENT'] = 'Jetpack Unit Tests';
		$this->listener             = Listener::get_instance();
		$this->sender               = Sender::get_instance();

		parent::set_up();

		$this->setSyncClientDefaults();

		$this->server = new Server();

		// Bind the sender to the server.
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceive' ), 10, 4 );

		// Stop triggering 'jetpack.fetchPublicizeConnection' remote XML-RPC call to
		// WPCOM on every `save_post` action.
		global $publicize_ui;
		if ( ! isset( $publicize_ui ) ) {
			$publicize_ui = new Automattic\Jetpack\Publicize\Publicize_UI();
		}
		global $publicize;

		$publicize->set_refresh_wait_transient( HOUR_IN_SECONDS );

		// Bind the two storage systems to the server events.
		$this->server_replica_storage = new Jetpack_Sync_Test_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();

		// Set a blog token and id so the site is connected.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		$data_settings = new Data_Settings();
		$data_settings->empty_data_settings_and_hooks();
		$data_settings->add_settings_list( array() );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();
		unset( $_SERVER['HTTP_USER_AGENT'] );
		unset( $GLOBALS['publicize'] );
		unset( $GLOBALS['publicize_ui'] );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
	}

	public function setSyncClientDefaults() {
		$this->sender->set_defaults();
		Modules::set_defaults();
		$this->sender->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->sender->set_sync_wait_time( 0 ); // disable rate limiting
		// don't sync callables or constants every time - slows down tests
		set_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME, 60 );
		set_transient( Constants::CONSTANTS_AWAIT_TRANSIENT_NAME, 60 );
	}

	protected function resetCallableAndConstantTimeouts() {
		delete_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_transient( Constants::CONSTANTS_AWAIT_TRANSIENT_NAME );
	}

	public function test_pass() {
		// so that we don't have a failing test
		$this->assertTrue( true );
	}

	protected function assertDataIsSynced() {
		$local  = new Replicastore();
		$remote = $this->server_replica_storage;

		// Also pass the posts though the same filter other wise they woun't match any more.
		$posts_sync_module = new Posts();

		$local_posts = array_map(
			array(
				$posts_sync_module,
				'filter_post_content_and_add_links',
			),
			$local->get_posts()
		);
		$this->assertEquals( $local_posts, $remote->get_posts() );
		$this->assertEquals( $local->get_comments(), $remote->get_comments() );

	}

	// asserts that two objects are the same if they're both "objectified",
	// i.e. json_encoded and then json_decoded
	// this is useful because we json encode everything sent to the server
	protected function assertEqualsObject( $object_1, $object_2, $message = null ) {
		$this->assertEquals( $this->objectify( $object_1 ), $this->objectify( $object_2 ), $message );
	}

	protected function objectify( $instance ) {
		$codec = $this->sender->get_codec();

		return $codec->decode( $codec->encode( $instance ) );
	}

	public function serverReceive( $data, $codec, $sent_timestamp, $queue_id ) {
		return $this->server->receive( $data, null, $sent_timestamp, $queue_id );
	}

	public function pre_http_request_success() {
		return array( 'body' => json_encode( array( 'success' => true ) ) );
	}

	/**
	 * Intercept HTTP request to api.wordpress.org endpoints and return mocked results.
	 * Those requests will occur during plugin/theme or core updates or when we fire
	 * `upgrader_process_complete` actions across Sync related integration tests.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public static function pre_http_request_wordpress_org_updates( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( strpos( $url, 'api.wordpress.org/core/version-check' ) > 0 ) {
			return array(
				'response'    => array(
					'code' => 200,
				),
				'status_code' => 200,
				'body'        => wp_json_encode(
					array(
						'offers'       => array(
							array(
								'response' => 'upgrade',
								'download' => 'dummy.zip',
								'locale'   => 'en_US',
								'packages' => array(
									'full'        => 'dummy.zip',
									'no_content'  => 'dummy-no-content.zip',
									'new_bundled' => 'dummy-new-bundled.zip',
									'partial'     => false,
									'rollback'    => false,
								),
							),
						),
						'translations' => array(),
					)
				),
			);
		}

		if ( strpos( $url, 'api.wordpress.org/themes/update-check' ) > 0 ) {
			return array(
				'response'    => array(
					'code' => 200,
				),
				'status_code' => 200,
				'body'        => wp_json_encode(
					array(
						'themes'       => array(
							'hello' => array(
								'new_version' => 1,
								'name'        => 'hello',
							),
						),
						'translations' => array(),
						'no_update'    => array(),
					)
				),
			);
		}

		if ( strpos( $url, 'api.wordpress.org/plugins/update-check' ) > 0 ) {
			return array(
				'response'    => array(
					'code' => 200,
				),
				'status_code' => 200,
				'body'        => wp_json_encode(
					array(
						'plugins'      => array(
							'hello' => array(
								'new_version' => 1,
							),
						),
						'translations' => array(),
						'no_update'    => array(
							'jetpack/jetpack.php' => true,
						),
					)
				),
			);
		}

		return $preempt;
	}

	/**
	 * Intercept HTTP request to api.bruteprotect.com and return mocked results.
	 * Those requests will occur when the `wp_login` action is fired during tests.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public static function pre_http_request_bruteprotect_api( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( strpos( $url, 'api.bruteprotect.com' ) > 0 ) {
			return array(
				'response'    => array(
					'code' => 200,
				),
				'status_code' => 200,
				'body'        => wp_json_encode(
					array(
						'status'            => 'ok',
						'msg'               => 'API Key Required',
						'seconds_remaining' => 60,
						'error'             => 'API Key Required',
					)
				),
			);
		}

		return $preempt;
	}
}

