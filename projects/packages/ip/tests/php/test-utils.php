<?php
/**
 * Utils class test suite.
 *
 * @package automattic/jetpack-ip
 */

use Automattic\Jetpack\IP\Utils;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Utils class test suite.
 */
final class UtilsTest extends PHPUnit\Framework\TestCase {
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
			$this->assertSame( $expect, Utils::get_ip() );
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
			$this->assertFalse( Utils::ip_is_private( $public_ip ) );
		}

		$private_ips = array(
			'10.1.2.3',        // Single class A network.
			'172.23.45.67',    // 16 contiguous class B network.
			'192.168.1.2',     // 256 contiguous class C network.
			'169.254.255.255', // Link-local address also referred to as Automatic Private IP Addressing.
			'127.0.0.0',       // localhost.
		);
		foreach ( $private_ips as $private_ip ) {
			$this->assertTrue( Utils::ip_is_private( $private_ip ) );
		}
	}

	/**
	 * Test `convert_ip_address`.
	 *
	 * @covers ::convert_ip_address
	 */
	public function test_convert_ip_address() {
		$converted_ip_address = Utils::convert_ip_address( '1.2.3.4' );
		$this->assertEquals( 'string', gettype( $converted_ip_address ) );
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

		$this->assertTrue( Utils::ip_address_is_in_range( $in_range_ip, $range_low, $range_high ) );
		$this->assertFalse( Utils::ip_address_is_in_range( $out_range_ip, $range_low, $range_high ) );
	}

	/**
	 * Test `get_ip_addresses_from_string`.
	 * Covers IPv4 and IPv6 addresses, including ranges, concatenated with various delimiters.
	 *
	 * @covers ::get_ip_addresses_from_string
	 */
	public function test_get_ip_addresses_from_string() {
		$ip_string =
			// IPv4.
			"1.1.1.1\n2.2.2.2,3.3.3.3;4.4.4.4 5.5.5.5-6.6.6.6\n" .
			// IPv6.
			"2001:db8::1\n2001:db8::2,2001:db8::3;2001:db8::4 2001:db8::5-2001:db8::6\n" .
			// Invalid IP addresses.
			'hello world - 1.2.3:4,9999:9999:9999.9999:9999:9999:9999';

		$expected = array(
			'1.1.1.1',
			'2.2.2.2',
			'3.3.3.3',
			'4.4.4.4',
			'5.5.5.5-6.6.6.6',
			'2001:db8::1',
			'2001:db8::2',
			'2001:db8::3',
			'2001:db8::4',
			'2001:db8::5-2001:db8::6',
		);

		$this->assertEquals( $expected, Utils::get_ip_addresses_from_string( $ip_string ) );
	}

	/**
	 * Test `validate_ip_range`.
	 *
	 * @covers ::validate_ip_range
	 */
	public function test_validate_ip_range() {
		// Valid range.
		$this->assertTrue( Utils::validate_ip_range( '1.1.1.1', '2.2.2.2' ) );
		$this->assertTrue( Utils::validate_ip_range( '2001:db8::1', '2001:db8::2' ) );

		// Invalid ranges.
		$this->assertFalse( Utils::validate_ip_range( '2.2.2.2', '1.1.1.1' ) );
		$this->assertFalse( Utils::validate_ip_range( '2001:db8::2', '2001:db8::1' ) );
		$this->assertFalse( Utils::validate_ip_range( '1.1.1', '2.2.2.2' ) );

		// Ranges with the same low and high address are still considered valid.
		$this->assertTrue( Utils::validate_ip_range( '1.1.1.1', '1.1.1.1' ) );
		$this->assertTrue( Utils::validate_ip_range( '2001:db8::1', '2001:db8::1' ) );
	}
}
