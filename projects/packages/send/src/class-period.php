<?php
/**
 * Date ranges in the site's timezone.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Turns a preset or custom days into exact UTC bounds. All date maths happens here, in PHP:
 * the SQLite layer returns NULL for negative intervals, so SQL never shifts dates.
 */
class Period {

	/**
	 * The dashboard's preset ranges, in days; 1 is the rolling last 24 hours.
	 *
	 * @var int[]
	 */
	const PRESETS = array( 1, 7, 30, 90, 180, 365 );

	/**
	 * Resolve a range or custom days.
	 *
	 * - `range` 1 is the last 24 hours, ending with the current site-local hour.
	 * - `range` N is the last N site-local days, today included.
	 * - `start` + `end` are site-local days, both included.
	 * - An older `days` link: 1 meant today, N the last N days.
	 *
	 * @since $$next-version$$
	 *
	 * @param array    $args     `range` (int), `start` + `end` (site-local 'Y-m-d'), or `days` (int).
	 * @param int      $max_days Longest custom span; 0 for no cap.
	 * @param int|null $now      Unix time; defaults to now.
	 * @return array{range: int|null, start: string, end: string, start_utc: int, end_utc: int, days: int, unit: string}|WP_Error
	 */
	public static function resolve( array $args, $max_days = 0, $now = null ) {
		$now   = null === $now ? time() : (int) $now;
		$today = self::local( $now )->format( 'Y-m-d' );
		$start = isset( $args['start'] ) ? (string) $args['start'] : '';
		$end   = isset( $args['end'] ) ? (string) $args['end'] : '';
		if ( '' !== $start || '' !== $end ) {
			return self::custom( $start, $end, $today, (int) $max_days );
		}

		$range = (int) ( $args['range'] ?? 0 );
		if ( $range < 1 && isset( $args['days'] ) ) {
			$range = (int) $args['days'];
			// "Last 1 day" used to mean today, not the last 24 hours.
			if ( 1 === $range ) {
				return self::custom( $today, $today, $today, 0 );
			}
		}
		if ( $range < 1 ) {
			return self::error( __( 'Pick a start and an end date.', 'jetpack-send-pkg' ) );
		}

		if ( 1 === $range ) {
			$end_utc   = Stats::bucket( $now ) + HOUR_IN_SECONDS;
			$start_utc = $end_utc - DAY_IN_SECONDS;
			return array(
				'range'     => 1,
				'start'     => self::local( $start_utc )->format( 'Y-m-d' ),
				'end'       => self::local( $end_utc - 1 )->format( 'Y-m-d' ),
				'start_utc' => $start_utc,
				'end_utc'   => $end_utc,
				'days'      => 1,
				'unit'      => 'hour',
			);
		}

		$first = self::add_days( $today, 1 - $range );
		return array(
			'range'     => $range,
			'start'     => $first,
			'end'       => $today,
			'start_utc' => self::day_start( $first ),
			'end_utc'   => self::day_start( self::add_days( $today, 1 ) ),
			'days'      => $range,
			'unit'      => 'day',
		);
	}

