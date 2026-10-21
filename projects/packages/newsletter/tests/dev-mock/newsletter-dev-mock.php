<?php
/**
 * Plugin Name: Newsletter Dev Mock
 * Description: Local development only. Fakes a WordPress.com connection and answers WordPress.com API calls with sample data, so the newsletter screens render in Jetpack Docker without a real connection.
 * Version: 1.0.0
 * Author: Automattic
 * Text Domain: jetpack-newsletter
 *
 * @package automattic/jetpack-newsletter
 */

// phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Logging unmatched calls is the point of a dev mock.

/**
 * Store fake connection tokens, keeping whatever was there so deactivation can restore it.
 */
function newsletter_dev_mock_activate() {
	$keys   = array( 'id', 'blog_token', 'master_user', 'user_tokens' );
	$backup = array();
	foreach ( $keys as $key ) {
		$backup[ $key ] = Jetpack_Options::get_option( $key );
	}
	update_option( 'newsletter_dev_mock_backup', $backup, false );

	$user_id = get_current_user_id() ? get_current_user_id() : 1;
	Jetpack_Options::update_option( 'id', 12345678 );
	Jetpack_Options::update_option( 'blog_token', 'devmockblogtoken.devmocksecret' );
	Jetpack_Options::update_option( 'master_user', $user_id );
	Jetpack_Options::update_option( 'user_tokens', array( $user_id => "devmockusertoken.devmocksecret.$user_id" ) );
}
register_activation_hook( __FILE__, 'newsletter_dev_mock_activate' );

/**
 * Put the connection back the way it was before activation.
 */
function newsletter_dev_mock_deactivate() {
	foreach ( (array) get_option( 'newsletter_dev_mock_backup', array() ) as $key => $value ) {
		if ( false === $value || null === $value ) {
			Jetpack_Options::delete_option( $key );
		} else {
			Jetpack_Options::update_option( $key, $value );
		}
	}
	delete_option( 'newsletter_dev_mock_backup' );
}
register_deactivation_hook( __FILE__, 'newsletter_dev_mock_deactivate' );

// A localhost site is in offline mode, which stops connection-only modules (Subscriptions included) from loading.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );

/**
 * Subscriber totals for the last 30 days, rising from 10 to 45, as the dashboard widget expects.
 *
 * @return array Response body.
 */
function newsletter_dev_mock_subscriber_stats() {
	$aggregate = array();
	for ( $day = 29; $day >= 0; $day-- ) {
		$all = (int) round( 45 - $day * 35 / 29 );
		$aggregate[ gmdate( 'Y-m-d', strtotime( "-$day days" ) ) ] = array(
			'all'  => $all,
			'paid' => intdiv( $all, 6 ),
		);
	}
	return array(
		'counts'    => array(
			'email_subscribers' => 45,
			'paid_subscribers'  => 7,
			'all_subscribers'   => 45,
		),
		'aggregate' => $aggregate,
	);
}

/**
 * Answer WordPress.com API calls from sample data. Unmatched calls get a 404 and a debug.log line naming the path.
 *
 * @param false|array|WP_Error $response Short-circuit value.
 * @param array                $args     Request arguments.
 * @param string               $url      Request URL.
 * @return false|array
 */
function newsletter_dev_mock_wpcom_response( $response, $args, $url ) {
	$host = wp_parse_url( $url, PHP_URL_HOST );
	if ( ! in_array( $host, array( 'public-api.wordpress.com', 'jetpack.wordpress.com' ), true ) ) {
		return $response;
	}

	$path = (string) wp_parse_url( $url, PHP_URL_PATH );
	$body = null;
	if ( preg_match( '#/sites/\d+/subscribers/stats$#', $path ) ) {
		$body = newsletter_dev_mock_subscriber_stats();
	} else {
		$fixtures = json_decode( (string) file_get_contents( __DIR__ . '/fixtures.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file.
		foreach ( (array) $fixtures as $pattern => $fixture ) {
			if ( preg_match( '#' . $pattern . '#', $path ) ) {
				$body = $fixture;
				break;
			}
		}
	}

	static $logged = array();
	if ( null === $body && ! isset( $logged[ $path ] ) ) {
		$logged[ $path ] = true;
		error_log( "newsletter-dev-mock: no sample data for {$args['method']} $path" );
	}

	return array(
		'headers'  => array( 'content-type' => 'application/json' ),
		'body'     => wp_json_encode( null === $body ? array( 'error' => 'not_found' ) : $body, JSON_UNESCAPED_SLASHES ),
		'response' => null === $body ? array(
			'code'    => 404,
			'message' => 'Not Found',
		) : array(
			'code'    => 200,
			'message' => 'OK',
		),
		'cookies'  => array(),
		'filename' => null,
	);
}
add_filter( 'pre_http_request', 'newsletter_dev_mock_wpcom_response', 10, 3 );
