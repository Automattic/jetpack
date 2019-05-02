<?php

$sync_dir        = dirname( __FILE__ ) . '/../../../sync/';
$sync_server_dir = dirname( __FILE__ ) . '/server/';

require_once $sync_dir . 'class.jetpack-sync-server.php';
require_once $sync_dir . 'class.jetpack-sync-users.php';
require_once $sync_dir . 'class.jetpack-sync-listener.php';
require_once $sync_dir . 'class.jetpack-sync-sender.php';
require_once $sync_dir . 'class.jetpack-sync-wp-replicastore.php';

require_once $sync_server_dir . 'class.jetpack-sync-test-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';
require_once $sync_server_dir . 'class.jetpack-sync-test-helper.php';

/*
 * Base class for Sync tests - establishes connection between local
 * Jetpack_Sync_Sender and dummy server implementation,
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

	public function setUp() {

		$_SERVER['HTTP_USER_AGENT'] = 'Jetpack Unit Tests';
		$this->listener = Jetpack_Sync_Listener::get_instance();
		$this->sender   = Jetpack_Sync_Sender::get_instance();

		parent::setUp();

		$this->setSyncClientDefaults();

		$this->server = new Jetpack_Sync_Server();

		// bind the sender to the server
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceive' ), 10, 4 );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Test_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();
	}

	public function tearDown() {
		parent::tearDown();
		unset( $_SERVER['HTTP_USER_AGENT'] );
	}

	public function setSyncClientDefaults() {
		$this->sender->set_defaults();
		Jetpack_Sync_Modules::set_defaults();
		$this->sender->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->sender->set_sync_wait_time( 0 ); // disable rate limiting
		// don't sync callables or constants every time - slows down tests
		set_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME, 60 );
		set_transient( Jetpack_Sync_Module_Constants::CONSTANTS_AWAIT_TRANSIENT_NAME, 60 );
	}

	protected function resetCallableAndConstantTimeouts() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_transient( Jetpack_Sync_Module_Constants::CONSTANTS_AWAIT_TRANSIENT_NAME );	
	}

	public function test_pass() {
		// so that we don't have a failing test
		$this->assertTrue( true );
	}

	protected function assertDataIsSynced() {
		$local  = new Jetpack_Sync_WP_Replicastore();
		$remote = $this->server_replica_storage;

		// Also pass the posts though the same filter other wise they woun't match any more.
		$posts_sync_module = new Jetpack_Sync_Module_Posts();

		$local_posts = array_map( array(
			$posts_sync_module,
			'filter_post_content_and_add_links'
		), $local->get_posts() );
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

	function serverReceive( $data, $codec, $sent_timestamp, $queue_id ) {
		return $this->server->receive( $data, null, $sent_timestamp, $queue_id );
	}

	function pre_http_request_success() {
		return array( 'body' => json_encode( array( 'success' => true ) ) );
	}

	public static function mock_plugins_update_request() {
		add_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_plugins_update' ), 10, 3 );
	}

	public static function unmock_plugins_update_request() {
		remove_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_plugins_update' ), 10, 3 );
	}

	public static function pre_http_request_plugins_update( $response, $args, $url ) {
		if ( 'https://api.wordpress.org/plugins/update-check/1.1/' !== $url ) {
			return $response;
		}

		$version = explode( '-', JETPACK__VERSION );
		$version = $version[0];

		$body = <<<BODY
{
  "plugins": {
    "jetpack/jetpack.php": {
      "id": "w.org/plugins/jetpack",
      "slug": "jetpack",
      "plugin": "jetpack/jetpack.php",
      "new_version": "{$version}",
      "url": "https://wordpress.org/plugins/jetpack/",
      "package": "https://downloads.wordpress.org/plugin/jetpack.{$version}.zip",
      "icons": {
        "2x": "https://ps.w.org/jetpack/assets/icon-256x256.png?rev=1791404",
        "1x": "https://ps.w.org/jetpack/assets/icon.svg?rev=1791404",
        "svg": "https://ps.w.org/jetpack/assets/icon.svg?rev=1791404"
      },
      "banners": {
        "2x": "https://ps.w.org/jetpack/assets/banner-1544x500.png?rev=1791404",
        "1x": "https://ps.w.org/jetpack/assets/banner-772x250.png?rev=1791404"
      },
      "banners_rtl": []
    }
  },
  "translations": [],
  "no_update": {}
}
BODY;

		return array(
			'response' => array(
				'code' => 200,
			),
			'body' => $body,
		);
	}

	public static function mock_themes_update_request() {
		add_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_themes_update' ), 10, 3 );
	}

	public static function unmock_themes_update_request() {
		add_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_themes_update' ), 10, 3 );
	}

	public static function pre_http_request_themes_update( $response, $args, $url ) {
		if ( 'https://api.wordpress.org/themes/update-check/1.1/' !== $url ) {
			return $response;
		}

		$body = <<<BODY
{
  "themes": {
    "noop": {
      "theme": "noop",
      "new_version": "0.0.1",
      "url": "https://wordpress.org/themes/noop/",
      "package": "https://downloads.wordpress.org/theme/default.0.0.1.zip"
    }
  },
  "translations": []
}
BODY;

		return array(
			'response' => array(
				'code' => 200,
			),
			'body' => $body,
		);
	}

	public static function mock_core_update_request() {
		add_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_core_update' ), 10, 3 );
	}

	public static function unmock_core_update_request() {
		remove_filter( 'pre_http_request', array( __CLASS__, 'pre_http_request_core_update' ), 10, 3 );
	}

	public static function pre_http_request_core_update( $response, $args, $url ) {
		if ( 0 !== strpos( $url, 'https://api.wordpress.org/core/version-check/1.7/?' ) ) {
			return $response;
		}

		$version = $GLOBALS['wp_version'];

		$body = <<<BODY
{
  "offers": [
    {
      "response": "latest",
      "download": "https://downloads.wordpress.org/release/wordpress-{$version}.zip",
      "locale": "en_US",
      "packages": {
        "full": "https://downloads.wordpress.org/release/wordpress-{$version}.zip",
        "no_content": "https://downloads.wordpress.org/release/wordpress-{$version}-no-content.zip",
        "new_bundled": "https://downloads.wordpress.org/release/wordpress-{$version}-new-bundled.zip",
        "partial": false,
        "rollback": false
      },
      "current": "{$version}",
      "version": "{$version}",
      "php_version": "{$GLOBALS['required_php_version']}",
      "mysql_version": "{$GLOBALS['required_mysql_version']}",
      "new_bundled": "1.0",
      "partial_version": false
    }
  ],
  "translations": []
}
BODY;

		return array(
			'response' => array(
				'code' => 200,
			),
			'body' => $body,
		);
	}
}
