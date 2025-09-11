<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities\User;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Connections Ability Class
 *
 * Provides read-only access to user's social media and service connections
 */
class UserConnectionsAbility implements AbilityInterface {
	use AbilityTrait;

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		wp_register_ability(
			$this->get_ability_name(),
			$this->get_config()
		);
	}

	/**
	 * Get the ability configuration array.
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array {
		return array(
			'label'               => 'User Connections',
			'description'         => 'View and monitor social media and third-party service connections (read-only)',
			'input_schema'        => $this->get_input_schema(),
			'output_schema'       => $this->get_output_schema(),
			'execute_callback'    => array( $this, 'execute' ),
			'permission_callback' => array( $this, 'check_permission' ),
		);
	}

	/**
	 * Get the input schema for the ability.
	 *
	 * @return array The input schema.
	 */
	private function get_input_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'action'               => array(
					'type'        => 'string',
					'enum'        => array( 'list', 'get', 'test' ),
					'default'     => 'list',
					'description' => 'Action to perform',
				),
				'connection_id'        => array(
					'type'        => 'integer',
					'description' => 'Connection ID for get/test actions',
				),
				'service'              => array(
					'type'        => 'string',
					'description' => 'Filter connections by service name',
				),
				'status'               => array(
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive', 'error' ),
					'description' => 'Filter connections by status',
				),
				'force_refresh'        => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Force refresh connection data from external services',
				),
				'include_capabilities' => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include detailed capability information',
				),
			),
			'required'   => array( 'action' ),
		);
	}

	/**
	 * Get the output schema for the ability.
	 *
	 * @return array The output schema.
	 */
	private function get_output_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success'     => array( 'type' => 'boolean' ),
				'connections' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'               => array( 'type' => 'integer' ),
							'service'          => array( 'type' => 'string' ),
							'service_label'    => array( 'type' => 'string' ),
							'external_id'      => array( 'type' => 'string' ),
							'external_name'    => array( 'type' => 'string' ),
							'external_display' => array( 'type' => 'string' ),
							'status'           => array( 'type' => 'string' ),
							'connected_date'   => array( 'type' => 'string' ),
							'last_tested'      => array( 'type' => 'string' ),
							'capabilities'     => array( 'type' => 'array' ),
							'health'           => array(
								'type'       => 'object',
								'properties' => array(
									'status'      => array( 'type' => 'string' ),
									'last_error'  => array( 'type' => 'string' ),
									'error_count' => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'total'       => array( 'type' => 'integer' ),
				'summary'     => array(
					'type'       => 'object',
					'properties' => array(
						'total_connections'    => array( 'type' => 'integer' ),
						'active_connections'   => array( 'type' => 'integer' ),
						'services_connected'   => array( 'type' => 'array' ),
						'last_connection_test' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}
}
