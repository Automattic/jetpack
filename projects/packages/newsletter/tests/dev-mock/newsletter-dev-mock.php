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
 * Fake a WordPress.com connection for user 1 (the Docker admin). No connection data is stored,
 * so deactivating the plugin leaves the connection exactly as it was.
 *
 * @param mixed  $value Stored value.
 * @param string $name  Option name, without the `jetpack_` prefix.
 * @return mixed
 */
function newsletter_dev_mock_connection( $value, $name ) {
	switch ( $name ) {
		case 'id':
			return 12345678;
		case 'blog_token':
			return 'devmockblogtoken.devmocksecret';
		case 'master_user':
			return 1;
		case 'user_tokens':
			return array( 1 => 'devmockusertoken.devmocksecret.1' );
	}
	return $value;
}
add_filter( 'jetpack_options', 'newsletter_dev_mock_connection', 10, 2 );

// A localhost site is in offline mode, which stops connection-only modules (Subscriptions included) from loading.
// The option covers a database where offline mode was switched on and stored.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );
add_filter( 'pre_option_jetpack_offline_mode', '__return_zero' );

// With a connection, Sync would start queueing changes in the database for a WordPress.com that isn't there.
add_filter( 'pre_option_jetpack_sync_settings_disable', '__return_true' );

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
 * @return false|array|WP_Error
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
		static $fixtures = null;
		if ( null === $fixtures ) {
			$fixtures = json_decode( (string) file_get_contents( __DIR__ . '/fixtures.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file.
			if ( ! is_array( $fixtures ) ) {
				error_log( 'newsletter-dev-mock: fixtures.json is not valid JSON: ' . json_last_error_msg() );
				$fixtures = array();
			}
			$compiled = array();
			foreach ( $fixtures as $pattern => $fixture ) {
				$regex = '#' . str_replace( '#', '\\#', $pattern ) . '#';
				if ( false === preg_match( $regex, '' ) ) {
					error_log( "newsletter-dev-mock: invalid pattern in fixtures.json: $pattern" );
					continue;
				}
				$compiled[ $regex ] = $fixture;
			}
			$fixtures = $compiled;
		}
		foreach ( $fixtures as $regex => $fixture ) {
			if ( preg_match( $regex, $path ) ) {
				$body = $fixture;
				break;
			}
		}
	}

	static $logged = array();
	$call          = "{$args['method']} $path";
	if ( null === $body && ! isset( $logged[ $call ] ) ) {
		$logged[ $call ] = true;
		error_log( "newsletter-dev-mock: no sample data for $call" );
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
