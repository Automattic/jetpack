<?php
/**
 * Tests for the Brute force protection shared functions.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Shared_Functions;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Brute force protection shared functions test case.
 */
class BruteForceProtectionSharedFunctionsTest extends WorDBless\BaseTestCase {

	/**
	 * Clean up each test.
	 */
	public function tearDown(): void {
		delete_option( 'jetpack_waf_ip_allow_list' );

		parent::tearDown();
	}

	/**
	 * Test that each allow list entry type survives a save and read.
	 *
	 * @dataProvider provide_allow_list_entries
	 *
	 * @param string $entry     The entry as typed.
	 * @param string $stored    The entry as saved to the option.
	 * @param string $formatted The entry as shown in the settings.
	 */
	#[DataProvider( 'provide_allow_list_entries' )]
	public function test_save_allow_list_round_trips_entry( $entry, $stored, $formatted ) {
		$this->assertTrue( Brute_Force_Protection_Shared_Functions::save_allow_list( array( $entry ) ) );
		$this->assertSame( $stored, get_option( 'jetpack_waf_ip_allow_list' ) );
		$this->assertSame( array( $formatted ), Brute_Force_Protection_Shared_Functions::format_allow_list()['local'] );
	}

	/**
	 * Data provider for test_save_allow_list_round_trips_entry.
	 *
	 * @return array
	 */
	public static function provide_allow_list_entries() {
		return array(
			'single IP'    => array( '1.1.1.1', '1.1.1.1', '1.1.1.1' ),
			'hyphen range' => array( '1.1.1.1 - 1.1.1.9', '1.1.1.1-1.1.1.9', '1.1.1.1 - 1.1.1.9' ),
			'IPv4 CIDR'    => array( '192.168.0.0/24', '192.168.0.0/24', '192.168.0.0/24' ),
			'IPv6 CIDR'    => array( '2001:db8::/32', '2001:db8::/32', '2001:db8::/32' ),
		);
	}

	/**
	 * Test that a malformed CIDR entry is rejected.
	 */
	public function test_save_allow_list_rejects_invalid_cidr() {
		$this->assertInstanceOf( WP_Error::class, Brute_Force_Protection_Shared_Functions::save_allow_list( array( '192.168.0.0/33' ) ) );
	}
}
