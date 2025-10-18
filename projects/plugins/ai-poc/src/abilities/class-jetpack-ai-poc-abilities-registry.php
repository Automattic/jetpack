<?php
/**
 * WordPress Abilities Registry for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Abilities_Registry
 *
 * Manages registration and execution of WordPress abilities using the official WordPress Abilities API.
 */
class Jetpack_AI_POC_Abilities_Registry {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'abilities_api_init', array( $this, 'register_core_abilities' ) );
	}

	/**
	 * Register core abilities.
	 */
	public function register_core_abilities() {
		// Register site-security ability using official WordPress Abilities API.
		wp_register_ability(
			'jetpack-ai-poc/site-security',
			array(
				'label'               => __( 'Site Security', 'jetpack-ai-poc' ),
				'description'         => __( 'Toggle Jetpack Account Protection and Monitor modules for enhanced site security. Use "enable" action to activate security features or "disable" to deactivate them.', 'jetpack-ai-poc' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'action' => array(
							'type'        => 'string',
							'description' => 'Action to perform: enable or disable',
							'enum'        => array( 'enable', 'disable' ),
						),
					),
					'required'             => array( 'action' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => 'Whether the operation succeeded',
						),
						'message' => array(
							'type'        => 'string',
							'description' => 'Result message',
						),
						'modules' => array(
							'type'        => 'object',
							'description' => 'Status of affected modules',
						),
					),
				),
				'execute_callback'    => array( 'Jetpack_AI_POC_Ability_Site_Security', 'execute' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}
}
