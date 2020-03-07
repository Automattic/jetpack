<?php
/**
 * IXR_Client
 *
 * @package automattic/jetpack-connection
 *
 * @since 1.5
 * @since 7.7 Moved to the jetpack-connection package.
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

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
		);

		$args = wp_parse_args( $args, $defaults );

		$this->jetpack_args = $args;

		$this->IXR_Client( $args['url'], $path, $port, $timeout );
	}

	/**
	 * Perform the IXR request.
	 *
	 * @return bool True if request succeeded, false otherwise.
	 */
	public function query() {
		$args    = func_get_args();
		$method  = array_shift( $args );
		$request = new IXR_Request( $method, $args );
		$xml     = trim( $request->getXml() );

		$response = Client::remote_request( $this->jetpack_args, $xml );

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
		if ( is_null( $fault_code ) ) {
			$fault_code = $this->error->code;
		}

		if ( is_null( $fault_string ) ) {
			$fault_string = $this->error->message;
		}

		if ( preg_match( '#jetpack:\s+\[(\w+)\]\s*(.*)?$#i', $fault_string, $match ) ) {
			$code    = $match[1];
			$message = $match[2];
			$status  = $fault_code;
			return new \WP_Error( $code, $message, $status );
		}

		return new \WP_Error( "IXR_{$fault_code}", $fault_string );
	}
}
