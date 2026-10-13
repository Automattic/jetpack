<?php
/**
 * Unit tests for Retention_Bridge.
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
use function remove_filter;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the POST /jetpack/v4/site/backup/retention route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Retention_Bridge
 */
#[CoversClass( Retention_Bridge::class )]
class Rest_Retention_Bridge_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Enable modernization and register routes on a fresh REST server.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

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
	 * The days travel to the endpoint Jetpack Cloud writes through.
	 */
	public function test_forwards_the_days_to_the_retention_update_endpoint() {
		$this->arrange_wpcom( array( 'success' => true ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/retention' );
		$request->set_param( 'retention_days', 120 );

		$response = Retention_Bridge::update_retention( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertStringContainsString( '/backup/retention/update', $this->captured_url );
		$this->assertSame( 'POST', $this->captured_request_args[0]['method'] );
		$this->assertSame( array( 'retention_days' => 120 ), $this->captured_body );
	}

	/**
	 * A VaultPress refusal inside a 200 must not read as saved.
	 */
	public function test_treats_a_200_without_success_as_a_failure() {
		$this->arrange_wpcom(
			array(
				'success' => false,
				'error'   => 'VaultPress could not save the retention period.',
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/retention' );
		$request->set_param( 'retention_days', 30 );

		$response = Retention_Bridge::update_retention( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'retention_update_failed', $response->get_error_code() );
		$this->assertSame( 'VaultPress could not save the retention period.', $response->get_error_data()['wpcom']['message'] );
	}

	/**
	 * WordPress.com also accepts 2 days, which the dashboard does not offer.
	 */
	public function test_refuses_a_period_cloud_does_not_offer() {
		$this->arrange_wpcom( array( 'success' => true ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/retention' );
		$request->set_param( 'retention_days', 2 );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertNull( $this->captured_body );
	}
}
