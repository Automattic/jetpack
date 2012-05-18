<?php

/**
 * IXR_Client
 *
 * @package IXR
 * @since 1.5
 *
 */
class Jetpack_IXR_Client extends IXR_Client {
	var $jetpack_args = null;

	function Jetpack_IXR_Client( $args = array(), $path = false, $port = 80, $timeout = 15 ) {
		$defaults = array(
			'url' => Jetpack::xmlrpc_api_url(),
			'user_id' => 0,
		);

		$args = wp_parse_args( $args, $defaults );

		$args['user_id'] = (int) $args['user_id'];

		$this->jetpack_args = $args;

		$this->IXR_Client( $args['url'], $path, $port, $timeout );
	}

	function query() {
		$args = func_get_args();
		$method = array_shift( $args );
		$request =& new IXR_Request( $method, $args );
		$xml = trim( $request->getXml() );

		$headers = array(
			'Content-Type' => 'text/xml',
		);

		$response = Jetpack_Client::remote_request( $this->jetpack_args, $xml );

		if ( is_wp_error( $response ) ) {
			$this->error =& new IXR_Error( -10520, sprintf( 'Jetpack: [%s] %s', $response->get_error_code(), $response->get_error_message() ) );
			return false;
		}

		if ( !$response ) {
			$this->error =& new IXR_Error( -10520, 'Jetpack: Unknown Error' );
			return false;
		}

		if ( 200 != wp_remote_retrieve_response_code( $response ) ) {
			$this->error =& new IXR_Error( -32300, 'transport error - HTTP status code was not 200' );
			return false;
		}
		
		$content = wp_remote_retrieve_body( $response );

		// Now parse what we've got back
		$this->message =& new IXR_Message( $content );
		if ( !$this->message->parse() ) {
			// XML error
			$this->error =& new IXR_Error( -32700, 'parse error. not well formed' );
			return false;
		}

		// Is the message a fault?
		if ( $this->message->messageType == 'fault' ) {
			$this->error =& new IXR_Error( $this->message->faultCode, $this->message->faultString );
			return false;
		}

		// Message must be OK
		return true;
	}

	function get_jetpack_error( $fault_code = null, $fault_string = null ) {
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
			return new Jetpack_Error( $code, $message, $status );
		}

		return new Jetpack_Error( "IXR_{$fault_code}", $fault_string );
	}
}

/**
 * IXR_ClientMulticall
 *
 * @package IXR
 * @since 1.5
 */
class Jetpack_IXR_ClientMulticall extends Jetpack_IXR_Client {
	var $calls = array();

	function Jetpack_IXR_ClientMulticall( $args = array(), $path = false, $port = 80, $timeout = 15 ) {
		parent::Jetpack_IXR_Client( $args, $path, $port, $timeout );
	}

	function addCall() {
		$args = func_get_args();
		$methodName = array_shift( $args );
		$struct = array(
			'methodName' => $methodName,
			'params' => $args
		);
		$this->calls[] = $struct;
	}

	function query() {
		usort( $this->calls, array( &$this, 'sort_calls' ) );

		// Prepare multicall, then call the parent::query() method
		return parent::query( 'system.multicall', $this->calls );
	}

	// Make sure syncs are always done first
	function sort_calls( $a, $b ) {
		if ( 'jetpack.syncContent' == $a['methodName'] ) {
			return -1;
		}

		if ( 'jetpack.syncContent' == $b['methodName'] ) {
			return 1;
		}

		return 0;
	}
}
