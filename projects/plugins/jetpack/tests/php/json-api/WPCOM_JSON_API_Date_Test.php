<?php
/**
 * WPCOM_JSON_API_Date unit tests.
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Date_Test
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'sal/class.json-api-date.php';

/**
 * Tests for WPCOM_JSON_API_Date.
 *
 * @covers \WPCOM_JSON_API_Date
 */
#[CoversClass( WPCOM_JSON_API_Date::class )]
class WPCOM_JSON_API_Date_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test format_date() with the site's time zone set as given.
	 *
	 * @dataProvider format_date_data
	 *
	 * @param string      $date_gmt        Stored GMT date.
	 * @param string|null $date            Stored local date.
	 * @param string      $timezone_string The site's `timezone_string` option.
	 * @param float       $gmt_offset      The site's `gmt_offset` option.
	 * @param string      $expected        The formatted date.
	 */
	#[DataProvider( 'format_date_data' )]
	public function test_format_date( $date_gmt, $date, $timezone_string, $gmt_offset, $expected ) {
		update_option( 'timezone_string', $timezone_string );
		update_option( 'gmt_offset', $gmt_offset );

		$this->assertSame( $expected, WPCOM_JSON_API_Date::format_date( $date_gmt, $date ) );
	}

	/**
	 * Data provider for test_format_date.
	 *
	 * @return array
	 */
	public static function format_date_data() {
		return array(
			'normal post'                             => array( '2026-11-16 21:45:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34-05:00' ),
			'draft, with no GMT date'                 => array( '0000-00-00 00:00:00', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34-05:00' ),
			'GMT date only'                           => array( '2011-12-08 09:15:36', null, 'America/New_York', 0, '2011-12-08T09:15:36+00:00' ),
			'dates written 1 second apart'            => array( '2026-11-15 10:12:15', '2026-11-15 14:12:14', 'Asia/Dubai', 0, '2026-11-15T14:12:15+04:00' ),
			'local date moved 4 days later'           => array( '2026-11-12 21:45:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34-05:00' ),
			'local date moved 11 days earlier'        => array( '2026-06-11 19:09:32', '2026-05-31 11:00:36', 'America/New_York', 0, '2026-06-11T15:09:32-04:00' ),
			'photo dated by its camera'               => array( '2026-06-26 09:41:56', '2008-03-17 20:52:28', 'America/Los_Angeles', 0, '2026-06-26T02:41:56-07:00' ),
			'site offset applied twice'               => array( '2009-11-28 04:02:13', '2009-11-27 12:02:13', '', -8, '2009-11-27T20:02:13-08:00' ),
			'dates written 56 seconds apart'          => array( '2026-10-12 21:11:20', '2026-10-12 22:10:24', '', 1, '2026-10-12T22:11:20+01:00' ),
			'bad gap, site has no time zone set'      => array( '2026-11-12 21:45:34', '2026-11-16 16:45:34', '', 0, '2026-11-16T16:45:34+00:00' ),
			'site changed time zone after publishing' => array( '2026-11-17 00:45:34', '2026-11-16 16:45:34', 'Europe/Berlin', 0, '2026-11-16T16:45:34-08:00' ),
			'+14:00, the largest real offset'         => array( '2026-11-16 02:45:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34+14:00' ),
			'-12:00, the smallest real offset'        => array( '2026-11-17 04:45:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34-12:00' ),
			'+05:45, a quarter-hour zone'             => array( '2026-11-16 11:00:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34+05:45' ),
			'+14:15, just past the range'             => array( '2026-11-16 02:30:34', '2026-11-16 16:45:34', 'America/New_York', 0, '2026-11-16T16:45:34-05:00' ),
			'year 1, in local mean time'              => array( '0001-01-05 07:59:17', '0001-01-05 16:05:00', 'Asia/Shanghai', 0, '0001-01-05T16:05:00+08:05' ),
		);
	}
}
