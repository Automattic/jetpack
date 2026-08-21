<?php
/**
 * Unit tests for Capabilities_Bridge.
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
 * Tests for the GET /jetpack/v4/site/capabilities route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Capabilities_Bridge
 */
#[CoversClass( Capabilities_Bridge::class )]
class Rest_Capabilities_Bridge_Test extends TestCase {

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
		$this->assertArrayHasKey( '/jetpack/v4/site/capabilities', $routes );
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

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/capabilities' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
	/**
	 * A transport failure surfaces as the bridge's own error rather than
	 * cURL's text.
	 *
	 * This is the callback behind `<Gates>`, so its message is the first
	 * thing a reader sees when WPCOM is unreachable — the capabilities
	 * error screen renders it verbatim.
	 */
	public function test_wraps_a_transport_failure() {
		$this->arrange_wpcom_unreachable();

		$response = Capabilities_Bridge::get_capabilities();

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'capabilities_fetch_failed', $response->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $response->get_error_message() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
	}

	/**
	 * The projection, in the three shapes a real site produces.
	 *
	 * @param array $capabilities What WordPress.com lists for the site.
	 * @param bool  $has_backup   Expected `hasBackupPlan`.
	 * @param bool  $has_scan     Expected `hasScan`.
	 * @dataProvider provide_capability_lists
	 */
	#[DataProvider( 'provide_capability_lists' )]
	public function test_projects_the_capability_list( array $capabilities, $has_backup, $has_scan ) {
		$this->arrange_wpcom( array( 'capabilities' => $capabilities ) );

		$response = Capabilities_Bridge::get_capabilities();

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame(
			array(
				'hasBackupPlan' => $has_backup,
				'hasScan'       => $has_scan,
			),
			$response->get_data()
		);
	}

	/**
	 * Capability lists and the projection each should produce.
	 *
	 * @return array
	 */
	public static function provide_capability_lists() {
		return array(
			'backup and scan' => array( array( 'backup', 'scan' ), true, true ),
			'backup only'     => array( array( 'backup' ), true, false ),
			'scan only'       => array( array( 'scan' ), false, true ),
			// A site that genuinely has nothing. This is the audience the
			// upsell gate exists for, so it must stay a clean "no plan"
			// answer and never an error.
			'nothing'         => array( array(), false, false ),
		);
	}

	/**
	 * The route asks the capabilities endpoint, not site state.
	 *
	 * Pinned because the difference is invisible in the projection until
	 * it is wrong: `/rewind?force=wpcom` returns site *state* and omits
	 * `capabilities` entirely on some plan shapes, which produced a false
	 * "no plan" gate for plans that do include Backup.
	 */
	public function test_asks_the_capabilities_endpoint() {
		$this->arrange_wpcom( array( 'capabilities' => array( 'backup' ) ) );

		Capabilities_Bridge::get_capabilities();

		$this->assertStringContainsString( '/rewind/capabilities', $this->captured_url );
		$this->assertStringNotContainsString( 'force=wpcom', $this->captured_url );
	}

	/**
	 * A non-200 keeps WordPress.com's own status.
	 */
	public function test_forwards_the_upstream_status() {
		$this->arrange_wpcom( array( 'error' => 'unauthorized' ), 401 );

		$response = Capabilities_Bridge::get_capabilities();

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 401, $response->get_error_data()['status'] );
	}

	/**
	 * A status that arrives as a numeric string is still a success.
	 *
	 * `wp_remote_retrieve_response_code()` returns the value uncast, so a
	 * strict comparison against `200` sent a perfectly good response down
	 * the failure branch — and then reported it as a 500, because the
	 * `is_int()` ternary rejected the string too.
	 */
	public function test_treats_a_string_status_as_its_number() {
		$this->arrange_wpcom_raw( '{"capabilities":["backup"]}', '200' );

		$response = Capabilities_Bridge::get_capabilities();

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertTrue( $response->get_data()['hasBackupPlan'] );
	}

	/**
	 * An unreadable 200 is refused, not read as "this site has no plan".
	 *
	 * The difference matters to the person on the other end: the second
	 * reading shows a paying customer an upgrade screen. The class
	 * docblock records this exact mechanism firing once already, on the
	 * endpoint this route was moved off — that fix repointed the request
	 * and left the tolerant projection in place.
	 *
	 * An *empty* list is deliberately not in here: it is a legitimate
	 * answer, and refusing it would show a permanent error to the sites
	 * the upsell is for. See `provide_capability_lists`.
	 *
	 * @param string $label Why this body is unreadable.
	 * @param string $body  Raw body WordPress.com answers 200 with.
	 * @dataProvider provide_unreadable_bodies
	 */
	#[DataProvider( 'provide_unreadable_bodies' )]
	public function test_refuses_an_unreadable_success( $label, $body ) {
		$this->arrange_wpcom_raw( $body );

		$response = Capabilities_Bridge::get_capabilities();

		$this->assertInstanceOf( WP_Error::class, $response, $label );
		$this->assertSame( 'capabilities_unreadable', $response->get_error_code() );
		// Deliberately not 502: the client classes 502 as "the answer went
		// missing", a reading it shares with the destructive restore
		// mutation. Nothing was in flight here — we simply could not read
		// what came back.
		$this->assertSame( 500, $response->get_error_data()['status'] );
	}

	/**
	 * Bodies WordPress.com could answer 200 with that carry no usable list.
	 *
	 * @return array
	 */
	public static function provide_unreadable_bodies() {
		return array(
			'not JSON at all'         => array( 'not JSON at all', '<html>502 Bad Gateway</html>' ),
			'a bare scalar'           => array( 'a bare scalar', '"ok"' ),
			'an empty body'           => array( 'an empty body', '' ),
			'no capabilities key'     => array( 'no capabilities key', '{"error":"unauthorized"}' ),
			'a non-list capabilities' => array( 'a non-list capabilities', '{"capabilities":"backup"}' ),
		);
	}
}
