<?php
/**
 * Tests for what the local mode notice reads of WooCommerce Analytics' own state.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Local_Data_Status
 */
#[CoversClass( Local_Data_Status::class )]
class Local_Data_Status_Test extends BaseTestCase {

	/**
	 * Drop the REST server and the stand-in route.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );

		parent::tear_down();
	}

	/**
	 * Each case stubs WooCommerce Analytics, so it runs in its own process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reports_analytics_off_only_while_it_is_off() {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';
		$status = new Local_Data_Status();

		$this->assertTrue( $status->is_analytics_enabled() );

		$GLOBALS['woocommerce_stats_mock_analytics_off'] = true;
		$this->assertFalse( $status->is_analytics_enabled() );
	}

	/**
	 * @dataProvider provide_import_statuses
	 *
	 * @param array|WP_Error|null $answer   What core's route answers; null when there is no route.
	 * @param array|null          $expected The status read.
	 */
	#[DataProvider( 'provide_import_statuses' )]
	public function test_reads_core_import_status( $answer, $expected ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		if ( null !== $answer ) {
			add_action(
				'rest_api_init',
				static function () use ( $answer ) {
					register_rest_route(
						'wc-analytics',
						'/imports/status',
						array(
							'methods'             => 'GET',
							'callback'            => static function () use ( $answer ) {
								return $answer;
							},
							'permission_callback' => '__return_true',
						)
					);
				}
			);
		}
		do_action( 'rest_api_init', $wp_rest_server );

		$this->assertSame( $expected, ( new Local_Data_Status() )->get_import_status() );
	}

	/**
	 * @return array[]
	 */
	public static function provide_import_statuses() {
		return array(
			'scheduled'            => array(
				array(
					'mode'                      => 'scheduled',
					'last_processed_date'       => '2026-11-24 09:00:00',
					'next_scheduled'            => '2026-11-24 21:00:00',
					'import_in_progress_or_due' => false,
					'failed_count'              => 2,
					'failed_overflow_count'     => 1,
				),
				array(
					'mode'                  => 'scheduled',
					'last_processed_date'   => '2026-11-24 09:00:00',
					'next_scheduled'        => '2026-11-24 21:00:00',
					'failed_count'          => 2,
					'failed_overflow_count' => 1,
				),
			),
			'immediate'            => array(
				array(
					'mode'                      => 'immediate',
					'last_processed_date'       => null,
					'next_scheduled'            => null,
					'import_in_progress_or_due' => null,
					'failed_count'              => 0,
					'failed_overflow_count'     => 0,
				),
				array(
					'mode'                  => 'immediate',
					'last_processed_date'   => null,
					'next_scheduled'        => null,
					'failed_count'          => 0,
					'failed_overflow_count' => 0,
				),
			),
			'WooCommerce 10.5–10.x, before failed import counts' => array(
				array(
					'mode'                      => 'scheduled',
					'last_processed_date'       => '2026-11-24 09:00:00',
					'next_scheduled'            => '2026-11-24 21:00:00',
					'import_in_progress_or_due' => false,
				),
				array(
					'mode'                  => 'scheduled',
					'last_processed_date'   => '2026-11-24 09:00:00',
					'next_scheduled'        => '2026-11-24 21:00:00',
					'failed_count'          => 0,
					'failed_overflow_count' => 0,
				),
			),
			'no such route'        => array( null, null ),
			'the user may not see' => array( new WP_Error( 'woocommerce_rest_cannot_access', 'No.', array( 'status' => 403 ) ), null ),
		);
	}
}
