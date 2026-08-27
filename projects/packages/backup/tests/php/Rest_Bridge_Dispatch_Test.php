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
 * The bridge suites next door call their callbacks directly, which leaves
 * three things between a request and an answer untested on every route:
 * the `args` schema `register_rest_route()` was given, a
 * `permission_check()` that *succeeds*, and `rest_ensure_response()`
 * turning the projection into something the server will serve. A callback
 * can be exhaustively covered and the route still answer 400 to every
 * request the dashboard makes — a required arg the client does not send,
 * a `pattern` that rejects a legitimate value — and nothing in those
 * suites would notice.
 *
 * That gap was assumed to be unclosable: the permission gate needs a
 * user-level WordPress.com connection, and the shared trait's note said
 * WorDBless could not stand one up. It can, and had been all along — the
 * `user_tokens` the trait installs so `Client` can sign a request are the
 * same ones `Connection_Manager::is_user_connected()` reads. Nothing was
 * missing; nobody had dispatched.
 *
 * So this file dispatches, once per registered bridge route, and the
 * route list is asserted against the server's own rather than kept by
 * hand, so a route added without an end-to-end test fails here.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Rest_Controller
 */
#[CoversClass( Rest_Controller::class )]
class Rest_Bridge_Dispatch_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Stands in, in a data provider, for the signed-URL envelope the
	 * file-content route's first leg receives.
	 *
	 * The real body has to name a URL on this site's own host, so that
	 * `wp_http_validate_url()` takes its same-host path instead of
	 * resolving a name — otherwise the test passes or fails on whether the
	 * runner has DNS. `home_url()` reads an option, and a provider is
	 * evaluated before any test's `setUp()`, so the value is resolved in
	 * the test body instead of baked into the provider.
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
	 * Keyed rather than listed because the keys are what
	 * `test_every_bridge_route_is_covered_here()` compares against the
	 * server's own route table — the guard that makes this file keep pace
	 * with `Rest_Controller::register_routes()`.
	 *
	 * Each row is the request a real dashboard makes, the answers
	 * WordPress.com gives it, and the payload the client should end up
	 * with. The upstream fixtures are deliberately not minimal: several of
	 * these projections read one key and default another, and a fixture
	 * carrying only the keys that survive cannot tell a forwarded value
	 * from a default.
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
				array( 'content' => "<?php\ndefine( 'DB_NAME', 'wordpress' );\n" ),
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
	 * A bridge route, dispatched by the REST server, answers 200 with the
	 * payload the client expects.
	 *
	 * This is the whole of what the direct-call suites cannot say: that the
	 * request the dashboard sends satisfies the route's own `args` schema,
	 * that `permission_check()` lets a connected administrator through, and
	 * that the projection comes back out of the server as data rather than
	 * as an error envelope.
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

		// Named first, because a failure here is otherwise reported as an
		// unhelpful array diff against an error envelope.
		$this->assertSame(
			200,
			$response->get_status(),
			sprintf( '%s %s: %s', $method, $path, wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES ) )
		);
		$this->assertSame( $expected, $response->get_data() );
		// The last thing between the projection and the reader. Nothing
		// here should be able to fail it, which is the point: until now
		// nothing established that.
		$this->assertIsString( wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Every registered bridge route is dispatched by the provider above.
	 *
	 * The provider is keyed by route, so this is a set comparison against
	 * what `Rest_Controller::register_routes()` actually registered. A
	 * tenth bridge route lands here as a failure naming itself, rather
	 * than shipping with its schema and permission gate never once
	 * exercised end to end — which is exactly how the first nine got here.
	 *
	 * The bridge routes are identified the way `Rest_Bridge_Gating_Test`
	 * identifies them — by diffing the route table with the modernization
	 * filter on against the same table with it off. Matching on a path
	 * prefix would not do: `rest_api_init` also registers this package's
	 * legacy `REST_Controller` routes and the sync package's, several of
	 * which live under `/jetpack/v4/` too, and none of which belong here.
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
	 * An administrator whose own WordPress.com account is not linked is
	 * refused, with a reason.
	 *
	 * The other half of `permission_check()`, and the half no suite
	 * reached: every existing permission test signs in a subscriber, so it
	 * stops at `manage_options` and the connection branch below it never
	 * runs. This is not a hypothetical user — it is every additional admin
	 * on a site somebody else connected, and the error code is the only
	 * thing that tells them to link their account rather than to go
	 * looking for a broken plan.
	 *
	 * Deliberately *not* using the trait: what makes this user unconnected
	 * is the absence of the `user_tokens` the trait installs.
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
	 * Replace provider placeholders with values only a running test can
	 * produce. See `SIGNED_URL_BODY`.
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
