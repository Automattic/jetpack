<?php
/**
 * Unit tests for Activity_Log_Bridge.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function get_current_user_id;
use function remove_filter;
use function update_user_meta;
use function wp_insert_user;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the GET /jetpack/v4/site/rewindable-activity route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Activity_Log_Bridge
 */
#[CoversClass( Activity_Log_Bridge::class )]
class Rest_Activity_Log_Bridge_Test extends TestCase {

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
	 * Route registers when the modernization filter is on.
	 */
	public function test_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/site/rewindable-activity', $routes );
	}

	/**
	 * Route is gated on manage_options — a subscriber gets 403.
	 */
	public function test_route_requires_manage_options() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
	/**
	 * A transport failure surfaces as the bridge's own error rather than
	 * cURL's text, which the activity list renders verbatim beneath its
	 * "We couldn't load your site's activity." heading.
	 */
	public function test_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'number', 10 );
		$response = Activity_Log_Bridge::get_activity_log( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'activity_log_fetch_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * WPCOM renders the activity summaries, so the reader's locale has to
	 * travel with the request or every string comes back in English.
	 *
	 * The user locale is set away from the site locale on purpose: reading it
	 * back with `get_user_locale()` would compare the code against itself and
	 * pass just as well against `get_locale()`.
	 */
	public function test_forwards_the_reader_locale() {
		$this->arrange_wpcom( array( 'current' => array( 'orderedItems' => array() ) ) );
		update_user_meta( get_current_user_id(), 'locale', 'es_ES' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'number', 10 );
		Activity_Log_Bridge::get_activity_log( $request );

		$this->assertStringContainsString( '_locale=es_ES', $this->captured_url );
	}

	/**
	 * A non-200 becomes the bridge's error, carrying the status and the
	 * reason WordPress.com gave.
	 *
	 * 403 rather than 500, because 500 is also the fallback for a status
	 * outside the failure range — a test written against it would pass
	 * whether or not the status was forwarded.
	 */
	public function test_reports_a_non_200_with_the_upstream_reason() {
		$this->arrange_wpcom(
			array(
				'code'    => 'authorization_required',
				'message' => 'An active access token must be used.',
			),
			403
		);

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$response = Activity_Log_Bridge::get_activity_log( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'activity_log_fetch_failed', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data()['status'] );
		$this->assertSame( 'authorization_required', $response->get_error_data()['wpcom']['code'] );
	}

	/**
	 * The sort direction reaches WordPress.com.
	 *
	 * Asserted on the outgoing URL: the dashboard holds one page of a paginated
	 * log, so a direction that stopped at the bridge would only sort ten rows.
	 */
	public function test_forwards_the_sort_direction() {
		$this->arrange_wpcom( array( 'current' => array( 'orderedItems' => array() ) ) );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'number', 10 );
		$request->set_param( 'sort_order', 'asc' );
		Activity_Log_Bridge::get_activity_log( $request );

		$this->assertStringContainsString( 'sort_order=asc', $this->captured_url );
	}

	/**
	 * Absent means absent, not empty.
	 *
	 * `array_filter` drops the key so WordPress.com applies its own `desc`
	 * default; sending `sort_order=` would fail the route's `enum`.
	 */
	public function test_omits_the_sort_direction_when_none_is_given() {
		$this->arrange_wpcom( array( 'current' => array( 'orderedItems' => array() ) ) );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'number', 10 );
		Activity_Log_Bridge::get_activity_log( $request );

		$this->assertStringNotContainsString( 'sort_order', $this->captured_url );
	}

	/**
	 * A direction outside the enum is refused here, not by WordPress.com.
	 *
	 * Dispatched through the REST server because `args` validation is its job.
	 */
	public function test_rejects_a_direction_outside_the_enum() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'sort_order', 'sideways' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * A success code reported as a string is a success.
	 *
	 * `wp_remote_retrieve_response_code()` hands back whatever the
	 * transport put there, so an uncast `200 !== $status_code` sent a
	 * perfectly good activity log down the failure branch — and the reader
	 * got "We couldn't load your site's activity." over a response that had
	 * arrived intact.
	 *
	 * The forwarded payload is what is asserted, not the absence of an
	 * error. The uncast behaviour reported these as a 500 rather than as a
	 * 200, so a test that only checked the status would have been satisfied
	 * by the bug it exists to catch.
	 */
	public function test_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw(
			'{"current":{"orderedItems":[{"activity_id":"foo"}]},"totalItems":1}',
			'200'
		);

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$response = Activity_Log_Bridge::get_activity_log( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 1, $response->get_data()['totalItems'] );
		$this->assertSame( 'foo', $response->get_data()['current']['orderedItems'][0]['activity_id'] );
	}
}
