<?php
/**
 * End-to-end tests: every bridge route, through the REST server, to a 200.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function home_url;
use function remove_filter;
use function wp_insert_user;
use function wp_json_encode;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * The bridge suites next door call their callbacks directly, which leaves three things
 * untested on every route: the `args` schema, the route regex, and a
 * `permission_check()` that *succeeds*. A callback can be exhaustively covered and the
 * route still answer 400 or 404 to every request the dashboard makes.
 *
 * So this file dispatches through the REST server once per registered bridge route, and
 * asserts the route list against the server's own rather than keeping it by hand.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Rest_Controller
 */
#[CoversClass( Rest_Controller::class )]
class Rest_Bridge_Dispatch_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Stands in, in a data provider, for the signed-URL envelope the file-content route's
	 * first leg receives.
	 *
	 * The real body names a URL on this site's own host, so `wp_http_validate_url()`
	 * takes its same-host path rather than passing or failing on the runner's DNS.
	 * `home_url()` reads an option, so it is resolved in the test body: a provider runs
	 * before any `setUp()`.
	 *
	 * @var string
	 */
	private const SIGNED_URL_BODY = '@signed-url-body';

	/**
	 * REST Server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Enable modernization, register routes, and prepare a fresh REST server.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		add_action( 'rest_api_init', array( Rest_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		remove_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		$this->reset_wpcom_request_mock();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Every bridge route, keyed by the route it registers under.
	 *
	 * Keyed rather than listed: the keys are what
	 * `test_every_bridge_route_is_covered_here()` compares against the server's route
	 * table.
	 *
	 * Each row is the request a real dashboard makes, WordPress.com's answers, and the
	 * payload the client should end up with. The upstream fixtures are deliberately not
	 * minimal — a fixture carrying only the keys that survive cannot tell a forwarded
	 * value from a default.
	 *
	 * @return array<string, array{0: string, 1: string, 2: array<string, mixed>, 3: array<int, array{body?: string, status?: int|string}>, 4: array<string, mixed>}>
	 */
	public static function provide_bridge_dispatches() {
		return array(
			'/jetpack/v4/site/capabilities'          => array(
				'GET',
				'/jetpack/v4/site/capabilities',
				array(),
				array( array( 'body' => '{"capabilities":["backup","scan"]}' ) ),
				array(
					'hasBackupPlan' => true,
					'hasScan'       => true,
					// Decided on the site, not upstream — hence its own branch —
					// and false without the standalone plugin's constant, which
					// nothing in a package test run defines.
					'local'         => array(
						'isStandalonePluginActive' => false,
					),
				),
			),
			'/jetpack/v4/site/rewindable-activity'   => array(
				'GET',
				'/jetpack/v4/site/rewindable-activity',
				array(
					'number' => 10,
					'page'   => 1,
				),
				array( array( 'body' => '{"current":{"orderedItems":[{"activity_id":"foo"}]},"totalItems":1,"totalPages":1}' ) ),
				array(
					'current'    => array( 'orderedItems' => array( array( 'activity_id' => 'foo' ) ) ),
					'totalItems' => 1,
					'totalPages' => 1,
				),
			),
			'/jetpack/v4/rewind/backup/ls'           => array(
				'POST',
				'/jetpack/v4/rewind/backup/ls',
				array(
					'rewind_id' => '1748888135.123',
					'path'      => '/',
				),
				array( array( 'body' => '{"contents":[{"name":"wp-config.php","type":"file","period":"1748888135"}]}' ) ),
				array(
					'contents' => array(
						array(
							'name'   => 'wp-config.php',
							'type'   => 'file',
							'period' => '1748888135',
						),
					),
				),
			),
			'/jetpack/v4/rewind/backup/path-info'    => array(
				'GET',
				'/jetpack/v4/rewind/backup/path-info',
				array(
					'file_period'   => '1748888135',
					'manifest_path' => 'f5:/wp-config.php',
				),
				array( array( 'body' => '{"size":3247,"hash":"abc123","mtime":1748888135}' ) ),
				array(
					'size'  => 3247,
					'hash'  => 'abc123',
					'mtime' => 1748888135,
				),
			),
			'/jetpack/v4/rewind/backup/file-content' => array(
				'GET',
				'/jetpack/v4/rewind/backup/file-content',
				array(
					'file_period'           => '1748888135',
					'encoded_manifest_path' => 'ZjU6L3dwLWNvbmZpZy5waHA=',
				),
				array(
					array( 'body' => self::SIGNED_URL_BODY ),
					array( 'body' => "<?php\ndefine( 'DB_NAME', 'wordpress' );\n" ),
				),
				array(
					'content'   => "<?php\ndefine( 'DB_NAME', 'wordpress' );\n",
					'is_text'   => true,
					'truncated' => false,
				),
			),
			'/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)' => array(
				'POST',
				'/jetpack/v4/backups/download/1748888135.123',
				array(),
				array( array( 'body' => '{"downloadId":42}' ) ),
				array( 'id' => 42 ),
			),
			'/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)/status' => array(
				'GET',
				'/jetpack/v4/backups/download/1748888135.123/status',
				array( 'download_id' => 42 ),
				array( array( 'body' => '{"downloadId":42,"progress":55}' ) ),
				array(
					'id'          => 42,
					'status'      => 'running',
					'progress'    => 55,
					'url'         => '',
					'valid_until' => '',
					'error'       => '',
				),
			),
			'/jetpack/v4/rewind/to/(?P<rewind_id>[A-Za-z0-9.\-]+)' => array(
				'POST',
				'/jetpack/v4/rewind/to/1748888135.123',
				array(),
				array( array( 'body' => '{"ok":true,"restore_id":7,"rewind_id":"1748888135.123"}' ) ),
				array(
					'id'        => 7,
					'rewind_id' => '1748888135.123',
				),
			),
			'/jetpack/v4/rewind/restore/(?P<restore_id>\d+)/status' => array(
				'GET',
				'/jetpack/v4/rewind/restore/7/status',
				array(),
				array( array( 'body' => '{"restore_id":7,"status":"running","percent":42.5,"rewind_id":"1748888135.123","message":"Restoring uploads"}' ) ),
				array(
					'id'         => 7,
					'status'     => 'running',
					'progress'   => 42.5,
					'rewind_id'  => '1748888135.123',
					'error_code' => '',
					'message'    => 'Restoring uploads',
				),
			),
		);
	}

	/**
	 * A bridge route, dispatched by the REST server, answers 200 with the payload the
	 * client expects — the route's `args` schema, its `permission_check()` and its
	 * projection, none of which a direct call exercises.
	 *
	 * @param string                                                $method   Request method.
	 * @param string                                                $path     Route path to dispatch.
	 * @param array<string, mixed>                                  $params   Request params.
	 * @param array<int, array{body?: string, status?: int|string}> $answers WordPress.com's answers, in call order.
	 * @param array<string, mixed>                                  $expected Payload the route should serve.
	 * @dataProvider provide_bridge_dispatches
	 */
	#[DataProvider( 'provide_bridge_dispatches' )]
	public function test_route_serves_its_projection( $method, $path, array $params, array $answers, array $expected ) {
		$this->arrange_wpcom_answers( $this->resolve_answers( $answers ) );

		$request = new WP_REST_Request( $method, $path );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		$response = $this->server->dispatch( $request );

		// Named first: a failure here is otherwise an array diff against an error
		// envelope.
		$this->assertSame(
			200,
			$response->get_status(),
			sprintf( '%s %s: %s', $method, $path, wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES ) )
		);
		$this->assertSame( $expected, $response->get_data() );
	}

	/**
	 * Every registered bridge route is dispatched by the provider above, so a tenth one
	 * lands here as a failure naming itself.
	 *
	 * Bridge routes are identified by diffing the route table with the modernization
	 * filter on against the same table with it off, as `Rest_Bridge_Gating_Test` does. A
	 * `/jetpack/v4/` prefix match would not do — the legacy `REST_Controller` registers
	 * ten routes under that same prefix.
	 */
	public function test_every_bridge_route_is_covered_here() {
		$bridge_routes = array_values(
			array_diff( $this->collect_routes( true ), $this->collect_routes( false ) )
		);
		$covered       = array_keys( self::provide_bridge_dispatches() );

		sort( $bridge_routes );
		sort( $covered );

		$this->assertSame( $bridge_routes, $covered );
	}

	/**
	 * Route keys registered by a fresh `rest_api_init`, with the
	 * modernization filter forced either on or off.
	 *
	 * @param bool $modernized Whether to leave the modernization filter enabled.
	 * @return string[] Registered route keys.
	 */
	private function collect_routes( $modernized ) {
		global $wp_rest_server;

		if ( ! $modernized ) {
			remove_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		}

		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );
		$routes = array_keys( $wp_rest_server->get_routes() );

		if ( ! $modernized ) {
			add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		}

		// `setUp()` handed the tests a server; leave one in place.
		$wp_rest_server = $this->server;

		return $routes;
	}

	/**
	 * An administrator whose own WordPress.com account is not linked is refused, with a
	 * reason.
	 *
	 * The other half of `permission_check()`: every existing permission test signs in a
	 * subscriber, so it stops at `manage_options` and never reaches the connection
	 * branch. Deliberately not using the trait — the absence of its `user_tokens` is
	 * what makes this user unconnected.
	 */
	public function test_an_unlinked_administrator_is_told_which_connection_is_missing() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'unlinked_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/capabilities' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'user_not_connected', $response->get_data()['code'] );
	}

	/**
	 * Replace provider placeholders with values only a running test can produce.
	 *
	 * @param array<int, array{body?: string, status?: int|string}> $answers Answers as the provider wrote them.
	 * @return array<int, array{body?: string, status?: int|string}>
	 */
	private function resolve_answers( array $answers ) {
		foreach ( $answers as $index => $answer ) {
			if ( isset( $answer['body'] ) && self::SIGNED_URL_BODY === $answer['body'] ) {
				$answers[ $index ]['body'] = wp_json_encode(
					array( 'url' => home_url( '/signed-stream' ) ),
					JSON_UNESCAPED_SLASHES
				);
			}
		}
		return $answers;
	}
}
