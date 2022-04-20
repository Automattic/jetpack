<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status\Visitor methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use PHPUnit\Framework\TestCase;

/**
 * Visitor test suite.
 *
 * @covers \Automattic\Jetpack\Status\Visitor
 */
class Test_Visitor extends TestCase {
	/**
	 * Testing object.
	 *
	 * @var Visitor
	 */
	private $visitor_obj;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		$this->visitor_obj = new Visitor();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		unset( $_SERVER['REMOTE_ADDR'] );
		unset( $_SERVER['HTTP_CF_CONNECTING_IP'] );
		unset( $_SERVER['HTTP_CLIENT_IP'] );
		unset( $_SERVER['HTTP_X_FORWARDED_FOR'] );
		unset( $_SERVER['HTTP_X_FORWARDED'] );
		unset( $_SERVER['HTTP_X_CLUSTER_CLIENT_IP'] );
		unset( $_SERVER['HTTP_FORWARDED_FOR'] );
		unset( $_SERVER['HTTP_FORWARDED'] );
		unset( $_SERVER['HTTP_VIA'] );
	}

	/**
	 * Tests get_ip method.
	 *
	 * @dataProvider get_ip_data_provider
	 *
	 * @param  bool   $check_all_headers Whether test_ip should check all headers.
	 * @param  array  $headers           An array of headers.
	 * @param  string $expected_ip       The expected result after calling `get_ip`.
	 */
	public function test_get_ip( $check_all_headers, $headers, $expected_ip ) {
		foreach ( $headers as $header_name => $header_value ) {
			$_SERVER[ $header_name ] = $header_value;
		}
		$this->assertSame( $expected_ip, $this->visitor_obj->get_ip( $check_all_headers ) );
	}

	/**
	 * Data provider for 'test_get_ip'.
	 *
	 * The test data arrays have the format:
	 *    'check_all_headers' => Whether test_ip should check all headers.
	 *    'expected_value' => The expected result after calling `get_ip`.
	 */
	public function get_ip_data_provider() {
		return array(
			'REMOTE_ADDR do not check all headers'       => array(
				'check_all_headers' => false,
				'headers'           => array(
					'REMOTE_ADDR' => '1.2.3.4',
				),
				'expected_ip'       => '1.2.3.4',
			),
			'no REMOTE_ADDR do not check all headers'    => array(
				'check_all_headers' => false,
				'headers'           => array(),
				'expected_ip'       => '',
			),
			'REMOTE_ADDR check all headers'              => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR' => '1.2.3.4',
				),
				'expected_ip'       => '1.2.3.4',
			),
			'no REMOTE_ADDR check all headers'           => array(
				'check_all_headers' => true,
				'headers'           => array(),
				'expected_ip'       => '',
			),
			'HTTP_CF_CONNECTING_IP check all headers'    => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'           => '1.2.3.4',
					'HTTP_CF_CONNECTING_IP' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_CF_CONNECTING_IP do not check all headers' => array(
				'check_all_headers' => false,
				'headers'           => array(
					'REMOTE_ADDR'           => '1.2.3.4',
					'HTTP_CF_CONNECTING_IP' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.4',
			),
			'HTTP_CF_CONNECTING_IP HTTP_CLIENT_IP check all headers' => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'           => '1.2.3.4',
					'HTTP_CF_CONNECTING_IP' => '1.2.3.5',
					'HTTP_CLIENT_IP'        => '1.2.3.6',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_CLIENT_IP check all headers'           => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'    => '1.2.3.4',
					'HTTP_CLIENT_IP' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_X_FORWARDED_FOR check all headers'     => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'          => '1.2.3.4',
					'HTTP_X_FORWARDED_FOR' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_X_FORWARDED check all headers'         => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'      => '1.2.3.4',
					'HTTP_X_FORWARDED' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_X_CLUSTER_CLIENT_IP check all headers' => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'              => '1.2.3.4',
					'HTTP_X_CLUSTER_CLIENT_IP' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_FORWARDED_FOR check all headers'       => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'        => '1.2.3.4',
					'HTTP_FORWARDED_FOR' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_FORWARDED check all headers'           => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'    => '1.2.3.4',
					'HTTP_FORWARDED' => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'HTTP_VIA check all headers'                 => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR' => '1.2.3.4',
					'HTTP_VIA'    => '1.2.3.5',
				),
				'expected_ip'       => '1.2.3.5',
			),
			'All headers do not check all headers'       => array(
				'check_all_headers' => false,
				'headers'           => array(
					'REMOTE_ADDR'              => '1.2.3.4',
					'HTTP_CF_CONNECTING_IP'    => '1.2.3.5',
					'HTTP_CLIENT_IP'           => '1.2.3.7',
					'HTTP_X_FORWARDED_FOR'     => '1.2.3.7',
					'HTTP_X_FORWARDED'         => '1.2.3.8',
					'HTTP_X_CLUSTER_CLIENT_IP' => '1.2.3.9',
					'HTTP_FORWARDED_FOR'       => '1.2.3.10',
					'HTTP_VIA'                 => '1.2.3.11',
				),
				'expected_ip'       => '1.2.3.4',
			),
			'All headers check all headers'              => array(
				'check_all_headers' => true,
				'headers'           => array(
					'REMOTE_ADDR'              => '1.2.3.4',
					'HTTP_CF_CONNECTING_IP'    => '1.2.3.5',
					'HTTP_CLIENT_IP'           => '1.2.3.7',
					'HTTP_X_FORWARDED_FOR'     => '1.2.3.7',
					'HTTP_X_FORWARDED'         => '1.2.3.8',
					'HTTP_X_CLUSTER_CLIENT_IP' => '1.2.3.9',
					'HTTP_FORWARDED_FOR'       => '1.2.3.10',
					'HTTP_VIA'                 => '1.2.3.11',
				),
				'expected_ip'       => '1.2.3.5',
			),
		);
	}
}
