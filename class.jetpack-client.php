<?php

class Jetpack_Client {
	/**
	 * Makes an authorized remote request using Jetpack_Signature
	 *
	 * @return array|WP_Error WP HTTP response on success
	 */
	public static function remote_request( $args, $body = null ) {
		$defaults = array(
			'url' => '',
			'user_id' => 0,
			'blog_id' => 0,
			'auth_location' => JETPACK_CLIENT__AUTH_LOCATION,
			'method' => 'POST',
			'timeout' => 10,
			'redirection' => 0,
		);

		$args = wp_parse_args( $args, $defaults );

		$args['blog_id'] = (int) $args['blog_id'];

		if ( 'header' != $args['auth_location'] ) {
			$args['auth_location'] = 'query_string';
		}

		$token = Jetpack_Data::get_access_token( $args['user_id'] );
		if ( !$token ) {
			return new Jetpack_Error( 'missing_token' );
		}

		$method = strtoupper( $args['method'] );

		$timeout = intval( $args['timeout'] );

		$redirection = $args['redirection'];

		$request = compact( 'method', 'body', 'timeout', 'redirection' );

		@list( $token_key, $secret ) = explode( '.', $token->secret );
		if ( empty( $token ) || empty( $secret ) ) {
			return new Jetpack_Error( 'malformed_token' );
		}

		$token_key = sprintf( '%s:%d:%d', $token_key, JETPACK__API_VERSION, $token->external_user_id );

		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-signature.php';

		$time_diff = (int) Jetpack_Options::get_option( 'time_diff' );
		$jetpack_signature = new Jetpack_Signature( $token->secret, $time_diff );

		$timestamp = time() + $time_diff;
		$nonce = wp_generate_password( 10, false );

		// Kind of annoying.  Maybe refactor Jetpack_Signature to handle body-hashing
		if ( is_null( $body ) ) {
			$body_hash = '';
		} else {
			if ( !is_string( $body ) ) {
				return new Jetpack_Error( 'invalid_body', 'Body is malformed.' );
			}
			$body_hash = jetpack_sha1_base64( $body );
		}

		$auth = array(
			'token' => $token_key,
			'timestamp' => $timestamp,
			'nonce' => $nonce,
			'body-hash' => $body_hash,
		);

		if ( false !== strpos( $args['url'], 'xmlrpc.php' ) ) {
			$url_args = array(
				'for'           => 'jetpack',
				'wpcom_blog_id' => Jetpack_Options::get_option( 'id' ),
			);
		} else {
			$url_args = array();
		}

		if ( 'header' != $args['auth_location'] ) {
			$url_args += $auth;
		}

		$url = add_query_arg( urlencode_deep( $url_args ), $args['url'] );
		$url = Jetpack::fix_url_for_bad_hosts( $url );

		$signature = $jetpack_signature->sign_request( $token_key, $timestamp, $nonce, $body_hash, $method, $url, $body, false );

		if ( !$signature || is_wp_error( $signature ) ) {
			return $signature;
		}

		// Send an Authorization header so various caches/proxies do the right thing
		$auth['signature'] = $signature;
		$auth['version'] = JETPACK__VERSION;
		$header_pieces = array();
		foreach ( $auth as $key => $value ) {
			$header_pieces[] = sprintf( '%s="%s"', $key, $value );
		}
		$request['headers'] = array(
			'Authorization' => "X_JETPACK " . join( ' ', $header_pieces ),
		);

		if ( 'header' != $args['auth_location'] ) {
			$url = add_query_arg( 'signature', urlencode( $signature ), $url );
		}

		return Jetpack_Client::_wp_remote_request( $url, $request );
	}

	/**
	 * Wrapper for wp_remote_request().  Turns off SSL verification for certain SSL errors.
	 * This is lame, but many, many, many hosts have misconfigured SSL.
	 *
	 * When Jetpack is registered, the jetpack_fallback_no_verify_ssl_certs option is set to the current time if:
	 * 1. a certificate error is found AND
	 * 2. not verifying the certificate works around the problem.
	 *
	 * The option is checked on each request.
	 *
	 * @internal
	 * @see Jetpack::fix_url_for_bad_hosts()
	 *
	 * @return array|WP_Error WP HTTP response on success
	 */
	public static function _wp_remote_request( $url, $args, $set_fallback = false ) {
		$fallback = Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' );
		if ( false === $fallback ) {
			Jetpack_Options::update_option( 'fallback_no_verify_ssl_certs', 0 );
		}

		if ( (int) $fallback ) {
			// We're flagged to fallback
			$args['sslverify'] = false;
		}

		$response = wp_remote_request( $url, $args );

		if (
			!$set_fallback                                     // We're not allowed to set the flag on this request, so whatever happens happens
		||
			isset( $args['sslverify'] ) && !$args['sslverify'] // No verification - no point in doing it again
		||
			!is_wp_error( $response )                          // Let it ride
		) {
			Jetpack_Client::set_time_diff( $response, $set_fallback );
			return $response;
		}

		// At this point, we're not flagged to fallback and we are allowed to set the flag on this request.

		$message = $response->get_error_message();

		// Is it an SSL Certificate verification error?
		if (
			false === strpos( $message, '14090086' ) // OpenSSL SSL3 certificate error
		&&
			false === strpos( $message, '1407E086' ) // OpenSSL SSL2 certificate error
		&&
			false === strpos( $message, 'error setting certificate verify locations' ) // cURL CA bundle not found
		&&
			false === strpos( $message, 'Peer certificate cannot be authenticated with' ) // cURL CURLE_SSL_CACERT: CA bundle found, but not helpful
			                                                                              // different versions of curl have different error messages
			                                                                              // this string should catch them all
		&&
			false === strpos( $message, 'Problem with the SSL CA cert' ) // cURL CURLE_SSL_CACERT_BADFILE: probably access rights
		) {
			// No, it is not.
			return $response;
		}

		// Redo the request without SSL certificate verification.
		$args['sslverify'] = false;
		$response = wp_remote_request( $url, $args );

		if ( !is_wp_error( $response ) ) {
			// The request went through this time, flag for future fallbacks
			Jetpack_Options::update_option( 'fallback_no_verify_ssl_certs', time() );
			Jetpack_Client::set_time_diff( $response, $set_fallback );
		}

		return $response;
	}

	public static function set_time_diff( &$response, $force_set = false ) {
		$code = wp_remote_retrieve_response_code( $response );

		// Only trust the Date header on some responses
		if ( 200 != $code && 304 != $code && 400 != $code && 401 != $code ) {
			return;
		}

		if ( !$date = wp_remote_retrieve_header( $response, 'date' ) ) {
			return;
		}

		if ( 0 >= $time = (int) strtotime( $date ) ) {
			return;
		}

		$time_diff = $time - time();

		if ( $force_set ) { // during register
			Jetpack_Options::update_option( 'time_diff', $time_diff );
		} else { // otherwise
			$old_diff = Jetpack_Options::get_option( 'time_diff' );
			if ( false === $old_diff || abs( $time_diff - (int) $old_diff ) > 10 ) {
				Jetpack_Options::update_option( 'time_diff', $time_diff );
			}
		}
	}
}
