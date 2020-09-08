<?php
/**
 * The Jetpack Connection signature class file.
 *
 * @package automattic/jetpack-connection
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * The Jetpack Connection signature class that is used to sign requests.
 */
class Jetpack_Signature {
	/**
	 * Token part of the access token.
	 *
	 * @access public
	 * @var string
	 */
	public $token;

	/**
	 * Access token secret.
	 *
	 * @access public
	 * @var string
	 */
	public $secret;

	/**
	 * The current request URL.
	 *
	 * @access public
	 * @var string
	 */
	public $current_request_url;

	/**
	 * Constructor.
	 *
	 * @param array $access_token Access token.
	 * @param int   $time_diff    Timezone difference (in seconds).
	 */
	public function __construct( $access_token, $time_diff = 0 ) {
		$secret = explode( '.', $access_token );
		if ( 2 !== count( $secret ) ) {
			return;
		}

		$this->token     = $secret[0];
		$this->secret    = $secret[1];
		$this->time_diff = $time_diff;
	}

	/**
	 * Sign the current request.
	 *
	 * @todo Implement a proper nonce verification.
	 *
	 * @param array $override Optional arguments to override the ones from the current request.
	 * @return string|WP_Error Request signature, or a WP_Error on failure.
	 */
	public function sign_current_request( $override = array() ) {
		if ( isset( $override['scheme'] ) ) {
			$scheme = $override['scheme'];
			if ( ! in_array( $scheme, array( 'http', 'https' ), true ) ) {
				return new WP_Error( 'invalid_scheme', 'Invalid URL scheme' );
			}
		} else {
			if ( is_ssl() ) {
				$scheme = 'https';
			} else {
				$scheme = 'http';
			}
		}

		$host_port = isset( $_SERVER['HTTP_X_FORWARDED_PORT'] ) ? $_SERVER['HTTP_X_FORWARDED_PORT'] : $_SERVER['SERVER_PORT'];
		$host_port = intval( $host_port );

		/**
		 * Note: This port logic is tested in the Jetpack_Cxn_Tests->test__server_port_value() test.
		 * Please update the test if any changes are made in this logic.
		 */
		if ( is_ssl() ) {
			// 443: Standard Port
			// 80: Assume we're behind a proxy without X-Forwarded-Port. Hardcoding "80" here means most sites
			// with SSL termination proxies (self-served, Cloudflare, etc.) don't need to fiddle with
			// the JETPACK_SIGNATURE__HTTPS_PORT constant. The code also implies we can't talk to a
			// site at https://example.com:80/ (which would be a strange configuration).
			// JETPACK_SIGNATURE__HTTPS_PORT: Set this constant in wp-config.php to the back end webserver's port
			// if the site is behind a proxy running on port 443 without
			// X-Forwarded-Port and the back end's port is *not* 80. It's better,
			// though, to configure the proxy to send X-Forwarded-Port.
			$https_port = defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) ? JETPACK_SIGNATURE__HTTPS_PORT : 443;
			$port       = in_array( $host_port, array( 443, 80, $https_port ), false ) ? '' : $host_port; // phpcs:ignore WordPress.PHP.StrictInArray.FoundNonStrictFalse
		} else {
			// 80: Standard Port
			// JETPACK_SIGNATURE__HTTPS_PORT: Set this constant in wp-config.php to the back end webserver's port
			// if the site is behind a proxy running on port 80 without
			// X-Forwarded-Port. It's better, though, to configure the proxy to
			// send X-Forwarded-Port.
			$http_port = defined( 'JETPACK_SIGNATURE__HTTP_PORT' ) ? JETPACK_SIGNATURE__HTTP_PORT : 80;
			$port      = in_array( $host_port, array( 80, $http_port ), false ) ? '' : $host_port; // phpcs:ignore WordPress.PHP.StrictInArray.FoundNonStrictFalse
		}

		$this->current_request_url = "{$scheme}://{$_SERVER['HTTP_HOST']}:{$port}" . stripslashes( $_SERVER['REQUEST_URI'] );

