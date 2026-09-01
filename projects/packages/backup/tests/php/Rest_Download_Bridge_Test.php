<?php
/**
 * Unit tests for Download_Bridge.
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
 * Tests for the /jetpack/v4/backups/download/* routes.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Download_Bridge
 */
#[CoversClass( Download_Bridge::class )]
class Rest_Download_Bridge_Test extends TestCase {

	/**
	 * REST Server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	use Wpcom_Request_Mock;

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
	 * The initiate route registers when the modernization filter is on.
	 */
	public function test_initiate_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)', $routes );
	}

	/**
	 * The status route registers when the modernization filter is on.
	 */
	public function test_status_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)/status', $routes );
	}

	/**
	 * Routes are gated on manage_options — a subscriber gets 403.
	 */
	public function test_routes_require_manage_options() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$initiate_request  = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$initiate_response = $this->server->dispatch( $initiate_request );
		$this->assertSame( 403, $initiate_response->get_status() );

		$status_request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$status_request->set_param( 'download_id', 1 );
		$status_response = $this->server->dispatch( $status_request );
		$this->assertSame( 403, $status_response->get_status() );
	}

	/**
	 * The rewind id goes in the body, in full, and the target is the
	 * downloads collection.
	 *
	 * The previous target was a `prepare-download` path under the backup,
	 * which is not a registered route — the Download screen answered
	 * `rest_no_route` on every site it was tried against.
	 */
	public function test_initiate_sends_full_rewind_id_in_the_body() {
		$this->arrange_wpcom( array( 'downloadId' => 4321 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/1786663613.9425' );
		$request->set_param( 'rewind_id', '1786663613.9425' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Download_Bridge::initiate_download( $request );

		$sent = (array) $this->captured_body;

		$this->assertStringContainsString( '/sites/999/rewind/downloads', $this->captured_url );
		// In full: truncating the decimal addresses a different backup.
		$this->assertSame( '1786663613.9425', $sent['rewindId'] );
		$this->assertSame( array( 'themes' => true ), $sent['types'] );
		$this->assertSame( array( 'id' => 4321 ), $response->get_data() );
	}

	/**
	 * An absent `types` is forwarded as an omission, because that is how
	 * a whole-archive download is spelled upstream.
	 *
	 * The only empty-looking case that stays allowed, and the distinction
	 * is load-bearing — see the refusal test below.
	 */
	public function test_initiate_omits_an_absent_types() {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		Download_Bridge::initiate_download( $request );

		$this->assertArrayNotHasKey( 'types', (array) $this->captured_body );
	}

	/**
	 * A supplied `types` that names nothing is refused, not omitted.
	 *
	 * This test asserted the opposite until now, and the reasoning
	 * recorded with it was wrong: an omitted `types` does not ask WPCOM
	 * for a download containing nothing, it asks for **all six
	 * categories**. Dropping an empty selection therefore handed back the
	 * full archive the caller had just excluded — and the same code path
	 * on the restore bridge overwrote a live site with it.
	 * `/rewind/downloads` has no server-side guard of its own, unlike the
	 * v2 restore route, so this one has to hold.
	 *
	 * @param string $label Case description.
	 * @param mixed  $types The `types` parameter to send.
	 * @dataProvider provide_types_that_name_nothing
	 */
	#[DataProvider( 'provide_types_that_name_nothing' )]
	public function test_initiate_refuses_types_that_name_nothing( $label, $types ) {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', $types );
		$response = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'no_types_selected', $response->get_error_code(), $label );
		$this->assertSame( 400, $response->get_error_data()['status'], $label );
		// And nothing was asked of WPCOM at all.
		$this->assertNull( $this->captured_body, $label );
	}

	/**
	 * Every supplied shape that names no category.
	 *
	 * `list of booleans` is the shape the route schema cannot reject,
	 * since it constrains values rather than shape.
	 *
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public static function provide_types_that_name_nothing() {
		return array(
			'empty array'      => array( 'empty array', array() ),
			'all false'        => array( 'all false', array( 'themes' => false ) ),
			'list of booleans' => array( 'list of booleans', array( true, false ) ),
			// Supplied as null, which the guard used to miss: WordPress
			// skips `validate_callback` for a null param, so the schema
			// passes it and `get_param()` answers exactly what an omitted
			// key answers. Only `has_param()` can tell them apart.
			'supplied as null' => array( 'supplied as null', null ),
			'unknown names'    => array( 'unknown names', array( 'sql' => true ) ),
		);
	}

	/**
	 * A transport failure surfaces as the bridge's own error rather than
	 * cURL's text, which the dashboard renders to the reader verbatim.
	 */
	public function test_initiate_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'download_initiate_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * The status poll wraps a transport failure too. Worth its own case:
	 * this is the call that runs on a timer, so it is the one most likely
	 * to meet a flaky network.
	 */
	public function test_status_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'download_id', 4321 );
		$response = Download_Bridge::get_download_status( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'download_status_fetch_failed', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * Only the selected categories are forwarded, each normalised to true.
	 */
	public function test_initiate_forwards_only_selected_types() {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param(
			'types',
			array(
				'themes'  => true,
				'plugins' => false,
				'sqls'    => true,
			)
		);
		Download_Bridge::initiate_download( $request );

		$sent = (array) $this->captured_body;
		$this->assertSame(
			array(
				'themes' => true,
				'sqls'   => true,
			),
			$sent['types']
		);
		// A category download names no paths — the other half of the pairing.
		$this->assertArrayNotHasKey( 'include_path_list', $sent );
	}

	/**
	 * A JSON list of category names never reaches the callback.
	 *
	 * WordPress validates `'type' => 'object'` with `rest_is_object()`,
	 * which is `is_array()` — so without the schema's value constraint a
	 * list passes validation, arrives as a PHP list, and WPCOM reads its
	 * numeric keys as category names.
	 */
	public function test_a_list_of_type_names_is_rejected_by_the_schema() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'schema_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode( array( 'types' => array( 'themes' ) ), JSON_UNESCAPED_SLASHES )
		);

		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
		// Name the parameter, so this cannot pass on some unrelated 400.
		$this->assertArrayHasKey( 'types', $data['data']['params'] );
	}

	/**
	 * A non-200 from WordPress.com becomes a WP_Error carrying its status.
	 */
	public function test_initiate_reports_a_non_200_from_wpcom() {
		$this->arrange_wpcom( array( 'error' => 'nope' ), 503 );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$result = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'download_initiate_failed', $result->get_error_code() );
		$this->assertSame( 503, $result->get_error_data()['status'] );
	}

	/**
	 * A success code reported as a string still queues the archive.
	 *
	 * `wp_remote_retrieve_response_code()` hands back whatever the
	 * transport put there, so an uncast `200 !== $status_code` sent an
	 * accepted download into the failure branch — and the reader was told
	 * their archive could not be started while WordPress.com was building
	 * it.
	 *
	 * The download id is what is asserted, not the absence of an error:
	 * uncast, this came back as a 500, so a status-only test would have
	 * passed on the bug.
	 */
	public function test_initiate_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw( '{"downloadId":4321}', '200' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$response = Download_Bridge::initiate_download( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( array( 'id' => 4321 ), $response->get_data() );
	}

	/**
	 * The same on the poll: a string 200 reports the finished archive.
	 */
	public function test_status_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw(
			'{"downloadId":55,"url":"https://example.com/archive.zip","validUntil":"2026-08-20T00:00:00+00:00"}',
			'200'
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'download_id', 55 );
		$response = Download_Bridge::get_download_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'finished', $response->get_data()['status'] );
		$this->assertSame( 'https://example.com/archive.zip', $response->get_data()['url'] );
	}

	/**
	 * A 200 with no `downloadId` is a failure, not a queued download.
	 */
	public function test_initiate_reports_a_missing_download_id() {
		$this->arrange_wpcom( array( 'ok' => true ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$result = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'download_initiate_failed', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * A non-200 on the status route is reported too.
	 */
	public function test_status_reports_a_non_200_from_wpcom() {
		$this->arrange_wpcom( array(), 502 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'download_id', 55 );
		$result = Download_Bridge::get_download_status( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'download_status_fetch_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
		// This body names no reason, so none is invented. An always-present
		// key would make "WordPress.com said nothing" and "we did not look"
		// look the same to whoever reads the failure.
		$this->assertArrayNotHasKey( 'wpcom', $result->get_error_data() );
	}

	/**
	 * The status route keeps WordPress.com's reason when it gives one.
	 *
	 * 401 rather than 500, because 500 is also the fallback for a status
	 * that cannot be read — a test written against it would pass whether
	 * or not the status was forwarded.
	 */
	public function test_status_forwards_the_upstream_reason() {
		$this->arrange_wpcom(
			array(
				'error'   => 'authorization_required',
				'message' => 'An active access token must be used.',
			),
			401
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'download_id', 55 );
		$data = Download_Bridge::get_download_status( $request )->get_error_data();

		$this->assertSame( 401, $data['status'] );
		$this->assertSame( 'authorization_required', $data['wpcom']['code'] );
		$this->assertSame( 'An active access token must be used.', $data['wpcom']['message'] );
	}

	/**
	 * A URL we would not hand to the browser is a failure, not an
	 * in-progress download.
	 *
	 * Left as an empty `url` it would fall through to `running`, and the
	 * client would poll forever against a download that is in fact done.
	 */
	public function test_a_non_http_url_is_reported_as_failed() {
		$failed = $this->project_status(
			array(
				'downloadId' => 55,
				'url'        => 'javascript:alert(1)',
			)
		);

		$this->assertSame( 'failed', $failed['status'] );
		$this->assertSame( '', $failed['url'] );
		$this->assertNotSame( '', $failed['error'] );
	}

	/**
	 * `progress` is clamped to the range the field documents.
	 */
	public function test_progress_is_clamped() {
		$over = $this->project_status(
			array(
				'downloadId' => 55,
				'progress'   => 10000,
			)
		);
		$this->assertSame( 100, $over['progress'] );

		$under = $this->project_status(
			array(
				'downloadId' => 55,
				'progress'   => -5,
			)
		);
		$this->assertSame( 0, $under['progress'] );
	}

	/**
	 * Run a status request against a canned WPCOM body.
	 *
	 * @param array $body WPCOM's payload.
	 * @return array The projected response data.
	 */
	private function project_status( array $body ) {
		$this->arrange_wpcom( $body );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/backups/download/123/status' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'download_id', 55 );

		return Download_Bridge::get_download_status( $request )->get_data();
	}

	/**
	 * The status call addresses the download directly — the rewind id is
	 * not part of the upstream path.
	 */
	public function test_status_targets_the_download_directly() {
		$this->project_status(
			array(
				'downloadId' => 55,
				'progress'   => 10,
			)
		);

		$this->assertStringContainsString( '/sites/999/rewind/downloads/55', $this->captured_url );
	}

	/**
	 * WPCOM sends no status field, so the bridge derives one from which
	 * of its lifecycle keys arrived. The other branches have their own
	 * tests below.
	 */
	public function test_an_in_flight_download_reports_running() {
		// In flight: `progress` only.
		$running = $this->project_status(
			array(
				'downloadId' => 55,
				'progress'   => 42,
			)
		);
		$this->assertSame( 'running', $running['status'] );
		$this->assertSame( 42, $running['progress'] );
	}

	/**
	 * A ready archive reports `finished`, and carries no progress at all.
	 */
	public function test_a_ready_archive_reports_finished() {
		$finished = $this->project_status(
			array(
				'downloadId' => 55,
				'url'        => 'https://example.com/archive.zip',
				'validUntil' => '2026-08-20T00:00:00+00:00',
			)
		);

		$this->assertSame( 'finished', $finished['status'] );
		$this->assertSame( 'https://example.com/archive.zip', $finished['url'] );
		$this->assertSame( '2026-08-20T00:00:00+00:00', $finished['valid_until'] );
		// Absent upstream once the download leaves the in-flight branch.
		$this->assertSame( 0, $finished['progress'] );
	}

	/**
	 * A failed download can still carry a stale `url`, so the error
	 * branch has to win.
	 */
	public function test_error_beats_a_stale_url() {
		$failed = $this->project_status(
			array(
				'downloadId' => 55,
				'error'      => 'Archive expired',
				'url'        => 'https://example.com/stale.zip',
			)
		);

		$this->assertSame( 'failed', $failed['status'] );
		$this->assertSame( 'Archive expired', $failed['error'] );
	}

	/**
	 * A granular download reaches WordPress.com as `types: { paths: true }`
	 * plus the entry ids, and nothing else.
	 *
	 * Dispatched from a JSON body rather than a hand-built request, so the
	 * route's own schema is part of what passes.
	 */
	public function test_initiate_forwards_a_path_list_with_the_paths_type() {
		$this->arrange_wpcom( array( 'downloadId' => 7 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/1786663613.9425' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'types'             => array( 'paths' => true ),
					'include_path_list' => array( 'cjI6', 'ZjI6Lw==' ),
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'rewindId'          => '1786663613.9425',
				'types'             => array( 'paths' => true ),
				'include_path_list' => array( 'cjI6', 'ZjI6Lw==' ),
			),
			(array) $this->captured_body
		);
		// A JSON array on the wire rather than an object, which is what
		// `path_list()` rebuilding the entries as a PHP list buys.
		$this->assertStringContainsString(
			'"include_path_list":["cjI6","ZjI6Lw=="]',
			$this->captured_request_args[0]['body']
		);
	}

	/**
	 * A path list sent beside anything but `types: { paths: true }` is
	 * refused before it reaches the network.
	 *
	 * @param string $label Case description.
	 * @param mixed  $types The `types` parameter to send, or null to omit it.
	 * @dataProvider provide_types_that_cannot_carry_a_path_list
	 */
	#[DataProvider( 'provide_types_that_cannot_carry_a_path_list' )]
	public function test_initiate_refuses_a_path_list_without_the_paths_type( $label, $types ) {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		if ( null !== $types ) {
			$request->set_param( 'types', $types );
		}
		$request->set_param( 'include_path_list', array( 'cjI6' ) );
		$response = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'path_list_needs_paths_type', $response->get_error_code(), $label );
		$this->assertSame( 400, $response->get_error_data()['status'], $label );
		$this->assertNull( $this->captured_body, $label );
	}

	/**
	 * Every `types` a path list must not travel with.
	 *
	 * `omitted` is the dangerous one: an absent `types` is upstream's
	 * shorthand for all six categories, not for none.
	 *
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public static function provide_types_that_cannot_carry_a_path_list() {
		return array(
			'omitted'            => array( 'omitted', null ),
			'another category'   => array( 'another category', array( 'sqls' => true ) ),
			'paths plus another' => array(
				'paths plus another',
				array(
					'paths' => true,
					'sqls'  => true,
				),
			),
			'paths turned off'   => array( 'paths turned off', array( 'paths' => false ) ),
		);
	}

	/**
	 * `exclude_path_list` is under the same rule, and is registered so a
	 * request carrying it fails loudly rather than losing it silently.
	 */
	public function test_initiate_refuses_an_exclude_list_without_the_paths_type() {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'uploads' => true ) );
		$request->set_param( 'exclude_path_list', array( 'cjI6' ) );
		$response = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'path_list_needs_paths_type', $response->get_error_code() );
		$this->assertNull( $this->captured_body );
	}

	/**
	 * An include list that trims away to nothing is still an include list.
	 *
	 * `path_list()` drops blank entries before the guard sees them, so
	 * gating on its result alone would let this through as a full download.
	 *
	 * @param string $label   Case description.
	 * @param mixed  $include The `include_path_list` to send.
	 * @dataProvider provide_include_lists_that_survive_into_nothing
	 */
	#[DataProvider( 'provide_include_lists_that_survive_into_nothing' )]
	public function test_initiate_refuses_a_blank_path_list_without_the_paths_type( $label, $include ) {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/1786663613.9425' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode( array( 'include_path_list' => $include ), JSON_UNESCAPED_SLASHES )
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status(), $label );
		$this->assertSame( 'path_list_needs_paths_type', $response->get_data()['code'], $label );
		$this->assertNull( $this->captured_body, $label );
	}

	/**
	 * Every include list that reaches the guard empty.
	 *
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public static function provide_include_lists_that_survive_into_nothing() {
		return array(
			'blank entries' => array( 'blank entries', array( '  ', '' ) ),
			'empty list'    => array( 'empty list', array() ),
		);
	}

	/**
	 * The mirror image: `paths` with nothing to scope it by is refused,
	 * because upstream reads that as the whole site too.
	 *
	 * @param string $label   Case description.
	 * @param mixed  $include The `include_path_list` to send, or null to omit it.
	 * @dataProvider provide_path_lists_that_name_nothing
	 */
	#[DataProvider( 'provide_path_lists_that_name_nothing' )]
	public function test_initiate_refuses_the_paths_type_without_a_path_list( $label, $include ) {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'paths' => true ) );
		if ( null !== $include ) {
			$request->set_param( 'include_path_list', $include );
		}
		$response = Download_Bridge::initiate_download( $request );

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'paths_type_needs_path_list', $response->get_error_code(), $label );
		$this->assertSame( 400, $response->get_error_data()['status'], $label );
		$this->assertNull( $this->captured_body, $label );
	}

	/**
	 * Every path list that names no entry.
	 *
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public static function provide_path_lists_that_name_nothing() {
		return array(
			'omitted'       => array( 'omitted', null ),
			'empty list'    => array( 'empty list', array() ),
			'blank entries' => array( 'blank entries', array( '', '   ' ) ),
		);
	}

	/**
	 * A path list keyed by name never reaches the callback.
	 *
	 * Without the schema this would reach WPCOM flattened to its values:
	 * WordPress skips *validating* unregistered params, it does not strip them.
	 */
	public function test_a_keyed_path_list_is_rejected_by_the_schema() {
		$this->arrange_wpcom( array( 'downloadId' => 1 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'types'             => array( 'paths' => true ),
					'include_path_list' => array( 'first' => 'cjI6' ),
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
		$this->assertArrayHasKey( 'include_path_list', $data['data']['params'] );
		$this->assertNull( $this->captured_body );
	}

	/**
	 * Entries are trimmed and blanks dropped, so a stray space cannot
	 * become part of an id.
	 */
	public function test_initiate_trims_the_path_list() {
		$this->arrange_wpcom( array( 'downloadId' => 9 ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backups/download/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'paths' => true ) );
		$request->set_param( 'include_path_list', array( ' cjI6 ', '', 'ZjI6Lw==' ) );
		Download_Bridge::initiate_download( $request );

		$sent = (array) $this->captured_body;
		$this->assertSame( array( 'cjI6', 'ZjI6Lw==' ), $sent['include_path_list'] );
	}
}
