<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use WP_Error;

/**
 * User Connections Executor Class
 *
 * Handles execution logic for user connections ability
 */
class UserConnectionsExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user connections ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return WP_Error|array The connections data or error.
	 */
	public function execute( array $input = array() ): WP_Error|array {
		try {
			$action = ValidationHelper::validate_action(
				$input['action'] ?? 'list',
				array( 'list', 'get', 'test' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			return match ( $action ) {
				'list' => $this->list_connections( $input ),
				'get' => $this->get_connection( $input['connection_id'] ?? 0 ),
				'test' => $this->test_connection( $input['connection_id'] ?? 0 ),
				default => $this->create_error( 'invalid_action', 'Invalid action specified' ),
			};
		} catch ( Exception $e ) {
			return $this->create_error(
				'connections_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user connections ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

	/**
	 * List user connections
	 *
	 * @param array $params Input parameters.
	 *
	 * @return WP_Error|array Connections list or error.
	 */
	private function list_connections( array $params ): WP_Error|array {
		// In a real WordPress.com environment, this would use the connections API
		// For now, we'll simulate the response with placeholder data.
		$connections = $this->get_user_connections_data();

		if ( is_wp_error( $connections ) ) {
			return $connections;
		}

		// Apply filters.
		$filtered_connections = $this->apply_connection_filters( $connections, $params );

		return array(
			'success'     => true,
			'connections' => $filtered_connections,
			'total'       => count( $filtered_connections ),
			'summary'     => $this->generate_connections_summary( $filtered_connections ),
		);
	}

	/**
	 * Get a specific connection
	 *
	 * @param int $connection_id Connection ID.
	 *
	 * @return WP_Error|array Connection data or error.
	 */
	private function get_connection( int $connection_id ): WP_Error|array {
		$validated_id = $this->validate_connection_id( $connection_id );
		if ( is_wp_error( $validated_id ) ) {
			return $validated_id;
		}

		// Simulate getting a specific connection.
		$connections = $this->get_user_connections_data();
		if ( is_wp_error( $connections ) ) {
			return $connections;
		}

		$connection = array_filter( $connections, fn( $conn ) => $conn['id'] === $connection_id );

		if ( empty( $connection ) ) {
			return $this->create_error( 'connection_not_found', 'Connection not found', 404 );
		}

		return array(
			'success'    => true,
			'connection' => array_values( $connection )[0],
		);
	}

	/**
	 * Test a connection's health
	 *
	 * @param int $connection_id Connection ID.
	 *
	 * @return WP_Error|array Test results or error.
	 */
	private function test_connection( int $connection_id ): WP_Error|array {
		$validated_id = $this->validate_connection_id( $connection_id );
		if ( is_wp_error( $validated_id ) ) {
			return $validated_id;
		}

		// Get the connection first.
		$connection_result = $this->get_connection( $connection_id );
		if ( is_wp_error( $connection_result ) ) {
			return $connection_result;
		}

		$connection = $connection_result['connection'];

		// Simulate connection test.
		$test_result = $this->perform_connection_test( $connection );

		return array(
			'success'       => true,
			'connection_id' => $connection_id,
			'service'       => $connection['service'],
			'test_result'   => $test_result,
			'tested_at'     => gmdate( 'c' ),
		);
	}

	/**
	 * Get user connections data (placeholder implementation)
	 *
	 * @return WP_Error|array Connections data or error.
	 */
	private function get_user_connections_data(): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();

		// This is placeholder data - in a real implementation, this would come from the WordPress.com API.
		$connections = array(
			array(
				'id'               => 1,
				'service'          => 'twitter',
				'service_label'    => 'Twitter',
				'external_id'      => '123456789',
				'external_name'    => 'example_user',
				'external_display' => '@example_user',
				'status'           => 'active',
				'connected_date'   => '2023-01-15T10:30:00Z',
				'last_tested'      => '2024-01-01T12:00:00Z',
				'capabilities'     => array( 'publish', 'read_timeline' ),
				'health'           => array(
					'status'      => 'healthy',
					'last_error'  => '',
					'error_count' => 0,
				),
			),
			array(
				'id'               => 2,
				'service'          => 'facebook',
				'service_label'    => 'Facebook',
				'external_id'      => '987654321',
				'external_name'    => 'John Doe',
				'external_display' => 'John Doe',
				'status'           => 'inactive',
				'connected_date'   => '2023-03-20T14:15:00Z',
				'last_tested'      => '2023-12-15T08:30:00Z',
				'capabilities'     => array( 'publish_posts', 'read_insights' ),
				'health'           => array(
					'status'      => 'warning',
					'last_error'  => 'Token expired',
					'error_count' => 3,
				),
			),
			array(
				'id'               => 3,
				'service'          => 'linkedin',
				'service_label'    => 'LinkedIn',
				'external_id'      => '456789123',
				'external_name'    => 'John Doe',
				'external_display' => 'John Doe - Professional Profile',
				'status'           => 'active',
				'connected_date'   => '2023-06-10T09:45:00Z',
				'last_tested'      => '2024-01-02T15:20:00Z',
				'capabilities'     => array( 'share_content', 'read_profile' ),
				'health'           => array(
					'status'      => 'healthy',
					'last_error'  => '',
					'error_count' => 0,
				),
			),
		);

		return $connections;
	}

	/**
	 * Apply filters to connections list
	 *
	 * @param array $connections Array of connections.
	 * @param array $params Filter parameters.
	 *
	 * @return array Filtered connections.
	 */
	private function apply_connection_filters( array $connections, array $params ): array {
		// Filter by service.
		if ( ! empty( $params['service'] ) ) {
			$connections = array_filter(
				$connections,
				fn( $conn ) => $conn['service'] === $params['service']
			);
		}

		// Filter by status.
		if ( ! empty( $params['status'] ) ) {
			$connections = array_filter(
				$connections,
				fn( $conn ) => $conn['status'] === $params['status']
			);
		}

		return array_values( $connections );
	}

	/**
	 * Generate connections summary
	 *
	 * @param array $connections Array of connections.
	 *
	 * @return array Summary data.
	 */
	private function generate_connections_summary( array $connections ): array {
		$total_connections  = count( $connections );
		$active_connections = count( array_filter( $connections, fn( $conn ) => 'active' === $conn['status'] ) );
		$services_connected = array_unique( array_column( $connections, 'service' ) );

		// Find most recent test date.
		$last_test_dates      = array_filter( array_column( $connections, 'last_tested' ) );
		$last_connection_test = $last_test_dates ? max( $last_test_dates ) : '';

		return array(
			'total_connections'    => $total_connections,
			'active_connections'   => $active_connections,
			'services_connected'   => $services_connected,
			'last_connection_test' => $last_connection_test,
		);
	}

	/**
	 * Perform a connection test (placeholder implementation)
	 *
	 * @param array $connection Connection data.
	 *
	 * @return array Test result.
	 */
	private function perform_connection_test( array $connection ): array {
		// This is a placeholder implementation
		// In a real environment, this would test the actual connection to the external service.

		$is_healthy = 'active' === $connection['status'] && 'healthy' === $connection['health']['status'];

		return array(
			'status'        => $is_healthy ? 'success' : 'failed',
			'response_time' => wp_rand( 100, 500 ) . 'ms',
			'message'       => $is_healthy ? 'Connection is healthy' : 'Connection has issues',
			'details'       => array(
				'can_authenticate' => $is_healthy,
				'can_post'         => $is_healthy && in_array( 'publish', $connection['capabilities'], true ),
				'token_valid'      => $is_healthy,
			),
		);
	}
}
