<?php
/**
 * JSON Web Token implementation, based on this spec:
 * https://tools.ietf.org/html/rfc7519
 *
 * @package automattic/jetpack-jwt
 */

namespace Automattic\Jetpack;

use DomainException;
use InvalidArgumentException;
use UnexpectedValueException;

/**
 * JSON Web Token implementation, based on this spec:
 * https://tools.ietf.org/html/rfc7519
 *
 * PHP version 5
 *
 * @category Authentication
 * @package  Authentication_JWT
 * @author   Neuman Vong <neuman@twilio.com>
 * @author   Anant Narayanan <anant@php.net>
 * @license  http://opensource.org/licenses/BSD-3-Clause 3-clause BSD
 * @link     https://github.com/firebase/php-jwt
 */
class JWT {

	const PACKAGE_VERSION = '0.2.1';
	/**
	 * When checking nbf, iat or expiration times,
	 * we want to provide some extra leeway time to
	 * account for clock skew.
	 *
	 * @var int $leeway The leeway value.
	 */
	public static $leeway = 0;

	/**
	 * Allow the current timestamp to be specified.
	 * Useful for fixing a value within unit testing.
	 *
	 * Will default to PHP time() value if null.
	 *
	 * @var string $timestamp The timestamp.
	 */
	public static $timestamp = null;

	/**
	 * Supported algorithms.
	 *
	 * @var array $supported_algs Supported algorithms.
	 */
	public static $supported_algs = array(
		'HS256' => array( 'hash_hmac', 'SHA256' ),
		'HS512' => array( 'hash_hmac', 'SHA512' ),
		'HS384' => array( 'hash_hmac', 'SHA384' ),
		'RS256' => array( 'openssl', 'SHA256' ),
		'RS384' => array( 'openssl', 'SHA384' ),
		'RS512' => array( 'openssl', 'SHA512' ),
	);

	/**
	 * Decodes a JWT string into a PHP object.
	 *
	 * @param string       $jwt            The JWT.
	 * @param string|array $key            The key, or map of keys.
	 *                                     If the algorithm used is asymmetric, this is the public key.
	 * @param array        $allowed_algs   List of supported verification algorithms.
	 *                                     Supported algorithms are 'HS256', 'HS384', 'HS512' and 'RS256'.
	 * @param bool         $as_array Whether to return the result as an associative array.
	 *
	 * @return object|array The JWT's payload as a PHP object or array.
	 *
	 * @throws UnexpectedValueException     Provided JWT was invalid.
	 * @throws SignatureInvalidException    Provided JWT was invalid because the signature verification failed.
	 * @throws InvalidArgumentException     Provided JWT is trying to be used before it's eligible as defined by 'nbf'.
	 * @throws BeforeValidException         Provided JWT is trying to be used before it's been created as defined by 'iat'.
	 * @throws ExpiredException             Provided JWT has since expired, as defined by the 'exp' claim.
	 *
	 * @uses json_decode
	 * @uses urlsafe_b64_decode
	 */
	public static function decode( $jwt, $key, array $allowed_algs = array(), $as_array = false ) {
		$timestamp = static::$timestamp === null ? time() : static::$timestamp;

		if ( empty( $key ) ) {
			throw new InvalidArgumentException( 'Key may not be empty' );
		}

		$tks = explode( '.', $jwt );
		if ( count( $tks ) !== 3 ) {
			throw new UnexpectedValueException( 'Wrong number of segments' );
		}

		list( $headb64, $bodyb64, $cryptob64 ) = $tks;

		$header = static::json_decode( static::urlsafe_b64_decode( $headb64 ) );
		if ( null === $header ) {
			throw new UnexpectedValueException( 'Invalid header encoding' );
		}

		$payload = static::json_decode( static::urlsafe_b64_decode( $bodyb64 ), $as_array );
		if ( null === $payload ) {
			throw new UnexpectedValueException( 'Invalid claims encoding' );
		}

		$sig = static::urlsafe_b64_decode( $cryptob64 );
		if ( false === $sig ) {
			throw new UnexpectedValueException( 'Invalid signature encoding' );
		}

		if ( empty( $header->alg ) ) {
			throw new UnexpectedValueException( 'Empty algorithm' );
		}

		if ( empty( static::$supported_algs[ $header->alg ] ) ) {
			throw new UnexpectedValueException( 'Algorithm not supported' );
		}

		if ( ! in_array( $header->alg, $allowed_algs, true ) ) {
			throw new UnexpectedValueException( 'Algorithm not allowed' );
		}

		if ( is_array( $key ) || $key instanceof \ArrayAccess ) {
			if ( isset( $header->kid ) ) {
				if ( ! isset( $key[ $header->kid ] ) ) {
					throw new UnexpectedValueException( '"kid" invalid, unable to lookup correct key' );
				}
				$key = $key[ $header->kid ];
			} else {
				throw new UnexpectedValueException( '"kid" empty, unable to lookup correct key' );
			}
		}

		// Check the signature.
		if ( ! static::verify( "$headb64.$bodyb64", $sig, $key, $header->alg ) ) {
			throw new SignatureInvalidException( 'Signature verification failed' );
		}

		$nbf = ! $as_array && isset( $payload->nbf ) ? $payload->nbf : null;
		if ( $as_array && isset( $payload['nbf'] ) ) {
			$nbf = $payload['nbf'];
		}
		// Check if the nbf if it is defined. This is the time that the
		// token can actually be used. If it's not yet that time, abort.
		if ( $nbf > ( $timestamp + static::$leeway ) ) {
			throw new BeforeValidException(
				'Cannot handle token prior to ' . gmdate( 'Y-m-d\\TH:i:sO', $nbf )
			);
		}

		$iat = ! $as_array && isset( $payload->iat ) ? $payload->iat : null;
		if ( $as_array && isset( $payload['iat'] ) ) {
			$iat = $payload['iat'];
		}
		// Check that this token has been created before 'now'. This prevents
		// using tokens that have been created for later use (and haven't
		// correctly used the nbf claim).
		if ( $iat > ( $timestamp + static::$leeway ) ) {
			throw new BeforeValidException(
				'Cannot handle token prior to ' . gmdate( 'Y-m-d\\TH:i:sO', $iat )
			);
		}

		$exp = ! $as_array && isset( $payload->exp ) ? $payload->exp : null;
		if ( $as_array && isset( $payload['exp'] ) ) {
			$exp = $payload['exp'];
		}

		// Check if this token has expired.
		if ( $exp && ( $timestamp - static::$leeway ) >= $exp ) {
			throw new ExpiredException( 'Expired token' );
		}

		return $payload;
	}

