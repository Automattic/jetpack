<?php
/**
 * Tests for the CSV export Report_Data_Fetcher helpers.
 *
 * The proxy error path is intercepted at the local REST layer, so it needs no external request.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

require_once __DIR__ . '/fixtures/class-spy-logger.php';

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

	public function test_build_external_api_error_preserves_external_message() {
		$response = new WP_REST_Response(
			(object) array(
				'code'    => 'woocommerce_analytics_bookings_error',
				'message' => 'Failed to retrieve bookings data. Please try again later.',
				'data'    => (object) array(
					'status' => 500,
				),
			),
			500
		);

		$result = $this->invoke( 'build_external_api_error', array( $response ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame( 'External API error', $result->get_error_message() );
		$this->assertSame(
			array(
				'status'        => 500,
				'message'       => 'Failed to retrieve bookings data. Please try again later.',
				'external_code' => 'woocommerce_analytics_bookings_error',
			),
			$result->get_error_data()
		);
	}

	public function test_build_external_api_error_uses_already_normalized_data() {
		$response = new WP_REST_Response(
			array(
				'code'    => 'unused_response_code',
				'message' => 'Unused response message.',
			),
			200
		);
		$data     = array(
			'code'    => 'normalized_error_code',
			'message' => 'Normalized error message.',
			'data'    => array(
				'status' => 429,
			),
		);

		$result = $this->invoke( 'build_external_api_error', array( $response, $data ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame(
			array(
				'status'        => 429,
				'message'       => 'Normalized error message.',
				'external_code' => 'normalized_error_code',
			),
			$result->get_error_data()
		);
	}

	/**
	 * Encoding failures retain the stable external API error contract.
	 */
	public function test_build_external_api_error_normalizes_encode_failure() {
		foreach (
			array(
				502 => 502,
				200 => 500,
			) as $response_status => $expected_status
		) {
			$resource = fopen( 'php://temp', 'r' );

			try {
				$response = new WP_REST_Response(
					array(
						'data' => array(
							'unencodable' => $resource,
						),
					),
					$response_status
				);
				$result   = $this->invoke( 'build_external_api_error', array( $response ) );
			} finally {
				fclose( $resource );
			}

			$this->assertInstanceOf( WP_Error::class, $result );
			$this->assertSame( 'external_api_error', $result->get_error_code() );
			$this->assertSame( 'External API error', $result->get_error_message() );
			$this->assertSame( array( 'status' => $expected_status ), $result->get_error_data() );
		}
	}

	public function test_build_external_api_error_preserves_invalid_fields_metadata_for_retry() {
		$response = new WP_REST_Response(
			(object) array(
				'code'    => 'rest_invalid_param',
				'message' => 'Invalid parameter(s): fields',
				'data'    => (object) array(
					'status' => 400,
					'params' => (object) array(
						'fields' => 'fields is not one of the allowed values.',
					),
				),
			),
			400
		);

		$result = $this->invoke( 'build_external_api_error', array( $response ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame(
			array(
				'status'        => 400,
				'message'       => 'Invalid parameter(s): fields',
				'external_code' => 'rest_invalid_param',
				'params'        => array(
					'fields' => 'fields is not one of the allowed values.',
				),
			),
			$result->get_error_data()
		);
		$this->assertTrue( $this->invoke( 'is_invalid_fields_error', array( $result ) ) );
	}

	public function test_build_external_api_error_uses_fallback_status_without_external_details() {
		$response = new WP_REST_Response( array(), 0 );

		$result = $this->invoke( 'build_external_api_error', array( $response ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame(
			array(
				'status' => 500,
			),
			$result->get_error_data()
		);
	}

	public function test_build_external_api_error_keeps_http_status_and_empty_external_message() {
		$response = new WP_REST_Response(
			(object) array(
				'code'    => 500,
				'message' => '',
				'data'    => (object) array(
					'status' => 502,
				),
			),
			500
		);

		$result = $this->invoke( 'build_external_api_error', array( $response ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame(
			array(
				'status'        => 500,
				'message'       => '',
				'external_code' => '500',
			),
			$result->get_error_data()
		);
	}

	/**
	 * External proxy failures retain their upstream details when the export fetcher makes the
	 * internal REST request.
	 */
	public function test_make_proxy_request_normalizes_external_api_errors() {
		global $wp_rest_server;

		$previous_server  = $wp_rest_server;
		$wp_rest_server   = new WP_REST_Server();
		$proxy_controller = new Api_Proxy_Controller();
		$register_routes  = array( $proxy_controller, 'register_routes' );
		$error_route      = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/coverage-test-error';
		$embedded_route   = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/coverage-test-embedded-error';
		$pre_dispatch     = static function ( $result, $server, $request ) use ( $error_route, $embedded_route ) {
			if ( $error_route === $request->get_route() ) {
				return new WP_REST_Response(
					(object) array(
						'code'    => 'woocommerce_analytics_bookings_error',
						'message' => 'Failed to retrieve bookings data. Please try again later.',
						'data'    => (object) array(
							'status' => 500,
						),
					),
					500
				);
			}

			if ( $embedded_route === $request->get_route() ) {
				return new WP_REST_Response(
					(object) array(
						'code'    => 'embedded_analytics_error',
						'message' => 'The API embedded an error in a successful response.',
						'data'    => (object) array(
							'status' => 502,
						),
					),
					200
				);
			}

			return $result;
		};

		add_action( 'rest_api_init', $register_routes );
		add_filter( 'rest_pre_dispatch', $pre_dispatch, 10, 3 );

		try {
			// Routes must be registered on the `rest_api_init` action.
			do_action( 'rest_api_init' );
			$result          = $this->invoke( 'make_proxy_request', array( 'reports/coverage-test-error', array() ) );
			$embedded_result = $this->invoke( 'make_proxy_request', array( 'reports/coverage-test-embedded-error', array() ) );
		} finally {
			remove_action( 'rest_api_init', $register_routes );
			remove_filter( 'rest_pre_dispatch', $pre_dispatch, 10 );
			$wp_rest_server = $previous_server;
		}

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'external_api_error', $result->get_error_code() );
		$this->assertSame(
			array(
				'status'        => 500,
				'message'       => 'Failed to retrieve bookings data. Please try again later.',
				'external_code' => 'woocommerce_analytics_bookings_error',
			),
			$result->get_error_data()
		);

		$this->assertInstanceOf( WP_Error::class, $embedded_result );
		$this->assertSame( 'external_api_error', $embedded_result->get_error_code() );
		$this->assertSame(
			array(
				'status'        => 502,
				'message'       => 'The API embedded an error in a successful response.',
				'external_code' => 'embedded_analytics_error',
			),
			$embedded_result->get_error_data()
		);
	}
}
