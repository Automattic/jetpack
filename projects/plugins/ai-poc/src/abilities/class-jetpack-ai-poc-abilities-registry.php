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
 * Manages registration and execution of WordPress abilities.
 */
class Jetpack_AI_POC_Abilities_Registry {

	/**
	 * Registered abilities.
	 *
	 * @var array
	 */
	private static $abilities = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_core_abilities();
	}

	/**
	 * Register core abilities.
	 */
	private function register_core_abilities() {
		// Register site-security ability
		$this->register_ability(
			'jetpack-ai-poc/site-security',
			array(
				'name'        => 'Site Security',
				'description' => 'Toggle Account Protection and Downtime Monitor modules for enhanced site security',
				'callback'    => array( 'Jetpack_AI_POC_Ability_Site_Security', 'execute' ),
				'capability'  => 'manage_options', // Only admins
			)
		);
	}

	/**
	 * Register an ability.
	 *
	 * @param string $name Ability name (namespaced).
	 * @param array  $args Ability arguments.
	 * @return bool
	 */
	public function register_ability( $name, $args ) {
		$defaults = array(
			'name'        => '',
			'description' => '',
			'callback'    => null,
			'capability'  => 'manage_options',
		);

		$ability = wp_parse_args( $args, $defaults );

		if ( ! is_callable( $ability['callback'] ) ) {
			return false;
		}

		self::$abilities[ $name ] = $ability;
		return true;
	}

	/**
	 * Execute an ability.
	 *
	 * @param string $name Ability name.
	 * @param array  $args Arguments to pass to the ability.
	 * @return array Result with success status and data.
	 */
	public static function execute_ability( $name, $args = array() ) {
		if ( ! isset( self::$abilities[ $name ] ) ) {
			return array(
				'success' => false,
				'message' => 'Ability not found: ' . $name,
			);
		}

		$ability = self::$abilities[ $name ];

		// Check capability
		if ( ! current_user_can( $ability['capability'] ) ) {
			return array(
				'success' => false,
				'message' => 'Insufficient permissions to execute this ability',
			);
		}

		// Execute the ability
		try {
			$result = call_user_func( $ability['callback'], $args );
			return $result;
		} catch ( Exception $e ) {
			return array(
				'success' => false,
				'message' => 'Error executing ability: ' . $e->getMessage(),
			);
		}
	}

	/**
	 * Get all registered abilities.
	 *
	 * @return array
	 */
	public static function get_abilities() {
		return self::$abilities;
	}

	/**
	 * Get a specific ability.
	 *
	 * @param string $name Ability name.
	 * @return array|null
	 */
	public static function get_ability( $name ) {
		return isset( self::$abilities[ $name ] ) ? self::$abilities[ $name ] : null;
	}
}
