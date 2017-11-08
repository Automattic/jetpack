<?php

// don't call the file directly
defined( 'ABSPATH' ) or die();

if ( !class_exists( 'IXR_Client' ) )
	include_once( ABSPATH . WPINC . '/class-IXR.php' );

class VaultPress_IXR_SSL_Client extends IXR_Client {
	var $ssl = false;
	function __construct( $server, $path = false, $port = 80, $timeout = false, $useragent = false ) {
		parent::__construct( $server, $path, $port, $timeout );
		if ( ! empty( $useragent ) ) {
			$this->useragent = $useragent;
		}
	}
	function ssl( $port=443 ) {
		if ( !extension_loaded( 'openssl' ) )
			return;

		$this->ssl = true;
		if ( $port )
			$this->port = $port;
	}
	function query() {
		$args = func_get_args();
		$method = array_shift($args);
		$request = new IXR_Request($method, $args);
		$length = $request->getLength();
		$xml = $request->getXml();
		$r = "\r\n";
		$request  = "POST {$this->path} HTTP/1.0$r";

		$this->headers['Host']           = preg_replace( '#^ssl://#', '', $this->server );
		$this->headers['Content-Type']   = 'text/xml';
		$this->headers['User-Agent']     = $this->useragent;
		$this->headers['Content-Length'] = $length;

		$sslverify = true;
		if ( defined( 'VAULTPRESS_NO_SSL' ) && VAULTPRESS_NO_SSL ) {
			$sslverify = false;
		}
		if ( class_exists( 'WP_Http' ) ) {
			$args = array(
				'method' => 'POST',
				'body' => $xml,
				'headers' => $this->headers,
				'sslverify' => $sslverify,
				);
			if ( $this->timeout )
				$args['timeout'] = $this->timeout;

			$http = new WP_Http();
			if ( $this->ssl )
				$url = sprintf( 'https://%s%s', $this->server, $this->path );
			else
				$url = sprintf( 'http://%s%s', $this->server, $this->path );

			$result = $http->request( $url, $args );
			if ( is_wp_error( $result ) ) {
				foreach( $result->errors as $type => $messages ) {
					$this->error = new IXR_Error(
						-32702,
						sprintf( 'WP_Http error: %s, %s', $type, $messages[0] )
					);
					break;
				}
				return false;
			} else if ( $result['response']['code'] > 299 || $result['response']['code'] < 200 ) {
				$this->error = new IXR_Error(
					-32701,
					sprintf( 'Server rejected request (HTTP response: %s %s)', $result['response']['code'], $result['response']['message'])
				);
				return false;
			}
			// Now parse what we've got back
			$this->message = new IXR_Message( $result['body'] );
		} else {
			foreach( $this->headers as $header => $value ) {
				$request .= "{$header}: {$value}{$r}";
			}
			$request .= $r;

			$request .= $xml;
			// Now send the request
			if ( $this->ssl )
				$host = 'ssl://'.$this->server;
			else
				$host = $this->server;
			if ($this->timeout) {
				$fp = @fsockopen( $host, $this->port, $errno, $errstr, $this->timeout );
			} else {
				$fp = @fsockopen( $host, $this->port, $errno, $errstr );
			}
			if (!$fp) {
				$this->error = new IXR_Error( -32300, "Transport error - could not open socket: $errno $errstr" );
				return false;
			}
			fputs( $fp, $request );

			$contents = '';
			$gotFirstLine = false;
			$gettingHeaders = true;

			while ( !feof($fp) ) {
				$line = fgets( $fp, 4096 );
				if ( !$gotFirstLine ) {
					// Check line for '200'
					if ( strstr($line, '200') === false ) {
						$this->error = new IXR_Error( -32301, 'transport error - HTTP status code was not 200' );
						return false;
					}
					$gotFirstLine = true;
				}
				if ( trim($line) == '' ) {
					$gettingHeaders = false;
				}
				if ( !$gettingHeaders ) {
					$contents .= trim( $line );
				}
			}
			// Now parse what we've got back
			$this->message = new IXR_Message( $contents );
		}
		if ( !$this->message->parse() ) {
			// XML error
			$this->error = new IXR_Error( -32700, 'parse error. not well formed' );
			return false;
		}
		// Is the message a fault?
		if ( $this->message->messageType == 'fault' ) {
			$this->error = new IXR_Error( $this->message->faultCode, $this->message->faultString );
			return false;
		}
		// Message must be OK
		return true;
	}
}
