<?php
/**
 * Tests for the Stats CSV export REST controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Posts_Export_Controller;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;

require_once __DIR__ . '/fixtures/class-spy-logger.php';
require_once __DIR__ . '/fixtures/class-fake-fetcher.php';
require_once __DIR__ . '/fixtures/class-fake-generator.php';
require_once __DIR__ . '/fixtures/class-fake-wp-cron-scheduler.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Stats_Csv_Export_Controller
 */
#[CoversClass( Stats_Csv_Export_Controller::class )]
class StatsCSVExportController_Test extends TestCase {

	/**
	 * Controller under test.
	 *
	 * @var Stats_Csv_Export_Controller
	 */
	private $controller;

	/**
	 * Fake scheduler injected into the controller.
	 *
	 * @var Fake_Wp_Cron_Scheduler
	 */
	private $scheduler;

	/**
	 * Fake generator injected into the controller.
	 *
	 * @var Fake_Generator
	 */
	private $generator;

	/**
	 * Build a controller with a fresh registry and fake services.
	 *
	 * @before
	 */
	#[Before]
	public function set_up_controller() {
		$registry = new Report_Registry();
		$registry->register_controller( new Top_Posts_Export_Controller( $registry ) );

		$logger           = new Spy_Logger();
		$fetcher          = new Fake_Fetcher( $logger );
		$fetcher->result  = array(
			'data' => array(
				array(
					'title' => 'Hello',
					'views' => 4,
				),
			),
		);
		$this->scheduler  = new Fake_Wp_Cron_Scheduler();
		$this->generator  = new Fake_Generator( $logger );
		$this->controller = new Stats_Csv_Export_Controller(
			$registry,
			$fetcher,
			$this->generator,
			$this->scheduler,
			$logger
		);
	}

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		wp_set_current_user( 0 );
		remove_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
	}

	public function test_register_hooks_route_registration() {
		$this->controller->register();

		$this->assertNotFalse( has_action( 'rest_api_init', array( $this->controller, 'register_routes' ) ) );
	}

	private function serve_response( \WP_REST_Response $response, WP_REST_Request $request ): bool {
		$previous_request_method   = $_SERVER['REQUEST_METHOD'] ?? null;
		$_SERVER['REQUEST_METHOD'] = 'POST';

		try {
			return (bool) apply_filters( 'rest_pre_serve_request', false, $response, $request, null );
		} finally {
			if ( null === $previous_request_method ) {
				unset( $_SERVER['REQUEST_METHOD'] );
			} else {
				$_SERVER['REQUEST_METHOD'] = $previous_request_method;
			}
		}
	}

	public function test_register_routes_exposes_expected_endpoint_args() {
		$this->controller->register();
		do_action( 'rest_api_init' );

		$route  = '/jetpack-premium-analytics/v1/reports/stats-csv-export';
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( $route, $routes );
		$this->assertArrayHasKey( \WP_REST_Server::CREATABLE, $routes[ $route ][0]['methods'] );
		$this->assertArrayHasKey( 'report_type', $routes[ $route ][0]['args'] );
		$this->assertArrayHasKey( 'from', $routes[ $route ][0]['args'] );
		$this->assertArrayHasKey( 'to', $routes[ $route ][0]['args'] );
		$this->assertSame( array( 'download', 'email' ), $routes[ $route ][0]['args']['delivery_method']['enum'] );
	}

	public function test_validate_report_type() {
		$this->assertTrue( $this->controller->validate_report_type( 'stats-top-posts' ) );

		$error = $this->controller->validate_report_type( 'nope' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_report_type', $error->get_error_code() );
		$this->assertSame( 'Invalid report type: nope', $error->get_error_message() );

		$error = $this->controller->validate_report_type( array( 'x' ) );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'Invalid report type: ["x"]', $error->get_error_message() );
	}

	public function test_check_permission_allows_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'stats_exporter',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);
		$this->assertIsInt( $user_id );

		$user = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_check_permission_allows_manage_options_and_denies_anonymous() {
		$this->assertFalse( $this->controller->check_permission() );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'stats_export_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $user_id );

		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_validate_date_ranges() {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'to', '2026-01-02T00:00:00' );

		$this->assertTrue( $this->controller->validate_from_date( '2026-01-01T00:00:00', $request, 'from' ) );

		$error = $this->controller->validate_from_date( '2026-01-03T00:00:00', $request, 'from' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_date_range', $error->get_error_code() );

		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$this->assertTrue( $this->controller->validate_to_date( '2026-01-02T00:00:00', $request, 'to' ) );

		$error = $this->controller->validate_to_date( '2026-01-01T00:00:00', $request, 'to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_date_range', $error->get_error_code() );

		$error = $this->controller->validate_to_date( gmdate( 'Y-m-d\T00:00:00', strtotime( '+1 day' ) ), $request, 'to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'future_date', $error->get_error_code() );
	}

	public function test_validate_date_ranges_skip_ordering_when_programmatic_dates_do_not_parse() {
		$request = new WP_REST_Request();
		$request->set_param( 'to', '2026-01-02T00:00:00' );

		$this->assertTrue( $this->controller->validate_from_date( 'not-a-date', $request, 'from' ) );

		$request = new WP_REST_Request();
		$request->set_param( 'from', 'not-a-date' );

		$this->assertTrue( $this->controller->validate_to_date( '2026-01-02T00:00:00', $request, 'to' ) );
	}

	public function test_validate_comparison_date_ranges() {
		$request = new WP_REST_Request();
		$request->set_param( 'compare_to', '2025-01-02T00:00:00' );

		$this->assertTrue( $this->controller->validate_compare_from_date( '2025-01-01T00:00:00', $request, 'compare_from' ) );

		$error = $this->controller->validate_compare_from_date( '2025-01-03T00:00:00', $request, 'compare_from' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_compare_date_range', $error->get_error_code() );

		$request = new WP_REST_Request();
		$error   = $this->controller->validate_compare_from_date( '2025-01-01T00:00:00', $request, 'compare_from' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'missing_compare_to', $error->get_error_code() );

		$request = new WP_REST_Request();
		$request->set_param( 'compare_from', '2025-01-01T00:00:00' );

		$this->assertTrue( $this->controller->validate_compare_to_date( '2025-01-02T00:00:00', $request, 'compare_to' ) );

		$error = $this->controller->validate_compare_to_date( '2025-01-01T00:00:00', $request, 'compare_to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_compare_date_range', $error->get_error_code() );

		$error = $this->controller->validate_compare_to_date( gmdate( 'Y-m-d\T00:00:00', strtotime( '+1 day' ) ), $request, 'compare_to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'future_date', $error->get_error_code() );

		$request = new WP_REST_Request();
		$error   = $this->controller->validate_compare_to_date( '2025-01-02T00:00:00', $request, 'compare_to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'missing_compare_from', $error->get_error_code() );
	}

	public function test_validate_comparison_date_ranges_skip_ordering_when_programmatic_dates_do_not_parse() {
		$request = new WP_REST_Request();
		$request->set_param( 'compare_to', '2025-01-02T00:00:00' );

		$this->assertTrue( $this->controller->validate_compare_from_date( 'not-a-date', $request, 'compare_from' ) );

		$request = new WP_REST_Request();
		$request->set_param( 'compare_from', 'not-a-date' );

		$this->assertTrue( $this->controller->validate_compare_to_date( '2025-01-02T00:00:00', $request, 'compare_to' ) );
	}

	public function test_create_export_returns_registry_error_for_unknown_report() {
		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'missing-report' );
		$request->set_param( 'delivery_method', 'download' );

		$result = $this->controller->create_export( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_report_type', $result->get_error_code() );
	}

	public function test_create_export_email_path_schedules_wp_cron_job() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'stats_exporter_email',
					'user_pass'  => 'pass',
					'user_email' => 'stats-exporter@example.com',
					'role'       => 'administrator',
				)
			)
		);

		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'stats-top-posts' );
		$request->set_param( 'delivery_method', 'email' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$request->set_param( 'to', '2026-01-03T00:00:00' );

		$response = $this->controller->create_export( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 202, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );
		$this->assertCount( 1, $this->scheduler->calls );
		$this->assertSame( 'stats-top-posts', $this->scheduler->calls[0]['report_type'] );
		$this->assertSame( 'stats-exporter@example.com', $this->scheduler->calls[0]['user_email'] );
	}

	public function test_create_export_email_path_returns_scheduler_error() {
		$this->scheduler->return_value = new \WP_Error( 'schedule_failed', 'Nope' );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'stats_exporter_email_failure',
					'user_pass'  => 'pass',
					'user_email' => 'stats-exporter-failure@example.com',
					'role'       => 'administrator',
				)
			)
		);

		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'stats-top-posts' );
		$request->set_param( 'delivery_method', 'email' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$request->set_param( 'to', '2026-01-03T00:00:00' );

		$result = $this->controller->create_export( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'schedule_failed', $result->get_error_code() );
	}

	public function test_create_export_download_path_registers_streaming_response_without_exiting() {
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'report_type', 'stats-top-posts' );
		$request->set_param( 'delivery_method', 'download' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$request->set_param( 'to', '2026-01-03T00:00:00' );

		$response = $this->controller->create_export( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 0, $this->generator->streams );

		$served = $this->serve_response( $response, $request );

		$this->assertTrue( $served );
		$this->assertCount( 1, $this->generator->streams );
		$this->assertSame( 'top-posts-pages-2026-01-01-to-2026-01-03.csv', $this->generator->streams[0]['filename'] );
	}

	public function test_create_export_download_path_returns_unserved_response_when_streaming_fails() {
		$this->generator->stream_result = false;

		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'report_type', 'stats-top-posts' );
		$request->set_param( 'delivery_method', 'download' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$request->set_param( 'to', '2026-01-03T00:00:00' );

		$response = $this->controller->create_export( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$served = $this->serve_response( $response, $request );

		$this->assertFalse( $served );
		$this->assertCount( 1, $this->generator->streams );
		$this->assertSame( 'top-posts-pages-2026-01-01-to-2026-01-03.csv', $this->generator->streams[0]['filename'] );
	}

	public function test_create_export_download_path_returns_fetch_error() {
		$registry = new Report_Registry();
		$registry->register_controller( new Top_Posts_Export_Controller( $registry ) );

		$logger          = new Spy_Logger();
		$fetcher         = new Fake_Fetcher( $logger );
		$fetcher->result = new \WP_Error( 'fetch_failed', 'Fetch failed' );

		$controller = new Stats_Csv_Export_Controller(
			$registry,
			$fetcher,
			$this->generator,
			$this->scheduler,
			$logger
		);

		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'stats-top-posts' );
		$request->set_param( 'delivery_method', 'download' );
		$request->set_param( 'from', '2026-01-01T00:00:00' );
		$request->set_param( 'to', '2026-01-03T00:00:00' );

		$result = $controller->create_export( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'fetch_failed', $result->get_error_code() );
	}
}
