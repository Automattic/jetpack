<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Text XMLRPC Connector
 */
class XMLRPC_Connector_Test extends TestCase {

	/**
	 * Public key to verify signature
	 *
	 * @var string
	 */
	public static $public_key;

	/**
	 * Base64 encoded signature
	 *
	 * @var string
	 */
	public static $signature;

	/**
	 * Timestamp of the signature
	 *
	 * @var integer
	 */
	public static $timestamp;

	/**
	 * Initialize tests
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		$keys = openssl_pkey_new();
		openssl_pkey_export( $keys, $private_key );
		$public_key       = openssl_pkey_get_details( $keys );
		self::$public_key = $public_key['key'];
		self::$timestamp  = time();
		$url_parameters   = array(
			'rest_route' => '/jetpack/v4/connection/test/',
			'timestamp'  => self::$timestamp,
			'url'        => 'https://example.com',
		);

		openssl_sign( wp_json_encode( $url_parameters ), $signature, $private_key );
		self::$signature = ( base64_encode( $signature ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	/**
	 * Tests is_request_signed_by_jetpack_debugger
	 *
	 * @param array $get_params The value of $_GET.
	 * @param bool  $expected The expected return of is_request_signed_by_jetpack_debugger.
	 *
	 * @dataProvider is_request_signed_by_jetpack_debugger_data
	 * @covers Automattic\Jetpack\Connection\REST_Connector::is_request_signed_by_jetpack_debugger
	 * @return void
	 */
	public function test_is_request_signed_by_jetpack_debugger( $get_params, $expected ) {

		if ( isset( $get_params['signature'] ) && '__VALID__' === $get_params['signature'] ) {
			$get_params['signature'] = self::$signature;
		}

		if ( isset( $get_params['timestamp'] ) && '__VALID__' === $get_params['timestamp'] ) {
			$get_params['timestamp'] = self::$timestamp;
		}

		$old_get  = $_GET; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET     = $get_params;
		$response = REST_Connector::is_request_signed_by_jetpack_debugger( self::$public_key );
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
			'empty get'                    => array(
				array(),
				false,
			),
			'incomplete get'               => array(
				array(
					'timestamp' => '__VALID__',
					'url'       => 'https://example.com',
					'signature' => '__VALID__',
				),
				false,
			),
			'valid get'                    => array(
				array(
					'rest_route' => '/jetpack/v4/connection/test/',
					'timestamp'  => '__VALID__',
					'url'        => 'https://example.com',
					'signature'  => '__VALID__',
				),
				true,
			),
			'valid get, invalid signature' => array(
				array(
					'rest_route' => '/jetpack/v4/connection/test/',
					'timestamp'  => time(),
					'url'        => 'https://example.com',
					'signature'  => 'invalid',
				),
				false,
			),
			'valid get, invalid url'       => array(
				array(
					'rest_route' => '/jetpack/v4/connection/test/',
					'timestamp'  => '__VALID__',
					'url'        => 'https://bad-example.com',
					'signature'  => '__VALID__',
				),
				false,
			),
			'outdated signature'           => array(
				array(
					'signature'  => '__VALID__',
					'timestamp'  => time() - 400,
					'url'        => 'https://example.com',
					'rest_route' => '/jetpack/v4/connection/test/',
				),
				false,
			),
		);
	}

}
