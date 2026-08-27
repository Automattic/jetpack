<?php
/**
 * Unit tests for Restore_Bridge.
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
 * Tests for the /jetpack/v4/rewind/* routes.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Restore_Bridge
 */
#[CoversClass( Restore_Bridge::class )]
class Rest_Restore_Bridge_Test extends TestCase {

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
	 * The initiate route registers when the modernization filter is on.
	 */
	public function test_initiate_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/to/(?P<rewind_id>[A-Za-z0-9.\-]+)', $routes );
	}

	/**
	 * The status route registers when the modernization filter is on.
	 */
	public function test_status_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/rewind/restore/(?P<restore_id>\d+)/status', $routes );
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

		$initiate_request  = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$initiate_response = $this->server->dispatch( $initiate_request );
		$this->assertSame( 403, $initiate_response->get_status() );

		$status_request  = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/1/status' );
		$status_response = $this->server->dispatch( $status_request );
		$this->assertSame( 403, $status_response->get_status() );
	}
	/**
	 * A supplied `types` that names nothing is refused, not omitted.
	 *
	 * The destructive half of the guard. An omitted `types` means every
	 * category upstream, so forwarding an empty selection as an omission
	 * would overwrite the live site with exactly the parts the caller
	 * excluded. The v2 restore route rejects this too, but only after the
	 * request has left us.
	 *
	 * @param string $label Case description.
	 * @param mixed  $types The `types` parameter to send.
	 * @dataProvider provide_types_that_name_nothing
	 */
	#[DataProvider( 'provide_types_that_name_nothing' )]
	public function test_initiate_refuses_types_that_name_nothing( $label, $types ) {
		$this->arrange_wpcom( array( 'ok' => true ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', $types );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'no_types_selected', $response->get_error_code(), $label );
		$this->assertSame( 400, $response->get_error_data()['status'], $label );
		// Nothing was asked of WPCOM at all.
		$this->assertNull( $this->captured_body, $label );
	}

	/**
	 * An absent `types` still means a whole-site restore, and must stay
	 * allowed — it is what the default six-of-six checklist collapses to
	 * once every category is named.
	 */
	public function test_initiate_allows_an_absent_types() {
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 42,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertArrayNotHasKey( 'types', (array) $this->captured_body );
	}

	/**
	 * Every supplied shape that names no category.
	 *
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public static function provide_types_that_name_nothing() {
		return array(
			'empty array'      => array( 'empty array', array() ),
			'all false'        => array( 'all false', array( 'themes' => false ) ),
			'list of booleans' => array( 'list of booleans', array( true, false ) ),
			// Supplied as null, which is the case the guard used to miss:
			// WordPress skips `validate_callback` for a null param, so the
			// schema passes it and `get_param()` answers exactly what an
			// omitted key answers. Only `has_param()` can tell them apart,
			// and getting it wrong means a whole-site restore.
			'supplied as null' => array( 'supplied as null', null ),
			'unknown names'    => array( 'unknown names', array( 'sql' => true ) ),
		);
	}

	/**
	 * A transport failure surfaces as the bridge's own error rather than
	 * cURL's text.
	 */
	public function test_initiate_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'restore_initiate_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * The status poll wraps a transport failure too — the call that runs
	 * on a timer, and so the one most likely to meet a flaky network.
	 */
	public function test_status_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/1/status' );
		$request->set_param( 'restore_id', 1 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'restore_status_fetch_failed', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * The rewind id goes in the body, in full, and the target is the v2
	 * restores collection.
	 *
	 * The old target was the v1 activity-log route, which discards Jetpack
	 * user tokens by design and answered 401 for every restore ever
	 * attempted from wp-admin.
	 */
	public function test_initiate_targets_v2_with_the_full_rewind_id_in_the_body() {
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 912682,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/1786663613.9425' );
		$request->set_param( 'rewind_id', '1786663613.9425' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Restore_Bridge::initiate_restore( $request );

		$sent = (array) $this->captured_body;

		$this->assertStringContainsString( '/sites/999/rewind/restores', $this->captured_url );
		$this->assertStringNotContainsString( 'activity-log', $this->captured_url );
		// In full: truncating the decimal addresses a different backup.
		$this->assertSame( '1786663613.9425', $sent['rewindId'] );
		$this->assertSame( array( 'themes' => true ), $sent['types'] );
		$this->assertSame( 912682, $response->get_data()['id'] );
	}

	/**
	 * `force_rewind` is sent explicitly.
	 *
	 * It is optional upstream and now defaults to false, so omitting it
	 * would silently change behaviour for a caller that has always sent
	 * true.
	 */
	public function test_initiate_sends_force_rewind_explicitly() {
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 1,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'sqls' => true ) );
		Restore_Bridge::initiate_restore( $request );

		$this->assertTrue( ( (array) $this->captured_body )['force_rewind'] );
	}

	/**
	 * A null `restore_id` is a queued restore, not a failure.
	 *
	 * VaultPress does not reliably echo an id back — the documented
	 * response for the underlying call is only `{ ok, error }`. Reading
	 * the id as the success signal reported a successfully queued restore
	 * as a 500, and could not tell null from zero in any case.
	 */
	public function test_initiate_treats_a_null_restore_id_as_queued() {
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => null,
				'rewind_id'  => '1786663613.9425',
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/1786663613.9425' );
		$request->set_param( 'rewind_id', '1786663613.9425' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertNull( $response->get_data()['id'] );
		// Echoed back so the client can find the restore in the collection.
		$this->assertSame( '1786663613.9425', $response->get_data()['rewind_id'] );
	}

	/**
	 * `ok: false` is the failure, whatever else the payload carries.
	 */
	public function test_initiate_reports_a_falsey_ok_as_failure() {
		$this->arrange_wpcom(
			array(
				'ok'         => false,
				'restore_id' => 42,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'restore_initiate_failed', $response->get_error_code() );
	}

	/**
	 * The refusal that comes back inside a 200 keeps its reason too.
	 *
	 * VaultPress says why in prose, under `error`, and this branch used to
	 * drop it — leaving a reader who cannot start a restore with a generic
	 * sentence and no way to learn that one is already running.
	 *
	 * It lands in `message` rather than `code` because it is a sentence,
	 * and the client only ever matches `code` against tokens it knows.
	 */
	public function test_initiate_keeps_the_reason_from_a_refusal_in_a_200() {
		$this->arrange_wpcom(
			array(
				'ok'    => false,
				'error' => 'There is already a restore in progress',
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$response = Restore_Bridge::initiate_restore( $request );
		$data     = $response->get_error_data();

		$this->assertSame( 'There is already a restore in progress', $data['wpcom']['message'] );
		$this->assertArrayNotHasKey( 'code', $data['wpcom'] );
		// Unchanged: WordPress.com answered and said no, so nothing was
		// queued and `isAmbiguousFailure()` must keep reading this as safe
		// to retry.
		$this->assertSame( 500, $data['status'] );
	}

	/**
	 * A refusal that names nothing adds no reason.
	 */
	public function test_initiate_omits_the_reason_when_the_refusal_is_silent() {
		$this->arrange_wpcom( array( 'ok' => false ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertArrayNotHasKey( 'wpcom', $response->get_error_data() );
	}

	/**
	 * A non-200 on initiate carries WordPress.com's own code.
	 *
	 * The bridge's code cannot say why on its own — all three initiate
	 * failures are `restore_initiate_failed` — so a support agent looking
	 * at a failed restore has only this to go on. 412 rather than 500,
	 * because 500 is also the fallback for an unreadable status.
	 */
	public function test_initiate_forwards_the_upstream_reason() {
		$this->arrange_wpcom(
			array(
				'code'    => 'no_connected_jetpack',
				'message' => 'This site is not connected.',
			),
			412
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$data = Restore_Bridge::initiate_restore( $request )->get_error_data();

		$this->assertSame( 412, $data['status'] );
		$this->assertSame( 'no_connected_jetpack', $data['wpcom']['code'] );
	}

	/**
	 * The status poll targets the v2 route and is signed with the blog
	 * token.
	 *
	 * Watching a restore does not need a user, unlike starting one — which
	 * is what lets progress survive the initiating user's session.
	 */
	public function test_status_targets_the_v2_route() {
		$this->arrange_wpcom(
			array(
				'restore_id' => 912682,
				'status'     => 'running',
				'percent'    => 42,
				'rewind_id'  => '1786663613.9425',
				'message'    => 'Restoring wp-content/uploads',
			)
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/912682/status' );
		$request->set_param( 'restore_id', 912682 );
		$data = Restore_Bridge::get_restore_status( $request )->get_data();

		$this->assertStringContainsString( '/sites/999/rewind/restores/912682', $this->captured_url );
		$this->assertSame( 'running', $data['status'] );
		$this->assertSame( 42.0, $data['progress'] );
		$this->assertSame( '1786663613.9425', $data['rewind_id'] );
		$this->assertSame( 'Restoring wp-content/uploads', $data['message'] );
	}

	/**
	 * WPCOM's status vocabulary is mapped to the client's.
	 *
	 * The client used to test for `in-progress`, `queued`, `finished` and
	 * `failed` — none of which WPCOM returns — so no terminal state was
	 * ever reachable and the poll stopped after one response.
	 *
	 * @param string $upstream WPCOM's status value.
	 * @param string $expected What the bridge should report.
	 * @dataProvider provide_statuses
	 */
	#[DataProvider( 'provide_statuses' )]
	public function test_status_is_mapped( $upstream, $expected ) {
		$this->arrange_wpcom(
			array(
				'restore_id' => 1,
				'status'     => $upstream,
			)
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/1/status' );
		$request->set_param( 'restore_id', 1 );
		$data = Restore_Bridge::get_restore_status( $request )->get_data();

		$this->assertSame( $expected, $data['status'], "upstream: $upstream" );
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function provide_statuses() {
		return array(
			'running'                 => array( 'running', 'running' ),
			'success'                 => array( 'success', 'finished' ),
			// Kept distinct rather than folded into either neighbour: a
			// restore that completed but not cleanly is neither.
			'success-with-errors'     => array( 'success-with-errors', 'finished-with-errors' ),
			'fail'                    => array( 'fail', 'failed' ),
			'aborted'                 => array( 'aborted', 'aborted' ),
			// Anything WPCOM adds later is reported as unknown, which the
			// client keeps polling through rather than freezing on.
			'a status we do not know' => array( 'paused-for-lunch', 'unknown' ),
			'absent'                  => array( '', 'queued' ),
		);
	}

	/**
	 * A 404 means "queued, not visible yet" — the normal first answer for
	 * a restore that has only just been accepted.
	 *
	 * Mapping every non-200 to a hard error, as the v1 code did, turns the
	 * opening seconds of every restore into a user-visible failure. Safe
	 * to treat softly only because the route now answers 502 when
	 * VaultPress returns nothing parseable, so a 404 can no longer
	 * secretly mean "upstream is down".
	 */
	public function test_status_treats_404_as_queued() {
		$this->arrange_wpcom( array( 'error' => 'not_found' ), 404 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'queued', $response->get_data()['status'] );
		$this->assertSame( 7, $response->get_data()['id'] );
	}

	/**
	 * A success code reported as a string starts the restore.
	 *
	 * `wp_remote_retrieve_response_code()` hands back whatever the
	 * transport put there, so an uncast `200 !== $status_code` routed an
	 * accepted restore into the failure branch. This is the worst route in
	 * the package to get that wrong on: the restore is running, the reader
	 * is told it failed, and the obvious next move is to start a second
	 * one.
	 *
	 * The queued restore's own id is what is asserted, not the absence of
	 * an error — uncast, this response came back as a 500, so a test that
	 * only read the status would have passed on the bug.
	 */
	public function test_initiate_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw(
			'{"ok":true,"restore_id":42,"rewind_id":"1786663613.9425"}',
			'200'
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/1786663613.9425' );
		$request->set_param( 'rewind_id', '1786663613.9425' );
		$request->set_param( 'types', array( 'themes' => true ) );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 42, $response->get_data()['id'] );
		$this->assertSame( '1786663613.9425', $response->get_data()['rewind_id'] );
	}

	/**
	 * The same on the poll: a string 200 reports the restore's progress.
	 */
	public function test_status_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw(
			'{"restore_id":7,"status":"running","percent":42}',
			'200'
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'running', $response->get_data()['status'] );
		$this->assertSame( 42.0, $response->get_data()['progress'] );
	}

	/**
	 * A 404 reported as a string is still the queued carve-out.
	 *
	 * Both branches of this callback read the same variable, so the cast
	 * buys more here than the success test above shows: uncast, `'404'`
	 * missed the carve-out *and* the success test, and the ordinary
	 * opening seconds of every restore — before the id is visible to this
	 * route — surfaced as a failure.
	 */
	public function test_status_treats_a_string_404_as_queued() {
		$this->arrange_wpcom_raw( '{"error":"not_found"}', '404' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'queued', $response->get_data()['status'] );
		$this->assertSame( 7, $response->get_data()['id'] );
	}

	/**
	 * A 5xx is still a hard error — that is the half of the old behaviour
	 * worth keeping.
	 */
	public function test_status_still_hard_errors_on_5xx() {
		$this->arrange_wpcom( array( 'error' => 'rewind_error' ), 502 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'restore_status_fetch_failed', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
		// And the reason survives the wrapping, which is what lets the
		// client say something better than "could not fetch progress".
		$this->assertSame( 'rewind_error', $response->get_error_data()['wpcom']['code'] );
	}
}
