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
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'wp_unslash' )->returnArg();
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
	}

	/**
	 * Test `get_ip`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::get_ip
	 * @covers Automattic\Jetpack\IP\Utils::clean_ip
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
	public static function provide_get_ip() {
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
	 * @covers Automattic\Jetpack\IP\Utils::ip_is_private
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
	 * @covers Automattic\Jetpack\IP\Utils::convert_ip_address
	 */
	public function test_convert_ip_address() {
		$converted_ip_address = Utils::convert_ip_address( '1.2.3.4' );
		$this->assertEquals( 'string', gettype( $converted_ip_address ) );
	}

	/**
	 * Test `ip_address_is_in_range`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::ip_address_is_in_range
	 */
	public function test_ip_address_is_in_range() {
		// IPv4 - Hyphenated ranges
		$range_low_ipv4    = '1.1.1.1';
		$range_high_ipv4   = '1.2.3.4';
		$in_range_ip_ipv4  = '1.2.2.2';
		$out_range_ip_ipv4 = '1.2.255.255';

		$this->assertTrue( Utils::ip_address_is_in_range( $in_range_ip_ipv4, $range_low_ipv4, $range_high_ipv4 ) );
		$this->assertFalse( Utils::ip_address_is_in_range( $out_range_ip_ipv4, $range_low_ipv4, $range_high_ipv4 ) );

		// IPv6 - Hyphenated ranges
		$range_low_ipv6    = '2001:db8::1';
		$range_high_ipv6   = '2001:db8::ffff';
		$in_range_ip_ipv6  = '2001:db8::abcd';
		$out_range_ip_ipv6 = '2001:db8::1:0';

		$this->assertTrue( Utils::ip_address_is_in_range( $in_range_ip_ipv6, $range_low_ipv6, $range_high_ipv6 ) );
		$this->assertFalse( Utils::ip_address_is_in_range( $out_range_ip_ipv6, $range_low_ipv6, $range_high_ipv6 ) );

		// IPv4 - CIDR notation
		$cidr_ipv4        = '192.168.1.0/24';
		$in_cidr_ip_ipv4  = '192.168.1.100';
		$out_cidr_ip_ipv4 = '192.168.2.1';

		$this->assertTrue( Utils::ip_address_is_in_range( $in_cidr_ip_ipv4, $cidr_ipv4 ) );
		$this->assertFalse( Utils::ip_address_is_in_range( $out_cidr_ip_ipv4, $cidr_ipv4 ) );

		// IPv6 - CIDR notation
		$cidr_ipv6        = '2001:db8::/32';
		$in_cidr_ip_ipv6  = '2001:db8:1234::1';
		$out_cidr_ip_ipv6 = '2001:db9::1';

		$this->assertTrue( Utils::ip_address_is_in_range( $in_cidr_ip_ipv6, $cidr_ipv6 ) );
		$this->assertFalse( Utils::ip_address_is_in_range( $out_cidr_ip_ipv6, $cidr_ipv6 ) );

		// Edge cases - minimum and maximum IPs
		$this->assertTrue( Utils::ip_address_is_in_range( '0.0.0.0', '0.0.0.0', '255.255.255.255' ) );
		$this->assertTrue( Utils::ip_address_is_in_range( '255.255.255.255', '0.0.0.0', '255.255.255.255' ) );

		$this->assertTrue( Utils::ip_address_is_in_range( '::', '::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' ) );
		$this->assertTrue( Utils::ip_address_is_in_range( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' ) );

		// Invalid inputs - Missing range high for hyphenated range
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '1.1.1.0' ) );

		// Invalid IP addresses
		$this->assertFalse( Utils::ip_address_is_in_range( 'invalid_ip', '1.1.1.0', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', 'invalid_ip', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '1.1.1.0', 'invalid_ip' ) );

		// IP version mismatch
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '2001:db8::1', '2001:db8::ffff' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '2001:db8::1', '1.1.1.0', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '2001:db8::/32' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '2001:db8::1', '192.168.1.0/24' ) );

		// Invalid CIDR notation
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '192.168.1.0' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '192.168.1.0/33' ) ); // Invalid prefix length

		// Hyphenated range with CIDR notation in parameters (should return false)
		$this->assertFalse( Utils::ip_address_is_in_range( '192.168.1.100', '192.168.1.0/24', '192.168.1.255' ) );

		// Test with empty strings
		$this->assertFalse( Utils::ip_address_is_in_range( '', '1.1.1.0', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1.1', '1.1.1.0', '' ) );

		// Test with invalid netmask in CIDR notation
		$this->assertFalse( Utils::ip_address_is_in_range( '192.168.1.1', '192.168.1.0/invalid' ) );

		// IPv4 addresses at the edges of the range
		$this->assertTrue( Utils::ip_address_is_in_range( '1.1.1.1', '1.1.1.1', '1.1.1.10' ) ); // At range low
		$this->assertTrue( Utils::ip_address_is_in_range( '1.1.1.10', '1.1.1.1', '1.1.1.10' ) ); // At range high

		// IPv6 addresses at the edges of the range
		$this->assertTrue( Utils::ip_address_is_in_range( '2001:db8::1', '2001:db8::1', '2001:db8::a' ) ); // At range low
		$this->assertTrue( Utils::ip_address_is_in_range( '2001:db8::a', '2001:db8::1', '2001:db8::a' ) ); // At range high

		// CIDR notation edge cases
		$this->assertTrue( Utils::ip_address_is_in_range( '0.0.0.0', '0.0.0.0/0' ) ); // All IPv4 addresses
		$this->assertTrue( Utils::ip_address_is_in_range( '255.255.255.255', '0.0.0.0/0' ) );

		$this->assertTrue( Utils::ip_address_is_in_range( '::', '::/0' ) ); // All IPv6 addresses
		$this->assertTrue( Utils::ip_address_is_in_range( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::/0' ) );

		// Invalid IP formats
		$this->assertFalse( Utils::ip_address_is_in_range( '1.1.1', '1.1.1.0', '1.1.1.255' ) );
		$this->assertFalse( Utils::ip_address_is_in_range( '2001:db8::g', '2001:db8::', '2001:db8::ffff' ) );

		// Valid IPv4 address with IPv6 CIDR notation (should return false)
		$this->assertFalse( Utils::ip_address_is_in_range( '192.168.1.1', '2001:db8::/32' ) );

		// Valid IPv6 address with IPv4 CIDR notation (should return false)
		$this->assertFalse( Utils::ip_address_is_in_range( '2001:db8::1', '192.168.1.0/24' ) );
	}

	/**
	 * Test `get_ip_addresses_from_string`.
	 * Covers IPv4 and IPv6 addresses, including ranges, concatenated with various delimiters.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::get_ip_addresses_from_string
	 */
	public function test_get_ip_addresses_from_string() {
		$ip_string =
			// IPv4 addresses, including a CIDR notation.
			"1.1.1.1\n" .
			'2.2.2.2,3.3.3.3;' .
			'4.4.4.4 ' .
			'5.5.5.5-6.6.6.6,' .
			"192.168.0.0/16\n" .
			// IPv6 addresses, including a CIDR notation.
			"2001:db8::1\n" .
			'2001:db8::2,2001:db8::3;' .
			'2001:db8::4 ' .
			'2001:db8::5-2001:db8::6,' .
			"2001:db8::/32\n" .
			// Invalid IP addresses.
			'hello world - 1.2.3:4,9999:9999:9999.9999:9999:9999:9999';

		$expected = array(
			// IPv4 addresses.
			'1.1.1.1',
			'2.2.2.2',
			'3.3.3.3',
			'4.4.4.4',
			'5.5.5.5-6.6.6.6',
			'192.168.0.0/16',
			// IPv6 addresses.
			'2001:db8::1',
			'2001:db8::2',
			'2001:db8::3',
			'2001:db8::4',
			'2001:db8::5-2001:db8::6',
			'2001:db8::/32',
		);

		$this->assertEquals( $expected, Utils::get_ip_addresses_from_string( $ip_string ) );
	}

	/**
	 * Test `validate_ip_range`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::validate_ip_range
	 */
	public function test_validate_ip_range() {
		// Valid ranges - IPv4.
		$this->assertTrue( Utils::validate_ip_range( '1.1.1.1', '2.2.2.2' ) );
		$this->assertTrue( Utils::validate_ip_range( '10.0.0.1', '10.0.0.255' ) );
		$this->assertTrue( Utils::validate_ip_range( '192.168.1.1', '192.168.1.255' ) );

		// Valid ranges - IPv6.
		$this->assertTrue( Utils::validate_ip_range( '2001:db8::1', '2001:db8::2' ) );
		$this->assertTrue( Utils::validate_ip_range( 'fe80::1', 'fe80::ffff' ) );
		$this->assertTrue( Utils::validate_ip_range( '::1', '::ffff' ) );

		// Invalid ranges - high is lower than low.
		$this->assertFalse( Utils::validate_ip_range( '2.2.2.2', '1.1.1.1' ) );
		$this->assertFalse( Utils::validate_ip_range( '2001:db8::2', '2001:db8::1' ) );

		// Invalid ranges - mismatched IP versions.
		$this->assertFalse( Utils::validate_ip_range( '1.1.1.1', '2001:db8::1' ) );
		$this->assertFalse( Utils::validate_ip_range( '2001:db8::1', '1.1.1.1' ) );

		// Invalid ranges - invalid IP addresses.
		$this->assertFalse( Utils::validate_ip_range( '1.1.1', '2.2.2.2' ) );
		$this->assertFalse( Utils::validate_ip_range( '2001:db8::g', '2001:db8::1' ) );

		// Ranges with the same low and high address are still considered valid.
		$this->assertTrue( Utils::validate_ip_range( '1.1.1.1', '1.1.1.1' ) );
		$this->assertTrue( Utils::validate_ip_range( '2001:db8::1', '2001:db8::1' ) );

		// Edge cases - minimum and maximum IPv4 addresses.
		$this->assertTrue( Utils::validate_ip_range( '0.0.0.0', '255.255.255.255' ) );

		// Edge cases - minimum and maximum IPv6 addresses.
		$this->assertTrue( Utils::validate_ip_range( '::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' ) );

		// Invalid input - empty strings.
		$this->assertFalse( Utils::validate_ip_range( '', '' ) );

		// Invalid input - non-IP strings.
		$this->assertFalse( Utils::validate_ip_range( 'not_an_ip', 'another_bad_ip' ) );
	}

	/**
	 * Test `validate_cidr`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::validate_cidr
	 */
	public function test_validate_cidr() {
		// Valid IPv4 CIDR notations
		$this->assertTrue( Utils::validate_cidr( '192.168.1.0/24' ) );
		$this->assertTrue( Utils::validate_cidr( '10.0.0.0/8' ) );
		$this->assertTrue( Utils::validate_cidr( '0.0.0.0/0' ) );
		$this->assertTrue( Utils::validate_cidr( '255.255.255.255/32' ) );

		// Valid IPv6 CIDR notations
		$this->assertTrue( Utils::validate_cidr( '2001:db8::/32' ) );
		$this->assertTrue( Utils::validate_cidr( '::/0' ) );
		$this->assertTrue( Utils::validate_cidr( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128' ) );

		// Invalid CIDR notations - missing slash
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0' ) );
		$this->assertFalse( Utils::validate_cidr( '2001:db8::' ) );

		// Invalid CIDR notations - invalid IP address
		$this->assertFalse( Utils::validate_cidr( '999.999.999.999/24' ) );
		$this->assertFalse( Utils::validate_cidr( 'gggg::gggg/64' ) );

		// Invalid CIDR notations - invalid prefix length
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/33' ) ); // IPv4 max prefix is 32
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/-1' ) ); // Negative prefix length
		$this->assertFalse( Utils::validate_cidr( '2001:db8::/129' ) ); // IPv6 max prefix is 128
		$this->assertFalse( Utils::validate_cidr( '2001:db8::/-1' ) );  // Negative prefix length

		// Invalid CIDR notations - non-digit prefix
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/abc' ) );
		$this->assertFalse( Utils::validate_cidr( '2001:db8::/xyz' ) );

		// Invalid CIDR notations - empty prefix
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/' ) );
		$this->assertFalse( Utils::validate_cidr( '2001:db8::/' ) );

		// Invalid CIDR notations - extra parts
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/24/extra' ) );
		$this->assertFalse( Utils::validate_cidr( '2001:db8::/64/extra' ) );

		// Invalid CIDR notations - IP and prefix mismatch
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/128' ) ); // IPv4 with IPv6 prefix length
		$this->assertTrue( Utils::validate_cidr( '2001:db8::/32' ) );    // Ensuring valid IPv6 CIDR is accepted

		// Edge cases - minimum and maximum prefix lengths
		$this->assertTrue( Utils::validate_cidr( '0.0.0.0/0' ) );        // IPv4 with prefix length 0
		$this->assertTrue( Utils::validate_cidr( '255.255.255.255/32' ) ); // IPv4 with prefix length 32
		$this->assertTrue( Utils::validate_cidr( '::/0' ) );             // IPv6 with prefix length 0
		$this->assertTrue( Utils::validate_cidr( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128' ) ); // IPv6 with prefix length 128

		// Invalid CIDR notations - whitespace issues
		$this->assertFalse( Utils::validate_cidr( ' 192.168.1.0/24' ) ); // Leading whitespace
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/24 ' ) ); // Trailing whitespace
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0 /24' ) ); // Space before slash
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0/ 24' ) ); // Space after slash

		// Valid CIDR notation with leading zeros in prefix
		$this->assertTrue( Utils::validate_cidr( '192.168.1.0/08' ) );
		$this->assertTrue( Utils::validate_cidr( '2001:db8::/064' ) );

		// Invalid CIDR notations - special characters in IP
		$this->assertFalse( Utils::validate_cidr( '192.168.1.0$/24' ) );
		$this->assertFalse( Utils::validate_cidr( '2001:db8:::/64' ) );
	}

	/**
	 * Test `parse_cidr`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::parse_cidr
	 */
	public function test_parse_cidr() {
		// Valid IPv4 CIDR notation
		$this->assertEquals( array( '192.168.1.0', 24 ), Utils::parse_cidr( '192.168.1.0/24' ) );

		// Valid IPv6 CIDR notation
		$this->assertEquals( array( '2001:db8::', 32 ), Utils::parse_cidr( '2001:db8::/32' ) );

		// Invalid CIDR notation - Missing netmask
		$this->assertFalse( Utils::parse_cidr( '192.168.1.0' ) );

		// Invalid CIDR notation - Non-integer netmask
		$this->assertFalse( Utils::parse_cidr( '192.168.1.0/abc' ) );

		// Invalid CIDR notation - Netmask out of range
		$this->assertFalse( Utils::parse_cidr( '192.168.1.0/33' ) );
		$this->assertFalse( Utils::parse_cidr( '2001:db8::/129' ) );
	}

	/**
	 * Test `get_ip_version`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::get_ip_version
	 */
	public function test_get_ip_version() {
		// Valid IPv4 address
		$this->assertEquals( 'ipv4', Utils::get_ip_version( '192.168.1.1' ) );

		// Valid IPv6 address
		$this->assertEquals( 'ipv6', Utils::get_ip_version( '2001:db8::1' ) );

		// Invalid IP address
		$this->assertFalse( Utils::get_ip_version( 'invalid_ip' ) );
	}

	/**
	 * Test `validate_netmask`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::validate_netmask
	 */
	public function test_validate_netmask() {
		// Valid netmask for IPv4
		$this->assertTrue( Utils::validate_netmask( 0, 'ipv4' ) );
		$this->assertTrue( Utils::validate_netmask( 32, 'ipv4' ) );

		// Invalid netmask for IPv4
		$this->assertFalse( Utils::validate_netmask( -1, 'ipv4' ) );
		$this->assertFalse( Utils::validate_netmask( 33, 'ipv4' ) );

		// Valid netmask for IPv6
		$this->assertTrue( Utils::validate_netmask( 0, 'ipv6' ) );
		$this->assertTrue( Utils::validate_netmask( 128, 'ipv6' ) );

		// Invalid netmask for IPv6
		$this->assertFalse( Utils::validate_netmask( -1, 'ipv6' ) );
		$this->assertFalse( Utils::validate_netmask( 129, 'ipv6' ) );

		// Invalid IP version
		$this->assertFalse( Utils::validate_netmask( 24, 'ipv7' ) );
	}

	/**
	 * Test `ip_in_ipv4_cidr`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::ip_in_ipv4_cidr
	 */
	public function test_ip_in_ipv4_cidr() {
		// IP within CIDR range
		$this->assertTrue( Utils::ip_in_ipv4_cidr( '192.168.1.100', '192.168.1.0', 24 ) );

		// IP outside CIDR range
		$this->assertFalse( Utils::ip_in_ipv4_cidr( '192.168.2.100', '192.168.1.0', 24 ) );

		// Edge cases
		$this->assertTrue( Utils::ip_in_ipv4_cidr( '0.0.0.0', '0.0.0.0', 0 ) );
		$this->assertTrue( Utils::ip_in_ipv4_cidr( '255.255.255.255', '0.0.0.0', 0 ) );

		// Invalid IP addresses
		$this->assertFalse( Utils::ip_in_ipv4_cidr( 'invalid_ip', '192.168.1.0', 24 ) );
		$this->assertFalse( Utils::ip_in_ipv4_cidr( '192.168.1.100', 'invalid_ip', 24 ) );

		// Invalid netmask
		$this->assertFalse( Utils::ip_in_ipv4_cidr( '192.168.1.100', '192.168.1.0', -1 ) );
		$this->assertFalse( Utils::ip_in_ipv4_cidr( '192.168.1.100', '192.168.1.0', 33 ) );
	}

	/**
	 * Test `ip_in_ipv6_cidr`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::ip_in_ipv6_cidr
	 */
	public function test_ip_in_ipv6_cidr() {
		// IP within CIDR range
		$this->assertTrue( Utils::ip_in_ipv6_cidr( '2001:db8::1', '2001:db8::', 32 ) );

		// IP outside CIDR range
		$this->assertFalse( Utils::ip_in_ipv6_cidr( '2001:db9::1', '2001:db8::', 32 ) );

		// Edge cases
		$this->assertTrue( Utils::ip_in_ipv6_cidr( '::', '::', 0 ) );
		$this->assertTrue( Utils::ip_in_ipv6_cidr( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::', 0 ) );

		// Invalid IP addresses
		$this->assertFalse( Utils::ip_in_ipv6_cidr( 'invalid_ip', '2001:db8::', 32 ) );
		$this->assertFalse( Utils::ip_in_ipv6_cidr( '2001:db8::1', 'invalid_ip', 32 ) );

		// Invalid netmask
		$this->assertFalse( Utils::ip_in_ipv6_cidr( '2001:db8::1', '2001:db8::', -1 ) );
		$this->assertFalse( Utils::ip_in_ipv6_cidr( '2001:db8::1', '2001:db8::', 129 ) );
	}

	/**
	 * Test `ip_in_cidr`.
	 *
	 * @covers Automattic\Jetpack\IP\Utils::ip_in_cidr
	 */
	public function test_ip_in_cidr() {
		// IPv4 - Valid cases
		$this->assertTrue( Utils::ip_in_cidr( '192.168.1.100', '192.168.1.0/24' ) );
		$this->assertFalse( Utils::ip_in_cidr( '192.168.2.100', '192.168.1.0/24' ) );

		// IPv6 - Valid cases
		$this->assertTrue( Utils::ip_in_cidr( '2001:db8::1', '2001:db8::/32' ) );
		$this->assertFalse( Utils::ip_in_cidr( '2001:db9::1', '2001:db8::/32' ) );

		// Invalid CIDR notation
		$this->assertFalse( Utils::ip_in_cidr( '192.168.1.100', '192.168.1.0' ) );
		$this->assertFalse( Utils::ip_in_cidr( '2001:db8::1', '2001:db8::' ) );

		// IP and CIDR version mismatch
		$this->assertFalse( Utils::ip_in_cidr( '192.168.1.100', '2001:db8::/32' ) );
		$this->assertFalse( Utils::ip_in_cidr( '2001:db8::1', '192.168.1.0/24' ) );

		// Edge cases
		$this->assertTrue( Utils::ip_in_cidr( '0.0.0.0', '0.0.0.0/0' ) );
		$this->assertTrue( Utils::ip_in_cidr( '255.255.255.255', '0.0.0.0/0' ) );

		$this->assertTrue( Utils::ip_in_cidr( '::', '::/0' ) );
		$this->assertTrue( Utils::ip_in_cidr( 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::/0' ) );
	}
}
