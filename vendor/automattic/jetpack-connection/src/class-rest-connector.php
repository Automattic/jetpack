<?php
/**
 * Sets up the Connection REST API endpoints.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Registers the REST routes for Connections.
 */
class REST_Connector {
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

		// Register a site.
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
	 * Handles verification that a site is registered.
	 *
	 * @since 5.4.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return string|WP_Error
	 */
	public function verify_registration( \WP_REST_Request $request ) {
		$registration_data = array( $request['secret_1'], $request['state'] );

		return $this->connection->handle_registration( $registration_data );
	}
}