	/**
	 * Converts and signs a PHP object or array into a JWT string.
	 *
	 * @param object|array $payload    PHP object or array.
	 * @param string       $key        The secret key.
	 *                                 If the algorithm used is asymmetric, this is the private key.
	 * @param string       $alg        The signing algorithm.
	 *                                 Supported algorithms are 'HS256', 'HS384', 'HS512' and 'RS256'.
	 * @param mixed        $key_id     The key ID.
	 * @param array        $head       An array with header elements to attach.
	 *
	 * @return string A signed JWT
	 *
	 * @uses json_encode
	 * @uses urlsafe_b64_decode
	 */
	public static function encode( $payload, $key, $alg = 'HS256', $key_id = null, $head = null ) {
		$header = array(
			'typ' => 'JWT',
			'alg' => $alg,
		);

		if ( null !== $key_id ) {
			$header['kid'] = $key_id;
		}

		if ( isset( $head ) && is_array( $head ) ) {
			$header = array_merge( $head, $header );
		}

		$segments      = array();
		$segments[]    = static::urlsafe_b64_encode( static::json_encode( $header ) );
		$segments[]    = static::urlsafe_b64_encode( static::json_encode( $payload ) );
		$signing_input = implode( '.', $segments );

		$signature  = static::sign( $signing_input, $key, $alg );
		$segments[] = static::urlsafe_b64_encode( $signature );

		return implode( '.', $segments );
	}

	/**
	 * Sign a string with a given key and algorithm.
	 *
	 * @param string          $msg    The message to sign.
	 * @param string|resource $key    The secret key.
	 * @param string          $alg    The signing algorithm.
	 *                                Supported algorithms are 'HS256', 'HS384', 'HS512' and 'RS256'.
	 *
	 * @return string An encrypted message
	 *
	 * @throws DomainException Unsupported algorithm was specified.
	 */
	public static function sign( $msg, $key, $alg = 'HS256' ) {
		if ( empty( static::$supported_algs[ $alg ] ) ) {
			throw new DomainException( 'Algorithm not supported' );
		}
		list($function, $algorithm) = static::$supported_algs[ $alg ];
		switch ( $function ) {
			case 'hash_hmac':
				return hash_hmac( $algorithm, $msg, $key, true );
			case 'openssl':
				$signature = '';
				$success   = openssl_sign( $msg, $signature, $key, $algorithm );
				if ( ! $success ) {
					throw new DomainException( 'OpenSSL unable to sign data' );
				} else {
					return $signature;
				}
		}
	}

	/**
	 * Verify a signature with the message, key and method. Not all methods
	 * are symmetric, so we must have a separate verify and sign method.
	 *
	 * @param string          $msg        The original message (header and body).
	 * @param string          $signature  The original signature.
	 * @param string|resource $key        For HS*, a string key works. for RS*, must be a resource of an openssl public key.
	 * @param string          $alg        The algorithm.
	 *
	 * @return bool
	 *
	 * @throws DomainException Invalid Algorithm or OpenSSL failure.
	 */
	private static function verify( $msg, $signature, $key, $alg ) {
		if ( empty( static::$supported_algs[ $alg ] ) ) {
			throw new DomainException( 'Algorithm not supported' );
		}

		list($function, $algorithm) = static::$supported_algs[ $alg ];
		switch ( $function ) {
			case 'openssl':
				$success = openssl_verify( $msg, $signature, $key, $algorithm );

				if ( 1 === $success ) {
					return true;
				} elseif ( 0 === $success ) {
					return false;
				}

				// returns 1 on success, 0 on failure, -1 on error.
				throw new DomainException(
					'OpenSSL error: ' . openssl_error_string()
				);
			case 'hash_hmac':
			default:
				$hash = hash_hmac( $algorithm, $msg, $key, true );

				if ( function_exists( 'hash_equals' ) ) {
					return hash_equals( $signature, $hash );
				}

				$len = min( static::safe_strlen( $signature ), static::safe_strlen( $hash ) );

				$status = 0;

				for ( $i = 0; $i < $len; $i++ ) {
					$status |= ( ord( $signature[ $i ] ) ^ ord( $hash[ $i ] ) );
				}

				$status |= ( static::safe_strlen( $signature ) ^ static::safe_strlen( $hash ) );

				return ( 0 === $status );
		}
	}

