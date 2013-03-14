<?php

defined( 'JETPACK_SIGNATURE__HTTP_PORT'  ) or define( 'JETPACK_SIGNATURE__HTTP_PORT' , 80  );
defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) or define( 'JETPACK_SIGNATURE__HTTPS_PORT', 443 );

class Jetpack_Signature {
	var $token;
	var $secret;

	function Jetpack_Signature( $access_token, $time_diff = 0 ) {
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

		if ( is_ssl() ) {
			$port = JETPACK_SIGNATURE__HTTPS_PORT == $_SERVER['SERVER_PORT'] ? '' : $_SERVER['SERVER_PORT'];
		} else {
			$port = JETPACK_SIGNATURE__HTTP_PORT  == $_SERVER['SERVER_PORT'] ? '' : $_SERVER['SERVER_PORT'];
		}

		$url = "{$scheme}://{$_SERVER['HTTP_HOST']}:{$port}" . stripslashes( $_SERVER['REQUEST_URI'] );

		if ( array_key_exists( 'body', $override ) && !is_null( $override['body'] ) ) {
			$body = $override['body'];
		} else if ( 'POST' == strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			$body = isset( $GLOBALS['HTTP_RAW_POST_DATA'] ) ? $GLOBALS['HTTP_RAW_POST_DATA'] : null;
		} else {
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

		if ( is_null( $body ) ) {
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

		if ( !ctype_digit( $timestamp ) || 10 < strlen( $timestamp ) ) { // If Jetpack is around in 275 years, you can blame mdawaffe for the bug.
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
