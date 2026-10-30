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
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Handler;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Query;
use Automattic\Jetpack\WooCommerceStats\Report_Execution\Report_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * The route reads WooCommerce reports from WordPress.com for a connected site.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
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

		$headers = $this->get_report()->get_headers();

		$this->assertSame( '42', $headers['x-wp-total'] );
		$this->assertArrayNotHasKey( 'x-other', $headers );
		$this->assertSame( 'remote', $headers['X-Jetpack-Report-Provider'] );
	}

	/**
	 * @dataProvider data_executions
	 */
	#[DataProvider( 'data_executions' )]
	public function test_resolves_the_provider_without_falling_back( $report, array $params, $connected, $status, $code ) {
		require_once __DIR__ . '/mocks/woocommerce-revenue-stats-controller-mock.php';
		if ( ! $connected ) {
			\Jetpack_Options::delete_option( 'blog_token' );
			( new Connection_Manager() )->reset_connection_status();
		}

		$response = $this->get_report( $report, $params );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * The local provider is ready for `orders/by-date` only, through the controller stub.
	 *
	 * @return array<string, array{0: string, 1: array, 2: bool, 3: int, 4: string}>
	 */
	public static function data_executions() {
		return array(
			'a route nobody declares'               => array( 'orders/by-week', array( 'execution' => 'auto' ), true, 404, 'unknown_report' ),
			'local forced on a remote-only report'  => array( 'sessions/by-device', array( 'execution' => 'local' ), true, 422, 'unsupported_provider' ),
			'remote forced on a local-only report'  => array( 'stock.summary', array( 'execution' => 'remote' ), true, 422, 'unsupported_provider' ),
			'auto on a local-only report'           => array( 'stock.summary', array( 'execution' => 'auto' ), true, 503, 'feature_missing' ),
			'auto without a connection'             => array( 'orders/by-date', array( 'execution' => 'auto' ), false, 503, 'needs_connection' ),
			'no override without a connection'      => array( 'orders/by-date', array(), false, 403, 'no_connection' ),
			'an execution value nobody serves'      => array( 'orders/by-date', array( 'execution' => 'both' ), true, 400, 'rest_invalid_param' ),
			'local over the interval cap'           => array(
				'orders/by-date',
				array(
					'execution' => 'local',
					'fields'    => 'orders_no',
					'from'      => '2026-09-27',
					'to'        => '2026-10-26',
					'interval'  => 'hour',
				),
				true,
				422,
				'too_many_intervals',
			),
			// Under the cap it reaches core, which WorDBless lacks.
			'local just under the interval cap'     => array(
				'orders/by-date',
				array(
					'execution' => 'local',
					'fields'    => 'orders_no',
					'from'      => '2026-10-07',
					'to'        => '2026-10-26',
					'interval'  => 'hour',
				),
				true,
				503,
				'feature_missing',
			),
			'local with a date that does not parse' => array(
				'orders/by-date',
				array(
					'execution' => 'local',
					'fields'    => 'orders_no',
					'from'      => 'not-a-date',
					'to'        => '2026-10-26',
					'interval'  => 'day',
				),
				true,
				422,
				'invalid_parameter',
			),
			'local with a date that rolls over'     => array(
				'orders/by-date',
				array(
					'execution' => 'local',
					'fields'    => 'orders_no',
					'from'      => '2026-02-30',
					'to'        => '2026-03-26',
					'interval'  => 'day',
				),
				true,
				422,
				'invalid_parameter',
			),
			'local forced for the whole report'     => array( 'orders/by-date', array( 'execution' => 'local' ), true, 422, 'unsupported_fields' ),
			'local forced for a field it lacks'     => array(
				'orders/by-date',
				array(
					'execution' => 'local',
					'fields'    => 'profit_margin',
				),
				true,
				422,
				'unsupported_fields',
			),
			'a field the contract lacks'            => array( 'orders/by-date', array( 'fields' => 'orders_no,mood' ), true, 422, 'unknown_field' ),
			'fields on a report without a contract' => array( 'sessions/by-date', array( 'fields' => 'visitors' ), true, 422, 'fields_not_described' ),
		);
	}

	/**
	 * @dataProvider data_source_filter
	 */
	#[DataProvider( 'data_source_filter' )]
	public function test_the_source_filter_moves_only_auto_requests_local_can_serve( array $params, $forwarded ) {
		require_once __DIR__ . '/mocks/woocommerce-revenue-stats-controller-mock.php';
		$prefer_local = static function () {
			return 'local';
		};
		add_filter( 'jetpack_analytics_dataset_source', $prefer_local );

		$this->upstream = $this->upstream_response( 200, '{"summary":{"orders_no":"3","profit_margin":"0"}}' );
		$this->get_report(
			'orders/by-date',
			$params + array(
				'from'     => '2026-10-01',
				'to'       => '2026-10-26',
				'interval' => 'day',
			)
		);
		remove_filter( 'jetpack_analytics_dataset_source', $prefer_local );

		$this->assertCount( $forwarded ? 1 : 0, $this->requests );
	}

	/**
	 * @return array<string, array{0: array, 1: bool}>
	 */
	public static function data_source_filter() {
		return array(
			'no override stays remote'                  => array( array( 'fields' => 'orders_no' ), true ),
			'auto for fields local serves goes local'   => array(
				array(
					'execution' => 'auto',
					'fields'    => 'orders_no',
				),
				false,
			),
			'auto for a field local lacks stays remote' => array(
				array(
					'execution' => 'auto',
					'fields'    => 'profit_margin',
				),
				true,
			),
			'auto for the whole report stays remote'    => array( array( 'execution' => 'auto' ), true ),
		);
	}

	public function test_refuses_an_answer_without_a_requested_field() {
		$response = $this->get_report(
			'orders/by-date',
			array(
				'execution' => 'remote',
				'fields'    => 'orders_no',
			)
		);

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'contract_violation', $response->get_data()['code'] );
	}

	public function test_names_the_provider_and_contract_in_headers_only() {
		$this->upstream = $this->upstream_response( 200, '{"summary":{"orders_no":"3"}}' );

		$response = $this->get_report(
			'orders/by-date',
			array(
				'execution' => 'remote',
				'fields'    => 'orders_no',
			)
		);

		$this->assertSame( 'remote', $response->get_headers()['X-Jetpack-Report-Provider'] );
		$this->assertSame( 'orders.by_date@1', $response->get_headers()['X-Jetpack-Report-Contract'] );
		$this->assertSame( array( 'summary' ), array_keys( (array) $response->get_data() ) );
	}

	public function test_serves_a_report_another_owner_registers_through_the_hook() {
		$handler  = new class() implements Report_Handler {
			// phpcs:disable Squiz.Commenting.FunctionComment.Missing, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			public function get_capability() {
				return array(
					'fields'     => array( 'signups' ),
					'params'     => array( 'from', 'to' ),
					'deviations' => array(),
				);
			}
			public function supports( Report_Query $query ) {
				return true;
			}
			public function check_ready( Report_Query $query ) {
				return true;
			}
			public function run( Report_Query $query ) {
				return array(
					'data'    => array( 'summary' => array( 'signups' => 7 ) ),
					'status'  => 200,
					'headers' => array(),
				);
			}
			// phpcs:enable
		};
		$register = static function ( Report_Registry $registry ) use ( $handler ) {
			$registry->register_report(
				new Report_Definition(
					'stock.notifications',
					1,
					array(),
					array(
						'signups' => 'int',
						'waiting' => 'int',
					),
					array( 'products' )
				)
			);
			$registry->register_handler( 'stock.notifications', 'local', $handler );
		};
		add_action( Report_Registry::REGISTER_ACTION, $register, 20 );

		$response = $this->get_report( 'stock.notifications', array( 'fields' => 'signups' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 7, $response->get_data()['summary']['signups'] );
		$this->assertSame( array( 'waiting' ), $response->get_data()['unsupported_fields'] );
		$this->assertSame( 'stock.notifications@1', $response->get_headers()['X-Jetpack-Report-Contract'] );
		$this->assertSame( array(), $this->requests );
	}

	public function test_counts_orders_by_status_with_its_own_sql() {
		global $wpdb;
		$real_wpdb = $wpdb;
		update_option( 'woocommerce_excluded_report_order_statuses', array( 'failed' ) );
		// WorDBless has no database: this stand-in prepares as WordPress does and answers with fixed rows.
		$wpdb = new class( $real_wpdb ) {
			// phpcs:disable Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.VariableComment.Missing, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			public $prefix;
			public $last_error = '';
			public $queries    = array();
			private $real;
			public function __construct( $real ) {
				$this->real   = $real;
				$this->prefix = $real->prefix;
			}
			public function prepare( $query, ...$args ) {
				return $this->real->prepare( $query, ...$args );
			}
			public function get_var( $sql ) {
				return $this->prefix . 'wc_order_stats';
			}
			public function get_results( $sql ) {
				$this->queries[] = $sql;
				return array(
					array(
						'status'    => 'wc-completed',
						'orders_no' => '3',
						'net_total' => '120.5',
					),
					array(
						'status'    => 'wc-processing',
						'orders_no' => '1',
						'net_total' => '24',
					),
				);
			}
			// phpcs:enable
		};

		$response = $this->get_report(
			'orders.by_status',
			array(
				'from'   => '2026-10-01',
				'to'     => '2026-10-26',
				'fields' => 'orders_no,net_total',
			)
		);
		$sql      = $wpdb->queries[0] ?? '';
		$wpdb     = $real_wpdb; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Restores the test's own stand-in.
		delete_option( 'woocommerce_excluded_report_order_statuses' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'orders_no' => 4,
				'net_total' => 144.5,
			),
			$response->get_data()['summary']
		);
		$this->assertSame( 'completed', $response->get_data()['data'][0]['status'] );
		$this->assertStringContainsString( "date_created >= '2026-10-01 00:00:00' AND date_created <= '2026-10-26 23:59:59'", $sql );
		$this->assertStringContainsString( "status NOT IN ( 'wc-auto-draft', 'wc-trash', 'wc-failed', 'wc-checkout-draft' )", $sql );
		$this->assertStringContainsString( "<> '0000-00-00 00:00:00'", $sql );
	}

	public function test_forwards_no_execution_override_to_wordpress_com() {
		$this->get_report( 'orders/by-date', array( 'execution' => 'remote' ) );

		$this->assertStringNotContainsString( 'execution', $this->requests[0]['url'] );
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
