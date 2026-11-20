<?php
/**
 * Unit tests for Schedule_Bridge.
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
 * Tests for the POST /jetpack/v4/site/backup/schedule route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Schedule_Bridge
 */
#[CoversClass( Schedule_Bridge::class )]
class Rest_Schedule_Bridge_Test extends TestCase {

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
	 * WordPress.com reads `schedule_hour`, not the `scheduled_hour` its GET answers with.
	 */
	public function test_forwards_the_hour_under_the_name_wpcom_reads() {
		$this->arrange_wpcom( array( 'ok' => true ) );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/schedule' );
		$request->set_param( 'schedule_hour', 0 );

		$response = Schedule_Bridge::update_schedule( $request );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertStringContainsString( '/rewind/scheduled', $this->captured_url );
		$this->assertSame( 'POST', $this->captured_request_args[0]['method'] );
		$this->assertSame( array( 'schedule_hour' => 0 ), $this->captured_body );
	}

	/**
	 * A refusal inside a 200 must not read as saved.
	 */
	public function test_treats_a_200_without_ok_as_a_failure() {
		$this->arrange_wpcom(
			array(
				'ok'    => false,
				'error' => 'VaultPress could not save the schedule.',
			)
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/schedule' );
		$request->set_param( 'schedule_hour', 4 );

		$response = Schedule_Bridge::update_schedule( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'schedule_update_failed', $response->get_error_code() );
		$this->assertSame( 'VaultPress could not save the schedule.', $response->get_error_data()['wpcom']['message'] );
	}
}
