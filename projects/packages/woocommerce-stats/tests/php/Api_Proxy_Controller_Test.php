<?php
/**
 * Tests for the reports proxy.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Default_Reports;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Definition;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Executor;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Handler;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Provider;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Registry;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Request;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Wpcom_Forward_Handler;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Wpcom_Report_Provider;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * The route reads WooCommerce reports from WordPress.com for a connected site.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Default_Reports
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Definition
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Executor
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Registry
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Request
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Wpcom_Forward_Handler
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Wpcom_Report_Provider
 */
#[CoversClass( Api_Proxy_Controller::class )]
#[CoversClass( Default_Reports::class )]
#[CoversClass( Report_Definition::class )]
#[CoversClass( Report_Executor::class )]
#[CoversClass( Report_Registry::class )]
#[CoversClass( Report_Request::class )]
#[CoversClass( Wpcom_Forward_Handler::class )]
#[CoversClass( Wpcom_Report_Provider::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

	/**
	 * Requests that reached WordPress.com.
	 *
	 * @var array[]
	 */
	private $requests = array();

	/**
	 * What WordPress.com answers with.
	 *
	 * @var array|\WP_Error
	 */
	private $upstream;

	/**
	 * A connected site, an administrator, and a WordPress.com that answers 200.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		do_action( 'rest_api_init' );
		add_action( Report_Registry::REGISTER_ACTION, array( Default_Reports::class, 'register' ) );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		$this->requests = array();
		$this->upstream = $this->upstream_response( 200, '{"orders":42}' );
		add_filter( 'pre_http_request', array( $this, 'answer_as_wordpress_com' ), 10, 3 );

		wp_set_current_user( $this->create_user( 'administrator' ) );
	}

	/**
	 * Drop the connection, the route and the user.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_as_wordpress_com' ) );
		remove_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		remove_all_actions( Report_Registry::REGISTER_ACTION );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_constants();
		wp_set_current_user( 0 );

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	public function test_forwards_a_report_signed_with_the_blog_token() {
		$response = $this->get_report(
			'orders/by-date',
			array(
				'from'     => '2026-01-01',
				'interval' => 'day',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 42, $response->get_data()->orders );
		$this->assertCount( 1, $this->requests );
		$this->assertStringStartsWith(
			'https://public-api.wordpress.com/wpcom/v2/sites/4242/analytics/reports/orders/by-date?from=2026-01-01&interval=day&',
			$this->requests[0]['url']
		);
		$this->assertSame( 'GET', $this->requests[0]['args']['method'] );
		$this->assertStringStartsWith( 'X_JETPACK token="blog_token:', $this->requests[0]['args']['headers']['Authorization'] );
	}

	/**
	 * @dataProvider data_readers
	 *
	 * @param string|null $role   Role of the reader, null when logged out.
	 * @param string|null $cap    Capability added to the reader.
	 * @param int         $status Expected status.
	 */
	#[DataProvider( 'data_readers' )]
	public function test_serves_only_readers_of_store_reports( $role, $cap, $status ) {
		wp_set_current_user( null === $role ? 0 : $this->create_user( $role, $cap ) );

		$this->assertSame( $status, $this->get_report()->get_status() );
		$this->assertCount( 200 === $status ? 1 : 0, $this->requests );
	}

	/**
	 * @return array<string, array{0: string|null, 1: string|null, 2: int}>
	 */
	public static function data_readers() {
		return array(
			'logged out'    => array( null, null, 401 ),
			'stats reader'  => array( 'subscriber', 'view_stats', 403 ),
			'shop manager'  => array( 'subscriber', 'view_woocommerce_reports', 200 ),
			'administrator' => array( 'administrator', null, 200 ),
		);
	}

	/**
	 * @dataProvider data_paths_outside_the_reports
	 *
	 * @param string $path   Path below `proxy/v2/`.
	 * @param array  $params Query params.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'data_paths_outside_the_reports' )]
	public function test_reaches_nothing_but_the_reports( $path, $params, $status ) {
		$response = $this->dispatch( 'GET', $path, $params );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * @return array<string, array{0: string, 1: array, 2: int}>
	 */
	public static function data_paths_outside_the_reports() {
		return array(
			'another analytics path'   => array( 'analytics/sync-status', array(), 404 ),
			'another endpoint group'   => array( 'stats/top-posts', array(), 404 ),
			'the reports root'         => array( 'analytics/reports', array(), 404 ),
			'a traversal'              => array( 'analytics/reports/../../stats/top-posts', array(), 400 ),
			'a shadowed route capture' => array( 'analytics/reports/orders', array( 'endpoint' => 'stats/top-posts' ), 400 ),
		);
	}

	public function test_does_not_route_writes() {
		$this->assertSame( 404, $this->dispatch( 'POST', 'analytics/reports/orders' )->get_status() );
		$this->assertSame( array(), $this->requests );
	}

	public function test_answers_no_connection_on_a_site_without_one() {
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_report();

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'no_connection', $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	public function test_serves_a_cached_report_on_a_site_that_lost_its_connection() {
		$this->get_report();
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_report();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $this->requests );
	}

	/**
	 * @dataProvider data_wpcom_routes
	 *
	 * @param string $route Route WordPress.com serves, forwarded exactly as sent.
	 */
	#[DataProvider( 'data_wpcom_routes' )]
	public function test_forwards_every_route_wordpress_com_serves( $route ) {
		$this->assertSame( 200, $this->get_report( $route )->get_status() );
		$this->assertStringContainsString( '/sites/4242/analytics/reports/' . $route . '?', $this->requests[0]['url'] );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function data_wpcom_routes() {
		$routes = array(
			'bookings/by-date',
			'coupons/',
			'coupons/by-date',
			'customers/by-date',
			'customers/new-returning',
			'order-attribution/channel/summary',
			'order-attribution/source/summary',
			'order-attribution/campaign/summary',
			'order-attribution-by-product/channel/summary',
			'order-attribution/channel/items',
			'order-attribution/channel/compare',
			'orders/by-date',
			'orders-by-product-type/by-date',
			'products',
			'sessions/by-conversion-rate',
			'sessions/by-date',
			'sessions/by-device',
			'sessions/by-location',
			'taxes/by-date',
			'taxes/breakdown',
		);

		return array_combine( $routes, array_map( fn( $route ) => array( $route ), $routes ) );
	}

	public function test_answers_unknown_report_for_a_route_without_a_definition() {
		$response = $this->get_report( 'orders/by-week' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'unknown_report', $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	public function test_refuses_an_unknown_provider() {
		$this->assertSame( 400, $this->get_report( 'orders/by-date', array( 'provider' => 'mars' ) )->get_status() );
		$this->assertSame( array(), $this->requests );
	}

	public function test_answers_unsupported_provider_for_a_provider_without_a_handler() {
		$response = $this->get_report( 'orders/by-date', array( 'provider' => 'local' ) );

		$this->assertSame( 422, $response->get_status() );
		$this->assertSame( 'unsupported_provider', $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	public function test_never_forwards_the_provider_param_and_shares_the_cache() {
		$this->get_report();
		$this->get_report( 'orders/by-date', array( 'provider' => 'wpcom' ) + array( 'force_refresh' => '1' ) );
		$cached = $this->get_report( 'orders/by-date', array( 'provider' => 'wpcom' ) );

		$this->assertSame( 200, $cached->get_status() );
		$this->assertCount( 2, $this->requests );
		$this->assertStringNotContainsString( 'provider', $this->requests[1]['url'] );
	}

	public function test_answers_needs_connection_when_a_request_names_a_provider() {
		$this->get_report();
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_report( 'orders/by-date', array( 'provider' => 'wpcom' ) );

		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'needs_connection', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider data_registered_reports
	 *
	 * @param string $route Route requested.
	 * @param string $id    Id of the report the handler should receive.
	 */
	#[DataProvider( 'data_registered_reports' )]
	public function test_serves_a_report_handler_registered_through_the_hook( $route, $id ) {
		// @phan-suppress-next-line PhanAccessClassInternal -- The test stands in for another package's handler.
		$handler = new class() implements Report_Handler {
			/**
			 * Serves everything.
			 *
			 * @return array
			 */
			public function get_capability() {
				return array(
					'fields' => '*',
					'params' => '*',
				);
			}

			/**
			 * Answer with the report's id.
			 *
			 * @param Report_Request $request The request.
			 * @return array
			 */
			public function run( Report_Request $request ) {
				return array(
					'data'    => array( 'id' => $request->definition->id ),
					'status'  => 200,
					'headers' => array(),
				);
			}
		};
		add_action(
			Report_Registry::REGISTER_ACTION,
			static function ( Report_Registry $registry ) use ( $handler ) {
				$registry->register_report( new Report_Definition( 'owner.report', 0, array( 'owner/report' ) ) );
				$registry->register_handler( 'owner.report', 'wpcom', $handler );
				$registry->register_handler( 'orders.by_date', 'wpcom', $handler );
			}
		);

		$response = $this->get_report( $route );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $id, $response->get_data()['id'] );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function data_registered_reports() {
		return array(
			'a new report'                 => array( 'owner/report', 'owner.report' ),
			'a handler that beats the `*`' => array( 'orders/by-date', 'orders.by_date' ),
		);
	}

	public function test_caches_a_report_by_path_and_params() {
		$params = array(
			'from'     => '2026-01-01',
			'interval' => 'day',
		);

		$this->get_report( 'orders/by-date', $params );
		$cached = $this->get_report( 'orders/by-date', array_reverse( $params, true ) );

		$this->assertCount( 1, $this->requests );
		$this->assertSame( 42, $cached->get_data()->orders );

		$this->get_report( 'orders/by-date', array( 'interval' => 'week' ) + $params );
		$this->get_report( 'products', $params );
		$this->get_report( 'orders/by-date', $params + array( 'force_refresh' => '1' ) );

		$this->assertCount( 4, $this->requests );
		$this->assertStringNotContainsString( 'force_refresh', $this->requests[3]['url'] );
	}

	public function test_clearing_the_cache_misses_it() {
		$this->get_report();
		Api_Proxy_Controller::clear_cache();
		$this->get_report();

		$this->assertCount( 2, $this->requests );
	}

	/**
	 * @dataProvider data_date_types
	 *
	 * @param string|null $option    Stored `woocommerce_date_type`, null when unset.
	 * @param array       $params    Query params of the request.
	 * @param string      $forwarded Date type sent to WordPress.com.
	 */
	#[DataProvider( 'data_date_types' )]
	public function test_forwards_the_store_date_type_unless_the_request_names_one( $option, array $params, $forwarded ) {
		if ( null !== $option ) {
			update_option( 'woocommerce_date_type', $option );
		}

		$this->get_report( 'orders/by-date', $params );

		wp_parse_str( (string) wp_parse_url( $this->requests[0]['url'], PHP_URL_QUERY ), $query );
		$this->assertSame( $forwarded, $query['date_type'] );
	}

	public static function data_date_types(): array {
		return array(
			'unset option'          => array( null, array(), 'paid' ),
			'date created'          => array( 'date_created', array(), 'created' ),
			'date completed'        => array( 'date_completed', array(), 'completed' ),
			'unknown option'        => array( 'date_modified', array(), 'paid' ),
			'the request names one' => array( 'date_created', array( 'date_type' => 'paid' ), 'paid' ),
		);
	}

	public function test_a_date_type_change_misses_the_cache() {
		$this->get_report();
		update_option( 'woocommerce_date_type', 'date_created' );
		$this->get_report();

		$this->assertCount( 2, $this->requests );
	}

	public function test_passes_an_upstream_error_through_without_caching_it() {
		$this->upstream = $this->upstream_response( 400, '{"code":"invalid_interval","message":"Bad interval."}' );

		$response = $this->get_report();
		$this->get_report();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_interval', $response->get_data()->code );
		$this->assertCount( 2, $this->requests );
	}

	public function test_keeps_the_cause_of_a_failed_request() {
		$this->upstream = new \WP_Error( 'http_request_failed', 'Operation timed out.' );

		$response = $this->get_report();

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'] );
	}

	public function test_does_not_cache_an_unreadable_response() {
		$this->upstream = $this->upstream_response( 200, '<html>Bad gateway</html>' );

		$response = $this->get_report();
		$this->get_report();

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
		$this->assertCount( 2, $this->requests );
	}

	public function test_passes_the_pagination_headers_back() {
		$this->upstream = $this->upstream_response(
			200,
			'[]',
			array(
				'x-wp-total' => '42',
				'x-other'    => 'dropped',
			)
		);

		$this->assertSame(
			array(
				'x-wp-total'                => '42',
				'X-Jetpack-Report-Provider' => 'wpcom',
				'X-Jetpack-Report-Contract' => 'orders.by_date@1',
			),
			$this->get_report()->get_headers()
		);
	}

	/**
	 * @dataProvider data_plain_reports
	 *
	 * @param string $route    Route requested.
	 * @param string $contract Expected contract header.
	 */
	#[DataProvider( 'data_plain_reports' )]
	public function test_names_the_provider_and_contract_without_changing_the_body( $route, $contract ) {
		$body           = '{"summary":{"orders_no":3},"intervals":[]}';
		$this->upstream = $this->upstream_response( 200, $body );

		$fresh  = $this->get_report( $route );
		$cached = $this->get_report( $route );

		$this->assertCount( 1, $this->requests );
		foreach ( array( $fresh, $cached ) as $response ) {
			$this->assertEquals( json_decode( $body, false ), $response->get_data() );
			$this->assertSame( 'wpcom', $response->get_headers()['X-Jetpack-Report-Provider'] );
			$this->assertSame( $contract, $response->get_headers()['X-Jetpack-Report-Contract'] );
		}
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function data_plain_reports() {
		return array(
			'a described report'    => array( 'orders/by-date', 'orders.by_date@1' ),
			'an undescribed one'    => array( 'products', 'products@0' ),
			'with a trailing slash' => array( 'coupons/', 'coupons@0' ),
		);
	}

	/**
	 * @dataProvider data_unreadable_fields
	 *
	 * @param string $route  Route requested.
	 * @param string $fields The `report_fields` param.
	 * @param string $code   Expected error code.
	 */
	#[DataProvider( 'data_unreadable_fields' )]
	public function test_refuses_fields_the_contract_does_not_list( $route, $fields, $code ) {
		$response = $this->get_report( $route, array( 'report_fields' => $fields ) );

		$this->assertSame( 422, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * @return array<string, array{0: string, 1: string, 2: string}>
	 */
	public static function data_unreadable_fields() {
		return array(
			'an unknown field'         => array( 'orders/by-date', 'orders_no,orders_count', 'unknown_field' ),
			'no field at all'          => array( 'orders/by-date', ' , ', 'unknown_field' ),
			'fields of another report' => array( 'sessions/by-device', 'orders_no', 'unknown_field' ),
			'an undescribed report'    => array( 'products', 'orders_no', 'fields_not_described' ),
		);
	}

	public function test_forwards_the_fields_param_of_wordpress_com() {
		$response = $this->get_report(
			'taxes/breakdown',
			array(
				'fields'        => 'tax_rate,total_tax',
				'force_refresh' => '1',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( 'fields=tax_rate%2Ctotal_tax', $this->requests[0]['url'] );
	}

	public function test_never_forwards_report_fields() {
		$this->upstream = $this->upstream_response( 200, '{"summary":{"orders_no":3}}' );

		$this->get_report( 'orders/by-date', array( 'report_fields' => 'orders_no' ) );

		$this->assertStringNotContainsString( 'report_fields', $this->requests[0]['url'] );
	}

	/**
	 * @dataProvider data_named_fields
	 *
	 * @param array $params Query params.
	 * @param int   $status Expected status.
	 */
	#[DataProvider( 'data_named_fields' )]
	public function test_refuses_an_answer_without_a_named_field( array $params, $status ) {
		$this->upstream = $this->upstream_response( 200, '{"summary":{"orders_no":3}}' );

		$response = $this->get_report( 'orders/by-date', $params );

		$this->assertSame( $status, $response->get_status() );
		if ( 502 === $status ) {
			$this->assertSame( 'contract_violation', $response->get_data()['code'] );
		}
	}

	/**
	 * @return array<string, array{0: array, 1: int}>
	 */
	public static function data_named_fields() {
		return array(
			'a named field missing'   => array( array( 'report_fields' => 'orders_no,total_sales' ), 502 ),
			'named fields present'    => array( array( 'report_fields' => 'orders_no' ), 200 ),
			'no fields named'         => array( array(), 200 ),
			'only wpcom fields named' => array( array( 'fields' => 'total_sales' ), 200 ),
		);
	}

	/**
	 * @dataProvider data_uncovered_requests
	 *
	 * @param array       $params Query params, with `provider=local`.
	 * @param int         $status Expected status.
	 * @param string|null $code Expected error code.
	 */
	#[DataProvider( 'data_uncovered_requests' )]
	public function test_refuses_a_forced_provider_that_cannot_cover_the_request( array $params, $status, $code ) {
		$this->register_partial_local_handler();

		$response = $this->get_report( 'orders/by-date', array( 'provider' => 'local' ) + $params );

		$this->assertSame( $status, $response->get_status() );
		if ( null !== $code ) {
			$this->assertSame( $code, $response->get_data()['code'] );
		}
	}

	/**
	 * @return array<string, array{0: array, 1: int, 2: string|null}>
	 */
	public static function data_uncovered_requests() {
		return array(
			'the whole contract'        => array( array(), 422, 'unsupported_fields' ),
			'an uncovered field'        => array( array( 'report_fields' => 'orders_no,total_sales' ), 422, 'unsupported_fields' ),
			'an uncovered param'        => array(
				array(
					'report_fields' => 'orders_no',
					'filters'       => 'status',
				),
				422,
				'unsupported_parameter',
			),
			'covered fields and params' => array(
				array(
					'report_fields' => 'orders_no',
					'from'          => '2026-01-01',
				),
				200,
				null,
			),
		);
	}

	/**
	 * @dataProvider data_handler_bodies
	 *
	 * @param bool $as_object Whether the handler answers with an object, as decoded JSON is.
	 */
	#[DataProvider( 'data_handler_bodies' )]
	public function test_lists_the_contract_fields_a_partial_handler_leaves_out( $as_object ) {
		$this->register_partial_local_handler( $as_object );

		$response = $this->get_report(
			'orders/by-date',
			array(
				'provider'      => 'local',
				'report_fields' => 'orders_no',
			)
		);

		$data = (array) $response->get_data();
		$this->assertContains( 'total_sales', $data['unsupported_fields'] );
		$this->assertNotContains( 'orders_no', $data['unsupported_fields'] );
		$this->assertSame( 3, ( (array) $data['summary'] )['orders_no'] );
		$this->assertSame( 'local', $response->get_headers()['X-Jetpack-Report-Provider'] );
	}

	/**
	 * @return array<string, array{0: bool}>
	 */
	public static function data_handler_bodies() {
		return array(
			'an array body'  => array( false ),
			'an object body' => array( true ),
		);
	}

	/**
	 * Register a `local` provider whose `orders.by_date` handler serves only `orders_no`, by `from` and `to`.
	 *
	 * @param bool $as_object Whether the handler answers with an object.
	 */
	private function register_partial_local_handler( $as_object = false ) {
		add_action(
			Report_Registry::REGISTER_ACTION,
			function ( Report_Registry $registry ) use ( $as_object ) {
				$registry->register_provider(
					'local',
					// @phan-suppress-next-line PhanAccessClassInternal -- The test stands in for step 3's local provider.
					new class() implements Report_Provider {
						/**
						 * Always ready.
						 *
						 * @return true
						 */
						public function check_ready() {
							return true;
						}
					}
				);
				$registry->register_handler(
					'orders.by_date',
					'local',
					// @phan-suppress-next-line PhanAccessClassInternal -- The test stands in for step 3's local handler.
					new class( $as_object ) implements Report_Handler {
						/**
						 * Whether to answer with an object.
						 *
						 * @var bool
						 */
						private $as_object;

						/**
						 * Constructor.
						 *
						 * @param bool $as_object Whether to answer with an object.
						 */
						public function __construct( $as_object ) {
							$this->as_object = $as_object;
						}

						/**
						 * Serves `orders_no` only.
						 *
						 * @return array
						 */
						public function get_capability() {
							return array(
								'fields' => array( 'orders_no' ),
								'params' => array( 'from', 'to' ),
							);
						}

						/**
						 * Answer with the one field.
						 *
						 * @param Report_Request $request The request.
						 * @return array
						 */
						public function run( Report_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
							$summary = array( 'orders_no' => 3 );

							return array(
								'data'    => $this->as_object ? (object) array( 'summary' => (object) $summary ) : array( 'summary' => $summary ),
								'status'  => 200,
								'headers' => array(),
							);
						}
					}
				);
			}
		);
	}

	/**
	 * Answer a request to WordPress.com, and record it.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return array|\WP_Error
	 */
	public function answer_as_wordpress_com( $pre, $args, $url ) {
		$this->requests[] = array(
			'url'  => $url,
			'args' => $args,
		);

		return $this->upstream;
	}

	/**
	 * A response of WordPress.com, as the HTTP API returns it.
	 *
	 * @param int    $status  Status code.
	 * @param string $body    Body.
	 * @param array  $headers Headers.
	 * @return array
	 */
	private function upstream_response( $status, $body, array $headers = array() ) {
		return array(
			'response' => array( 'code' => $status ),
			'body'     => $body,
			'headers'  => $headers,
		);
	}

	/**
	 * Read a report through the route.
	 *
	 * @param string $report Path below `analytics/reports/`.
	 * @param array  $params Query params.
	 * @return \WP_REST_Response
	 */
	private function get_report( $report = 'orders/by-date', array $params = array() ) {
		return $this->dispatch( 'GET', 'analytics/reports/' . $report, $params );
	}

	/**
	 * Dispatch a request to a path below `proxy/v2/`.
	 *
	 * @param string $method HTTP method.
	 * @param string $path   Path below `proxy/v2/`.
	 * @param array  $params Query params.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $method, $path, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/' . Api_Proxy_Controller::REST_NAMESPACE . '/proxy/v2/' . $path );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Create a user, with an extra capability when given.
	 *
	 * @param string      $role Role.
	 * @param string|null $cap  Capability to add.
	 * @return int
	 */
	private function create_user( $role, $cap = null ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'reader_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);

		if ( null !== $cap ) {
			( new \WP_User( $user_id ) )->add_cap( $cap );
		}

		return $user_id;
	}
}
