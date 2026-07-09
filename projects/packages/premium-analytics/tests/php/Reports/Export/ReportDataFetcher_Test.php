<?php
/**
 * Tests for the CSV export Report_Data_Fetcher pure helpers (merge/normalize logic).
 *
 * The network methods fetch()/make_proxy_request() are exercised against the live site
 * (they call the WPCom proxy); these tests cover the data-shaping methods that need no network.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use WP_Error;

require_once __DIR__ . '/fixtures/class-spy-logger.php';
require_once __DIR__ . '/fixtures/class-fake-report-controller.php';
require_once __DIR__ . '/fixtures/class-fetcher-spy-controller.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Data_Fetcher
 */
#[CoversClass( Report_Data_Fetcher::class )]
class ReportDataFetcher_Test extends TestCase {

	/**
	 * Fetcher under test.
	 *
	 * @var Report_Data_Fetcher
	 */
	private $fetcher;

	protected function setUp(): void {
		parent::setUp();
		$this->fetcher = new Report_Data_Fetcher( new Spy_Logger() );
	}

	/**
	 * Invoke a private/protected method on the fetcher.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Arguments.
	 * @return mixed
	 */
	private function invoke( string $method, array $args ) {
		$ref = new ReflectionMethod( Report_Data_Fetcher::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invokeArgs( $this->fetcher, $args );
	}

	public function test_is_comparison_request() {
		$this->assertTrue(
			$this->invoke(
				'is_comparison_request',
				array(
					array(
						'compare_from' => 'a',
						'compare_to'   => 'b',
					),
				)
			)
		);
		$this->assertFalse( $this->invoke( 'is_comparison_request', array( array( 'compare_from' => 'a' ) ) ) );
		$this->assertFalse( $this->invoke( 'is_comparison_request', array( array() ) ) );
	}

	public function test_extract_base_params_drops_date_range_and_defaults_interval() {
		$base = $this->invoke(
			'extract_base_params',
			array(
				array(
					'interval'     => 'month',
					'from'         => '2025-01-01',
					'to'           => '2025-02-01',
					'compare_from' => '2024-01-01',
					'compare_to'   => '2024-02-01',
					'orderby'      => 'product_gross_revenue',
				),
			)
		);

		$this->assertSame( 'month', $base['interval'] );
		$this->assertSame( 'product_gross_revenue', $base['orderby'] );
		$this->assertArrayNotHasKey( 'from', $base );
		$this->assertArrayNotHasKey( 'compare_to', $base );

		// Interval defaults to 'day' when omitted.
		$this->assertSame( 'day', $this->invoke( 'extract_base_params', array( array() ) )['interval'] );
	}

	public function test_normalize_response_data_returns_error_when_json_encoding_fails() {
		$resource = fopen( 'php://temp', 'r' );

		try {
			$result = $this->invoke(
				'normalize_response_data',
				array(
					array(
						'data' => array(
							'unencodable' => $resource,
						),
					),
				)
			);
		} finally {
			fclose( $resource );
		}

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'proxy_response_encode_failed', $result->get_error_code() );
	}

	public function test_fetch_prepares_params_adds_fields_and_uses_controller_fetch_data() {
		$controller = new Fetcher_Spy_Controller( new Report_Registry() );

		$result = $this->fetcher->fetch(
			array(
				'from'       => '2026-01-01T00:00:00',
				'to'         => '2026-01-02T00:00:00',
				'overridden' => 'request',
			),
			$controller
		);

		$this->assertSame(
			array(
				array(
					'bucket' => 'A',
					'count'  => 10,
				),
			),
			$result['data']
		);
		$this->assertCount( 1, $controller->requests );
		$this->assertSame( 'reports/fake-report', $controller->requests[0]['endpoint'] );
		$this->assertTrue( $controller->requests[0]['params']['prepared'] );
		$this->assertSame( 100, $controller->requests[0]['params']['max'] );
		$this->assertSame( 'request', $controller->requests[0]['params']['overridden'] );
		$this->assertSame( array( 'bucket', 'count' ), $controller->requests[0]['params']['fields'] );
	}

	public function test_fetch_retries_without_fields_when_endpoint_rejects_fields_param() {
		$controller          = new Fetcher_Spy_Controller( new Report_Registry() );
		$controller->results = array(
			new WP_Error(
				'rest_invalid_param',
				'Invalid parameter(s): fields',
				array(
					'params' => array(
						'fields' => 'fields is not one of the accepted values.',
					),
				)
			),
			array(
				'data' => array(
					array(
						'bucket' => 'B',
						'count'  => 3,
					),
				),
			),
		);

		$result = $this->fetcher->fetch(
			array(
				'from' => '2026-01-01T00:00:00',
				'to'   => '2026-01-02T00:00:00',
			),
			$controller
		);

		$this->assertSame(
			array(
				array(
					'bucket' => 'B',
					'count'  => 3,
				),
			),
			$result['data']
		);
		$this->assertCount( 2, $controller->requests );
		$this->assertArrayHasKey( 'fields', $controller->requests[0]['params'] );
		$this->assertArrayNotHasKey( 'fields', $controller->requests[1]['params'] );
	}

	public function test_fetch_returns_error_when_comparison_params_are_missing() {
		$controller = new Fetcher_Spy_Controller( new Report_Registry() );

		$result = $this->fetcher->fetch(
			array(
				'from'         => '2026-01-01T00:00:00',
				'compare_from' => '2025-01-01T00:00:00',
				'compare_to'   => '2025-01-02T00:00:00',
			),
			$controller
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'missing_comparison_param', $result->get_error_code() );
	}

	public function test_make_proxy_request_uses_configured_stats_route_and_summary_rows() {
		$fetcher = new class( new Spy_Logger(), 'stats', '1.1' ) extends Report_Data_Fetcher {
			public function proxy( string $endpoint, array $params ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test exposure.
				return $this->make_proxy_request( $endpoint, $params );
			}
		};

		add_action(
			'rest_api_init',
			static function () {
				register_rest_route(
					'jetpack-premium-analytics/v1',
					'/proxy/v1.1/stats/top-posts',
					array(
						'methods'             => 'GET',
						'callback'            => static function ( \WP_REST_Request $request ) {
							return rest_ensure_response(
								array(
									'summary' => array(
										'posts' => array(
											array(
												'title' => 'Hello World',
												'views' => 12,
											),
										),
									),
									'query'   => $request->get_query_params(),
								)
							);
						},
						'permission_callback' => '__return_true',
					)
				);
			}
		);
		do_action( 'rest_api_init' );

		$result = $fetcher->proxy(
			'top-posts',
			array(
				'endpoint' => 'ignored',
				'period'   => 'day',
			)
		);

		$this->assertSame(
			array(
				array(
					'title' => 'Hello World',
					'views' => 12,
				),
			),
			$result['data']
		);
		$this->assertSame( array( 'period' => 'day' ), $result['query'] );
	}
}
