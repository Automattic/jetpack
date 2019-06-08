<?php
/**
 * @package jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

class XMLRPC_Connector {
	private $connection;

	public function __construct( Manager $connection ) {
		$this->connection = $connection;

		add_filter( 'xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
	}

	public function xmlrpc_methods( $methods ) {
		return array_merge(
			$methods,
			array(
				'jetpack.verifyRegistration' => array( $this, 'verify_registration' ),
			)
		);
	}

	public function verify_registration( $registration_data ) {
		return $this->output( $this->connection->handle_registration( $registration_data ) );
	}

	private function output( $data ) {
		if ( is_wp_error( $data ) ) {
			$code = $data->get_error_data();
			if ( ! $code ) {
				$code = -10520;
			}

			return new \IXR_Error(
				$code,
				sprintf( 'Jetpack: [%s] %s', $data->get_error_code(), $data->get_error_message() )
			);
		}

		return $data;
	}
}
