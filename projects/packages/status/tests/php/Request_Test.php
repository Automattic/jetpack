<?php
/**
 * Tests for Automattic\Jetpack\Status\Request methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

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
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
					'Vary: Accept-Encoding',
				),
				array( '*' ),
			),
		);
	}
}
