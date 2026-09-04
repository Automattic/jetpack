<?php
/**
 * Utils class test suite.
 *
 * @package automattic/jetpack-ip
 */

use Automattic\Jetpack\IP\Utils;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Utils class test suite.
 *
 * @covers \Automattic\Jetpack\IP\Utils
 */
#[CoversClass( Utils::class )]
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
		\Jetpack_IP_Test_Resolver::reset();
	}

	/**
	 * Test `get_ip`.
	 *
	 * @dataProvider provide_get_ip
	 * @param string|false $expect Expected output.
	 * @param array        $server Data for `$_SERVER`.
	 * @param object|null  $trusted_header_data Trusted header data.
	 */
	#[DataProvider( 'provide_get_ip' )]
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
	 * Test `ip_is_public`.
	 */
	public function test_ip_is_public() {
		$public_ips = array(
			'1.2.3.4',
			'8.8.8.8',
			'128.0.0.0',
			'100.63.255.255',                 // Just below the CGNAT range.
			'100.128.0.0',                    // Just above the CGNAT range.
			'2606:4700:4700::1111',           // Global IPv6 unicast.
			'2001:4860:4860::8888',           // Global IPv6 unicast.
			'::ffff:8.8.8.8',                 // IPv4-mapped IPv6 of a public address.
			'64:ff9b::808:808',               // NAT64 embedding a public IPv4 (8.8.8.8).
		);
		foreach ( $public_ips as $public_ip ) {
			$this->assertTrue( Utils::ip_is_public( $public_ip ), "$public_ip should be public" );
		}

		$non_public_ips = array(
			// Private / loopback (also covered by ip_is_private()).
			'10.1.2.3',
			'172.16.5.5',
			'192.168.1.1',
			'127.0.0.1',
			// Reserved / special-use ranges the plain filter leaves open.
			'169.254.169.254',                // Link-local cloud metadata.
			'169.254.1.1',
			'168.63.129.16',                  // Azure metadata "Wire Server".
			'100.64.0.1',                     // CGNAT.
			'100.127.255.255',                // CGNAT.
			'192.0.0.1',                      // IETF protocol assignments.
			'192.88.99.1',                    // 6to4 relay anycast.
			'198.18.0.1',                     // Benchmarking.
			'198.19.255.255',                 // Benchmarking.
			'224.0.0.1',                      // Multicast.
			'239.255.255.255',                // Multicast.
			// IPv6 loopback / link-local / unique-local / site-local.
			'::1',
			'fe80::1',
			'fc00::1',
			'fd00::1',
			'fec0::1',
			'fe80::1%eth0',                   // Zone identifier is ignored, still link-local.
			// IPv4-mapped IPv6 pointing at internal addresses.
			'::ffff:169.254.169.254',
			'::ffff:10.0.0.1',
			// Other IPv6 forms embedding an internal IPv4.
			'64:ff9b::a9fe:a9fe',             // NAT64 embedding cloud metadata (169.254.169.254).
			'64:ff9b::a00:1',                 // NAT64 embedding a private IPv4 (10.0.0.1).
			'2002:a9fe:a9fe::',               // 6to4 embedding cloud metadata (169.254.169.254).
			'::7f00:1',                       // IPv4-compatible IPv6 embedding loopback (127.0.0.1).
			// Invalid input.
			'',
			'not-an-ip',
			'999.999.999.999',
			'8.8.8.8%foo',                    // Zone identifier is only valid on IPv6; malformed on IPv4.
			'8.8.8.8%eth0',
		);
		foreach ( $non_public_ips as $non_public_ip ) {
			$this->assertFalse( Utils::ip_is_public( $non_public_ip ), "$non_public_ip should not be public" );
		}
	}

	/**
	 * `url_is_public` accepts URLs whose host is a public address.
	 *
	 * Core's gate is stubbed open throughout these tests so the assertions are
	 * about this helper's own check and not wp_http_validate_url()'s blocklist.
	 * IP-literal hosts keep the whole set off DNS.
	 */
	public function test_url_is_public_accepts_public_hosts() {
		$this->stub_url_helpers();

		$public_urls = array(
			'http://8.8.8.8/image.jpg',
			'https://1.1.1.1/a/b?c=d#e',
			'https://[2606:4700:4700::1111]/image.jpg',
			'https://[::ffff:8.8.8.8]/image.jpg',
		);
		foreach ( $public_urls as $url ) {
			$this->assertTrue( Utils::url_is_public( $url ), "$url should be public" );
		}
	}

	/**
	 * `url_is_public` rejects URLs pointing at reserved or internal addresses.
	 *
	 * Several of these are also rejected by core's wp_http_validate_url(); stubbing
	 * it open is what makes this a test of our own check rather than of core's.
	 */
	public function test_url_is_public_rejects_reserved_hosts() {
		$this->stub_url_helpers();

		$rejected_urls = array(
			'http://169.254.169.254/latest/meta-data/',  // Cloud metadata.
			'http://168.63.129.16/metadata',             // Azure "Wire Server".
			'http://100.64.0.1/',                        // CGNAT.
			'http://198.18.0.1/',                        // Benchmarking.
			'http://192.0.0.1/',                         // IETF protocol assignments.
			'http://127.0.0.1/internal',                 // Loopback.
			'http://10.0.0.1/internal',                  // Private.
			'http://[::1]/internal',                     // IPv6 loopback.
			'http://[fe80::1]/internal',                 // IPv6 link-local.
			'http://[fd00::1]/internal',                 // IPv6 unique-local.
			'http://[::ffff:169.254.169.254]/',          // IPv4-mapped metadata.
			'http://169%2e254%2e169%2e254/',             // Percent-encoded metadata host.
			'http://8.8.8.8%foo/',                       // Zone id on a non-IPv6 host.
		);
		foreach ( $rejected_urls as $url ) {
			$this->assertFalse( Utils::url_is_public( $url ), "$url should not be public" );
		}
	}

	/**
	 * A host that resolves to nothing is rejected rather than passed to the request layer.
	 */
	public function test_url_is_public_rejects_unresolvable_host() {
		$this->stub_url_helpers();

		// RFC 2606 reserves .invalid, so this can never resolve.
		$this->assertFalse( Utils::url_is_public( 'http://jetpack-ip-test.invalid/x' ) );
	}

	/**
	 * Input that is not a usable URL is rejected before any lookup.
	 */
	public function test_url_is_public_rejects_malformed_input() {
		$this->stub_url_helpers();

		$malformed = array( '', 'not a url', '/relative/path', 'http:///nohost' );
		foreach ( $malformed as $url ) {
			$this->assertFalse( Utils::url_is_public( $url ), 'malformed input should not be public' );
		}
	}

	/**
	 * A URL core rejects stays rejected, whatever its host resolves to.
	 */
	public function test_url_is_public_defers_to_core_validation() {
		Functions\when( 'wp_http_validate_url' )->justReturn( false );

		$this->assertFalse( Utils::url_is_public( 'http://8.8.8.8/image.jpg' ) );
	}

	/**
	 * The host checked is the one core handed back, not the one we passed in.
	 *
	 * Core returns a normalized URL, so parsing the argument instead would check a
	 * host it never approved.
	 */
	public function test_url_is_public_checks_the_url_core_returned() {
		$this->stub_url_helpers();
		Functions\when( 'wp_http_validate_url' )->justReturn( 'http://169.254.169.254/' );

		$this->assertFalse( Utils::url_is_public( 'http://8.8.8.8/image.jpg' ) );
	}

	/**
	 * `resolve_host_ips` returns IP literals as-is, after undoing the encodings a
	 * caller could hide one behind.
	 */
	public function test_resolve_host_ips_normalizes_literals() {
		$literals = array(
			'8.8.8.8'               => '8.8.8.8',
			'[::1]'                 => '::1',
			'169%2e254%2e169%2e254' => '169.254.169.254', // Percent-encoded dots.
			'fe80::1%25eth0'        => 'fe80::1',         // Encoded IPv6 zone id.
		);
		foreach ( $literals as $host => $expected ) {
			$this->assertSame( array( $expected ), Utils::resolve_host_ips( (string) $host ) );
		}
	}

	/**
	 * A '%' outside an IPv6 address is malformed, so the host resolves to nothing.
	 *
	 * Trimming it back to the prefix instead would launder a bad host into a public
	 * one, undoing the same guard ip_is_public() applies.
	 */
	public function test_resolve_host_ips_rejects_zone_id_on_non_ipv6_host() {
		$malformed = array( '8.8.8.8%foo', '8.8.8.8%25foo', 'example.com%foo' );
		foreach ( $malformed as $host ) {
			$this->assertSame( array(), Utils::resolve_host_ips( $host ), "$host should resolve to nothing" );
			$this->assertFalse( Utils::ip_is_public( $host ), "$host should not be public" );
		}
	}

	/**
	 * A host that decodes to nothing, or to bytes no host name can hold, is rejected.
	 *
	 * Reaching the lookup at all would be a fatal rather than a failed resolution:
	 * gethostbynamel() throws a ValueError on a NUL byte.
	 */
	public function test_resolve_host_ips_rejects_empty_and_control_character_hosts() {
		$malformed = array( '[]', '%00', 'example%00.com', 'exa%09mple.com', 'exa%20mple.com' );
		foreach ( $malformed as $host ) {
			$this->assertSame( array(), Utils::resolve_host_ips( $host ), "$host should resolve to nothing" );
		}
	}

	/**
	 * A URL whose host decodes to a NUL byte is rejected, not fatal.
	 */
	public function test_url_is_public_rejects_control_character_host() {
		$this->stub_url_helpers();

		$this->assertFalse( Utils::url_is_public( 'http://example%00.com/image.jpg' ) );
	}

	/**
	 * Whatever a resolver returns, the list holds valid, distinct IP addresses.
	 *
	 * The lookup needs DNS, so the assertions are on the shape of the result rather
	 * than a fixed set of addresses; with no network the list is empty and they hold
	 * trivially.
	 */
	public function test_resolve_host_ips_returns_only_valid_distinct_addresses() {
		$ips = Utils::resolve_host_ips( 'dns.google' );

		$this->assertSame( array_values( array_unique( $ips ) ), $ips );
		foreach ( $ips as $ip ) {
			$this->assertIsString( $ip );
			$this->assertNotFalse( filter_var( $ip, FILTER_VALIDATE_IP ), "$ip should be an IP address" );
		}
	}

	/**
	 * A host is public only when every address it resolves to is public.
	 *
	 * This is the whole point of the helper, and the one behaviour real DNS cannot
	 * pin down, so the answers are supplied rather than looked up.
	 */
	public function test_url_is_public_requires_every_resolved_address_to_be_public() {
		$this->stub_url_helpers();
		$this->require_aaaa_lookups();

		\Jetpack_IP_Test_Resolver::$answers = array(
			'all-public.test'    => array( 'ipv4' => array( '8.8.8.8', '1.1.1.1' ) ),
			'one-internal.test'  => array( 'ipv4' => array( '8.8.8.8', '169.254.169.254' ) ),
			'public-dual.test'   => array(
				'ipv4' => array( '8.8.8.8' ),
				'ipv6' => array( '2606:4700:4700::1111' ),
			),
			'internal-v6.test'   => array(
				'ipv4' => array( '8.8.8.8' ),
				'ipv6' => array( '2606:4700:4700::1111', 'fd00::1' ),
			),
			'only-internal.test' => array( 'ipv4' => array( '10.0.0.1' ) ),
		);

		$this->assertTrue( Utils::url_is_public( 'http://all-public.test/x' ) );
		$this->assertTrue( Utils::url_is_public( 'http://public-dual.test/x' ) );

		$this->assertFalse( Utils::url_is_public( 'http://one-internal.test/x' ), 'one internal A record rejects the host' );
		$this->assertFalse( Utils::url_is_public( 'http://internal-v6.test/x' ), 'one internal AAAA record rejects the host' );
		$this->assertFalse( Utils::url_is_public( 'http://only-internal.test/x' ) );
	}

	/**
	 * Both the A and the AAAA answers are returned, not just whichever came first.
	 */
	public function test_resolve_host_ips_returns_both_a_and_aaaa_records() {
		$this->require_aaaa_lookups();
		\Jetpack_IP_Test_Resolver::$answers = array(
			'dual.test'   => array(
				'ipv4' => array( '8.8.8.8', '8.8.4.4' ),
				'ipv6' => array( '2001:4860:4860::8888' ),
			),
			'v6only.test' => array( 'ipv6' => array( '2001:4860:4860::8888' ) ),
		);

		$this->assertSame(
			array( '8.8.8.8', '8.8.4.4', '2001:4860:4860::8888' ),
			Utils::resolve_host_ips( 'dual.test' )
		);
		$this->assertSame( array( '2001:4860:4860::8888' ), Utils::resolve_host_ips( 'v6only.test' ) );
	}

	/**
	 * Anything a resolver returns that is not an address is dropped, repeats included.
	 */
	public function test_resolve_host_ips_drops_junk_and_duplicates() {
		$this->require_aaaa_lookups();
		\Jetpack_IP_Test_Resolver::$answers = array(
			'noisy.test' => array(
				'ipv4' => array( '8.8.8.8', 'not-an-ip', '8.8.8.8', '' ),
				'ipv6' => array( '2001:4860:4860::8888', 'nonsense', '2001:4860:4860::8888' ),
			),
		);

		$this->assertSame(
			array( '8.8.8.8', '2001:4860:4860::8888' ),
			Utils::resolve_host_ips( 'noisy.test' )
		);
	}

	/**
	 * An unresolvable or empty host yields no addresses, which callers treat as unsafe.
	 */
	public function test_resolve_host_ips_returns_empty_for_unresolvable_host() {
		$this->assertSame( array(), Utils::resolve_host_ips( '' ) );
		$this->assertSame( array(), Utils::resolve_host_ips( 'jetpack-ip-test.invalid' ) );
	}

	/**
	 * Skips a test whose expectations need AAAA records.
	 *
	 * They are only looked up when ext-dns supplies dns_get_record(), and the package
	 * does not require the extension.
	 */
	private function require_aaaa_lookups() {
		if ( ! function_exists( 'dns_get_record' ) ) {
			$this->markTestSkipped( 'AAAA lookups need dns_get_record() from ext-dns.' );
		}
	}

	/**
	 * Stubs the WordPress functions `url_is_public` depends on.
	 *
	 * Core's wp_http_validate_url() is stubbed to accept everything, so each URL is
	 * judged by this package's own check alone.
	 */
	private function stub_url_helpers() {
		Functions\when( 'wp_http_validate_url' )->returnArg();
		Functions\when( 'wp_parse_url' )->alias(
			function ( $url, $component = -1 ) {
				return parse_url( $url, $component ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- This stub is what wp_parse_url() wraps.
			}
		);
	}

	/**
	 * Test `convert_ip_address`.
	 */
	public function test_convert_ip_address() {
		$converted_ip_address = Utils::convert_ip_address( '1.2.3.4' );
		$this->assertEquals( 'string', gettype( $converted_ip_address ) );
	}

	/**
	 * Test `ip_address_is_in_range`.
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
