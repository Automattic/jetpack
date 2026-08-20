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
use function get_user_locale;
use function remove_filter;
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
	 */
	public function test_forwards_the_reader_locale() {
		$this->sign_in_as_admin();
		$this->arrange_wpcom( array( 'current' => array( 'orderedItems' => array() ) ) );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$request->set_param( 'page', 1 );
		$request->set_param( 'number', 10 );
		Activity_Log_Bridge::get_activity_log( $request );

		$this->assertStringContainsString( '_locale=' . get_user_locale(), $this->captured_url );
	}
}
