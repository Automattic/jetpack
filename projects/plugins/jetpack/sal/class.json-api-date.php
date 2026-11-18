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
		$offset        = 0;
		$timestamp_gmt = strtotime( "$date_gmt+0000" );

		if ( null === $date ) {
			$timestamp = $timestamp_gmt;
			$west      = 0;
			$minutes   = 0;
			$hours     = 0;
		} else {
			$date_time = date_create( "$date+0000" );
			if ( $date_time ) {
				$timestamp = date_format( $date_time, 'U' );
			} else {
				$timestamp = 0;
			}

			$offset = $timestamp - $timestamp_gmt;

			// Drafts have a GMT date of "0000-00-00 00:00:00" (-62169984000). Anything that writes one
			// date column without the other leaves a gap that is not a UTC offset, so neither can use it.
			if ( -62169984000 === $timestamp_gmt || ! self::is_utc_offset( $offset ) ) {
				// Keep the local date, which is the one WordPress shows, with the blog's own offset.
				$offset          = 0;
				$timezone_string = get_option( 'timezone_string' );

				if ( $timezone_string && $date_time ) {
					$timezone = timezone_open( $timezone_string );
					if ( $timezone ) {
						$offset = $timezone->getOffset( $date_time );
					}
				} else {
					$offset = 3600 * (float) get_option( 'gmt_offset' );
				}
			}

			$west    = $offset < 0;
			$offset  = abs( $offset );
			$hours   = (int) floor( $offset / 3600 );
			$offset -= $hours * 3600;
			$minutes = (int) floor( $offset / 60 );
		}

		return gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}

	/**
	 * Whether a number of seconds is a UTC offset a site can have: -12:00 to +14:00, in steps of 15 minutes.
	 *
	 * @param int $seconds Seconds east of UTC.
	 *
	 * @return bool
	 */
	private static function is_utc_offset( $seconds ) {
		return $seconds >= -12 * HOUR_IN_SECONDS
			&& $seconds <= 14 * HOUR_IN_SECONDS
			&& 0 === $seconds % ( 15 * MINUTE_IN_SECONDS );
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
