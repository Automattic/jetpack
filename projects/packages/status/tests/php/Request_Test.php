<?php
/**
 * Tests for Automattic\Jetpack\Status\Request methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 *
 * @covers \Automattic\Jetpack\Status\Request
 */
#[CoversClass( Request::class )]
class Request_Test extends TestCase {
	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
		Constants::clear_constants();
	}

	/**
	 * Test is_frontend with various scenarios
	 *
	 * @dataProvider get_is_frontend_scenarios
	 *
	 * @param array $function_mocks   WordPress functions and their return values.
	 * @param array $constants        Constants to mock and their values.
	 * @param bool  $expected_result  Expected result from is_frontend().
	 * @param bool  $should_set_headers Whether Vary headers should be set.
	 */
	#[DataProvider( 'get_is_frontend_scenarios' )]
	public function test_is_frontend_scenarios( $function_mocks, $constants, $expected_result, $should_set_headers ) {
		// Set up constants using Constants package
		foreach ( $constants as $constant_name => $constant_value ) {
			Constants::set_constant( $constant_name, $constant_value );
		}

		// Mock WordPress functions
		foreach ( $function_mocks as $function_name => $return_value ) {
			Functions\when( $function_name )->justReturn( $return_value );
		}

		// Set up header expectations
		if ( $should_set_headers ) {
			Functions\when( 'headers_list' )->justReturn( array() );
			Functions\expect( 'header' )->once()->with( 'Vary: accept, content-type' );
		} else {
			Functions\expect( 'header' )->never();
		}

		// Mock the apply_filters function
		Filters\expectApplied( 'jetpack_is_frontend' )->once()->with( $expected_result )->andReturn( $expected_result );

		$result = Request::is_frontend();
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Data provider for is_frontend scenarios
	 *
	 * @return array
	 */
	public static function get_is_frontend_scenarios() {
		$default_functions = array(
			'is_admin'            => false,
			'wp_doing_ajax'       => false,
			'wp_is_jsonp_request' => false,
			'is_feed'             => false,
			'wp_is_json_request'  => false,
			'wp_is_xml_request'   => false,
			'headers_sent'        => false,
		);

		return array(
			'frontend request'          => array(
				'function_mocks'     => $default_functions,
				'constants'          => array(),
				'expected_result'    => true,
				'should_set_headers' => true,
			),
			'admin request'             => array(
				'function_mocks'     => array_merge( $default_functions, array( 'is_admin' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'ajax request'              => array(
				'function_mocks'     => array_merge( $default_functions, array( 'wp_doing_ajax' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'jsonp request'             => array(
				'function_mocks'     => array_merge( $default_functions, array( 'wp_is_jsonp_request' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'feed request'              => array(
				'function_mocks'     => array_merge( $default_functions, array( 'is_feed' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'REST_REQUEST constant'     => array(
				'function_mocks'     => $default_functions,
				'constants'          => array( 'REST_REQUEST' => true ),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'REST_API_REQUEST constant' => array(
				'function_mocks'     => $default_functions,
				'constants'          => array( 'REST_API_REQUEST' => true ),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'WP_CLI constant'           => array(
				'function_mocks'     => $default_functions,
				'constants'          => array( 'WP_CLI' => true ),
				'expected_result'    => false,
				'should_set_headers' => false,
			),
			'json request'              => array(
				'function_mocks'     => array_merge( $default_functions, array( 'wp_is_json_request' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => true, // JSON requests are varying requests
			),
			'xml request'               => array(
				'function_mocks'     => array_merge( $default_functions, array( 'wp_is_xml_request' => true ) ),
				'constants'          => array(),
				'expected_result'    => false,
				'should_set_headers' => true, // XML requests are varying requests
			),
			'headers already sent'      => array(
				'function_mocks'     => array_merge( $default_functions, array( 'headers_sent' => true ) ),
				'constants'          => array(),
				'expected_result'    => true,
				'should_set_headers' => false, // No headers set when headers_sent is true
			),
		);
	}

	/**
	 * Test is_frontend with various existing header scenarios
	 *
	 * @dataProvider get_header_scenarios
	 * @param array  $existing_headers Existing headers to mock.
	 * @param string $expected_header  Expected Vary header to be set.
	 */
	#[DataProvider( 'get_header_scenarios' )]
	public function test_is_frontend_with_existing_headers( $existing_headers, $expected_header ) {
		// Set up for frontend request (all conditions false)
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_doing_ajax' )->justReturn( false );
		Functions\when( 'wp_is_jsonp_request' )->justReturn( false );
		Functions\when( 'is_feed' )->justReturn( false );
		Functions\when( 'wp_is_json_request' )->justReturn( false );
		Functions\when( 'wp_is_xml_request' )->justReturn( false );
		Functions\when( 'headers_sent' )->justReturn( false );
		Functions\when( 'headers_list' )->justReturn( $existing_headers );

		// Expect the header to be set with the combined Vary values
		Functions\expect( 'header' )->once()->with( $expected_header );
		Filters\expectApplied( 'jetpack_is_frontend' )->once()->with( true )->andReturn( true );

		$result = Request::is_frontend();
		$this->assertTrue( $result );
	}

	/**
	 * Data provider for header scenarios
	 *
	 * @return array
	 */
	public static function get_header_scenarios() {
		return array(
			'no existing headers'                       => array(
				'existing_headers' => array(),
				'expected_header'  => 'Vary: accept, content-type',
			),
			'existing Accept-Encoding header'           => array(
				'existing_headers' => array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept-Encoding',
				),
				'expected_header'  => 'Vary: accept, content-type, accept-encoding',
			),
			'multiple Vary headers'                     => array(
				'existing_headers' => array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
					'Vary: Accept-Encoding',
				),
				'expected_header'  => 'Vary: accept, content-type, accept-encoding',
			),
			'wildcard Vary header'                      => array(
				'existing_headers' => array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
				),
				'expected_header'  => 'Vary: *',
			),
			'existing Accept header (already included)' => array(
				'existing_headers' => array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
				),
				'expected_header'  => 'Vary: accept, content-type',
			),
			'mixed case Vary header'                    => array(
				'existing_headers' => array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept-Language, Accept-Encoding',
				),
				'expected_header'  => 'Vary: accept, content-type, accept-language, accept-encoding',
			),
		);
	}

	/**
	 * Test is_frontend filter behavior
	 *
	 * @dataProvider get_filter_override_scenarios
	 * @param bool $initial_result    The initial result before filter is applied.
	 * @param bool $filter_return     What the filter should return.
	 * @param bool $expected_result   The expected final result.
	 */
	#[DataProvider( 'get_filter_override_scenarios' )]
	public function test_is_frontend_filter_behavior( $initial_result, $filter_return, $expected_result ) {
		// Set up WordPress functions based on the initial result we want
		if ( $initial_result ) {
			// Frontend request setup
			Functions\when( 'is_admin' )->justReturn( false );
			Functions\when( 'wp_doing_ajax' )->justReturn( false );
			Functions\when( 'wp_is_jsonp_request' )->justReturn( false );
			Functions\when( 'is_feed' )->justReturn( false );
			Functions\when( 'wp_is_json_request' )->justReturn( false );
			Functions\when( 'wp_is_xml_request' )->justReturn( false );
			Functions\when( 'headers_sent' )->justReturn( false );
			Functions\when( 'headers_list' )->justReturn( array() );
			Functions\expect( 'header' )->once()->with( 'Vary: accept, content-type' );
		} else {
			// Non-frontend request setup (admin)
			Functions\when( 'is_admin' )->justReturn( true );
			Functions\when( 'wp_doing_ajax' )->justReturn( false );
			Functions\when( 'wp_is_jsonp_request' )->justReturn( false );
			Functions\when( 'is_feed' )->justReturn( false );
			Functions\when( 'wp_is_json_request' )->justReturn( false );
			Functions\when( 'wp_is_xml_request' )->justReturn( false );
			Functions\when( 'headers_sent' )->justReturn( false );
			Functions\expect( 'header' )->never();
		}

		// Set up the filter expectation
		Filters\expectApplied( 'jetpack_is_frontend' )->once()->with( $initial_result )->andReturn( $filter_return );

		$result = Request::is_frontend();
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Data provider for filter override scenarios
	 *
	 * @return array
	 */
	public static function get_filter_override_scenarios() {
		return array(
			'frontend request - filter returns same (true)' => array(
				'initial_result'  => true,
				'filter_return'   => true,
				'expected_result' => true,
			),
			'frontend request - filter overrides to false' => array(
				'initial_result'  => true,
				'filter_return'   => false,
				'expected_result' => false,
			),
			'admin request - filter returns same (false)'  => array(
				'initial_result'  => false,
				'filter_return'   => false,
				'expected_result' => false,
			),
			'admin request - filter overrides to true'     => array(
				'initial_result'  => false,
				'filter_return'   => true,
				'expected_result' => true,
			),
		);
	}

	/**
	 * Test jetpack_get_vary_headers.
	 *
	 * @dataProvider get_test_headers
	 * @param array $headers  Array of headers.
	 * @param array $expected Expected array of headers, to be used as Vary header.
	 */
	#[DataProvider( 'get_test_headers' )]
	public function test_get_vary_headers( $headers, $expected ) {
		$vary_header_parts = Request::get_vary_headers( $headers );

		$this->assertEquals( $expected, $vary_header_parts );
	}

	/**
	 * Data provider for the test_get_vary_headers() test.
	 *
	 * @return array
	 */
	public static function get_test_headers() {
		return array(
			'no headers'                             => array(
				array(),
				array( 'accept', 'content-type' ),
			),
			'Single Vary Encoding header'            => array(
				array(
					'Vary: Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'Double Vary: Accept-Encoding & Accept'  => array(
				array(
					'Vary: Accept, Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'vary header'                            => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
				),
				array( 'accept', 'content-type' ),
			),
			'Wildcard Vary header'                   => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
				),
				array( '*' ),
			),
			'Multiple Vary headers'                  => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
					'Vary: Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'Multiple Vary headers, with a wildcard' => array(
				array(
					'Cache-Control: no-cache, must revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
					'Vary: Accept-Encoding',
				),
				array( '*' ),
			),
		);
	}
}
