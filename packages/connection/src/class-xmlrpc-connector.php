<?php
/**
 * Sets up the Connection XML-RPC methods.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Registers the XML-RPC methods for Connections.
 */
class XMLRPC_Connector {
	/**
	 * The Connection Manager.
	 *
	 * @var Manager
	 */
	private $connection;

	/**
	 * Constructor.
	 *
	 * @param Manager $connection The Connection Manager.
	 */
	public function __construct( Manager $connection ) {
		$this->connection = $connection;

		// Adding the filter late to avoid being overwritten by Jetpack's XMLRPC server.
		add_filter( 'xmlrpc_methods', array( $this, 'xmlrpc_methods' ), 20 );
	}

	/**
	 * Attached to the `xmlrpc_methods` filter.
	 *
	 * @param array $methods The already registered XML-RPC methods.
	 * @return array
	 */
	public function xmlrpc_methods( $methods ) {
		return array_merge(
			$methods,
			array(
				'jetpack.verifyRegistration' => array( $this, 'verify_registration' ),
				'jetpack.remoteAuthorize'    => array( $this, 'remote_authorize' ),
			)
		);
	}

	/**
	 * Handles verification that a site is registered.
	 *
	 * @param array $registration_data The data sent by the XML-RPC client:
	 *                                 [ $secret_1, $user_id ].
	 *
	 * @return string|IXR_Error
	 */
	public function verify_registration( $registration_data ) {
		return $this->output( $this->connection->handle_registration( $registration_data ) );
	}

	/**
	 * Handles user authorization.
	 *
	 * @param array $request The request array.
	 *
	 * @return array|\IXR_Error Returns an array containing 'result'=>'authorized' on success.
	 *                          Returns an IXR_Error on failure.
	 */
	public function remote_authorize( $request ) {
		return $this->output( $this->connection->handle_authorization( $request ) );
	}

	/**
	 * Normalizes output for XML-RPC.
	 *
	 * @param mixed $data The data to output.
	 */
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
