<?php
/**
 * Tests for `orders.by_date` served from core's revenue stats.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Core_Report_Handler;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Core_Revenue_Stats_Handler;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Default_Reports;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Local_Report_Provider;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Executor;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Each test runs in its own process, since the WooCommerce stubs can't be unloaded.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Core_Report_Handler
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Core_Revenue_Stats_Handler
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Local_Report_Provider
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Executor
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Core_Report_Handler::class )]
#[CoversClass( Core_Revenue_Stats_Handler::class )]
#[CoversClass( Local_Report_Provider::class )]
#[CoversClass( Report_Executor::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Local_Report_Test extends BaseTestCase {

	/**
	 * Fields the local handler serves.
	 */
	const FIELDS = 'orders_no,orders_value_net,orders_value_gross,total_sales,average_order_value,avg_items,coupons,refunds';

	/**
	 * Query params of each request that reached core.
	 *
	 * @var array[]
	 */
	private $core_queries = array();

	/**
	 * Pages core answers with, in order: `totals`, `intervals` and `pages`.
	 *
	 * @var array[]
	 */
	private $core_pages = array();

	/**
	 * Requests that reached WordPress.com.
	 *
	 * @var string[]
	 */
	private $wpcom_requests = array();

	/**
	 * A connected site with WooCommerce Analytics, and a store reports reader.
	 */
	public function set_up() {
		parent::set_up();
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		add_action( 'rest_api_init', array( $this, 'register_core_route' ) );
		do_action( 'rest_api_init' );
		add_action( Report_Registry::REGISTER_ACTION, array( Default_Reports::class, 'register' ) );
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_true' );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();
		add_filter( 'pre_http_request', array( $this, 'answer_as_wordpress_com' ), 10, 3 );

		$this->core_pages = array( $this->core_page( 1 ) );
		wp_set_current_user( $this->create_user( 'administrator', 'view_woocommerce_reports' ) );
	}

	public function test_maps_core_revenue_stats_into_the_wordpress_com_shape() {
		$this->core_pages = array(
			$this->core_page(
				1,
				array(
					array( '2026-10-01 00:00:00', '2026-10-01 23:59:59', $this->core_row( 2 ) ),
					array( '2026-10-02 00:00:00', '2026-10-02 23:59:59', $this->core_row( 0 ) ),
				)
			),
		);

		$response = $this->get_local( array( 'report_fields' => self::FIELDS ) );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'orders_no'           => '2',
				'orders_value_net'    => '90.5',
				'orders_value_gross'  => '110.25',
				'total_sales'         => '100',
				'average_order_value' => '45.25',
				'avg_items'           => '1.5',
				'coupons'             => '4',
				'refunds'             => '5',
				'date_start'          => '2026-10-01T00:00:00+00:00',
				'date_end'            => '2026-10-02T23:59:59+00:00',
			),
			$data['summary']
		);
		$this->assertSame(
			array(
				'time_interval' => '2026-10-02',
				'date_start'    => '2026-10-02T00:00:00+00:00',
				'date_end'      => '2026-10-02T23:59:59+00:00',
			),
			array_slice( $data['data'][1], 0, 3 )
		);
		$this->assertNull( $data['data'][1]['average_order_value'] );
		$this->assertNull( $data['data'][1]['avg_items'] );
		$this->assertContains( 'total_items', $data['unsupported_fields'] );
		$this->assertSame( 'local', $response->get_headers()['X-Jetpack-Report-Provider'] );
		$this->assertSame( array(), $this->wpcom_requests );
	}

	/**
	 * @dataProvider data_ranges
	 *
	 * @param array $params     Range params.
	 * @param int   $core_pages Pages core answers with.
	 * @param int   $status     Expected status.
	 * @param int   $requests   Requests expected to reach core.
	 */
	#[DataProvider( 'data_ranges' )]
	public function test_serves_at_most_500_intervals( array $params, $core_pages, $status, $requests ) {
		update_option( 'timezone_string', 'America/New_York' );
		$this->core_pages = array();
		for ( $page = 1; $page <= $core_pages; $page++ ) {
			$this->core_pages[] = $this->core_page( $core_pages );
		}

		$response = $this->get_local( $params );

		$this->assertSame( $status, $response->get_status() );
		if ( 422 === $status ) {
			$this->assertSame( 'too_many_intervals', $response->get_data()['code'] );
		}
		$this->assertCount( $requests, $this->core_queries );
	}

	/**
	 * @return array<string, array{0: array, 1: int, 2: int, 3: int}>
	 */
	public static function data_ranges() {
		return array(
			'500 days, every page'               => array( self::range( '2025-01-01', '2026-05-15' ), 5, 200, 5 ),
			'501 days, refused before core'      => array( self::range( '2025-01-01', '2026-05-16' ), 6, 422, 0 ),
			'core counts more than the estimate' => array( self::range( '2026-01-01', '2026-01-31' ), 6, 422, 1 ),
			'500 hours across a DST change'      => array(
				array(
					'from'     => '2026-03-01T00:00:00',
					'to'       => '2026-03-21T20:59:59',
					'interval' => 'hour',
				),
				5,
				200,
				5,
			),
		);
	}

	/**
	 * @dataProvider data_dates
	 *
	 * @param string $from   The `from` param.
	 * @param string $to     The `to` param.
	 * @param string $after  Bound core should get.
	 * @param string $before Bound core should get.
	 * @param string $start  Summary `date_start`.
	 */
	#[DataProvider( 'data_dates' )]
	public function test_reads_dates_in_the_store_zone( $from, $to, $after, $before, $start ) {
		update_option( 'timezone_string', 'America/New_York' );

		$response = $this->get_local(
			array(
				'from' => $from,
				'to'   => $to,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $after, $this->core_queries[0]['after'] );
		$this->assertSame( $before, $this->core_queries[0]['before'] );
		$this->assertSame( $start, $response->get_data()['summary']['date_start'] );
	}

	/**
	 * @return array<string, array{0: string, 1: string, 2: string, 3: string, 4: string}>
	 */
	public static function data_dates() {
		return array(
			'a UTC offset is converted'            => array( '2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.999Z', '2026-09-30T20:00:00-04:00', '2026-10-31T19:59:59-04:00', '2026-09-30T20:00:00-04:00' ),
			'another offset is converted'          => array( '2026-12-01T00:00:00+09:00', '2026-12-31T23:59:59+09:00', '2026-11-30T10:00:00-05:00', '2026-12-31T09:59:59-05:00', '2026-11-30T10:00:00-05:00' ),
			'a bare date spans its day'            => array( '2026-10-01', '2026-10-31', '2026-10-01T00:00:00-04:00', '2026-10-31T23:59:59-04:00', '2026-10-01T00:00:00-04:00' ),
			'an offset in the repeated hour stays' => array( '2026-11-01T01:15:00-05:00', '2026-11-01T01:45:00-05:00', '2026-11-01T01:15:00-05:00', '2026-11-01T01:45:00-05:00', '2026-11-01T01:15:00-05:00' ),
		);
	}

	/**
	 * @dataProvider data_date_types
	 *
	 * @param string|null $option    Stored `woocommerce_date_type`, null when unset.
	 * @param array       $params    Params of the request.
	 * @param string      $date_type Date type core should get.
	 */
	#[DataProvider( 'data_date_types' )]
	public function test_applies_the_store_date_type_unless_the_request_names_one( $option, array $params, $date_type ) {
		if ( null !== $option ) {
			update_option( 'woocommerce_date_type', $option );
		}

		$this->assertSame( 200, $this->get_local( $params )->get_status() );
		$this->assertSame( $date_type, $this->core_queries[0]['date_type'] );
	}

	/**
	 * @return array<string, array{0: string|null, 1: array, 2: string}>
	 */
	public static function data_date_types() {
		return array(
			'unset option'          => array( null, array(), 'date_paid' ),
			'date created'          => array( 'date_created', array(), 'date_created' ),
			'unknown option'        => array( 'date_modified', array(), 'date_paid' ),
			'the request names one' => array( 'date_created', array( 'date_type' => 'completed' ), 'date_completed' ),
		);
	}

	/**
	 * @dataProvider data_unservable_requests
	 *
	 * @param array  $params Params replacing the defaults.
	 * @param int    $status Expected status.
	 * @param string $code   Expected error code.
	 */
	#[DataProvider( 'data_unservable_requests' )]
	public function test_refuses_what_it_cannot_apply_before_reaching_core( array $params, $status, $code ) {
		$response = $this->get_local( $params );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->core_queries );
	}

	/**
	 * @return array<string, array{0: array, 1: int, 2: string}>
	 */
	public static function data_unservable_requests() {
		return array(
			'filters'                => array( array( 'filters' => 'status' ), 422, 'unsupported_parameter' ),
			'wpcom fields'           => array( array( 'fields' => 'orders_no' ), 422, 'unsupported_parameter' ),
			'no interval'            => array( array( 'interval' => null ), 400, 'missing_parameter' ),
			'an unknown interval'    => array( array( 'interval' => 'fortnight' ), 400, 'invalid_parameter' ),
			'a date that rolls over' => array( array( 'to' => '2026-02-30' ), 400, 'invalid_parameter' ),
			'a date with a weekday'  => array( array( 'from' => 'Thu, 01 Oct 2026' ), 400, 'invalid_parameter' ),
			'an unknown date type'   => array( array( 'date_type' => 'refunded' ), 400, 'invalid_parameter' ),
			'a date type array'      => array( array( 'date_type' => array( 'paid' ) ), 400, 'invalid_parameter' ),
			'an impossible offset'   => array( array( 'from' => '2026-10-01T00:00:00+00:99' ), 400, 'invalid_parameter' ),
		);
	}

	/**
	 * @dataProvider data_unready_sites
	 *
	 * @param string $site   What the site lacks.
	 * @param int    $status Expected status.
	 * @param string $code   Expected error code.
	 */
	#[DataProvider( 'data_unready_sites' )]
	public function test_answers_when_local_data_cannot_be_served( $site, $status, $code ) {
		if ( 'analytics off' === $site ) {
			$GLOBALS['woocommerce_stats_mock_analytics_off'] = true;
		} elseif ( 'no core route' === $site ) {
			remove_action( 'rest_api_init', array( $this, 'register_core_route' ) );
			$GLOBALS['wp_rest_server'] = new WP_REST_Server();
			do_action( 'rest_api_init' );
		} elseif ( 'an older WooCommerce' === $site ) {
			add_action(
				Report_Registry::REGISTER_ACTION,
				static function ( Report_Registry $registry ) {
					$registry->register_handler(
						'orders.by_date',
						'local',
						// @phan-suppress-next-line PhanAccessClassInternal -- The test stands in for a WooCommerce without the controller.
						new class() extends Core_Revenue_Stats_Handler {
							/**
							 * A controller this WooCommerce lacks.
							 *
							 * @var string
							 */
							protected $core_controller = 'Missing_Revenue_Stats_Controller';
						}
					);
				}
			);
		} elseif ( 'a reader without the WooCommerce cap' === $site ) {
			wp_set_current_user( $this->create_user( 'subscriber', 'manage_options' ) );
		}

		$response = $this->get_local();

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->core_queries );
	}

	/**
	 * @return array<string, array{0: string, 1: int, 2: string}>
	 */
	public static function data_unready_sites() {
		return array(
			'analytics off'                        => array( 'analytics off', 503, 'local_unavailable' ),
			'no core route'                        => array( 'no core route', 503, 'local_unavailable' ),
			'an older WooCommerce'                 => array( 'an older WooCommerce', 503, 'local_unavailable' ),
			'a reader without the WooCommerce cap' => array( 'a reader without the WooCommerce cap', 403, 'woocommerce_rest_cannot_view' ),
		);
	}

	public function test_a_request_without_provider_still_goes_to_wordpress_com() {
		$response = $this->get_report( array( 'report_fields' => self::FIELDS ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'wpcom', $response->get_headers()['X-Jetpack-Report-Provider'] );
		$this->assertCount( 1, $this->wpcom_requests );
		$this->assertSame( array(), $this->core_queries );
	}

	/**
	 * Stand-in for core's revenue stats route, with its capability check.
	 */
	public function register_core_route() {
		register_rest_route(
			'wc-analytics',
			'/reports/revenue/stats',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'answer_as_core' ),
				'permission_callback' => function () {
					return current_user_can( 'view_woocommerce_reports' ) ? true : new \WP_Error( 'woocommerce_rest_cannot_view', 'Sorry, you cannot list resources.', array( 'status' => 403 ) );
				},
			)
		);
	}

	/**
	 * Answer the next core page, and record the query.
	 *
	 * @param WP_REST_Request $request The core request.
	 * @return WP_REST_Response
	 */
	public function answer_as_core( WP_REST_Request $request ) {
		$this->core_queries[] = $request->get_query_params();
		$page                 = $this->core_pages[ count( $this->core_queries ) - 1 ];

		$response = new WP_REST_Response(
			array(
				'totals'    => $page['totals'],
				'intervals' => $page['intervals'],
			)
		);
		$response->header( 'X-WP-TotalPages', (string) $page['pages'] );

		return $response;
	}

	/**
	 * Answer WordPress.com's report, and record the request.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return array
	 */
	public function answer_as_wordpress_com( $pre, $args, $url ) {
		$this->wpcom_requests[] = $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"summary":{"orders_no":"2","orders_value_net":"1","orders_value_gross":"1","total_sales":"1","average_order_value":"1","avg_items":"1","coupons":"0","refunds":"0"},"data":[]}',
			'headers'  => array(),
		);
	}

	/**
	 * A core page with one total over two orders.
	 *
	 * @param int   $pages     Pages core reports.
	 * @param array $intervals Each `[ date_start, date_end, subtotals ]`.
	 * @return array
	 */
	private function core_page( $pages, array $intervals = array() ) {
		return array(
			'totals'    => $this->core_row( 2 ),
			'intervals' => array_map(
				static function ( $interval ) {
					return array(
						'interval'   => substr( $interval[0], 0, 10 ),
						'date_start' => $interval[0],
						'date_end'   => $interval[1],
						'subtotals'  => $interval[2],
					);
				},
				$intervals
			),
			'pages'     => $pages,
		);
	}

	/**
	 * Core totals or subtotals, as core types them.
	 *
	 * @param int $orders Orders count; the averages are 0 without orders, as core casts them.
	 * @return array
	 */
	private function core_row( $orders ) {
		return array(
			'orders_count'        => $orders,
			'num_items_sold'      => 3 * $orders,
			'gross_sales'         => $orders ? 110.25 : 0,
			'total_sales'         => $orders ? 100.0 : 0,
			'coupons'             => $orders ? 4 : 0,
			'refunds'             => $orders ? 5.0 : 0,
			'net_revenue'         => $orders ? 90.5 : 0,
			'avg_items_per_order' => $orders ? 1.5 : 0.0,
			'avg_order_value'     => $orders ? 45.25 : 0.0,
			'segments'            => array(),
		);
	}

	/**
	 * A day range.
	 *
	 * @param string $from First day.
	 * @param string $to   Last day.
	 * @return array
	 */
	private static function range( $from, $to ) {
		return array(
			'from' => $from . 'T00:00:00',
			'to'   => $to . 'T23:59:59',
		);
	}

	/**
	 * Read `orders/by-date` from the local provider: October 2026 by day, the served fields, unless replaced.
	 *
	 * @param array $params Params replacing the defaults; null removes one.
	 * @return WP_REST_Response
	 */
	private function get_local( array $params = array() ) {
		return $this->get_report(
			$params + array(
				'provider'      => 'local',
				'report_fields' => self::FIELDS,
				'from'          => '2026-10-01T00:00:00',
				'to'            => '2026-10-02T23:59:59',
				'interval'      => 'day',
			)
		);
	}

	/**
	 * Read `orders/by-date` through the proxy.
	 *
	 * @param array $params Query params; null removes one.
	 * @return WP_REST_Response
	 */
	private function get_report( array $params ) {
		$request = new WP_REST_Request( 'GET', '/' . Api_Proxy_Controller::REST_NAMESPACE . '/proxy/v2/analytics/reports/orders/by-date' );
		$request->set_query_params( array_filter( $params, static fn( $value ) => null !== $value ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Create a user with an extra capability.
	 *
	 * @param string $role Role.
	 * @param string $cap  Capability to add.
	 * @return int
	 */
	private function create_user( $role, $cap ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'reader_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		( new \WP_User( $user_id ) )->add_cap( $cap );

		return $user_id;
	}
}