		if ( array_key_exists( 'body', $override ) && ! empty( $override['body'] ) ) {
			$body = $override['body'];
		} elseif ( 'POST' === strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			$body = isset( $GLOBALS['HTTP_RAW_POST_DATA'] ) ? $GLOBALS['HTTP_RAW_POST_DATA'] : null;

			// Convert the $_POST to the body, if the body was empty. This is how arrays are hashed
			// and encoded on the Jetpack side.
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing
				if ( empty( $body ) && is_array( $_POST ) && count( $_POST ) > 0 ) {
					$body = $_POST; // phpcs:ignore WordPress.Security.NonceVerification.Missing
				}
			}
		} elseif ( 'PUT' === strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			// This is a little strange-looking, but there doesn't seem to be another way to get the PUT body.
			$raw_put_data = file_get_contents( 'php://input' );
			parse_str( $raw_put_data, $body );

			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$put_data = json_decode( $raw_put_data, true );
				if ( is_array( $put_data ) && count( $put_data ) > 0 ) {
					$body = $put_data;
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
			if ( isset( $override[ $parameter ] ) ) {
				$a[ $parameter ] = $override[ $parameter ];
			} else {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$a[ $parameter ] = isset( $_GET[ $parameter ] ) ? stripslashes( $_GET[ $parameter ] ) : '';
			}
		}

		$method = isset( $override['method'] ) ? $override['method'] : $_SERVER['REQUEST_METHOD'];
		return $this->sign_request( $a['token'], $a['timestamp'], $a['nonce'], $a['body-hash'], $method, $this->current_request_url, $body, true );
	}

	/**
	 * Sign a specified request.
	 *
	 * @todo Having body_hash v. body-hash is annoying. Refactor to accept an array?
	 * @todo Use wp_json_encode() instead of json_encode()?
	 *
	 * @param string $token            Request token.
	 * @param int    $timestamp        Timestamp of the request.
	 * @param string $nonce            Request nonce.
	 * @param string $body_hash        Request body hash.
	 * @param string $method           Request method.
	 * @param string $url              Request URL.
	 * @param mixed  $body             Request body.
	 * @param bool   $verify_body_hash Whether to verify the body hash against the body.
	 * @return string|WP_Error Request signature, or a WP_Error on failure.
	 */
	public function sign_request( $token = '', $timestamp = 0, $nonce = '', $body_hash = '', $method = '', $url = '', $body = null, $verify_body_hash = true ) {
		if ( ! $this->secret ) {
			return new WP_Error( 'invalid_secret', 'Invalid secret' );
		}

		if ( ! $this->token ) {
			return new WP_Error( 'invalid_token', 'Invalid token' );
		}

		list( $token ) = explode( '.', $token );

		$signature_details = compact( 'token', 'timestamp', 'nonce', 'body_hash', 'method', 'url' );

		if ( 0 !== strpos( $token, "$this->token:" ) ) {
			return new WP_Error( 'token_mismatch', 'Incorrect token', compact( 'signature_details' ) );
		}

		// If we got an array at this point, let's encode it, so we can see what it looks like as a string.
		if ( is_array( $body ) ) {
			if ( count( $body ) > 0 ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
				$body = json_encode( $body );

			} else {
				$body = '';
			}
		}

		$required_parameters = array( 'token', 'timestamp', 'nonce', 'method', 'url' );
		if ( ! is_null( $body ) ) {
			$required_parameters[] = 'body_hash';
			if ( ! is_string( $body ) ) {
				return new WP_Error( 'invalid_body', 'Body is malformed.', compact( 'signature_details' ) );
			}
		}

		foreach ( $required_parameters as $required ) {
			if ( ! is_scalar( $$required ) ) {
				return new WP_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', str_replace( '_', '-', $required ) ), compact( 'signature_details' ) );
			}

			if ( ! strlen( $$required ) ) {
				return new WP_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is missing.', str_replace( '_', '-', $required ) ), compact( 'signature_details' ) );
			}
		}

		if ( empty( $body ) ) {
			if ( $body_hash ) {
				return new WP_Error( 'invalid_body_hash', 'Invalid body hash for empty body.', compact( 'signature_details' ) );
			}
		} else {
			$connection = new Connection_Manager();
			if ( $verify_body_hash && $connection->sha1_base64( $body ) !== $body_hash ) {
				return new WP_Error( 'invalid_body_hash', 'The body hash does not match.', compact( 'signature_details' ) );
			}
		}

		$parsed = wp_parse_url( $url );
		if ( ! isset( $parsed['host'] ) ) {
			return new WP_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'url' ), compact( 'signature_details' ) );
		}

		if ( ! empty( $parsed['port'] ) ) {
			$port = $parsed['port'];
		} else {
			if ( 'http' === $parsed['scheme'] ) {
				$port = 80;
			} elseif ( 'https' === $parsed['scheme'] ) {
				$port = 443;
			} else {
				return new WP_Error( 'unknown_scheme_port', "The scheme's port is unknown", compact( 'signature_details' ) );
			}
		}

		if ( ! ctype_digit( "$timestamp" ) || 10 < strlen( $timestamp ) ) { // If Jetpack is around in 275 years, you can blame mdawaffe for the bug.
			return new WP_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'timestamp' ), compact( 'signature_details' ) );
		}

		$local_time = $timestamp - $this->time_diff;
		if ( $local_time < time() - 600 || $local_time > time() + 300 ) {
			return new WP_Error( 'invalid_signature', 'The timestamp is too old.', compact( 'signature_details' ) );
		}

		if ( 12 < strlen( $nonce ) || preg_match( '/[^a-zA-Z0-9]/', $nonce ) ) {
			return new WP_Error( 'invalid_signature', sprintf( 'The required "%s" parameter is malformed.', 'nonce' ), compact( 'signature_details' ) );
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
			// Normalized Query String.
		);

		$normalized_request_pieces      = array_merge( $normalized_request_pieces, $this->normalized_query_parameters( isset( $parsed['query'] ) ? $parsed['query'] : '' ) );
		$flat_normalized_request_pieces = array();
		foreach ( $normalized_request_pieces as $piece ) {
			if ( is_array( $piece ) ) {
				foreach ( $piece as $subpiece ) {
					$flat_normalized_request_pieces[] = $subpiece;
				}
			} else {
				$flat_normalized_request_pieces[] = $piece;
			}
		}
		$normalized_request_pieces = $flat_normalized_request_pieces;

		$normalized_request_string = join( "\n", $normalized_request_pieces ) . "\n";

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return base64_encode( hash_hmac( 'sha1', $normalized_request_string, $this->secret, true ) );
	}

	/**
	 * Retrieve and normalize the parameters from a query string.
	 *
	 * @param string $query_string Query string.
	 * @return array Normalized query string parameters.
	 */
	public function normalized_query_parameters( $query_string ) {
		parse_str( $query_string, $array );

		unset( $array['signature'] );

		$names  = array_keys( $array );
		$values = array_values( $array );

		$names  = array_map( array( $this, 'encode_3986' ), $names );
		$values = array_map( array( $this, 'encode_3986' ), $values );

		$pairs = array_map( array( $this, 'join_with_equal_sign' ), $names, $values );

		sort( $pairs );

		return $pairs;
	}

	/**
	 * Encodes a string or array of strings according to RFC 3986.
	 *
	 * @param string|array $string_or_array String or array to encode.
	 * @return string|array URL-encoded string or array.
	 */
	public function encode_3986( $string_or_array ) {
		if ( is_array( $string_or_array ) ) {
			return array_map( array( $this, 'encode_3986' ), $string_or_array );
		}

		return rawurlencode( $string_or_array );
	}

	/**
	 * Concatenates a parameter name and a parameter value with an equals sign between them.
	 *
	 * @param string       $name  Parameter name.
	 * @param string|array $value Parameter value.
	 * @return string|array A string pair (e.g. `name=value`) or an array of string pairs.
	 */
	public function join_with_equal_sign( $name, $value ) {
		if ( is_array( $value ) ) {
			return $this->join_array_with_equal_sign( $name, $value );
		}
		return "{$name}={$value}";
	}

	/**
	 * Helper function for join_with_equal_sign for handling arrayed values.
	 * Explicitly supports nested arrays.
	 *
	 * @param string $name  Parameter name.
	 * @param array  $value Parameter value.
	 * @return array An array of string pairs (e.g. `[ name[example]=value ]`).
	 */
	private function join_array_with_equal_sign( $name, $value ) {
		$result = array();
		foreach ( $value as $value_key => $value_value ) {
			$joined_value = $this->join_with_equal_sign( $name . '[' . $value_key . ']', $value_value );
			if ( is_array( $joined_value ) ) {
				foreach ( array_values( $joined_value ) as $individual_joined_value ) {
					$result[] = $individual_joined_value;
				}
			} elseif ( is_string( $joined_value ) ) {
				$result[] = $joined_value;
			}
		}

		sort( $result );
		return $result;
	}
}
