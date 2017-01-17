<?php

// These constants can be set in wp-config.php to ensure sites behind proxies will still work.
// Setting these constants, though, is *not* the preferred method. It's better to configure
// the proxy to send the X-Forwarded-Port header.
defined( 'JETPACK_SIGNATURE__HTTP_PORT'  ) or define( 'JETPACK_SIGNATURE__HTTP_PORT' , 80  );
defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) or define( 'JETPACK_SIGNATURE__HTTPS_PORT', 443 );
defined( 'JETPACK__WPCOM_JSON_API_HOST' )  or define( 'JETPACK__WPCOM_JSON_API_HOST', 'public-api.wordpress.com' );

class Jetpack_Signature {
	public $token;
	public $secret;

	function __construct( $access_token, $time_diff = 0 ) {
		$secret = explode( '.', $access_token );
		if ( 2 != count( $secret ) )
			return;

		$this->token  = $secret[0];
		$this->secret = $secret[1];
		$this->time_diff = $time_diff;
	}

	function sign_current_request( $override = array() ) {
		if ( isset( $override['scheme'] ) ) {
			$scheme = $override['scheme'];
			if ( !in_array( $scheme, array( 'http', 'https' ) ) ) {
				return new Jetpack_Error( 'invalid_sheme', 'Invalid URL scheme' );
			}
		} else {
			if ( is_ssl() ) {
				$scheme = 'https';
			} else {
				$scheme = 'http';
			}
		}

		$host_port = isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) ? $_SERVER['HTTP_X_FORWARDED_PORT'] : $_SERVER['SERVER_PORT'];

		if ( is_ssl() ) {
			// 443: Standard Port
			// 80: Assume we're behind a proxy without X-Forwarded-Port. Hardcoding "80" here means most sites
			//     with SSL termination proxies (self-served, Cloudflare, etc.) don't need to fiddle with
			//     the JETPACK_SIGNATURE__HTTPS_PORT constant. The code also implies we can't talk to a
			//     site at https://example.com:80/ (which would be a strange configuration).
			// JETPACK_SIGNATURE__HTTPS_PORT: Set this constant in wp-config.php to the back end webserver's port
			//                                if the site is behind a proxy running on port 443 without
			//                                X-Forwarded-Port and the back end's port is *not* 80. It's better,
			//                                though, to configure the proxy to send X-Forwarded-Port.
			$port = in_array( $host_port, array( 443, 80, JETPACK_SIGNATURE__HTTPS_PORT ) ) ? '' : $host_port;
		} else {
			// 80: Standard Port
			// JETPACK_SIGNATURE__HTTPS_PORT: Set this constant in wp-config.php to the back end webserver's port
			//                                if the site is behind a proxy running on port 80 without
			//                                X-Forwarded-Port. It's better, though, to configure the proxy to
			//                                send X-Forwarded-Port.
			$port = in_array( $host_port, array( 80, JETPACK_SIGNATURE__HTTP_PORT ) ) ? '' : $host_port;
		}

		$url = "{$scheme}://{$_SERVER['HTTP_HOST']}:{$port}" . stripslashes( $_SERVER['REQUEST_URI'] );

