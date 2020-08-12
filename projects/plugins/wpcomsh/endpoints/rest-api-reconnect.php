<?php

define( 'JETPACK_RECONNECT_PUBLIC_KEY', <<<ENCODED_DER
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA48l7CRRCFL8ec1B1YgA3
qpUrF9xg0OHGg6EX/gK0GBf/qgswPeetctCsKHq+1+PHT+nFLyIFm1hOZlJjOj3u
wH2AuPZSPebUTVweAm/UIXBeqAohdopOhlQwx8UtdQGR4y/DqjCGyuFnAjxIy33D
5QA8o0nLszioxtLBZXSEeKNrmSkPckiKqhQZuWcuJ+7Z/dCwuqz5DcKpZP3jrf1h
7v52HqycYIW85o/EYpZUNOCOMWADoAxaCBHzI8NyX6KctcjvwCPjqUpWN24Jeq0L
/BTn8wnBIT3Pu8dW60ZkpjK/X50yw0R6tzceq6YJQs8blVlzKchUZoPbWL5stiVc
ywIDAQAB
-----END PUBLIC KEY-----
ENCODED_DER
);


function unpack_jetpack_reconnect_data( $data ) {
	return json_decode( base64_decode( $data ) );
}

function verify_jetpack_reconnect_data( $data, $sig ) {
	if ( ! openssl_verify( $data, base64_decode( $sig ),
		JETPACK_RECONNECT_PUBLIC_KEY, OPENSSL_ALGO_SHA256 ) ) {
		return new WP_Error( 'verify_jetpack_reconnect_data_error', openssl_error_string() );
	}
	return true;
}

/**
 * Restore site's Jetpack connection.
 *
 * Response is a JSON object with following fields:
 *
 * @param WP_REST_Request $request
 * @return WP_Error|WP_REST_Response
 */
function wpcomsh_rest_api_reconnect( $request = null ) {
	$package = $_POST['package'];
	$package_sig = $_POST['sig'];
	$package_ts = $_POST['ts'];

	if ( empty( $package ) ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package missing',
		), 400);
	}
	if ( empty( $package_sig ) ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package signature missing',
		), 400);
	}
	if ( empty( $package_ts ) ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package timestamp missing',
		), 400);
	} else if ( abs( time() - intval( $package_ts ) ) > 300 ) {
		// signature timestamp must be within 5min of current time
		return new WP_REST_Response( array(
			'error' => 'reconnect package timestamp invalid',
		), 400);
	}

	$verified = verify_jetpack_reconnect_data( $package, $package_sig );
	if ( is_wp_error( $verified ) ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package signature invalid',
		), 400);
	}

	$package = unpack_jetpack_reconnect_data( $package );
	if ( ! $package ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package invalid',
		), 400);
	}

	$_blog_id = (int) Jetpack_Options::get_option( 'id' );
	if ( $_blog_id != $package->blog_id ) {
		return new WP_REST_Response( array(
			'error' => 'reconnect package blog_id invalid',
		), 400);
	}

	// restore blog_token if necessary
	if ( isset( $package->blog_token ) ) {
		Jetpack_Options::update_option( 'blog_token', $package->blog_token );
	}

	// restore user_tokens if missing
	if ( isset( $package->user_tokens ) ) {
		$user_tokens = [];
		foreach ( $package->user_tokens as $user_id => $user_token ) {
			$user_tokens[intval($user_id)] = $user_token;
		}
		Jetpack_Options::update_option( 'user_tokens', $user_tokens );
	}

	return new WP_REST_Response( [
		'reconnected' => true,
	], 200);
}

// Declare privileages this plugin needs
function wpcomsh_rest_api_reconnect_permission_callback() {
	return true; // current_user_can( 'export' );
}

/**
 * Initialize API
 */
function wpcomsh_rest_api_reconnect_init() {
	register_rest_route( 'wpcomsh/v1', '/reconnect',
		array(
			array(
				'methods' => 'POST',
				'callback' => 'wpcomsh_rest_api_reconnect',
				'permission_callback' => '__return_true',
			)
		)
	);
}
