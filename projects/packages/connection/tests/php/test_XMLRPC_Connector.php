<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Text XMLRPC Connector
 */
class XMLRPC_Connector_Test extends TestCase {

	/**
	 * Tests is_request_signed_by_jetpack_debugger
	 *
	 * @param array $get_params The value of $_GET.
	 * @param mixed $openss_verify_output What openssl_verify will output.
	 * @param bool  $expected The expected return of is_request_signed_by_jetpack_debugger.
	 *
	 * @dataProvider is_request_signed_by_jetpack_debugger_data
	 * @covers Automattic\Jetpack\Connection\REST_Connector::is_request_signed_by_jetpack_debugger
	 * @return void
	 */
	public function test_is_request_signed_by_jetpack_debugger( $get_params, $openss_verify_output, $expected ) {

		Functions\when( 'openssl_verify' )->justReturn( $openss_verify_output );

		$old_get  = $_GET; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET     = $get_params;
		$response = REST_Connector::is_request_signed_by_jetpack_debugger();
		$_GET     = $old_get;

		$this->assertSame( $expected, $response );
	}

	/**
	 * Data provider for test_is_request_signed_by_jetpack_debugger
	 *
	 * @return array
	 */
	public function is_request_signed_by_jetpack_debugger_data() {
		return array(
			'empty get'                               => array(
				array(),
				1,
				false,
			),
			'valid get'                               => array(
				array(
					'signature' => 'asd',
					'timestamp' => time(),
					'url'       => 'https://example.com',
				),
				1,
				true,
			),
			'valid get, invalid signature'            => array(
				array(
					'signature' => 'asd',
					'timestamp' => time(),
					'url'       => 'https://example.com',
				),
				0,
				false,
			),
			'valid get, valid but outdated signature' => array(
				array(
					'signature' => 'asd',
					'timestamp' => time() - 400,
					'url'       => 'https://example.com',
				),
				1,
				false,
			),
		);
	}

}
