<?php
/**
 * Thin client for the MailChannels Email API.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Calls MailChannels endpoints with one API key.
 */
class MailChannels_Client {

	/**
	 * API base URL.
	 *
	 * @var string
	 */
	const BASE_URL = 'https://api.mailchannels.net/tx/v1';

	/**
	 * API key sent as `X-Api-Key`.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * The last answer's status, time taken, content type and size.
	 *
	 * @var array{status: int, ms: int, content_type: string, bytes: int}
	 */
	private $last = array(
		'status'       => 0,
		'ms'           => 0,
		'content_type' => '',
		'bytes'        => 0,
	);

	/**
	 * Constructor.
	 *
	 * @param string $api_key API key.
	 */
	public function __construct( $api_key ) {
		$this->api_key = (string) $api_key;
		// Whatever this request records, the key is never in it.
		Debug_Log::secret( $this->api_key );
	}

	/**
	 * The last answer's status, how long it took in milliseconds, its content type and size.
	 *
	 * @since $$next-version$$
	 *
	 * @return array{status: int, ms: int, content_type: string, bytes: int}
	 */
	public function last_response() {
		return $this->last;
	}

	/**
	 * Send a message synchronously.
	 *
	 * @param array $payload Message_Builder::build() output.
	 * @return array|WP_Error
	 */
	public function send( array $payload ) {
		return $this->request( 'POST', '/send', $payload, array(), 30 );
	}

	/**
	 * Check a domain's Lockdown, SPF, DKIM and A/MX records.
	 *
	 * @param string $domain        Domain.
	 * @param string $dkim_selector DKIM selector, or '' to skip DKIM.
	 * @return array|WP_Error
	 */
	public function check_domain( $domain, $dkim_selector ) {
		$body = array( 'domain' => $domain );
		if ( '' !== $dkim_selector ) {
			$body['dkim_settings'] = array(
				array(
					'dkim_domain'   => $domain,
					'dkim_selector' => $dkim_selector,
				),
			);
		}
		return $this->request( 'POST', '/check-domain', $body );
	}

	/**
	 * Create a sub-account (parent key).
	 *
	 * @param string $handle       Handle.
	 * @param string $company_name Company name, 3–128 characters.
	 * @return array|WP_Error
	 */
	public function create_sub_account( $handle, $company_name ) {
		return $this->request(
			'POST',
			'/sub-account',
			array(
				'company_name' => $company_name,
				'handle'       => $handle,
			)
		);
	}

	/**
	 * Create an API key for a sub-account (parent key). The key is only returned here.
	 *
	 * @param string $handle Handle.
	 * @return array|WP_Error
	 */
	public function create_sub_account_api_key( $handle ) {
		return $this->request( 'POST', '/sub-account/' . rawurlencode( $handle ) . '/api-key' );
	}

	/**
	 * Cap a sub-account's sends (parent key).
	 *
	 * @param string $handle Handle.
	 * @param int    $sends  Limit; 0 pauses the sub-account.
	 * @return array|WP_Error
	 */
	public function set_sub_account_limit( $handle, $sends ) {
		return $this->request( 'PUT', '/sub-account/' . rawurlencode( $handle ) . '/limit', array( 'sends' => (int) $sends ) );
	}

	/**
	 * A sub-account's usage this period (parent key).
	 *
	 * @param string $handle Handle.
	 * @return array|WP_Error
	 */
	public function get_sub_account_usage( $handle ) {
		// Read on every Overview visit; a successful read isn't worth a debug entry each time.
		return $this->request( 'GET', '/sub-account/' . rawurlencode( $handle ) . '/usage', null, array(), 30, true );
	}

	/**
	 * Delete a sub-account (parent key).
	 *
	 * @param string $handle Handle.
	 * @return array|WP_Error
	 */
	public function delete_sub_account( $handle ) {
		return $this->request( 'DELETE', '/sub-account/' . rawurlencode( $handle ) );
	}

	/**
	 * Create a hosted DKIM key.
	 *
	 * @param string $domain   Domain.
	 * @param string $selector Selector.
	 * @return array|WP_Error
	 */
	public function create_dkim_key( $domain, $selector ) {
		return $this->request(
			'POST',
			'/domains/' . rawurlencode( $domain ) . '/dkim-keys',
			array(
				'selector'   => $selector,
				'algorithm'  => 'rsa',
				'key_length' => 2048,
			)
		);
	}

	/**
	 * List hosted DKIM keys for a selector, with their DNS records.
	 *
	 * @param string $domain   Domain.
	 * @param string $selector Selector.
	 * @return array|WP_Error
	 */
	public function get_dkim_keys( $domain, $selector ) {
		return $this->request(
			'GET',
			'/domains/' . rawurlencode( $domain ) . '/dkim-keys',
			null,
			array(
				'selector'           => $selector,
				'include_dns_record' => 'true',
			)
		);
	}

