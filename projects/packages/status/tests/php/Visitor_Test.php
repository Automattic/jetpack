<?php
/**
 * Tests for Automattic\Jetpack\Status\Visitor methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Visitor test suite.
 *
 * @covers \Automattic\Jetpack\Status\Visitor
 */
#[CoversClass( Visitor::class )]
class Visitor_Test extends TestCase {
	/**
	 * Testing object.
	 *
	 * @var Visitor
	 */
	private $visitor_obj;

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->visitor_obj = new Visitor();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		parent::tearDown();
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
	#[DataProvider( 'get_ip_data_provider' )]
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
	public static function get_ip_data_provider() {
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

	/**
	 * Tests is_automattician_feature_flags_only method.
	 */
	public function test_is_automattician_feature_flags_only() {
		$is_a11n = $this->visitor_obj->is_automattician_feature_flags_only();
		$this->assertFalse( $is_a11n );

		define( 'AT_PROXIED_REQUEST', true );

		$is_a11n = $this->visitor_obj->is_automattician_feature_flags_only();
		$this->assertTrue( $is_a11n );
	}

	/**
	 * Tests is_tracking_automattician returns false for an ordinary request.
	 *
	 * Isolated because AT_PROXIED_REQUEST cannot be undefined once set. Without a
	 * fresh process this assertion would silently depend on running before every
	 * test that defines the constant.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_tracking_automattician_is_false_for_an_ordinary_request() {
		// Neither wpcom function exists off WordPress.com, so every branch falls through.
		$this->assertFalse( $this->visitor_obj->is_tracking_automattician() );
	}

	/**
	 * Tests is_tracking_automattician treats a proxied request as Automattician traffic.
	 *
	 * Isolated for the same reason: this test defines the constant, and doing so in a
	 * shared process would leak into the assertion above.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_tracking_automattician_is_true_for_a_proxied_request() {
		define( 'AT_PROXIED_REQUEST', true );

		$this->assertTrue( $this->visitor_obj->is_tracking_automattician() );
	}

	/**
	 * Tests that get_ip only returns REMOTE_ADDR when it holds a valid IP address.
	 *
	 * @param string $remote_addr Raw REMOTE_ADDR value.
	 * @param string $expected    Expected return value.
	 * @dataProvider remote_addr_validation_provider
	 */
	#[DataProvider( 'remote_addr_validation_provider' )]
	public function test_get_ip_validates_remote_addr( $remote_addr, $expected ) {
		$_SERVER['REMOTE_ADDR'] = $remote_addr;

		$this->assertSame( $expected, $this->visitor_obj->get_ip() );
	}

	/**
	 * Data provider for 'test_get_ip_validates_remote_addr'.
	 *
	 * @return array
	 */
	public static function remote_addr_validation_provider() {
		return array(
			'IPv4'                => array( '1.2.3.4', '1.2.3.4' ),
			'IPv6'                => array( '2001:db8::1', '2001:db8::1' ),
			'markup'              => array( '<script>alert(1)</script>', '' ),
			'arbitrary text'      => array( 'not-an-ip-address', '' ),
			'octets out of range' => array( '999.999.999.999', '' ),
			'address with a port' => array( '1.2.3.4:8080', '' ),
			'list of addresses'   => array( '1.2.3.4, 5.6.7.8', '' ),
		);
	}

	/**
	 * Tests that the forwarded headers are sanitized rather than validated as a single
	 * address, because they may legitimately carry a list.
	 */
	public function test_get_ip_sanitizes_forwarded_headers_and_keeps_lists() {
		$_SERVER['REMOTE_ADDR']          = '1.2.3.4';
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '<b>5.6.7.8</b>, 9.10.11.12';

		$ip = $this->visitor_obj->get_ip( true );

		$this->assertStringNotContainsString( '<', $ip );
		$this->assertSame( '5.6.7.8, 9.10.11.12', $ip );
	}
}
