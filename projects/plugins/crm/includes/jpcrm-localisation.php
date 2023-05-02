<?php
/**
 * 
 * Herein lie various functions designed to make localisation easier.
 * 
 */

// prevent direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

/**
 * Creates a timezone-aware datetime string
 * 
 * @param int Unix timestamp
 * @param string DateTime formatting string (e.g. 'Y-m-d H:i')
 * 
 * @return string formatted datetime string
 */
function jpcrm_uts_to_datetime_str( $timestamp, $format=false ) {

	if ( $timestamp === '' ) {
		return false;
	}
	// default to WP format
	if ( !$format ) {
		$format = get_option('date_format') . ' ' . get_option('time_format');
	}

	// create DateTime object from UTS
	$date_obj = new DateTime( '@'.$timestamp );

	//something's wrong, so abort
	if ( !$date_obj ) {
		return false;
	}

	// set timezone for object
	$date_obj->setTimezone( new DateTimeZone( wp_timezone_string() ) );

	// return formatted string
	return $date_obj->format( $format );

}

/**
 * Creates a timezone-aware date string
 * This is a wrapper of jpcrm_uts_to_datetime_str()
 * 
 * @param int Unix timestamp
 * @param string DateTime formatting string (e.g. 'Y-m-d')
 * 
 * @return string formatted date string
 */
function jpcrm_uts_to_date_str( $timestamp, $format=false ) {

	// default to WP format
	if ( !$format ) {
		$format = get_option('date_format');
	}

	return jpcrm_uts_to_datetime_str( $timestamp, $format );

}

/**
 * Creates a timezone-aware time string
 * This is a wrapper of jpcrm_uts_to_datetime_str()
 * 
 * @param int Unix timestamp
 * @param string DateTime formatting string (e.g. 'H:i')
 * 
 * @return string formatted time string
 */
function jpcrm_uts_to_time_str( $timestamp, $format=false ) {

	// default to WP format
	if ( !$format ) {
		$format = get_option('time_format');
	}

	return jpcrm_uts_to_datetime_str( $timestamp, $format );

}


/**
 * Creates a UTS from a date time string
 * 
 * @param string string containing date and time (in WP timezone)
 * @param string DateTime formatting string (e.g. 'Y-m-d H:i')
 * 
 * @return int $uts
 */
function jpcrm_datetime_str_to_uts( $datetime_str, $format=false ) {

	// default to ISO
	if ( !$format ) {
		$format = 'Y-m-d H:i';
	}

	// create DateTime object from string
	$date_obj = DateTime::createFromFormat( $format, $datetime_str, new DateTimeZone( wp_timezone_string() ) );

	//something's wrong, so abort
	if ( !$date_obj ) {
		return false;
	}

	return $date_obj->getTimestamp();
}

/**
 * Creates a UTS from two POST keys (e.g. 'somefield_datepart' and 'somefield_timepart')
 * 
 * @param string POST key prefix (e.g. 'somefield')
 * @param string DateTime formatting string (e.g. 'Y-m-d H:i')
 * 
 * @return int $uts
 */
function jpcrm_datetime_post_keys_to_uts( $post_key, $format=false ) {
	$datepart = empty( $_POST[$post_key . '_datepart'] ) ? '' : sanitize_text_field( $_POST[$post_key . '_datepart'] );

	// if no time, default to midnight
	$timepart = empty( $_POST[$post_key . '_timepart'] ) ? '0:00' : sanitize_text_field( $_POST[$post_key . '_timepart'] );

	// return the UTS if possible
	if ( !empty( $datepart ) ) {
		return jpcrm_datetime_str_to_uts( $datepart . ' ' . $timepart );
	}

	return false;
}

/**
 * Creates a UTS from a WP-formatted date time string
 * This is a wrapper of jpcrm_datetime_str_to_uts()
 * 
 * @param string string containing date and time (in WP timezone)
 * 
 * @return int $uts
 */
function jpcrm_datetime_str_wp_format_to_uts( $datetime_str ) {
	// use WP format
	$format = get_option('date_format') . ' ' . get_option('time_format');
	return jpcrm_datetime_str_to_uts( $datetime_str, $format );
}

/**
 * Creates a UTS from a date string (midnight timestamp)
 * This is a wrapper of jpcrm_datetime_str_to_uts()
 * 
 * @param string string containing date (in WP timezone)
 * @param string DateTime formatting string (e.g. 'Y-m-d')
 * 
 * @return int $uts
 */
function jpcrm_date_str_to_uts( $date_str, $format=false ) {
	if ( !$format ) {
		// Using ! ensures object is created with midnight timestamp instead of system time
		$format = '!Y-m-d';
	}

	return jpcrm_datetime_str_to_uts( $date_str, $format );
}

/**
 * Creates a UTS from a WP-formatted date string
 * This is a wrapper of jpcrm_datetime_str_to_uts()
 * 
 * @param string string containing date (in WP timezone)
 * @param string DateTime formatting string (e.g. 'Y-m-d')
 * 
 * @return int $uts
 */
function jpcrm_date_str_wp_format_to_uts( $date_str ) {
	// use WP format
	$format = '!' . get_option('date_format');
	return jpcrm_datetime_str_to_uts( $date_str, $format );
}

/**
 * Returns WP timezone offset string (e.g. -10:00)
 * 
 * @return string timezone offset string
 */
function jpcrm_get_wp_timezone_offset() {
	$date_obj = new DateTime();
	$date_obj->setTimezone( new DateTimeZone( wp_timezone_string() ) );
	return $date_obj->format( 'P' );
}

/**
 * Returns WP timezone offset string in seconds (e.g. -3600 for -1h)
 * 
 * @return string timezone offset string
 */
function jpcrm_get_wp_timezone_offset_in_seconds() {
	$date_obj = new DateTime();
	$date_obj->setTimezone( new DateTimeZone( wp_timezone_string() ) );
	return $date_obj->format( 'Z' );
}