<?php
/**
 * IXR_Client
 *
 * @package automattic/jetpack-connection
 *
 * @since 1.7.0
 * @since-jetpack 1.5
 * @since-jetpack 7.7 Moved to the jetpack-connection package.
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Error_Handler;
use Automattic\Jetpack\Connection\Manager;

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( IXR_Client::class ) ) {
	require_once ABSPATH . WPINC . '/class-IXR.php';
}

/**
 * A Jetpack implementation of the WordPress core IXR client.
 */
class Jetpack_IXR_Client extends IXR_Client {
	/**
	 * Jetpack args, used for the remote requests.
	 *
	 * @var array
	 */
	public $jetpack_args = null;

	/**
	 * Remote Response Headers.
	 *
	 * @var array
	 */
	public $response_headers = null;

	/**
	 * Holds the raw remote response from the latest call to query().
	 *
	 * @var null|array|WP_Error
	 */
	public $last_response = null;

	/**
	 * Constructor.
	 * Initialize a new Jetpack IXR client instance.
	 *
	 * @param array       $args    Jetpack args, used for the remote requests.
	 * @param string|bool $path    Path to perform the reuqest to.
	 * @param int         $port    Port number.
	 * @param int         $timeout The connection timeout, in seconds.
	 */
	public function __construct( $args = array(), $path = false, $port = 80, $timeout = 15 ) {
		$connection = new Manager();

		$defaults = array(
			'url'     => $connection->xmlrpc_api_url(),
			'user_id' => 0,
			'headers' => array(),
		);

		$args            = wp_parse_args( $args, $defaults );
		$args['headers'] = array_merge( array( 'Content-Type' => 'text/xml' ), (array) $args['headers'] );

		$this->jetpack_args = $args;

		$this->IXR_Client( $args['url'], $path, $port, $timeout );
	}

	/**
	 * Perform the IXR request.
	 *
	 * @param mixed ...$args IXR method and args.
	 *
	 * @return bool True if request succeeded, false otherwise.
	 */
	public function query( ...$args ) {
		$method  = array_shift( $args );
		$request = new IXR_Request( $method, $args );
		$xml     = trim( $request->getXml() );

		$response = Client::remote_request( $this->jetpack_args, $xml );

		// Store response headers.
		$this->response_headers = wp_remote_retrieve_headers( $response );

		$this->last_response = $response;
		if ( is_array( $this->last_response ) && isset( $this->last_response['http_response'] ) ) {
			// If the expected array response is received, format the data as plain arrays.
			$this->last_response            = $this->last_response['http_response']->to_array();
			$this->last_response['headers'] = $this->last_response['headers']->getAll();
		}

		if ( is_wp_error( $response ) ) {
			$this->error = new IXR_Error( -10520, sprintf( 'Jetpack: [%s] %s', $response->get_error_code(), $response->get_error_message() ) );
			return false;
		}

		if ( ! $response ) {
			$this->error = new IXR_Error( -10520, 'Jetpack: Unknown Error' );
			return false;
		}

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$this->error = new IXR_Error( -32300, 'transport error - HTTP status code was not 200' );
			return false;
		}

		$content = wp_remote_retrieve_body( $response );

		// Now parse what we've got back.
		$this->message = new IXR_Message( $content );
		if ( ! $this->message->parse() ) {
			// XML error.
			$this->error = new IXR_Error( -32700, 'parse error. not well formed' );
			return false;
		}

		// Is the message a fault?
		if ( 'fault' === $this->message->messageType ) {
			$this->error = new IXR_Error( $this->message->faultCode, $this->message->faultString );

			// Faults arrive as HTTP 200 responses with an XML body, so they never reach
			// Error_Handler::check_api_response_for_errors() (called on this same request by
			// Client::remote_request()); report them here instead.
			//
			// method_exists() guards against mid-update/mid-deploy skew: this legacy file can
			// load before the connection package's Error_Handler class does, so the method may
			// not exist yet on this request.
			if ( method_exists( Error_Handler::class, 'check_xmlrpc_fault_for_errors' ) ) {
				// is_scalar() avoids a PHP 8 array-to-string warning if malformed XML ever
				// leaves faultString as something other than a string.
				$fault_string = is_scalar( $this->message->faultString ) ? (string) $this->message->faultString : '';
				$parsed       = self::parse_jetpack_fault_string( $fault_string );

				if ( $parsed !== null ) {
					$user_id = true === $this->jetpack_args['user_id']
						? (int) \Jetpack_Options::get_option( 'master_user' )
						: (int) $this->jetpack_args['user_id'];

					Error_Handler::get_instance()->check_xmlrpc_fault_for_errors(
						$parsed[0],
						$parsed[1],
						$this->jetpack_args['url'],
						'POST',
						$user_id
					);
				}
			}

			return false;
		}

		// Message must be OK.
		return true;
	}

	/**
	 * Retrieve the Jetpack error from the result of the last request.
	 *
	 * @param int    $fault_code   Fault code.
	 * @param string $fault_string Fault string.
	 * @return WP_Error Error object.
	 */
	public function get_jetpack_error( $fault_code = null, $fault_string = null ) {
		if ( $fault_code === null ) {
			$fault_code = $this->error->code;
		}

		if ( $fault_string === null ) {
			$fault_string = $this->error->message;
		}

		$parsed = self::parse_jetpack_fault_string( $fault_string );

		if ( $parsed !== null ) {
			list( $code, $message ) = $parsed;
			return new WP_Error( $code, $message, $fault_code );
		}

		return new WP_Error( "IXR_{$fault_code}", $fault_string );
	}

	/**
	 * Parse a `Jetpack: [code] message` fault string, the convention WP.com uses to surface
	 * a Jetpack-specific error code and message inside an XML-RPC fault.
	 *
	 * Without the `s` modifier, `.` doesn't match a newline, and unmodified `$` anchors to the
	 * end of the whole string (not each line) — so a fault string containing embedded newlines
	 * after the code fails this match entirely rather than truncating the message. WP.com fault
	 * strings are single-line in practice, so this is intentional, not a bug.
	 *
	 * @param string $fault_string The XML-RPC fault string.
	 * @return array{0: string, 1: string}|null A [ code, message ] pair, or null if the string
	 *                                           doesn't follow the convention.
	 */
	public static function parse_jetpack_fault_string( $fault_string ) {
		if ( ! preg_match( '#\Ajetpack:\s+\[(\w+)\]\s*(.*)$#i', $fault_string, $match ) ) {
			return null;
		}

		return array( $match[1], $match[2] );
	}

	/**
	 * Retrieve a response header if set.
	 *
	 * @param  string $name  header name.
	 * @return string|bool Header value if set, false if not set.
	 */
	public function get_response_header( $name ) {
		if ( isset( $this->response_headers[ $name ] ) ) {
			return $this->response_headers[ $name ];
		}
		// case-insensitive header names: http://www.ietf.org/rfc/rfc2616.txt.
		if ( isset( $this->response_headers[ strtolower( $name ) ] ) ) {
			return $this->response_headers[ strtolower( $name ) ];
		}
		return false;
	}

	/**
	 * Retrieve the raw response for the last query() call.
	 *
	 * @return null|array|WP_Error
	 */
	public function get_last_response() {
		return $this->last_response;
	}
}