	/**
	 * Make a request and normalize failures into WP_Error.
	 *
	 * @param string     $method  HTTP method.
	 * @param string     $path    Path under BASE_URL.
	 * @param array|null $body    JSON body.
	 * @param array      $query   Query arguments.
	 * @param int        $timeout Seconds.
	 * @param bool       $quiet   Leave a successful answer out of the debug log.
	 * @return array|WP_Error Decoded body, or an error with data `{status, errors, ms}`; a network error keeps
	 *                        WordPress's code, the cURL error number and when it happened.
	 */
	private function request( $method, $path, $body = null, array $query = array(), $timeout = 30, $quiet = false ) {
		$url = self::BASE_URL . $path;
		if ( $query ) {
			$url = add_query_arg( $query, $url );
		}

		$args = array(
			'method'  => $method,
			'timeout' => $timeout,
			'headers' => array(
				'X-Api-Key' => $this->api_key,
				'Accept'    => 'application/json',
			),
		);
		if ( null !== $body ) {
			$args['headers']['Content-Type'] = 'application/json';
			$args['body']                    = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );
		}

		$started  = microtime( true );
		$response = wp_remote_request( $url, $args );
		$ms       = (int) round( ( microtime( true ) - $started ) * 1000 );
		// The path without its query, which is all the debug log needs.
		$where = array(
			'method' => $method,
			'path'   => $path,
		);
		if ( is_wp_error( $response ) ) {
			$message = $response->get_error_message();
			$errno   = preg_match( '/cURL error (\d+)/i', $message, $match ) ? (int) $match[1] : 0;
			$data    = array(
				'status'    => 0,
				'errors'    => array(),
				'wp_code'   => (string) $response->get_error_code(),
				'errno'     => $errno,
				'phase'     => Failure_Reason::transport_phase( $errno, $message ),
				'ms'        => $ms,
				'timeout_s' => (int) $timeout,
			);
			Debug_Log::add(
				'error',
				'sending',
				'api.transport_error',
				'after_send' === $data['phase']
					/* translators: %s: the network error, e.g. "cURL error 28: Operation timed out". */
					? sprintf( __( 'No answer after sending: %s', 'jetpack-send-pkg' ), $message )
					/* translators: %s: the network error, e.g. "cURL error 7: Failed to connect". */
					: sprintf( __( 'Couldn’t reach the email service: %s', 'jetpack-send-pkg' ), $message ),
				$where + $data + array( 'message' => $message )
			);
			return new WP_Error( 'jetpack_send_transport', $message, $data );
		}

		$code       = (int) wp_remote_retrieve_response_code( $response );
		$raw        = (string) wp_remote_retrieve_body( $response );
		$decoded    = '' === $raw ? array() : json_decode( $raw, true );
		$this->last = array(
			'status'       => $code,
			'ms'           => $ms,
			'content_type' => (string) wp_remote_retrieve_header( $response, 'content-type' ),
			'bytes'        => strlen( $raw ),
		);
		$ok         = $code >= 200 && $code < 300;
		if ( ! $quiet || ! $ok ) {
			Debug_Log::add(
				$ok ? 'debug' : ( 429 === $code ? 'warning' : 'error' ),
				'sending',
				'api.call',
				/* translators: 1: HTTP method, 2: the API path, 3: HTTP status, 4: milliseconds. */
				sprintf( __( '%1$s %2$s → HTTP %3$d in %4$d ms.', 'jetpack-send-pkg' ), $method, $path, $code, $ms ),
				$where + $this->last + array(
					'request_id' => is_array( $decoded ) && is_scalar( $decoded['request_id'] ?? null ) ? (string) $decoded['request_id'] : '',
					'body'       => null === $decoded && '' !== $raw ? '<not JSON, ' . strlen( $raw ) . ' bytes>' : Debug_Log::service_body( $decoded ),
				)
			);
		}

		if ( $code < 200 || $code >= 300 ) {
			$errors = self::extract_errors( $decoded );
			return new WP_Error(
				'jetpack_send_http_' . $code,
				$errors
					? implode( ' ', $errors )
					/* translators: %d: HTTP status code. */
					: sprintf( __( 'The sending service returned HTTP %d.', 'jetpack-send-pkg' ), $code ),
				array(
					'status'       => $code,
					'errors'       => $errors,
					'ms'           => $ms,
					'content_type' => $this->last['content_type'],
					'bytes'        => $this->last['bytes'],
				)
			);
		}

		return is_array( $decoded ) ? $decoded : array();
	}

	/**
	 * Pull human-readable messages out of an error body.
	 *
	 * @param mixed $decoded Decoded JSON.
	 * @return string[] Empty when the body is not JSON or has no recognized error field.
	 */
	private static function extract_errors( $decoded ) {
		if ( is_array( $decoded ) && isset( $decoded['errors'] ) && is_array( $decoded['errors'] ) ) {
			$messages = array();
			foreach ( $decoded['errors'] as $error ) {
				if ( is_string( $error ) ) {
					$messages[] = $error;
				} elseif ( is_array( $error ) && isset( $error['message'] ) ) {
					$messages[] = (string) $error['message'];
				}
			}
			return $messages;
		}
		foreach ( array( 'error', 'message' ) as $key ) {
			if ( is_array( $decoded ) && isset( $decoded[ $key ] ) && is_string( $decoded[ $key ] ) ) {
				return array( $decoded[ $key ] );
			}
		}
		return array();
	}
}
