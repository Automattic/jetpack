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
}
