<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * WPCOM_JSON_API_Date class.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Base class for WPCOM_JSON_API_Date.
 */
class WPCOM_JSON_API_Date {
	/**
	 * Returns ISO 8601 formatted datetime: 2011-12-08T01:15:36-08:00
	 *
	 * @param string $date_gmt GMT datetime string.
	 * @param string $date Optional.  Used to calculate the offset from GMT.
	 *
	 * @return string
	 */
	public static function format_date( $date_gmt, $date = null ) {
		$timestamp_gmt = strtotime( "$date_gmt+0000" );

		if ( null === $date ) {
			return self::format( $timestamp_gmt, 0 );
		}

		$date_time = date_create( "$date+0000" );
		$timestamp = $date_time ? (int) date_format( $date_time, 'U' ) : 0;

		// Drafts have a GMT date of "0000-00-00 00:00:00" (-62169984000), so only the local date is known.
		if ( false === $timestamp_gmt || -62169984000 === $timestamp_gmt ) {
			return self::format( $timestamp, self::site_offset_at_local( $timestamp ) );
		}

		// Core writes the two dates from separate clock reads, so a real offset can be a second or two out.
		$offset = self::nearest_utc_offset( $timestamp - $timestamp_gmt );
		if ( null !== $offset ) {
			return self::format( $timestamp_gmt + $offset, $offset );
		}

		// The dates disagree. Only the GMT date pins down a moment, so print it in the site's time zone.
		$offset = self::site_offset( $timestamp_gmt );
		return self::format( $timestamp_gmt + $offset, $offset );
	}

	/**
	 * Formats a local time and its UTC offset as ISO 8601.
	 *
	 * @param int $timestamp Local time, as seconds since the epoch.
	 * @param int $offset    Seconds east of UTC.
	 *
	 * @return string
	 */
	private static function format( $timestamp, $offset ) {
		$west    = $offset < 0;
		$offset  = abs( $offset );
		$hours   = (int) floor( $offset / HOUR_IN_SECONDS );
		$minutes = (int) floor( ( $offset - $hours * HOUR_IN_SECONDS ) / MINUTE_IN_SECONDS );

		return gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}

	/**
	 * The UTC offset a gap between a local and a GMT date stands for, if it is one a site can have:
	 * -12:00 to +14:00, in steps of 15 minutes, give or take 2 seconds.
	 *
	 * @param int $seconds Local time minus GMT time.
	 *
	 * @return int|null Seconds east of UTC, or null if the gap is not a UTC offset.
	 */
	private static function nearest_utc_offset( $seconds ) {
		$step   = 15 * MINUTE_IN_SECONDS;
		$offset = (int) round( $seconds / $step ) * $step;

		if ( abs( $seconds - $offset ) > 2 || $offset < -12 * HOUR_IN_SECONDS || $offset > 14 * HOUR_IN_SECONDS ) {
			return null;
		}

		return $offset;
	}

	/**
	 * The blog's UTC offset at a moment, from its time zone or its fixed offset.
	 *
	 * @param int $timestamp_gmt Seconds since the epoch.
	 *
	 * @return int Seconds east of UTC.
	 */
	private static function site_offset( $timestamp_gmt ) {
		$timezone_string = get_option( 'timezone_string' );

		if ( $timezone_string ) {
			$timezone = timezone_open( $timezone_string );
			return $timezone ? $timezone->getOffset( date_create( "@$timestamp_gmt" ) ) : 0;
		}

		return (int) round( HOUR_IN_SECONDS * (float) get_option( 'gmt_offset' ) );
	}

	/**
	 * The blog's UTC offset for a local time, which is read as if it were GMT.
	 *
	 * @param int $timestamp Local time, as seconds since the epoch.
	 *
	 * @return int Seconds east of UTC.
	 */
	private static function site_offset_at_local( $timestamp ) {
		return self::site_offset( $timestamp - self::site_offset( $timestamp ) );
	}

	/**
	 * Returns ISO 8601 formatted duration interval: P0DT1H10M0S
	 *
	 * @param string $time Duration in minutes or hours.
	 *
	 * @return null|string
	 */
	public static function format_duration( $time ) {
		$timestamp = strtotime( $time, 0 );

		// Bail early if we don't recognize a date.
		if ( empty( $timestamp ) ) {
			return;
		}

		$days       = floor( $timestamp / 86400 );
		$timestamp %= 86400;

		$hours      = floor( $timestamp / 3600 );
		$timestamp %= 3600;

		$minutes    = floor( $timestamp / 60 );
		$timestamp %= 60;

		return sprintf(
			'P%dDT%dH%dM%dS',
			$days,
			$hours,
			$minutes,
			$timestamp
		);
	}
}
