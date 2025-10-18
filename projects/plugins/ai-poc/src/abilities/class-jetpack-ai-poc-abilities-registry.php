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
		add_action( 'abilities_api_init', array( $this, 'register_ability_categories' ), 5 );
		add_action( 'abilities_api_init', array( $this, 'register_core_abilities' ), 10 );
	}

	/**
	 * Register ability categories.
	 */
	public function register_ability_categories() {
		// Check if the function exists (it should be available after abilities_api_init).
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			'jetpack-modules',
			array(
				'label'       => __( 'Jetpack Modules', 'jetpack-ai-poc' ),
				'description' => __( 'Manage Jetpack modules', 'jetpack-ai-poc' ),
			)
		);

		wp_register_ability_category(
			'jetpack-stats',
			array(
				'label'       => __( 'Jetpack Stats', 'jetpack-ai-poc' ),
				'description' => __( 'Retrieve Jetpack statistics', 'jetpack-ai-poc' ),
			)
		);
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
				'category'            => 'jetpack-modules',
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

		// Register toggle-module ability.
		wp_register_ability(
			'jetpack-ai-poc/toggle-module',
			array(
				'label'               => __( 'Toggle Jetpack Module', 'jetpack-ai-poc' ),
				'description'         => __( 'Enable or disable ANY Jetpack module by its slug (e.g., "verification-tools", "stats", "sso", "related-posts", "monitor", "protect"). Use this tool whenever a user asks to turn on/off, enable/disable, or activate/deactivate any Jetpack module. Module slug examples: verification-tools, stats, contact-form, subscriptions, videopress.', 'jetpack-ai-poc' ),
				'category'            => 'jetpack-modules',
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'module' => array(
							'type'        => 'string',
							'description' => 'The Jetpack module slug. Common modules: "verification-tools", "stats", "related-posts", "sso", "contact-form", "subscriptions", "monitor", "protect", "videopress"',
						),
						'action' => array(
							'type'        => 'string',
							'description' => 'Action to perform: "enable" to turn on/activate the module, "disable" to turn off/deactivate the module',
							'enum'        => array( 'enable', 'disable' ),
						),
					),
					'required'             => array( 'module', 'action' ),
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
						'module'  => array(
							'type'        => 'object',
							'description' => 'Module details',
						),
					),
				),
				'execute_callback'    => array( 'Jetpack_AI_POC_Ability_Toggle_Module', 'execute' ),
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

		// Register stats ability.
		wp_register_ability(
			'jetpack-ai-poc/stats',
			array(
				'label'               => __( 'Get Jetpack Stats', 'jetpack-ai-poc' ),
				'description'         => __( 'Retrieve Jetpack Stats data for the site. You can specify the period and number of days to retrieve.', 'jetpack-ai-poc' ),
				'category'            => 'jetpack-stats',
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'period' => array(
							'type'        => 'string',
							'description' => 'Period type for stats',
							'enum'        => array( 'day', 'week', 'month' ),
							'default'     => 'day',
						),
						'days'   => array(
							'type'        => 'integer',
							'description' => 'Number of days to retrieve',
							'default'     => 7,
							'minimum'     => 1,
							'maximum'     => 90,
						),
					),
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
							'description' => 'Formatted stats message',
						),
						'data'    => array(
							'type'        => 'object',
							'description' => 'Raw stats data',
						),
					),
				),
				'execute_callback'    => array( 'Jetpack_AI_POC_Ability_Stats', 'execute' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}
}
