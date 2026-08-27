<?php
/**
 * Unit tests for File_Browser_Bridge.
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
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function remove_filter;
use function wp_insert_user;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the /jetpack/v4/rewind/backup/* routes.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\File_Browser_Bridge
 */
#[CoversClass( File_Browser_Bridge::class )]
class Rest_File_Browser_Bridge_Test extends TestCase {

	use Wpcom_Request_Mock;

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
	 * The ls route registers when the modernization filter is on.
	 */
	public function test_ls_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/backup/ls', $routes );
	}

	/**
	 * The file-content route registers when the modernization filter is on.
	 */
	public function test_file_content_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/backup/file-content', $routes );
	}

	/**
	 * Every route in this file, with the params it needs to get past
	 * validation and reach the permission gate.
	 *
	 * @return array<string, array{0: string, 1: string, 2: array<string, string>}>
	 */
	public static function provide_bridge_routes() {
		return array(
			'ls'           => array(
				'POST',
				'/jetpack/v4/rewind/backup/ls',
				array(
					'rewind_id' => '123',
					'path'      => '/',
				),
			),
			'file-content' => array(
				'GET',
				'/jetpack/v4/rewind/backup/file-content',
				array(
					'file_period'           => '123',
					'encoded_manifest_path' => 'abc',
				),
			),
			'path-info'    => array(
				'GET',
				'/jetpack/v4/rewind/backup/path-info',
				array(
					'file_period'   => '123',
					'manifest_path' => 'f5:/wp-config.php',
				),
			),
		);
	}

	/**
	 * Routes are gated on manage_options — a subscriber gets 403.
	 *
	 * Driven by a provider so the coverage keeps pace as routes are
	 * added, rather than silently continuing to assert one of them.
	 *
	 * @param string                $method Request method.
	 * @param string                $route  Route to dispatch.
	 * @param array<string, string> $params Params needed to pass validation.
	 *
	 * @dataProvider provide_bridge_routes
	 */
	#[DataProvider( 'provide_bridge_routes' )]
	public function test_routes_require_manage_options( $method, $route, array $params ) {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request = new WP_REST_Request( $method, $route );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
	/**
	 * A transport failure on the directory listing surfaces as the
	 * bridge's own error rather than cURL's text.
	 *
	 * This one goes through `forward_response()`, which every
	 * pass-through bridge shares, so it covers the shared path.
	 */
	public function test_list_directory_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/ls' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'path', '/' );
		$response = File_Browser_Bridge::list_directory( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * A non-200 on the directory listing keeps WordPress.com's reason.
	 *
	 * The other half of `forward_response()`, which every pass-through
	 * bridge shares — so this covers the shared non-200 path the same way
	 * the test above covers the shared transport path.
	 *
	 * 412 rather than 500, because 500 is also what an unreadable status
	 * falls back to.
	 */
	public function test_list_directory_forwards_the_upstream_reason() {
		$this->arrange_wpcom(
			array(
				'code'    => 'no_connected_jetpack',
				'message' => 'This site is not connected.',
			),
			412
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/ls' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'path', '/' );
		$data = File_Browser_Bridge::list_directory( $request )->get_error_data();

		$this->assertSame( 412, $data['status'] );
		$this->assertSame( 'no_connected_jetpack', $data['wpcom']['code'] );
		$this->assertSame( 'This site is not connected.', $data['wpcom']['message'] );
	}

	/**
	 * A manifest path that is not base64 is refused before dispatch.
	 *
	 * The value is interpolated into the WPCOM URL *path* unescaped —
	 * it has to be, because percent-encoding it is what broke the
	 * preview — so the schema is the only thing standing between an
	 * admin and an arbitrary authenticated WPCOM GET. Dot segments are
	 * the concrete hazard: cURL applies RFC 3986 dot-segment removal
	 * before the request leaves the host, so `../` climbs out of the
	 * intended route and a `?` swallows the trailing `/url`.
	 *
	 * `has_valid_params()` runs in `dispatch()` before the permission
	 * callback is consulted, which is why this returns 400 rather than
	 * the 403 an unauthenticated caller would otherwise get.
	 */
	public function test_file_content_refuses_a_manifest_path_that_is_not_base64() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', '../../../../../me/sites?f=' );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Every character base64 can emit survives that guard.
	 *
	 * `+` and `/` only turn up for non-ASCII filenames, which makes them
	 * easy to leave untested and easy to break — a guard that rejected
	 * them would make every file with a CJK or accented name
	 * un-previewable. `/` is also the case where relying on the upstream
	 * route's `\S+` capture is load-bearing, since it splits the
	 * outbound path into an extra segment.
	 *
	 * Asserted by the absence of a validation failure: a well-formed
	 * request falls through to the permission gate, which is a 401/403
	 * here rather than a 400.
	 */
	public function test_file_content_accepts_base64_containing_plus_and_slash() {
		// base64 of `f5:/wp-content/uploads/日本語.jpg`.
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', 'ZjU6L3dwLWNvbnRlbnQvdXBsb2Fkcy/ml6XmnKzoqp4uanBn' );

		$response = $this->server->dispatch( $request );

		$this->assertNotSame( 'rest_invalid_param', $response->get_data()['code'] ?? '' );
	}

	/**
	 * The path-info route registers when the modernization filter is on.
	 */
	public function test_path_info_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/backup/path-info', $routes );
	}

	/**
	 * The path-info leg is addressed by the file's own period and the
	 * *raw* manifest path.
	 *
	 * Both halves are easy to get wrong and neither fails loudly. WPCOM
	 * names the parameter `backup_id`, but VaultPress hands it straight
	 * to an exact `period = %d` match against the row for this file
	 * version — so the parent backup's rewindId, the backup period and
	 * VaultPress's own id all resolve to nothing. And unlike the stream
	 * leg, this route takes the manifest path unencoded in the request
	 * body; base64-ing it here would look for a file literally named
	 * `ZjU6L3dwLWNvbmZpZy5waHA=`.
	 */
	public function test_path_info_sends_the_file_period_and_the_raw_manifest_path() {
		$this->arrange_wpcom(
			array(
				'size'  => 3247,
				'hash'  => 'abc123',
				'mtime' => 1748888135,
			)
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/path-info' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'manifest_path', 'f5:/wp-config.php' );
		File_Browser_Bridge::get_path_info( $request );

		// Asserted whole rather than key by key: it pins that nothing
		// extra is sent, and it fails loudly on a null body — the trait
		// leaves it null when a guard refused before reaching the
		// network, which per-key assertions would skip in silence.
		$this->assertSame(
			array(
				'backup_id'      => '1748888135',
				'manifest_path'  => 'f5:/wp-config.php',
				'extension_type' => '',
			),
			$this->captured_body
		);
	}

	/**
	 * The manifest path reaches WPCOM as raw, unescaped base64.
	 *
	 * WPCOM's stream route runs a plain `base64_decode()` on this URL
	 * segment, so percent-encoding it first is silently destructive:
	 * PHP's non-strict decoder discards the `%` and keeps the `3` and
	 * the `D`, both of which are valid base64 characters. The segment
	 * `ZjU6L3dwLWNvbmZpZy5waHA%3D` therefore decodes to the non-empty
	 * but wrong `f5:/wp-config.php7`, and VaultPress correctly reports
	 * `File not found` for a file that is really there.
	 *
	 * Only paths whose base64 needs no `=` padding and happens to avoid
	 * `+` and `/` survive the round trip — which is why `readme.html`
	 * (15 bytes) previewed while `wp-config.php` (17 bytes) did not.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_encoded_manifest_paths() {
		return array(
			// `f5:/wp-config.php` — the padded case, 68% of real paths.
			'padded'         => array( 'ZjU6L3dwLWNvbmZpZy5waHA=' ),
			// `f5:/wp-content/uploads/日本語.jpg`. `/` inside the base64
			// splits the outbound path into an extra segment, which is
			// the case where relying on the upstream route's greedy
			// `\S+` capture actually carries weight. Non-ASCII filenames
			// are the only way `+` and `/` arise, so without this the
			// central claim of the fix goes unexercised.
			'contains slash' => array( 'ZjU6L3dwLWNvbnRlbnQvdXBsb2Fkcy/ml6XmnKzoqp4uanBn' ),
		);
	}

	/**
	 * @param string $encoded The base64 manifest path to send.
	 *
	 * @dataProvider provide_encoded_manifest_paths
	 */
	#[DataProvider( 'provide_encoded_manifest_paths' )]
	public function test_file_content_sends_the_manifest_path_as_raw_base64( $encoded ) {
		$this->arrange_wpcom( array( 'url' => 'https://public-api.wordpress.com/signed-stream' ) );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', $encoded );
		File_Browser_Bridge::get_file_content( $request );

		$this->assertStringContainsString(
			"/rewind/backup/1748888135/file/{$encoded}/url",
			$this->captured_urls[0]
		);
	}

	/**
	 * The signed-URL leg wraps a transport failure too.
	 *
	 * Worth covering separately from the listing: the file-content
	 * callback makes two outbound calls, and only the first is reached
	 * when WPCOM is unreachable.
	 */
	public function test_file_content_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', 'ZjU6L3dwLWNvbmZpZy5waHA=' );
		$response = File_Browser_Bridge::get_file_content( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_file_content_url_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}
}
