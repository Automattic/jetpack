<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Security Ability Class
 *
 * Provides read-only access to user security settings and authentication status
 */
class UserSecurityAbility implements AbilityInterface {
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
			'label'               => 'User Security',
			'description'         => 'View user security settings, authentication methods, and account security status (read-only)',
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
				'action' => array(
					'type'        => 'string',
					'enum'        => array( 'get_status', 'list_sessions', 'get_login_history' ),
					'default'     => 'get_status',
					'description' => 'Security action to perform',
				),
				'limit'  => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'default'     => 10,
					'description' => 'Number of items to return for lists',
				),
				'days'   => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 90,
					'default'     => 30,
					'description' => 'Number of days for login history',
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
				'success'         => array( 'type' => 'boolean' ),
				'security_status' => array(
					'type'       => 'object',
					'properties' => array(
						'two_factor_enabled'    => array( 'type' => 'boolean' ),
						'enhanced_security'     => array( 'type' => 'boolean' ),
						'application_passwords' => array( 'type' => 'integer' ),
						'active_sessions'       => array( 'type' => 'integer' ),
						'last_login'            => array( 'type' => 'string' ),
						'account_age_days'      => array( 'type' => 'integer' ),
						'security_score'        => array( 'type' => 'integer' ),
					),
				),
				'two_factor'      => array(
					'type'       => 'object',
					'properties' => array(
						'enabled'           => array( 'type' => 'boolean' ),
						'methods'           => array( 'type' => 'array' ),
						'backup_codes'      => array( 'type' => 'integer' ),
						'enhanced_security' => array( 'type' => 'boolean' ),
					),
				),
				'sessions'        => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'session_id' => array( 'type' => 'string' ),
							'ip_address' => array( 'type' => 'string' ),
							'user_agent' => array( 'type' => 'string' ),
							'location'   => array( 'type' => 'string' ),
							'last_seen'  => array( 'type' => 'string' ),
							'is_current' => array( 'type' => 'boolean' ),
						),
					),
				),
				'app_passwords'   => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'uuid'      => array( 'type' => 'string' ),
							'app_id'    => array( 'type' => 'string' ),
							'name'      => array( 'type' => 'string' ),
							'created'   => array( 'type' => 'string' ),
							'last_used' => array( 'type' => 'string' ),
							'last_ip'   => array( 'type' => 'string' ),
						),
					),
				),
				'login_history'   => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'timestamp'  => array( 'type' => 'string' ),
							'ip_address' => array( 'type' => 'string' ),
							'user_agent' => array( 'type' => 'string' ),
							'location'   => array( 'type' => 'string' ),
							'method'     => array( 'type' => 'string' ),
							'status'     => array( 'type' => 'string' ),
						),
					),
				),
			),
		);
	}
}