	/**
	 * Custom days, checked.
	 *
	 * @param string $start    First day, 'Y-m-d'.
	 * @param string $end      Last day, 'Y-m-d'.
	 * @param string $today    Site-local today, 'Y-m-d'.
	 * @param int    $max_days Longest span; 0 for no cap.
	 * @return array|WP_Error
	 */
	private static function custom( $start, $end, $today, $max_days ) {
		if ( ! self::is_day( $start ) || ! self::is_day( $end ) ) {
			return self::error( __( 'Pick a start and an end date.', 'jetpack-send-pkg' ) );
		}
		if ( $end > $today ) {
			return self::error( __( 'Pick dates up to today.', 'jetpack-send-pkg' ) );
		}
		if ( $start > $end ) {
			return self::error( __( 'Pick an end date on or after the start date.', 'jetpack-send-pkg' ) );
		}

		// Count calendar days in UTC, where every day is 24 hours long.
		$days = (int) round( ( strtotime( $end . ' 00:00:00 UTC' ) - strtotime( $start . ' 00:00:00 UTC' ) ) / DAY_IN_SECONDS ) + 1;
		if ( $max_days > 0 && $days > $max_days ) {
			/* translators: %s: the longest range allowed, in days, e.g. 365. */
			return self::error( sprintf( _n( 'Pick a range of %s day or less.', 'Pick a range of %s days or less.', $max_days, 'jetpack-send-pkg' ), number_format_i18n( $max_days ) ) );
		}

		return array(
			'range'     => null,
			'start'     => $start,
			'end'       => $end,
			'start_utc' => self::day_start( $start ),
			'end_utc'   => self::day_start( self::add_days( $end, 1 ) ),
			'days'      => $days,
			// A daylight-saving day has 23 or 25 of them.
			'unit'      => 1 === $days ? 'hour' : 'day',
		);
	}

	/**
	 * Whether a value is a real day written as 'Y-m-d'.
	 *
	 * @param string $value Day.
	 * @return bool
	 */
	private static function is_day( $value ) {
		return (bool) preg_match( '/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts ) && checkdate( (int) $parts[2], (int) $parts[3], (int) $parts[1] );
	}

	/**
	 * A 'Y-m-d' day moved by whole days. The maths is on the date alone, so a daylight-saving change
	 * can't move it to the wrong day.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $day  Day, 'Y-m-d'.
	 * @param int    $days Days to add; negative goes back.
	 * @return string 'Y-m-d'.
	 */
	public static function add_days( $day, $days ) {
		return gmdate( 'Y-m-d', strtotime( $day . ' 00:00:00 UTC' ) + (int) $days * DAY_IN_SECONDS );
	}

	/**
	 * The first moment of a site-local day, as a Unix time. That's 00:00, or 01:00 where the clocks go
	 * forward at midnight that day. Where they go back from 01:00 to 00:00, midnight happens twice and
	 * this is the first one.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $day Day, 'Y-m-d'.
	 * @return int
	 */
	public static function day_start( $day ) {
		$day   = (string) $day;
		$start = \DateTimeImmutable::createFromFormat( '!Y-m-d', $day, wp_timezone() );
		if ( ! $start ) {
			return 0;
		}
		$time = $start->getTimestamp();
		// PHP can pick the second of two midnights. If an hour earlier is still the same day, use that.
		if ( self::local( $time - HOUR_IN_SECONDS )->format( 'Y-m-d' ) === $day ) {
			$time -= HOUR_IN_SECONDS;
		}
		return $time;
	}

	/**
	 * A Unix time in the site's timezone.
	 *
	 * @param int $time Unix time.
	 * @return \DateTimeImmutable
	 */
	public static function local( $time ) {
		return ( new \DateTimeImmutable( '@' . (int) $time ) )->setTimezone( wp_timezone() );
	}

	/**
	 * The site's timezone for a support report: "America/New_York, UTC-04:00", or just "UTC+00:00" when the
	 * site is set to an offset rather than a city (WordPress's default), which would print it twice.
	 *
	 * @since $$next-version$$
	 *
	 * @param \DateTimeInterface $moment A moment in the site's timezone.
	 * @return string
	 */
	public static function zone_label( \DateTimeInterface $moment ) {
		$name   = $moment->getTimezone()->getName();
		$offset = 'UTC' . $moment->format( 'P' );
		return '' === $name || in_array( $name[0], array( '+', '-' ), true ) || 'UTC' === $name ? $offset : $name . ', ' . $offset;
	}

	/**
	 * The error for a period that can't be used.
	 *
	 * @param string $message Plain message.
	 * @return WP_Error
	 */
	private static function error( $message ) {
		return new WP_Error( 'jetpack_send_bad_period', $message, array( 'status' => 400 ) );
	}
}
