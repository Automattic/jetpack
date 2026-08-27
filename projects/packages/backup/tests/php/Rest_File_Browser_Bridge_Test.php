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
use function home_url;
use function remove_filter;
use function wp_insert_user;
use function wp_json_encode;
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
	 * A success code reported as a string lists the directory.
	 *
	 * `wp_remote_retrieve_response_code()` hands back whatever the
	 * transport put there, so an uncast `200 !== $status_code` sent a
	 * perfectly good listing down the failure branch and left the file
	 * tree empty with an error over it.
	 *
	 * Through `forward_response()`, which `get_path_info()` shares — so
	 * this covers the cast on both pass-through routes. The listing itself
	 * is what is asserted, not the absence of an error: uncast, this came
	 * back as a 500, so a status-only test would have passed on the bug.
	 */
	public function test_list_directory_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw( '{"contents":[{"name":"wp-config.php","type":"file"}]}', '200' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/123/ls' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'path', '/' );
		$response = File_Browser_Bridge::list_directory( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'wp-config.php', $response->get_data()['contents'][0]['name'] );
	}

	/**
	 * A string 200 on either leg of the preview still returns the file.
	 *
	 * This callback reads a status twice — once for the signed-URL lookup
	 * and once for the stream fetch — and the single canned answer here
	 * serves both, so one test covers both casts. The stream leg is the
	 * one where getting this wrong cost most: the branch it wrongly took
	 * already had the previewed file's bytes in hand and threw them away
	 * to report a 500.
	 *
	 * The signed URL is built from `home_url()` so that
	 * `wp_http_validate_url()` takes its same-host path. Any other host
	 * would send it to `gethostbyname()`, and this test would then pass or
	 * fail on whether the runner has DNS.
	 */
	public function test_file_content_treats_a_string_status_as_its_number() {
		$body = wp_json_encode( array( 'url' => home_url( '/signed-stream' ) ), JSON_UNESCAPED_SLASHES );
		$this->arrange_wpcom_raw( $body, '200' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', 'ZjU6L3dwLWNvbmZpZy5waHA=' );
		$response = File_Browser_Bridge::get_file_content( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		// The stream leg is answered by the same filter, so the "file"
		// here is that canned body, forwarded verbatim.
		$this->assertSame( $body, $response->get_data()['content'] );
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

	/**
	 * What path-info answers with, not just what it asks for.
	 *
	 * The outbound half of this route was pinned and the return value was
	 * not, which left the whole of what the info card reads unasserted:
	 * `size`, `hash` and `mtime` are the reason the route exists, and a
	 * `forward_response()` that dropped or reshaped them would have shown
	 * an empty card with no error anywhere.
	 *
	 * Asserted whole rather than key by key, so a bridge that started
	 * adding or removing fields fails here rather than drifting.
	 *
	 * `manifest_filter` is in the fixture because it is the field a
	 * granular per-file download will need, and `error` because upstream
	 * answers 200 with one when the file has no row — the client branches
	 * on it, so it has to survive the forward.
	 */
	public function test_path_info_forwards_the_upstream_payload() {
		$upstream = array(
			'size'            => 3247,
			'hash'            => 'abc123',
			'mtime'           => 1748888135,
			'manifest_filter' => 'f5:/wp-config.php',
			'error'           => '',
		);
		$this->arrange_wpcom( $upstream );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/path-info' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'manifest_path', 'f5:/wp-config.php' );
		$response = File_Browser_Bridge::get_path_info( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( $upstream, $response->get_data() );
	}

	/**
	 * A non-200 on path-info is reported under path-info's own code.
	 *
	 * The status and reason travel through `forward_response()`, which the
	 * listing already covers — what is only true here is the error code.
	 * The client's `failureMessage()` keys off it, so a route answering
	 * with a sibling's code would be described to the reader as the wrong
	 * operation failing.
	 *
	 * 429 rather than 500: `upstream_error()` falls back to 500 for a
	 * status it cannot use, so a test written against 500 would pass
	 * whether or not the status was forwarded at all.
	 */
	public function test_path_info_reports_a_non_200_under_its_own_code() {
		$this->arrange_wpcom( array( 'code' => 'too_many_requests' ), 429 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/path-info' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'manifest_path', 'f5:/wp-config.php' );
		$response = File_Browser_Bridge::get_path_info( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_path_info_failed', $response->get_error_code() );
		$this->assertSame( 429, $response->get_error_data()['status'] );
		$this->assertSame( 'too_many_requests', $response->get_error_data()['wpcom']['code'] );
	}

	/**
	 * A signed-URL body WPCOM answered 200 with, and the signed URL the
	 * stream leg would then be given.
	 *
	 * `home_url()` throughout, so `wp_http_validate_url()` takes its
	 * same-host path — any other host sends it to `gethostbyname()` and
	 * makes these tests pass or fail on whether the runner has DNS.
	 *
	 * @return string
	 */
	private static function signed_url_body() {
		return wp_json_encode( array( 'url' => home_url( '/signed-stream' ) ), JSON_UNESCAPED_SLASHES );
	}

	/**
	 * A request for the preview that the file browser would really make.
	 *
	 * @return WP_REST_Request
	 */
	private static function file_content_request() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backup/file-content' );
		$request->set_param( 'file_period', '1748888135' );
		$request->set_param( 'encoded_manifest_path', 'ZjU6L3dwLWNvbmZpZy5waHA=' );
		return $request;
	}

	/**
	 * The stream fetch is capped, and capped at the preview limit.
	 *
	 * `limit_response_size` is the only thing between a text preview and
	 * a multi-gigabyte blob buffered into PHP memory: the bridge enforces
	 * no mime check at all, so any admin can point this route at any blob
	 * WordPress.com will sign a URL for. It cannot be asserted from a
	 * response — it changes nothing about a small file — so it is read off
	 * the outbound request arguments instead.
	 *
	 * The first call is asserted to be uncapped, and that is a statement
	 * about where the cap *can* live rather than about where someone might
	 * put it by mistake: `Client::validate_args_for_wpcom_json_api_request()`
	 * intersects outbound arguments against a fixed allowlist —
	 * `headers`, `method`, `format`, `timeout`, `redirection`, `stream`,
	 * `filename`, `sslverify` — and `limit_response_size` is not on it. A
	 * signed `Client` call cannot be capped at all, then, and asking for
	 * one to be is silently a no-op. The cap only works on the second leg
	 * because that leg is a bare `wp_remote_get()`, which it is because
	 * the signed URL points at the storage host and carries its own
	 * authorization — there is nothing for `Client` to sign.
	 */
	public function test_file_content_caps_the_stream_fetch_at_the_preview_limit() {
		$this->arrange_wpcom_answers(
			array(
				array( 'body' => self::signed_url_body() ),
				array( 'body' => 'file contents' ),
			)
		);

		File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertCount( 2, $this->captured_request_args );
		// `WP_Http` defaults the key to null, so "uncapped" is a null value
		// rather than an absent key.
		$this->assertNull( $this->captured_request_args[0]['limit_response_size'] ?? null );
		$this->assertSame(
			File_Browser_Bridge::PREVIEW_MAX_BYTES,
			$this->captured_request_args[1]['limit_response_size']
		);
	}

	/**
	 * A preview cut short by the byte cap is forwarded exactly as it
	 * arrived, mid-character and all.
	 *
	 * The cap is a byte count enforced by the HTTP transport, not by this
	 * bridge, and the transport counts bytes with no idea where characters
	 * begin. So the cut can land inside a multi-byte sequence, and this is
	 * the fixture where it does: 65,535 ASCII bytes followed by U+65E5
	 * (`日`, `E6 97 A5`) is 65,538 bytes, and the cut at 65,536 keeps the
	 * lead byte `E6` and drops the two continuation bytes behind it. The
	 * fixture is built that way rather than asserted to be that way, so
	 * the last two assertions below are what prove it landed mid-character
	 * rather than at a boundary.
	 *
	 * `pre_http_request` short-circuits the transport, so the arranged body
	 * stands in for what the transport's own cut would have handed back.
	 * What is under test is what the bridge does with it: nothing. It does
	 * not re-cut it to a character boundary, and it does not repair it —
	 * either would be a silently different file from the one on disk, which
	 * is worse in a preview than a visibly damaged tail.
	 *
	 * The damage is not invisible downstream: `wp_json_encode()` refuses
	 * the orphaned lead byte and its sanity pass rewrites it, so a reader
	 * sees `?` at the end of a preview this long. That is core's call to
	 * make, not this bridge's, and it only happens because the bytes were
	 * forwarded honestly.
	 */
	public function test_file_content_forwards_a_body_cut_mid_character_unrepaired() {
		$cut = substr(
			str_repeat( 'a', File_Browser_Bridge::PREVIEW_MAX_BYTES - 1 ) . "\xE6\x97\xA5",
			0,
			File_Browser_Bridge::PREVIEW_MAX_BYTES
		);

		$this->arrange_wpcom_answers(
			array(
				array( 'body' => self::signed_url_body() ),
				array( 'body' => $cut ),
			)
		);

		$response = File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$content = $response->get_data()['content'];
		$this->assertSame( $cut, $content );
		$this->assertSame( File_Browser_Bridge::PREVIEW_MAX_BYTES, strlen( $content ) );
		// Both halves of "the cut landed inside a character": the tail is
		// the lead byte of a three-byte sequence, and the string as a whole
		// is therefore not valid UTF-8. A bridge that repaired or re-cut
		// the body would pass the length check and fail these.
		$this->assertSame( "\xE6", substr( $content, -1 ) );
		$this->assertFalse( mb_check_encoding( $content, 'UTF-8' ) );
	}

	/**
	 * A failure resolving the signed URL is the lookup's, not the stream's.
	 *
	 * The two legs have separate error codes on purpose — one means
	 * WordPress.com would not name the file, the other means the storage
	 * host would not serve it — and only the first leg runs here, so a
	 * bridge that mixed them up would be reporting a fetch that never
	 * happened.
	 *
	 * 451 is arbitrary except in one respect: it is inside the range
	 * `upstream_error()` forwards and is not any of the codes it or the
	 * bridge falls back to (500 and 502), so it can only be here because
	 * it was carried through.
	 */
	public function test_file_content_reports_a_failed_signed_url_lookup() {
		$this->arrange_wpcom_answers(
			array(
				array(
					'body'   => '{"code":"rewind_error","message":"No backup for this period."}',
					'status' => 451,
				),
			)
		);

		$response = File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_file_content_url_failed', $response->get_error_code() );
		$this->assertSame( 451, $response->get_error_data()['status'] );
		$this->assertSame( 'rewind_error', $response->get_error_data()['wpcom']['code'] );
		// The stream leg must not have run: there was no URL to fetch.
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * A 200 that names no URL this server will fetch stops here.
	 *
	 * The scheme check is defence in depth rather than housekeeping.
	 * Whatever comes back in `url` is handed to `wp_remote_get()` on this
	 * server, so a regression upstream that answered `file:///etc/passwd`
	 * would otherwise have the site read its own disk and return the bytes
	 * to the browser.
	 *
	 * 502 rather than 500 here, and that is the bridge's own choice rather
	 * than `upstream_error()`'s: WordPress.com answered, and what it said
	 * cannot be used.
	 *
	 * @param string $label Why this body names no usable URL.
	 * @param string $body  Raw 200 body from the signed-URL lookup.
	 * @dataProvider provide_unusable_signed_urls
	 */
	#[DataProvider( 'provide_unusable_signed_urls' )]
	public function test_file_content_refuses_a_signed_url_it_will_not_fetch( $label, $body ) {
		$this->arrange_wpcom_answers( array( array( 'body' => $body ) ) );

		$response = File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'backup_file_content_url_missing', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
		$this->assertCount( 1, $this->captured_urls, 'Nothing may be fetched from an unusable URL.' );
	}

	/**
	 * 200 bodies the signed-URL lookup could answer with that name no URL
	 * this server may fetch.
	 *
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function provide_unusable_signed_urls() {
		return array(
			'no url key'    => array( 'no url key', '{"ok":true}' ),
			'an empty url'  => array( 'an empty url', '{"url":""}' ),
			'not JSON'      => array( 'not JSON', '<html>502 Bad Gateway</html>' ),
			// The one that matters: `wp_remote_get()` would happily read
			// this off the site's own disk.
			'a file scheme' => array( 'a file scheme', '{"url":"file:///etc/passwd"}' ),
		);
	}

	/**
	 * A transport failure on the *stream* leg is the stream's failure.
	 *
	 * The existing transport test never reaches this branch — with WPCOM
	 * unreachable the callback stops at the signed-URL lookup — so the
	 * second `is_wp_error()` guard, and the fact that it uses a different
	 * error code, was never run. The signed URL resolves here and the
	 * fetch of it is what times out.
	 */
	public function test_file_content_wraps_a_transport_failure_on_the_stream_leg() {
		$this->arrange_wpcom_answers(
			array(
				array( 'body' => self::signed_url_body() ),
				new WP_Error(
					'http_request_failed',
					'cURL error 28: Operation timed out after 10001 milliseconds with 0 bytes received'
				),
			)
		);

		$response = File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_file_content_stream_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * A non-200 from the storage host is reported as a stream failure.
	 *
	 * This response is not WordPress.com's — it is whoever holds the
	 * bytes — and a signed URL that has expired between being minted and
	 * being fetched is the ordinary way to get here. The status is
	 * forwarded all the same, because the client tells an expired link
	 * from a missing file by nothing else.
	 *
	 * 416 for the same reason 451 is used above: forwardable, and not a
	 * value any fallback on this path can produce.
	 */
	public function test_file_content_reports_a_failed_stream_fetch() {
		$this->arrange_wpcom_answers(
			array(
				array( 'body' => self::signed_url_body() ),
				array(
					'body'   => '<?xml version="1.0"?><Error><Code>AccessDenied</Code></Error>',
					'status' => 416,
				),
			)
		);

		$response = File_Browser_Bridge::get_file_content( self::file_content_request() );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'backup_file_content_stream_failed', $response->get_error_code() );
		$this->assertSame( 416, $response->get_error_data()['status'] );
		// The storage host answers in XML, which `upstream_reason()` reads
		// nothing out of — so there is no `wpcom` key to forward, and the
		// status is the whole of what the client has to go on.
		$this->assertArrayNotHasKey( 'wpcom', $response->get_error_data() );
	}
}
