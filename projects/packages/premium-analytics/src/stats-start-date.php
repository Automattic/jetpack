<?php
/**
 * The day a site's Stats history starts, which anchors the reports' All time range.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Option caching the WPCOM registration date, keyed by the site ID it belongs to.
 *
 * @var string
 */
const WPCOM_REGISTERED_OPTION = 'jetpack_premium_analytics_wpcom_registered';

/**
 * Transient that holds off a failed lookup, so WPCOM being down costs one request an hour.
 *
 * @var string
 */
const WPCOM_REGISTERED_RETRY_TRANSIENT = 'jetpack_premium_analytics_wpcom_registered_retry';

/**
 * Configures the Stats start date script data.
 *
 * @return void
 */
function configure_stats_start_date() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_start_date_script_data', 20 );
}

/**
 * Injects the Stats start date into JetpackScriptData on the dashboard page only, since it may cost a WPCOM request.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_stats_start_date_script_data( array $data ): array {
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	$start_date = get_stats_start_date();
	if ( null === $start_date ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['stats_start_date'] = $start_date;

	return $data;
}

/**
 * The site-local day Stats counts from: the WPCOM registration date, where the Stats endpoints floor every range.
 *
 * @return string|null The day as `Y-m-d`, or null when it cannot be determined.
 */
function get_stats_start_date() {
	if ( ( new Host() )->is_wpcom_simple() ) {
		$details = function_exists( 'get_blog_details' ) ? get_blog_details( get_current_blog_id(), false ) : null;

		return to_site_day( $details->registered ?? null );
	}

	$registered = get_wpcom_registered_date();
	if ( null !== $registered ) {
		return to_site_day( $registered );
	}

	// Approximate the registration with the earliest admin or post. Erring early is harmless,
	// since the endpoints clamp an earlier start to the registration.
	$manager = new Connection_Manager();

	return method_exists( $manager, 'get_assumed_site_creation_date' )
		? to_site_day( $manager->get_assumed_site_creation_date() )
		: null;
}

/**
 * The connected site's WPCOM registration date, fetched once per site ID and kept.
 *
 * @return string|null The date as WPCOM returns it, or null when unavailable.
 */
function get_wpcom_registered_date() {
	$site_id = (int) Jetpack_Options::get_option( 'id' );
	if ( ! $site_id ) {
		return null;
	}

	// Reconnecting can give the site a new WPCOM ID, whose registration date is its own.
	$cached = get_option( WPCOM_REGISTERED_OPTION );
	if ( is_array( $cached ) && ( $cached['site_id'] ?? null ) === $site_id && is_string( $cached['registered'] ?? null ) ) {
		return $cached['registered'];
	}

	if ( false !== get_transient( WPCOM_REGISTERED_RETRY_TRANSIENT ) ) {
		return null;
	}

	$response = Client::wpcom_json_api_request_as_blog(
		sprintf( '/sites/%d?force=wpcom&options=created_at', $site_id ),
		'1.1',
		array( 'timeout' => 3 )
	);

	$body       = is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response )
		? null
		: json_decode( wp_remote_retrieve_body( $response ), true );
	$created_at = $body['options']['created_at'] ?? null;

	if ( null === to_site_day( $created_at ) ) {
		set_transient( WPCOM_REGISTERED_RETRY_TRANSIENT, 1, HOUR_IN_SECONDS );
		return null;
	}

	update_option(
		WPCOM_REGISTERED_OPTION,
		array(
			'site_id'    => $site_id,
			'registered' => $created_at,
		),
		false
	);

	return $created_at;
}

/**
 * The site-local calendar day of a date, read as UTC unless it carries an offset.
 *
 * @param mixed $date A MySQL datetime or an ISO 8601 string.
 * @return string|null The day as `Y-m-d`, or null for a missing or zero date.
 */
function to_site_day( $date ) {
	// strtotime() turns the `0000-00-00 00:00:00` sentinel into a negative timestamp.
	$timestamp = is_string( $date ) ? strtotime( $date ) : false;
	if ( false === $timestamp || $timestamp <= 0 ) {
		return null;
	}

	$day = wp_date( 'Y-m-d', $timestamp );

	return is_string( $day ) ? $day : null;
}
