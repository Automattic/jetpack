<?php
/**
 * @package jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

class REST_Connector {
	private $connection;

	public function __construct( Manager $connection ) {
		$this->connection = $connection;

		// Register a site
		register_rest_route(
			'jetpack/v4',
			'/verify_registration',
			array(
				'methods'  => \WP_REST_Server::EDITABLE,
				'callback' => array( $this, 'verify_registration' ),
			)
		);
	}

	/**
	 * Handles verification that a site is registered
	 *
	 * @since 5.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	public function verify_registration( \WP_REST_Request $request ) {
		$registration_data = array( $request['secret_1'], $request['state'] );

		return $this->connection->handle_registration( $registration_data );
	}
}
