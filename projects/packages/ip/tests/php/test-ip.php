<?php
/**
 * IP class test suite.
 *
 * @package automattic/jetpack-ip
 */

use Automattic\Jetpack\IP\IP;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * IP class test suite.
 */
final class IPTest extends PHPUnit\Framework\TestCase {
	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\when( 'wp_unslash' )->returnArg();
	}

	/**
	 * Tear down.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Test `get_ip`.
	 *
	 * @covers ::get_ip
	 * @covers ::clean_ip
	 * @dataProvider provide_get_ip
	 * @param string|false $expect Expected output.
	 * @param array        $server Data for `$_SERVER`.
	 * @param object|null  $trusted_header_data Trusted header data.
	 */
	public function test_get_ip( $expect, $server, $trusted_header_data ) {
		Functions\expect( 'get_site_option' )
			->once()
			->with( 'trusted_ip_header' )
			->andReturn( $trusted_header_data );

		$old_server = $_SERVER;
		$_SERVER    = $server;
		try {
			$this->assertSame( $expect, IP::get_ip() );
		} finally {
			$_SERVER = $old_server;
		}
	}

	/**
	 * Data provider for `test_get_ip`.
	 */
	public function provide_get_ip() {
		return array(
			'Basic IPv4 address'                    => array(
				'192.0.2.1',
				array( 'REMOTE_ADDR' => '192.0.2.1' ),
				null,
			),
			'Invalid IPv4 address'                  => array(
				false,
				array( 'REMOTE_ADDR' => '192.0.2.256' ),
				null,
			),
			'IPv4-as-IPv6 address'                  => array(
				'192.0.2.3',
				array( 'REMOTE_ADDR' => '::FfFf:192.0.2.3' ),
				null,
			),

			'Basic IPv6 address'                    => array(
				'2001:db8::1',
				array( 'REMOTE_ADDR' => '2001:DB8::1' ),
				null,
			),
			'Invalid IPv6 address'                  => array(
				false,
				array( 'REMOTE_ADDR' => '2001:DB8::12345' ),
				null,
			),

			'Missing trusted header'                => array(
				'192.0.2.1',
				array( 'REMOTE_ADDR' => '192.0.2.1' ),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Use trusted header'                    => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments = 2'      => array(
				'192.0.2.2',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments = 3'      => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Use trusted header, too many segments' => array(
				'192.0.2.55',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 10,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments ignored if header has just one' => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 10,
					'reverse'        => true,
				),
			),
			'Use trusted header, unreversed'        => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => false,
				),
			),
			'Trusted header has invalid IP'         => array(
				false,
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::12345, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header has "unless"'           => array(
				'192.0.2.2',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2 unless 2001:DB8::12345, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => true,
				),
			),

			'Trusted header includes port'          => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv6 brackets' => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [2001:DB8::3], 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv6 brackets and port' => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [2001:DB8::3]:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv4-as-IPv6 brackets and port' => array(
				'192.0.2.3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [::ffff:192.0.2.3]:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
		);
	}

	/**
	 * Test `ip_is_private`.
	 *
	 * @covers ::ip_is_private
	 */
	public function test_ip_is_private() {
		$public_ips = array(
			'1.2.3.4',
			'9.255.255.255',
			'128.0.0.0',
		);
		foreach ( $public_ips as $public_ip ) {
			$this->assertFalse( IP::ip_is_private( $public_ip ) );
		}

		$private_ips = array(
			'10.1.2.3',        // Single class A network.
			'172.23.45.67',    // 16 contiguous class B network.
			'192.168.1.2',     // 256 contiguous class C network.
			'169.254.255.255', // Link-local address also referred to as Automatic Private IP Addressing.
			'127.0.0.0',       // localhost.
		);
		foreach ( $private_ips as $private_ip ) {
			$this->assertTrue( IP::ip_is_private( $private_ip ) );
		}
	}

	/**
	 * Test `convert_ip_address`.
	 *
	 * @covers ::convert_ip_address
	 */
	public function test_convert_ip_address() {
		$converted_ip_address = IP::convert_ip_address( '1.2.3.4' );
		if ( function_exists( 'inet_pton' ) ) {
			// if inet_pton() is available, the IP address should be converted to the in_addr representation as a string.
			$this->assertEquals( gettype( $converted_ip_address ), 'string' );
		} else {
			// if inet_pton() is not available, the IP address should be converted to an integer.
			$this->assertEquals( gettype( $converted_ip_address ), 'integer' );
		}
	}

	/**
	 * Test `ip_address_is_in_range`.
	 *
	 * @covers ::ip_address_is_in_range
	 */
	public function test_ip_address_is_in_range() {
		$range_low    = '1.1.1.1';
		$range_high   = '1.2.3.4';
		$in_range_ip  = '1.2.2.2';
		$out_range_ip = '1.2.255.255';

		$this->assertTrue( IP::ip_address_is_in_range( $in_range_ip, $range_low, $range_high ) );
		$this->assertFalse( IP::ip_address_is_in_range( $out_range_ip, $range_low, $range_high ) );
	}

}