	/**
	 * Decode a JSON string into a PHP object.
	 *
	 * @param string $input JSON string.
	 * @param bool   $as_array Whether to return the result as an associative array.
	 *
	 * @return object|array Object or Array representation of JSON string
	 *
	 * @throws DomainException Provided string was invalid JSON.
	 */
	public static function json_decode( $input, $as_array = false ) {
		$obj   = json_decode( $input, $as_array, 512, JSON_BIGINT_AS_STRING );
		$errno = json_last_error();

		if ( $errno ) {
			static::handle_json_error( $errno );
		} elseif ( null === $obj && 'null' !== $input ) {
			throw new DomainException( 'Null result with non-null input' );
		} elseif ( $obj === null ) {
			throw new DomainException( 'Null result' );
		}

		return $obj;
	}

	/**
	 * Encode a PHP object into a JSON string.
	 *
	 * @param object|array $input A PHP object or array.
	 *
	 * @return string JSON representation of the PHP object or array.
	 *
	 * @throws DomainException Provided object could not be encoded to valid JSON.
	 */
	public static function json_encode( $input ) {
		$json  = \wp_json_encode( $input );
		$errno = json_last_error();

		if ( $errno ) {
			static::handle_json_error( $errno );
		} elseif ( 'null' === $json && null !== $input ) {
			throw new DomainException( 'Null result with non-null input' );
		}
		return $json;
	}

	/**
	 * Decode a string with URL-safe Base64.
	 *
	 * @param string $input A Base64 encoded string.
	 *
	 * @return string A decoded string
	 */
	public static function urlsafe_b64_decode( $input ) {
		$remainder = strlen( $input ) % 4;
		if ( $remainder ) {
			$padlen = 4 - $remainder;
			$input .= str_repeat( '=', $padlen );
		}
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		return base64_decode( strtr( $input, '-_', '+/' ) );
	}

	/**
	 * Encode a string with URL-safe Base64.
	 *
	 * @param string $input The string you want encoded.
	 *
	 * @return string The base64 encode of what you passed in
	 */
	public static function urlsafe_b64_encode( $input ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return str_replace( '=', '', strtr( base64_encode( $input ), '+/', '-_' ) );
	}

	/**
	 * Helper method to create a JSON error.
	 *
	 * @param int $errno An error number from json_last_error().
	 * @throws DomainException .
	 *
	 * @return never
	 */
	private static function handle_json_error( $errno ) {
		$messages = array(
			JSON_ERROR_DEPTH          => 'Maximum stack depth exceeded',
			JSON_ERROR_STATE_MISMATCH => 'Invalid or malformed JSON',
			JSON_ERROR_CTRL_CHAR      => 'Unexpected control character found',
			JSON_ERROR_SYNTAX         => 'Syntax error, malformed JSON',
			JSON_ERROR_UTF8           => 'Malformed UTF-8 characters',
		);
		throw new DomainException(
			$messages[ $errno ] ?? 'Unknown JSON error: ' . $errno
		);
	}

	/**
	 * Get the number of bytes in cryptographic strings.
	 *
	 * @param string $str .
	 *
	 * @return int
	 */
	private static function safe_strlen( $str ) {
		if ( function_exists( 'mb_strlen' ) ) {
			return mb_strlen( $str, '8bit' );
		}
		return strlen( $str );
	}
}

// phpcs:disable
if ( ! class_exists( 'SignatureInvalidException' ) ) {
	/**
	 * SignatureInvalidException
	 *
	 * @package Automattic\Jetpack\Extensions\Premium_Content
	 */
	class SignatureInvalidException extends \UnexpectedValueException { }
}
if ( ! class_exists( 'ExpiredException' ) ) {
	/**
	 * ExpiredException
	 *
	 * @package Automattic\Jetpack\Extensions\Premium_Content
	 */
	class ExpiredException extends \UnexpectedValueException { }
}
if ( ! class_exists( 'BeforeValidException' ) ) {
	/**
	 * BeforeValidException
	 *
	 * @package Automattic\Jetpack\Extensions\Premium_Content
	 */
	class BeforeValidException extends \UnexpectedValueException { }
}
// phpcs:enable
