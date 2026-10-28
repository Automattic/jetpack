<?php
/**
 * Unit tests for Restore_Bridge.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
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
use function get_option;
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
		Constants::clear_constants();
		Status_Cache::clear();

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
	 * Every status the v2 route actually returns is recognised.
	 *
	 * Sourced from upstream, never from `STATUS_MAP` — a provider
	 * mirroring the map cannot catch a key the map is missing, which is
	 * how `finished` went unmapped. Asserting membership rather than
	 * `!== 'unknown'` so a typo'd map value fails too.
	 *
	 * @param string $upstream A status the v2 route returns.
	 * @dataProvider provide_upstream_statuses
	 */
	#[DataProvider( 'provide_upstream_statuses' )]
	public function test_every_upstream_status_maps_into_the_client_vocabulary( $upstream ) {
		$this->arrange_wpcom(
			array(
				'restore_id' => 1,
				'status'     => $upstream,
			)
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/1/status' );
		$request->set_param( 'restore_id', 1 );
		$data = Restore_Bridge::get_restore_status( $request )->get_data();

		// `RestoreStatus` in `dashboard/data/api/restore.ts`, less the two
		// this bridge mints when upstream names no status.
		$this->assertContains(
			$data['status'],
			array( 'queued', 'running', 'finished', 'finished-with-errors', 'failed', 'aborted' ),
			"upstream: $upstream"
		);
	}

	/**
	 * Both vocabularies, because the v2 route serves whichever engine ran.
	 *
	 * Rewind is Calypso's typed contract for this same endpoint
	 * (`packages/api-core/src/site-backup-restore/types.ts`); legacy is
	 * what `BackupRestore.php` assigns when it finishes a restore.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_upstream_statuses() {
		return array(
			'queued'              => array( 'queued' ),
			'running'             => array( 'running' ),
			'finished'            => array( 'finished' ),
			'fail'                => array( 'fail' ),
			'empty'               => array( '' ),
			'success'             => array( 'success' ),
			'success-with-errors' => array( 'success-with-errors' ),
			'aborted'             => array( 'aborted' ),
		);
	}

	/**
	 * WPCOM's status vocabulary is mapped to the client's.
	 *
	 * Mirrors `STATUS_MAP`, so it can only confirm that each key maps
	 * where it says — never that the map covers what arrives. That is what
	 * `test_every_upstream_status_maps_into_the_client_vocabulary` is for.
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
			'queued'                  => array( 'queued', 'queued' ),
			'running'                 => array( 'running', 'running' ),
			'finished'                => array( 'finished', 'finished' ),
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
	 * A 404 means "not visible to this route yet" — the normal first
	 * answer for a restore that has only just been accepted.
	 *
	 * Reported as `not-found` rather than `queued` so the client can tell
	 * it from WordPress.com's own `queued`: one is upstream tracking a
	 * real restore, the other is upstream having no record of it.
	 *
	 * Mapping every non-200 to a hard error, as the v1 code did, turns the
	 * opening seconds of every restore into a user-visible failure. Safe
	 * to treat softly only because the route now answers 502 when
	 * VaultPress returns nothing parseable, so a 404 can no longer
	 * secretly mean "upstream is down".
	 */
	public function test_status_treats_404_as_not_found() {
		$this->arrange_wpcom( array( 'error' => 'not_found' ), 404 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'not-found', $response->get_data()['status'] );
		$this->assertSame( 7, $response->get_data()['id'] );
	}

	/**
	 * A record that names no `restore_id` is still a record.
	 *
	 * `queued` now means *upstream is holding this restore*, which is
	 * enough to refuse the reader a new one — so the two must be told
	 * apart on whether a record arrived, not on one key.
	 */
	public function test_status_keeps_a_record_that_names_no_restore_id() {
		$this->arrange_wpcom_raw( '{"rewind_id":"1786663613.9425","percent":0,"status":""}', 200 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$data = Restore_Bridge::get_restore_status( $request )->get_data();

		$this->assertSame( 'queued', $data['status'] );
	}

	/**
	 * A 200 carrying nothing at all is `not-found`.
	 */
	public function test_status_treats_a_recordless_200_as_not_found() {
		$this->arrange_wpcom_raw( '{}', 200 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'not-found', $response->get_data()['status'] );
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
	 * A 404 reported as a string is still the not-found carve-out.
	 *
	 * Both branches of this callback read the same variable, so the cast
	 * buys more here than the success test above shows: uncast, `'404'`
	 * missed the carve-out *and* the success test, and the ordinary
	 * opening seconds of every restore — before the id is visible to this
	 * route — surfaced as a failure.
	 */
	public function test_status_treats_a_string_404_as_not_found() {
		$this->arrange_wpcom_raw( '{"error":"not_found"}', '404' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/restore/7/status' );
		$request->set_param( 'restore_id', 7 );
		$response = Restore_Bridge::get_restore_status( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'not-found', $response->get_data()['status'] );
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

	/**
	 * A ticked acknowledgement travels to WordPress.com; the arg schema coerces the string form.
	 */
	public function test_initiate_restore_forwards_acknowledge_threats() {
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 5,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'types', array( 'plugins' => true ) );
		$request->set_param( 'acknowledge_threats', 'true' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( ( (array) $this->captured_body )['acknowledge_threats'] );
	}

	/**
	 * Without an acknowledgement the flag is sent as false, so WordPress.com still checks the backup.
	 *
	 * @param mixed $acknowledge The `acknowledge_threats` param, or null for none.
	 * @dataProvider provide_unacknowledged
	 */
	#[DataProvider( 'provide_unacknowledged' )]
	public function test_initiate_restore_sends_false_without_an_acknowledgement( $acknowledge ) {
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 5,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		if ( null !== $acknowledge ) {
			$request->set_param( 'acknowledge_threats', $acknowledge );
		}
		Restore_Bridge::initiate_restore( $request );

		$this->assertFalse( ( (array) $this->captured_body )['acknowledge_threats'] );
	}

	/**
	 * Off WoA the flag stays out of the request, which keeps WordPress.com's exemption for a site with no warning.
	 */
	public function test_initiate_restore_omits_acknowledge_threats_off_woa() {
		$this->arrange_wpcom(
			array(
				'ok'         => true,
				'restore_id' => 5,
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/123' );
		$request->set_param( 'rewind_id', '123' );
		$request->set_param( 'acknowledge_threats', true );
		Restore_Bridge::initiate_restore( $request );

		$this->assertArrayNotHasKey( 'acknowledge_threats', (array) $this->captured_body );
	}

	/**
	 * Requests that do not acknowledge known threats.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_unacknowledged() {
		return array(
			'absent' => array( null ),
			'false'  => array( false ),
		);
	}

	/**
	 * A refusal over known threats keeps its own code and status so the screen can ask again.
	 */
	public function test_initiate_restore_maps_threats_not_acknowledged_to_409() {
		$known_threats = array(
			'malware'  => 2,
			'database' => 0,
		);
		$this->arrange_wpcom(
			array(
				'code'    => 'threats_not_acknowledged',
				'message' => 'Upstream wording.',
				'data'    => array(
					'status'        => 409,
					'known_threats' => $known_threats,
					'backup_period' => '1786663613',
				),
			),
			409
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/1786663613' );
		$request->set_param( 'rewind_id', '1786663613' );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'threats_not_acknowledged', $response->get_error_code() );
		$this->assertSame( 'This backup is known to contain security threats. Acknowledge them to restore it.', $response->get_error_message() );
		$this->assertSame( 409, $response->get_error_data()['status'] );
		$this->assertSame( $known_threats, $response->get_error_data()['known_threats'] );
	}

	/**
	 * The known-threats route proxies the v2 endpoint for the full rewind id and returns its body.
	 */
	public function test_known_threats_route_proxies_wpcom() {
		$body = array(
			'backup_id' => '1786663613.9425',
			'cutoff'    => '2026-10-01T00:00:00+00:00',
			'summary'   => array(
				'malware'    => 1,
				'database'   => 0,
				'vulnerable' => 0,
				'ignored'    => 0,
				'flagged'    => 1,
				'fixed'      => 0,
			),
			'threats'   => array(
				array(
					'id'        => 7,
					'state'     => 'open',
					'kind'      => 'malware',
					'signature' => 'php_generic_backdoor',
					'path'      => 'wp-content/uploads/x.php',
				),
			),
			'count'     => 1,
			'truncated' => false,
		);
		$this->arrange_woa_site();
		$this->arrange_wpcom( $body );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/1786663613.9425/threats' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( '/sites/999/rewind/backups/1786663613.9425/threats', $this->captured_url );
		$this->assertSame( $body, $response->get_data() );
	}

	/**
	 * A site without Scan gets a 403 upstream, reported as "unavailable" so the screen restores as before.
	 */
	public function test_known_threats_route_maps_403_to_unavailable() {
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'code'    => 'scan_required',
				'message' => 'Scan is required.',
			),
			403
		);

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/123/threats' ) );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'threats_unavailable', $response->get_data()['code'] );
	}

	public function test_backups_known_threats_lists_periods_and_the_latest_clean_backup() {
		$flagged = array(
			'malware'    => 3,
			'database'   => 0,
			'vulnerable' => 1,
			'ignored'    => 0,
			'flagged'    => 3,
			'fixed'      => 3,
		);
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'totalPages'                   => 1,
				'latest_without_known_threats' => 1792247305,
				'backups'                      => array(
					array(
						'object' => array(
							'backup_period' => '1792247305',
							'known_threats' => array_merge(
								$flagged,
								array(
									'malware' => 0,
									'flagged' => 0,
								)
							),
						),
					),
					array(
						'object' => array(
							'backup_period' => '1792244301',
							'known_threats' => $flagged,
						),
					),
					array( 'object' => array( 'backup_period' => '1792212685' ) ),
				),
			)
		);

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/known-threats' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( '/wpcom/v3/sites/999/rewind/backups?number=100&page=1&known_threats_only=true', $this->captured_urls[0] );
		// The clean backup's completion is looked up only when asked for.
		$this->assertCount( 1, $this->captured_urls );
		$this->assertSame(
			array(
				'backups'                                => array(
					array(
						'period'        => 1792247305,
						'known_threats' => array_merge(
							$flagged,
							array(
								'malware' => 0,
								'flagged' => 0,
							)
						),
					),
					array(
						'period'        => 1792244301,
						'known_threats' => $flagged,
					),
					array(
						'period'        => 1792212685,
						'known_threats' => null,
					),
				),
				'latest_without_known_threats'           => 1792247305,
				'latest_without_known_threats_rewind_id' => null,
			),
			$response->get_data()
		);
	}

	public function test_backups_known_threats_names_the_clean_backups_completion() {
		$this->arrange_woa_site();
		$this->arrange_wpcom_answers(
			array(
				array(
					'body' => wp_json_encode(
						array(
							'latest_without_known_threats' => 1792247305,
							'backups'                      => array(
								array( 'object' => array( 'backup_period' => '1792301539' ) ),
								array( 'object' => array( 'backup_period' => '1792247305' ) ),
							),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
				array(
					'body' => wp_json_encode(
						array(
							'current' => array(
								'orderedItems' => array(
									array(
										'name'      => 'rewind__backup_complete_full',
										'rewind_id' => '1792247404.817',
									),
								),
							),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
			)
		);

		$response = $this->server->dispatch( $this->backups_known_threats_request_with_clean_rewind_id() );

		$this->assertSame( '1792247404.817', $response->get_data()['latest_without_known_threats_rewind_id'] );
		$this->assertCount( 2, $this->captured_urls );
		$activity = urldecode( $this->captured_urls[1] );
		$this->assertStringContainsString( '/sites/999/activity/rewindable?', $activity );
		$this->assertStringContainsString( 'name[0]=rewind__backup_complete_full', $activity );
		$this->assertStringContainsString( 'after=2026-10-17T14:28:25+00:00', $activity );
		// Before the next backup period, so a later backup's entry never matches.
		$this->assertStringContainsString( 'before=2026-10-18T05:32:19+00:00', $activity );
	}

	public function test_backups_known_threats_remember_the_clean_backups_completion() {
		$list = array(
			'body' => wp_json_encode(
				array(
					'latest_without_known_threats' => 1792247305,
					'backups'                      => array( array( 'object' => array( 'backup_period' => '1792247305' ) ) ),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
		$this->arrange_woa_site();
		$this->arrange_wpcom_answers(
			array(
				$list,
				array( 'body' => wp_json_encode( array( 'current' => array( 'orderedItems' => array( array( 'rewind_id' => '1792247404.817' ) ) ) ), JSON_UNESCAPED_SLASHES ) ),
				$list,
			)
		);

		$this->server->dispatch( $this->backups_known_threats_request_with_clean_rewind_id() );
		$response = $this->server->dispatch( $this->backups_known_threats_request_with_clean_rewind_id() );

		$this->assertSame( '1792247404.817', $response->get_data()['latest_without_known_threats_rewind_id'] );
		$this->assertCount( 3, $this->captured_urls );
	}

	public function test_backups_known_threats_remember_a_missing_completion_only_briefly() {
		$this->arrange_woa_site();
		$this->arrange_wpcom_answers(
			array(
				array(
					'body' => wp_json_encode(
						array(
							'latest_without_known_threats' => 1792247305,
							'backups'                      => array(),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
				array( 'body' => wp_json_encode( array( 'current' => array( 'orderedItems' => array() ) ), JSON_UNESCAPED_SLASHES ) ),
			)
		);

		$response = $this->server->dispatch( $this->backups_known_threats_request_with_clean_rewind_id() );

		$this->assertNull( $response->get_data()['latest_without_known_threats_rewind_id'] );
		$expires = (int) get_option( '_transient_timeout_jetpack_backup_complete_rewind_id_999_1792247305' );
		$this->assertGreaterThan( time(), $expires );
		$this->assertLessThanOrEqual( time() + 5 * MINUTE_IN_SECONDS, $expires );
	}

	public function test_backups_known_threats_are_unavailable_off_woa() {
		$this->arrange_wpcom( array( 'backups' => array() ) );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/known-threats' ) );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'threats_unavailable', $response->get_data()['code'] );
		$this->assertSame( '', $this->captured_url );
	}

	/**
	 * Known threats are a WoA-only check for now: elsewhere the route answers "unavailable"
	 * without asking WordPress.com, so the screen restores as it always has.
	 */
	public function test_known_threats_route_is_unavailable_off_woa() {
		$this->arrange_wpcom( array( 'summary' => array( 'flagged' => 1 ) ) );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/123/threats' ) );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'threats_unavailable', $response->get_data()['code'] );
		$this->assertSame( '', $this->captured_url );
	}

	/**
	 * The known-threats route is gated like every other bridge route.
	 */
	public function test_known_threats_route_requires_permission() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/123/threats' ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( '', $this->captured_url );
	}

	/**
	 * Only a threats refusal keeps its own code; any other 409 is a failed restore.
	 */
	public function test_initiate_restore_reports_another_409_as_a_failure() {
		$this->arrange_wpcom(
			array(
				'code'    => 'restore_in_progress',
				'message' => 'Another restore is running.',
			),
			409
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/rewind/to/1786663613' );
		$request->set_param( 'rewind_id', '1786663613' );
		$response = Restore_Bridge::initiate_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'restore_initiate_failed', $response->get_error_code() );
		$this->assertSame( 409, $response->get_error_data()['status'] );
	}

	/**
	 * Neither known-threats route asks WordPress.com before the site is connected.
	 *
	 * @dataProvider provide_known_threats_routes
	 */
	#[DataProvider( 'provide_known_threats_routes' )]
	public function test_known_threats_routes_need_a_connected_site( $method ) {
		$this->arrange_woa_site();

		$response = Restore_Bridge::$method( $this->known_threats_request() );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'not_connected', $response->get_error_code() );
		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * The known-threats routes.
	 *
	 * @return array
	 */
	public static function provide_known_threats_routes() {
		return array(
			'counts for the list' => array( 'get_backups_known_threats' ),
			'one backup'          => array( 'get_known_threats' ),
		);
	}

	/**
	 * Failures other than a missing Scan plan are reported as failures, not as "unavailable".
	 *
	 * @dataProvider provide_known_threats_failures
	 */
	#[DataProvider( 'provide_known_threats_failures' )]
	public function test_known_threats_routes_report_upstream_failures( $method, $failure, $expected_status ) {
		$this->arrange_woa_site();
		if ( 'unreachable' === $failure ) {
			$this->arrange_wpcom_unreachable();
		} elseif ( 'unreadable' === $failure ) {
			$this->arrange_wpcom_raw( '<html>Bad gateway</html>' );
		} else {
			$this->arrange_wpcom( array( 'code' => 'internal_error' ), 500 );
		}

		$response = Restore_Bridge::$method( $this->known_threats_request() );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'known_threats_fetch_failed', $response->get_error_code() );
		$this->assertSame( $expected_status, $response->get_error_data()['status'] );
	}

	/**
	 * Upstream failures for each known-threats route, with the status each reports.
	 *
	 * @return array
	 */
	public static function provide_known_threats_failures() {
		return array(
			'list, unreachable'      => array( 'get_backups_known_threats', 'unreachable', 502 ),
			'list, server error'     => array( 'get_backups_known_threats', 'server error', 500 ),
			'list, unreadable 200'   => array( 'get_backups_known_threats', 'unreadable', 500 ),
			'backup, unreachable'    => array( 'get_known_threats', 'unreachable', 502 ),
			'backup, server error'   => array( 'get_known_threats', 'server error', 500 ),
			'backup, unreadable 200' => array( 'get_known_threats', 'unreadable', 502 ),
		);
	}

	public function test_backups_known_threats_skip_rows_without_a_backup_period() {
		$this->arrange_woa_site();
		$this->arrange_wpcom(
			array(
				'backups' => array(
					array( 'object' => array() ),
					array( 'object' => array( 'backup_period' => 'soon' ) ),
					array( 'object' => array( 'backup_period' => '1792247305' ) ),
				),
			)
		);

		$response = Restore_Bridge::get_backups_known_threats( $this->known_threats_request() );

		$this->assertSame( array( 1792247305 ), array_column( $response->get_data()['backups'], 'period' ) );
	}

	public function test_backups_known_threats_do_not_remember_a_failed_completion_lookup() {
		$this->arrange_woa_site();
		$this->arrange_wpcom_answers(
			array(
				array(
					'body' => wp_json_encode(
						array(
							'latest_without_known_threats' => 1792247305,
							'backups'                      => array(),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
				array(
					'body'   => '{}',
					'status' => 500,
				),
			)
		);

		$response = $this->server->dispatch( $this->backups_known_threats_request_with_clean_rewind_id() );

		$this->assertNull( $response->get_data()['latest_without_known_threats_rewind_id'] );
		$this->assertFalse( get_option( '_transient_jetpack_backup_complete_rewind_id_999_1792247305' ) );
	}

	/**
	 * A request for either known-threats route, called directly.
	 *
	 * @return WP_REST_Request
	 */
	private function known_threats_request() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/1792247305/threats' );
		$request->set_param( 'rewind_id', '1792247305' );
		return $request;
	}

	/**
	 * A known-threats list request that asks when the clean backup finished, as the restore screen does.
	 *
	 * @return WP_REST_Request
	 */
	private function backups_known_threats_request_with_clean_rewind_id() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/rewind/backups/known-threats' );
		$request->set_param( 'with_clean_rewind_id', 'true' );
		return $request;
	}

	/**
	 * Makes the site look like a WoA site to `Host::is_woa_site()`.
	 */
	private function arrange_woa_site() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();
	}
}
