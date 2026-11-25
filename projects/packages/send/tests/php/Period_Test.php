<?php
/**
 * Tests for Period.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Period
 */
#[CoversClass( Period::class )]
class Period_Test extends BaseTestCase {

	/** 2026-10-19 14:20:00 UTC. */
	const NOW = 1792419600;

	/**
	 * Use a named timezone per test.
	 *
	 * @param string $zone Timezone.
	 */
	private function zone( $zone ) {
		update_option( 'timezone_string', $zone );
		update_option( 'gmt_offset', 0 );
	}

	/**
	 * Back to UTC.
	 */
	public function tear_down() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 0 );
		parent::tear_down();
	}

	/**
	 * Presets and the first day they cover; today counts as day one.
	 *
	 * @return array[]
	 */
	public static function provide_presets() {
		return array(
			'7 days'   => array( 7, '2026-10-13' ),
			'30 days'  => array( 30, '2026-09-20' ),
			'90 days'  => array( 90, '2026-07-22' ),
			'180 days' => array( 180, '2026-04-23' ),
			'365 days' => array( 365, '2025-10-20' ),
		);
	}

	/**
	 * @dataProvider provide_presets
	 *
	 * @param int    $range Days.
	 * @param string $start First day.
	 */
	#[DataProvider( 'provide_presets' )]
	public function test_a_preset_covers_whole_site_days_ending_today( $range, $start ) {
		$this->zone( 'UTC' );

		$period = Period::resolve( array( 'range' => $range ), 0, self::NOW );

		$this->assertSame( $start, $period['start'] );
		$this->assertSame( '2026-10-19', $period['end'] );
		$this->assertSame( strtotime( $start . ' 00:00:00 UTC' ), $period['start_utc'] );
		$this->assertSame( strtotime( '2026-10-20 00:00:00 UTC' ), $period['end_utc'] );
		$this->assertSame( 'day', $period['unit'] );
	}

	/**
	 * Zones, including half-hour and quarter-hour ones, and where the rolling 24 hours end in UTC.
	 * Catches a day computed in UTC: in these zones, local midnight isn't a UTC hour.
	 *
	 * @return array[]
	 */
	public static function provide_zones() {
		return array(
			'UTC'                  => array( 'UTC', '2026-10-19 15:00:00', '2026-10-19 00:00:00' ),
			'Kolkata, +5:30'       => array( 'Asia/Kolkata', '2026-10-19 14:30:00', '2026-10-18 18:30:00' ),
			'Kathmandu, +5:45'     => array( 'Asia/Kathmandu', '2026-10-19 15:15:00', '2026-10-18 18:15:00' ),
			"St John's, -2:30 DST" => array( 'America/St_Johns', '2026-10-19 14:30:00', '2026-10-19 02:30:00' ),
			'Los Angeles, -7 DST'  => array( 'America/Los_Angeles', '2026-10-19 15:00:00', '2026-10-19 07:00:00' ),
		);
	}

	/**
	 * @dataProvider provide_zones
	 *
	 * @param string $zone     Site timezone.
	 * @param string $hour_end UTC end of the current site-local hour.
	 * @param string $midnight UTC of today's site-local midnight.
	 */
	#[DataProvider( 'provide_zones' )]
	public function test_the_last_24_hours_end_with_the_current_site_hour( $zone, $hour_end, $midnight ) {
		$this->zone( $zone );

		$rolling = Period::resolve( array( 'range' => 1 ), 0, self::NOW );
		$week    = Period::resolve( array( 'range' => 7 ), 0, self::NOW );

		$this->assertSame( strtotime( $hour_end . ' UTC' ), $rolling['end_utc'] );
		$this->assertSame( DAY_IN_SECONDS, $rolling['end_utc'] - $rolling['start_utc'] );
		$this->assertSame( 'hour', $rolling['unit'] );
		$this->assertSame( strtotime( $midnight . ' UTC' ) + DAY_IN_SECONDS, $week['end_utc'] );
	}

	public function test_the_last_24_hours_are_never_empty_just_after_midnight() {
		$this->zone( 'UTC' );

		$period = Period::resolve( array( 'range' => 1 ), 0, strtotime( '2026-10-19 00:05:00 UTC' ) );

		$this->assertSame( '2026-10-18', $period['start'] );
		$this->assertSame( '2026-10-19', $period['end'] );
		$this->assertSame( strtotime( '2026-10-18 01:00:00 UTC' ), $period['start_utc'] );
	}

	/**
	 * Daylight-saving days in Los Angeles and how many hours each has.
	 *
	 * @return array[]
	 */
	public static function provide_dst_days() {
		return array(
			'spring forward' => array( '2026-03-08', 23 ),
			'fall back'      => array( '2026-11-01', 25 ),
			'ordinary day'   => array( '2026-10-01', 24 ),
		);
	}

	/**
	 * @dataProvider provide_dst_days
	 *
	 * @param string $day   Site-local day.
	 * @param int    $hours Hours in it.
	 */
	#[DataProvider( 'provide_dst_days' )]
	public function test_one_custom_day_has_one_entry_per_local_hour( $day, $hours ) {
		$this->zone( 'America/Los_Angeles' );

		$period = Period::resolve(
			array(
				'start' => $day,
				'end'   => $day,
			),
			365,
			strtotime( '2026-12-01 12:00:00 UTC' )
		);

		$this->assertSame( 'hour', $period['unit'] );
		$this->assertSame( $hours * HOUR_IN_SECONDS, $period['end_utc'] - $period['start_utc'] );
		$this->assertNull( $period['range'] );
	}

	public function test_custom_days_run_from_local_midnight_to_the_midnight_after_the_last_day() {
		$this->zone( 'Asia/Kolkata' );

		$period = Period::resolve(
			array(
				'start' => '2026-09-01',
				'end'   => '2026-10-19',
			),
			365,
			self::NOW
		);

		$this->assertSame( strtotime( '2026-08-31 18:30:00 UTC' ), $period['start_utc'] );
		$this->assertSame( strtotime( '2026-10-19 18:30:00 UTC' ), $period['end_utc'] );
		$this->assertSame( 49, $period['days'] );
		$this->assertSame( 'day', $period['unit'] );
	}

	/**
	 * Zones whose clocks go forward at midnight, so 00:00 doesn't exist on that day and it starts at
	 * 01:00, with the day it happens, and zones that change at another time, for comparison.
	 *
	 * @return array[]
	 */
	public static function provide_midnight_changes() {
		return array(
			'Santiago, on the day'  => array( 'America/Santiago', '2026-09-06 18:00:00', '2026-09-06' ),
			'Santiago, after it'    => array( 'America/Santiago', '2026-10-19 18:00:00', '2026-10-19' ),
			'Cairo, on the day'     => array( 'Africa/Cairo', '2026-04-24 09:00:00', '2026-04-24' ),
			'Cairo, after it'       => array( 'Africa/Cairo', '2026-05-10 09:00:00', '2026-05-10' ),
			'Sydney, on the day'    => array( 'Australia/Sydney', '2026-10-04 02:00:00', '2026-10-04' ),
			'Kolkata, half an hour' => array( 'Asia/Kolkata', '2026-10-19 14:20:00', '2026-10-19' ),
			'Los Angeles'           => array( 'America/Los_Angeles', '2026-10-19 18:00:00', '2026-10-19' ),
		);
	}

	/**
	 * @dataProvider provide_midnight_changes
	 *
	 * @param string $zone  Site timezone.
	 * @param string $now   UTC now.
	 * @param string $today Site-local today.
	 */
	#[DataProvider( 'provide_midnight_changes' )]
	public function test_presets_end_at_tonights_midnight_where_clocks_change_at_midnight( $zone, $now, $today ) {
		$this->zone( $zone );
		$tomorrow = gmdate( 'Y-m-d', strtotime( $today . ' UTC' ) + DAY_IN_SECONDS );

		foreach ( array( 7, 90, 365 ) as $range ) {
			$period = Period::resolve( array( 'range' => $range ), 0, strtotime( $now . ' UTC' ) );
			$first  = gmdate( 'Y-m-d', strtotime( $today . ' UTC' ) - ( $range - 1 ) * DAY_IN_SECONDS );

			$this->assertSame( $first, $period['start'], "$range days" );
			$this->assertSame( $today, $period['end'], "$range days" );
			$this->assertSame( $range, $period['days'], "$range days" );
			// Each bound is the first moment of its day there, whichever hour that is.
			$this->assertSame( $first, Period::local( $period['start_utc'] )->format( 'Y-m-d' ), "$range days" );
			$this->assertNotSame( $first, Period::local( $period['start_utc'] - 1 )->format( 'Y-m-d' ), "$range days" );
			$this->assertSame( $tomorrow, Period::local( $period['end_utc'] )->format( 'Y-m-d' ), "$range days" );
			$this->assertSame( $today, Period::local( $period['end_utc'] - 1 )->format( 'Y-m-d' ), "$range days" );
		}
	}

	/**
	 * Single days around a change at midnight, and how many hours each has.
	 *
	 * @return array[]
	 */
	public static function provide_midnight_change_days() {
		return array(
			'Santiago, clocks forward' => array( 'America/Santiago', '2026-09-06', '2026-09-06 04:00:00', 23 ),
			'Santiago, the day before' => array( 'America/Santiago', '2026-09-05', '2026-09-05 04:00:00', 24 ),
			'Santiago, clocks back'    => array( 'America/Santiago', '2026-04-04', '2026-04-04 03:00:00', 25 ),
			'Cairo, clocks forward'    => array( 'Africa/Cairo', '2026-04-24', '2026-04-23 22:00:00', 23 ),
			'Cairo, clocks back'       => array( 'Africa/Cairo', '2026-10-29', '2026-10-28 21:00:00', 25 ),
			'Havana, back at 1 am'     => array( 'America/Havana', '2026-11-01', '2026-11-01 04:00:00', 25 ),
			'Amman, back at 1 am'      => array( 'Asia/Amman', '2021-10-29', '2021-10-28 21:00:00', 25 ),
			'Amman, the day before'    => array( 'Asia/Amman', '2021-10-28', '2021-10-27 21:00:00', 24 ),
			'Sydney, forward at 2 am'  => array( 'Australia/Sydney', '2026-10-04', '2026-10-03 14:00:00', 23 ),
		);
	}

	/**
	 * @dataProvider provide_midnight_change_days
	 *
	 * @param string $zone  Site timezone.
	 * @param string $day   Site-local day.
	 * @param string $start UTC of its first moment.
	 * @param int    $hours Hours in it.
	 */
	#[DataProvider( 'provide_midnight_change_days' )]
	public function test_one_day_around_a_midnight_change_has_its_real_hours( $zone, $day, $start, $hours ) {
		$this->zone( $zone );

		$period = Period::resolve(
			array(
				'start' => $day,
				'end'   => $day,
			),
			365,
			strtotime( '2026-12-01 12:00:00 UTC' )
		);

		$this->assertSame( 'hour', $period['unit'] );
		$this->assertSame( strtotime( $start . ' UTC' ), $period['start_utc'] );
		$this->assertSame( $hours * HOUR_IN_SECONDS, $period['end_utc'] - $period['start_utc'] );
	}

	/**
	 * Custom ranges in Santiago that end on the day the clocks go forward, and after it.
	 *
	 * @return array[]
	 */
	public static function provide_ranges_across_a_midnight_change() {
		return array(
			'ending on it'   => array( '2026-09-01', '2026-09-06', 6, '2026-09-07 03:00:00' ),
			'ending after'   => array( '2026-09-01', '2026-10-19', 49, '2026-10-20 03:00:00' ),
			'starting on it' => array( '2026-09-06', '2026-09-10', 5, '2026-09-11 03:00:00' ),
		);
	}

	/**
	 * @dataProvider provide_ranges_across_a_midnight_change
	 *
	 * @param string $start   First day.
	 * @param string $end     Last day.
	 * @param int    $days    Days in it.
	 * @param string $end_utc UTC of the midnight after the last day.
	 */
	#[DataProvider( 'provide_ranges_across_a_midnight_change' )]
	public function test_custom_days_across_a_midnight_change_end_on_the_last_day( $start, $end, $days, $end_utc ) {
		$this->zone( 'America/Santiago' );

		$period = Period::resolve(
			array(
				'start' => $start,
				'end'   => $end,
			),
			365,
			strtotime( '2026-10-19 18:00:00 UTC' )
		);

		$this->assertSame( $days, $period['days'] );
		$this->assertSame( $end, $period['end'] );
		$this->assertSame( strtotime( $end_utc . ' UTC' ), $period['end_utc'] );
		$this->assertSame( $start, Period::local( $period['start_utc'] )->format( 'Y-m-d' ) );
	}

	/**
	 * Whole days moved on dates alone, across both of Santiago's changes and a leap day.
	 *
	 * @return array[]
	 */
	public static function provide_day_moves() {
		return array(
			'onto the change'   => array( '2026-09-05', 1, '2026-09-06' ),
			'past the change'   => array( '2026-09-06', 1, '2026-09-07' ),
			'back over it'      => array( '2026-10-19', -89, '2026-07-22' ),
			'a leap day'        => array( '2028-02-28', 1, '2028-02-29' ),
			'into the new year' => array( '2026-12-31', 1, '2027-01-01' ),
		);
	}

	/**
	 * @dataProvider provide_day_moves
	 *
	 * @param string $day   Day.
	 * @param int    $days  Days to move.
	 * @param string $moved Expected day.
	 */
	#[DataProvider( 'provide_day_moves' )]
	public function test_add_days_moves_whole_days_whatever_the_zone( $day, $days, $moved ) {
		$this->zone( 'America/Santiago' );

		$this->assertSame( $moved, Period::add_days( $day, $days ) );
	}

	/**
	 * Old `days` links: 1 meant today, not the last 24 hours.
	 *
	 * @return array[]
	 */
	public static function provide_old_days() {
		return array(
			'today'       => array( 1, '2026-10-19', null, 'hour' ),
			'last 7 days' => array( 7, '2026-10-13', 7, 'day' ),
		);
	}

	/**
	 * @dataProvider provide_old_days
	 *
	 * @param int      $days  The old `days` value.
	 * @param string   $start First day.
	 * @param int|null $range The range it became.
	 * @param string   $unit  Bars.
	 */
	#[DataProvider( 'provide_old_days' )]
	public function test_old_days_links_keep_their_meaning( $days, $start, $range, $unit ) {
		$this->zone( 'UTC' );

		$period = Period::resolve( array( 'days' => $days ), 0, self::NOW );

		$this->assertSame( $start, $period['start'] );
		$this->assertSame( '2026-10-19', $period['end'] );
		$this->assertSame( $range, $period['range'] );
		$this->assertSame( $unit, $period['unit'] );
	}

	/**
	 * Periods that can't be used, and the plain message each gets.
	 *
	 * @return array[]
	 */
	public static function provide_bad_periods() {
		return array(
			'end before start' => array(
				array(
					'start' => '2026-10-10',
					'end'   => '2026-10-01',
				),
				'Pick an end date on or after the start date.',
			),
			'end after today'  => array(
				array(
					'start' => '2026-10-10',
					'end'   => '2026-10-20',
				),
				'Pick dates up to today.',
			),
			'over 365 days'    => array(
				array(
					'start' => '2025-10-01',
					'end'   => '2026-10-19',
				),
				'Pick a range of 365 days or less.',
			),
			'not a real day'   => array(
				array(
					'start' => '2026-02-30',
					'end'   => '2026-03-01',
				),
				'Pick a start and an end date.',
			),
			'only a start'     => array( array( 'start' => '2026-10-01' ), 'Pick a start and an end date.' ),
			'no range'         => array( array(), 'Pick a start and an end date.' ),
		);
	}

	/**
	 * @dataProvider provide_bad_periods
	 *
	 * @param array  $args    Args.
	 * @param string $message Expected message.
	 */
	#[DataProvider( 'provide_bad_periods' )]
	public function test_unusable_periods_say_what_to_pick( array $args, $message ) {
		$this->zone( 'UTC' );

		$error = Period::resolve( $args, 365, self::NOW );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'jetpack_send_bad_period', $error->get_error_code() );
		$this->assertSame( $message, $error->get_error_message() );
		$this->assertSame( 400, $error->get_error_data()['status'] );
	}

	public function test_the_log_takes_any_span_of_custom_days() {
		$this->zone( 'UTC' );

		$period = Period::resolve(
			array(
				'start' => '2020-01-01',
				'end'   => '2026-10-19',
			),
			0,
			self::NOW
		);

		$this->assertSame( 'day', $period['unit'] );
		$this->assertGreaterThan( 365, $period['days'] );
	}

	/**
	 * Zones and how a support report names them.
	 *
	 * @return array[]
	 */
	public static function provide_zone_labels() {
		return array(
			'a city'            => array( 'America/New_York', 0, 'America/New_York, UTC-04:00' ),
			'an offset'         => array( '', 0, 'UTC+00:00' ),
			'a non-zero offset' => array( '', 5.5, 'UTC+05:30' ),
		);
	}

	/**
	 * @dataProvider provide_zone_labels
	 *
	 * @param string $zone   timezone_string.
	 * @param float  $offset gmt_offset.
	 * @param string $label  Expected label.
	 */
	#[DataProvider( 'provide_zone_labels' )]
	public function test_zone_label_names_the_offset_once( $zone, $offset, $label ) {
		update_option( 'timezone_string', $zone );
		update_option( 'gmt_offset', $offset );

		$this->assertSame( $label, Period::zone_label( Period::local( strtotime( '2026-10-19 18:14:03 UTC' ) ) ) );
	}
}
