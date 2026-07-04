<?php
/**
 * Tests for the CSV export REST controller (validation, permission, and email delivery path).
 *
 * The download path calls exit() after streaming, so it is exercised against the live site,
 * not here; these tests cover everything up to that point.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use WP_REST_Request;

require_once __DIR__ . '/fixtures/class-spy-logger.php';
require_once __DIR__ . '/fixtures/class-fake-scheduler.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\CSVExportController
 */
#[CoversClass( CSVExportController::class )]
class CSVExportController_Test extends TestCase {

	/**
	 * Controller under test.
	 *
	 * @var CSVExportController
	 */
	private $controller;

	/**
	 * Fake scheduler injected into the controller.
	 *
	 * @var Fake_Scheduler
	 */
	private $scheduler;

	/**
	 * Build a controller with a fresh registry (Orders registered) and fake scheduler.
	 *
	 * @before
	 */
	#[Before]
	public function set_up_controller() {
		$prop = new ReflectionProperty( ReportRegistry::class, 'instance' );
		$prop->setAccessible( true );
		$prop->setValue( null, null );

		$registry = ReportRegistry::instance();
		$registry->register_controller( new OrdersOverTimeController( $registry ) );

		$logger           = new Spy_Logger();
		$this->scheduler  = new Fake_Scheduler();
		$this->controller = new CSVExportController(
			$registry,
			new ReportDataFetcher( $logger ),
			new ReportCSVGenerator( $logger ),
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
	}

	public function test_validate_report_type() {
		$this->assertTrue( $this->controller->validate_report_type( 'ordersovertime' ) );

		$error = $this->controller->validate_report_type( 'nope' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_report_type', $error->get_error_code() );

		// Non-string values are rejected too.
		$this->assertInstanceOf( \WP_Error::class, $this->controller->validate_report_type( array( 'x' ) ) );
	}

	public function test_validate_from_date_enforces_ordering() {
		$request = new WP_REST_Request();
		$request->set_param( 'to', '2026-01-10T00:00:00' );

		$this->assertTrue( $this->controller->validate_from_date( '2026-01-01T00:00:00', $request, 'from' ) );

		$error = $this->controller->validate_from_date( '2026-01-20T00:00:00', $request, 'from' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_date_range', $error->get_error_code() );
	}

	public function test_validate_to_date_rejects_future_and_bad_ordering() {
		$request = new WP_REST_Request();

		// A far-future date is rejected.
		$future = gmdate( 'Y-m-d\TH:i:s', time() + 2 * DAY_IN_SECONDS );
		$error  = $this->controller->validate_to_date( $future, $request, 'to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'future_date', $error->get_error_code() );

		// from >= to is rejected.
		$request->set_param( 'from', '2026-01-10T00:00:00' );
		$error = $this->controller->validate_to_date( '2026-01-01T00:00:00', $request, 'to' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'invalid_date_range', $error->get_error_code() );

		// A valid past range passes.
		$request->set_param( 'from', '2025-01-01T00:00:00' );
		$this->assertTrue( $this->controller->validate_to_date( '2025-06-01T00:00:00', $request, 'to' ) );
	}

	public function test_check_permission_requires_woocommerce_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'exporter',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);
		$this->assertIsInt( $user_id );

		wp_set_current_user( $user_id );
		$this->assertFalse( $this->controller->check_permission() );

		// Grant the WooCommerce reports capability via the caps filter.
		$grant = static function ( $allcaps ) {
			$allcaps['view_woocommerce_reports'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant );
		$this->assertTrue( $this->controller->check_permission() );
		remove_filter( 'user_has_cap', $grant );
	}

	public function test_create_export_rejects_unknown_report_type() {
		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'nope' );
		$request->set_param( 'delivery_method', 'email' );

		$result = $this->controller->create_export( $request );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_report_type', $result->get_error_code() );
	}

	public function test_create_export_email_path_schedules_job() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'exporter2',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);

		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'ordersovertime' );
		$request->set_param( 'delivery_method', 'email' );
		$request->set_param( 'from', '2025-01-01T00:00:00' );
		$request->set_param( 'to', '2025-06-01T00:00:00' );

		$response = $this->controller->create_export( $request );
		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 202, $response->get_status() );
		$this->assertSame( 123, $response->get_data()['job_id'] );
		$this->assertCount( 1, $this->scheduler->calls );
		$this->assertSame( 'ordersovertime', $this->scheduler->calls[0]['report_type'] );
	}

	public function test_create_export_returns_scheduler_error() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'exporter3',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);
		$this->scheduler->return_value = new \WP_Error( 'schedule_failed', 'nope' );

		$request = new WP_REST_Request();
		$request->set_param( 'report_type', 'ordersovertime' );
		$request->set_param( 'delivery_method', 'email' );

		$result = $this->controller->create_export( $request );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'schedule_failed', $result->get_error_code() );
	}
}
