<?php
/**
 * Plugin Name: WPCOM Request Tracker
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter( 'pre_http_request', 'e2e_intercept_wpcom_request', -999, 3 );

/**
 * Intercept WPCOM request.
 *
 * @param false|array|WP_Error $return result.
 * @param array                $_parsed_args not used.
 * @param string               $url request URL.
 */
function e2e_intercept_wpcom_request( $return, $_parsed_args, $url ) {
	$url_host = wp_parse_url( $url, PHP_URL_HOST );

	if ( 'public-api.wordpress.com' === $url_host ) {
		$transient_name  = 'wpcom_request_counter';
		$transient_value = get_transient( $transient_name );
		if ( false === $transient_value ) {
			$transient_value = 1;
		} else {
			++$transient_value;
		}
		set_transient( $transient_name, $transient_value );
	}

	return $return;
}