		if ( array_key_exists( 'body', $override ) && ! empty( $override['body'] ) ) {
			$body = $override['body'];
		} else if ( 'POST' == strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			$body = isset( $GLOBALS['HTTP_RAW_POST_DATA'] ) ? $GLOBALS['HTTP_RAW_POST_DATA'] : null;

			// Convert the $_POST to the body, if the body was empty. This is how arrays are hashed
			// and encoded on the Jetpack side.
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				if ( empty( $body ) && is_array( $_POST ) && count( $_POST ) > 0 ) {
					$body = $_POST;
				}
			}

		} else {
			$body = null;
		}

		if ( empty( $body ) ) {
			$body = null;
		}

		$a = array();
		foreach ( array( 'token', 'timestamp', 'nonce', 'body-hash' ) as $parameter ) {
			if ( isset( $override[$parameter] ) ) {
				$a[$parameter] = $override[$parameter];
			} else {
				$a[$parameter] = isset( $_GET[$parameter] ) ? stripslashes( $_GET[$parameter] ) : '';
			}
		}

		$method = isset( $override['method'] ) ? $override['method'] : $_SERVER['REQUEST_METHOD'];
		return $this->sign_request( $a['token'], $a['timestamp'], $a['nonce'], $a['body-hash'], $method, $url, $body, true );
	}

	// body_hash v. body-hash is annoying.  Refactor to accept an array?
	function sign_request( $token = '', $timestamp = 0, $nonce = '', $body_hash = '', $method = '', $url = '', $body = null, $verify_body_hash = true ) {
		if ( !$this->secret ) {
			return new Jetpack_Error( 'invalid_secret', 'Invalid secret' );
		}

		if ( !$this->token ) {
			return new Jetpack_Error( 'invalid_token', 'Invalid token' );
		}

		list( $token ) = explode( '.', $token );

		if ( 0 !== strpos( $token, "$this->token:" ) ) {
			return new Jetpack_Error( 'token_mismatch', 'Incorrect token' );
		}

		// If we got an array at this point, let's encode it, so we can see what it looks like as a string.
		if ( is_array( $body ) ) {
			if ( count( $body ) > 0 ) {
				$body = json_encode( $body );

			} else {
				$body = '';
			}
		}

		$required_parameters = array( 'token', 'timestamp', 'nonce', 'method', 'url' );
		if ( !is_null( $body ) ) {
			$required_parameters[] = 'body_hash';
			if ( !is_string( $body ) ) {
				return new Jetpack_Error( 'invalid_body', 'Body is malformed.' );
			}
		}

		foreach ( $required_parameters as $required ) {
			if ( !is_scalar( $$required ) ) {
				return new Jetpack_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', str_replace( '_', '-', $required ) ) );
			}

			if ( !strlen( $$required ) ) {
				return new Jetpack_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is missing.', str_replace( '_', '-', $required ) ) );
			}
		}

		if ( empty( $body ) ) {
			if ( $body_hash ) {
				return new Jetpack_Error( 'invalid_body_hash', 'The body hash does not match.' );
			}
		} else {
			if ( $verify_body_hash && jetpack_sha1_base64( $body ) !== $body_hash ) {
				return new Jetpack_Error( 'invalid_body_hash', 'The body hash does not match.' );
			}
		}

		$parsed = parse_url( $url );
		if ( !isset( $parsed['host'] ) ) {
			return new Jetpack_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'url' ) );
		}

		if ( $parsed['host'] === JETPACK__WPCOM_JSON_API_HOST ) {
			$parsed['host'] = 'public-api.wordpress.com';
		}

		if ( !empty( $parsed['port'] ) ) {
			$port = $parsed['port'];
		} else {
			if ( 'http' == $parsed['scheme'] ) {
				$port = 80;
			} else if ( 'https' == $parsed['scheme'] ) {
				$port = 443;
			} else {
				return new Jetpack_Error( 'unknown_scheme_port', "The scheme's port is unknown" );
			}
		}

		if ( !ctype_digit( "$timestamp" ) || 10 < strlen( $timestamp ) ) { // If Jetpack is around in 275 years, you can blame mdawaffe for the bug.
			return new Jetpack_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'timestamp' ) );
		}

		$local_time = $timestamp - $this->time_diff;
		if ( $local_time < time() - 600 || $local_time > time() + 300 ) {
			return new Jetpack_Error( 'invalid_signature', 'The timestamp is too old.' );
		}

		if ( 12 < strlen( $nonce ) || preg_match( '/[^a-zA-Z0-9]/', $nonce ) ) {
			return new Jetpack_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'nonce' ) );
		}

		$normalized_request_pieces = array(
			$token,
			$timestamp,
			$nonce,
			$body_hash,
			strtoupper( $method ),
			strtolower( $parsed['host'] ),
			$port,
			$parsed['path'],
			// Normalized Query String
		);

		$normalized_request_pieces = array_merge( $normalized_request_pieces, $this->normalized_query_parameters( isset( $parsed['query'] ) ? $parsed['query'] : '' ) );

		$normalized_request_string = join( "\n", $normalized_request_pieces ) . "\n";

		return base64_encode( hash_hmac( 'sha1', $normalized_request_string, $this->secret, true ) );
	}

	function normalized_query_parameters( $query_string ) {
		parse_str( $query_string, $array );
		if ( get_magic_quotes_gpc() )
			$array = stripslashes_deep( $array );

		unset( $array['signature'] );

		$names  = array_keys( $array );
		$values = array_values( $array );

		$names  = array_map( array( $this, 'encode_3986' ), $names  );
		$values = array_map( array( $this, 'encode_3986' ), $values );

		$pairs  = array_map( array( $this, 'join_with_equal_sign' ), $names, $values );

		sort( $pairs );

		return $pairs;
	}

	function encode_3986( $string ) {
		$string = rawurlencode( $string );
		return str_replace( '%7E', '~', $string ); // prior to PHP 5.3, rawurlencode was RFC 1738
	}

	function join_with_equal_sign( $name, $value ) {
		return "{$name}={$value}";
	}
}

function jetpack_sha1_base64( $text ) {
	return base64_encode( sha1( $text, true ) );
}
