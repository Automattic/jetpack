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
}
