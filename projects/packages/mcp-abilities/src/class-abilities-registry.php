<?php
/**
 * MCP Abilities Registry
 *
 * @package automattic/jetpack-mcp-abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registry for managing MCP (Model Context Protocol) abilities.
 *
 * This class provides a centralized way to register, manage, and query
 * MCP abilities that users can access through the Model Context Protocol.
 *
 * This registry works in conjunction with the wordpress/mcp-adapter package,
 * which provides the WordPress Abilities API functionality.
 *
 * @since $$next-version$$
 */
class Abilities_Registry {

	/**
	 * Singleton instance.
	 *
	 * @var Abilities_Registry
	 */
	private static $instance = null;

	/**
	 * Registered abilities.
	 *
	 * @var array<string, Ability>
	 */
	private $abilities = array();

	/**
	 * Get the singleton instance.
	 *
	 * @return Abilities_Registry
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		// Initialize the registry
		$this->init();
	}

	/**
	 * Initialize the registry.
	 *
	 * @return void
	 */
	private function init() {
		// Check if MCP adapter is available
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		// Load abilities from configuration file
		$this->load_abilities_from_config();

		// Allow other plugins and themes to register abilities
		do_action( 'jetpack_mcp_abilities_init', $this );
	}

	/**
	 * Load abilities from the configuration file.
	 *
	 * This method loads the abilities configuration and creates Ability objects
	 * for querying and filtering purposes. The actual registration with WordPress
	 * Abilities API is handled by the individual ability classes.
	 *
	 * @return void
	 */
	private function load_abilities_from_config() {
		$config_file = __DIR__ . '/AbilitiesRegistry/abilities-config.php';

		if ( ! file_exists( $config_file ) ) {
			return;
		}

		$abilities_config = include $config_file;

		if ( ! is_array( $abilities_config ) ) {
			return;
		}

		foreach ( $abilities_config as $name => $config ) {
			// Convert the config format to match our Ability class expectations
			$ability_args = array(
				'title'        => $config['title'] ?? '',
				'description'  => $config['description'] ?? '',
				'category'     => $config['category'] ?? 'general',
				'type'         => $config['type'] ?? 'tool',
				'enabled'      => $config['enabled'] ?? true,
				'capabilities' => $config['capabilities'] ?? array(),
				'callback'     => $config['callback'] ?? null,
			);

			// Add additional metadata from the config
			$metadata = array();
			if ( isset( $config['class'] ) ) {
				$metadata['class'] = $config['class'];
			}
			if ( isset( $config['executor'] ) ) {
				$metadata['executor'] = $config['executor'];
			}
			if ( isset( $config['servers'] ) ) {
				$metadata['servers'] = $config['servers'];
			}

			// Add any other config keys as metadata
			foreach ( $config as $key => $value ) {
				if ( ! in_array( $key, array( 'title', 'description', 'category', 'type', 'enabled', 'capabilities', 'callback', 'class', 'executor', 'servers' ), true ) ) {
					$metadata[ $key ] = $value;
				}
			}

			$ability_args['metadata'] = $metadata;

			$this->register( $name, $ability_args );
		}
	}

	/**
	 * Register a new ability.
	 *
	 * @param string $name The unique name of the ability.
	 * @param array  $args {
	 *     Array of ability arguments.
	 *
	 *     @type string $title       The human-readable title of the ability.
	 *     @type string $description The description of what the ability does.
	 *     @type string $category    The category this ability belongs to.
	 *     @type string $type        The type of ability (tool, resource, etc.).
	 *     @type bool   $enabled     Whether the ability is enabled by default.
	 *     @type array  $capabilities Required capabilities to use this ability.
	 *     @type callable $callback  Optional callback function for the ability.
	 * }
	 * @return bool True if the ability was registered successfully, false otherwise.
	 */
	public function register( $name, $args = array() ) {
		if ( empty( $name ) || ! is_string( $name ) ) {
			return false;
		}

		// Check if ability already exists
		if ( isset( $this->abilities[ $name ] ) ) {
			return false;
		}

		// Create the ability object
		$ability = new Ability( $name, $args );

		// Validate the ability
		if ( ! $ability->is_valid() ) {
			return false;
		}

		// Register the ability
		$this->abilities[ $name ] = $ability;

		/**
		 * Fires after an ability is registered.
		 *
		 * @param string $name   The name of the ability.
		 * @param Ability $ability The ability object.
		 */
		do_action( 'jetpack_mcp_ability_registered', $name, $ability );

		return true;
	}

	/**
	 * Unregister an ability.
	 *
	 * @param string $name The name of the ability to unregister.
	 * @return bool True if the ability was unregistered successfully, false otherwise.
	 */
	public function unregister( $name ) {
		if ( ! isset( $this->abilities[ $name ] ) ) {
			return false;
		}

		$ability = $this->abilities[ $name ];
		unset( $this->abilities[ $name ] );

		/**
		 * Fires after an ability is unregistered.
		 *
		 * @param string $name   The name of the ability.
		 * @param Ability $ability The ability object.
		 */
		do_action( 'jetpack_mcp_ability_unregistered', $name, $ability );

		return true;
	}

	/**
	 * Get a specific ability by name.
	 *
	 * @param string $name The name of the ability.
	 * @return Ability|null The ability object or null if not found.
	 */
	public function get_ability( $name ) {
		return isset( $this->abilities[ $name ] ) ? $this->abilities[ $name ] : null;
	}

	/**
	 * Get all registered abilities.
	 *
	 * @param array $args {
	 *     Optional arguments to filter abilities.
	 *
	 *     @type string $category Filter by category.
	 *     @type string $type     Filter by type.
	 *     @type bool   $enabled  Filter by enabled status.
	 *     @type int    $user_id  Filter by user capabilities.
	 *     @type string $server   Filter by server type.
	 * }
	 * @return array<string, Ability> Array of ability objects.
	 */
	public function get_abilities( $args = array() ) {
		$abilities = $this->abilities;

		// Apply filters
		if ( ! empty( $args['category'] ) ) {
			$abilities = array_filter(
				$abilities,
				function ( $ability ) use ( $args ) {
					return $ability->get_category() === $args['category'];
				}
			);
		}

		if ( ! empty( $args['type'] ) ) {
			$abilities = array_filter(
				$abilities,
				function ( $ability ) use ( $args ) {
					return $ability->get_type() === $args['type'];
				}
			);
		}

		if ( isset( $args['enabled'] ) ) {
			$abilities = array_filter(
				$abilities,
				function ( $ability ) use ( $args ) {
					return $ability->is_enabled() === $args['enabled'];
				}
			);
		}

		if ( ! empty( $args['user_id'] ) ) {
			$abilities = array_filter(
				$abilities,
				function ( $ability ) use ( $args ) {
					return $ability->user_can_access( $args['user_id'] );
				}
			);
		}

		if ( ! empty( $args['server'] ) ) {
			$abilities = array_filter(
				$abilities,
				function ( $ability ) use ( $args ) {
					$servers = $ability->get_metadata( 'servers', array() );
					return in_array( $args['server'], $servers, true );
				}
			);
		}

		/**
		 * Filter the list of abilities.
		 *
		 * @param array<string, Ability> $abilities Array of ability objects.
		 * @param array                  $args      Filter arguments.
		 */
		return apply_filters( 'jetpack_mcp_abilities', $abilities, $args );
	}

	/**
	 * Get ability names only.
	 *
	 * @param array $args Optional arguments to filter abilities (same as get_abilities).
	 * @return array<string> Array of ability names.
	 */
	public function get_ability_names( $args = array() ) {
		$abilities = $this->get_abilities( $args );
		return array_keys( $abilities );
	}

	/**
	 * Check if an ability is registered.
	 *
	 * @param string $name The name of the ability.
	 * @return bool True if the ability is registered, false otherwise.
	 */
	public function is_registered( $name ) {
		return isset( $this->abilities[ $name ] );
	}

	/**
	 * Get the total number of registered abilities.
	 *
	 * @return int The number of registered abilities.
	 */
	public function count() {
		return count( $this->abilities );
	}

	/**
	 * Get abilities for a specific server type.
	 *
	 * @param string $server The server type (e.g., 'default', 'site-level').
	 * @param array  $args   Optional additional filter arguments.
	 * @return array<string, Ability> Array of ability objects.
	 */
	public function get_abilities_for_server( $server, $args = array() ) {
		$args['server'] = $server;
		return $this->get_abilities( $args );
	}

	/**
	 * Get all available server types from registered abilities.
	 *
	 * @return array<string> Array of unique server types.
	 */
	public function get_available_servers() {
		$servers = array();

		foreach ( $this->abilities as $ability ) {
			$ability_servers = $ability->get_metadata( 'servers', array() );
			$servers         = array_merge( $servers, $ability_servers );
		}

		return array_unique( $servers );
	}

	/**
	 * Get the raw abilities configuration.
	 *
	 * @return array The abilities configuration array.
	 */
	public function get_config() {
		$config_file = __DIR__ . '/AbilitiesRegistry/abilities-config.php';

		if ( ! file_exists( $config_file ) ) {
			return array();
		}

		$abilities_config = include $config_file;

		return is_array( $abilities_config ) ? $abilities_config : array();
	}

	/**
	 * Get abilities configuration for a specific server.
	 *
	 * @param string $server The server type (e.g., 'default', 'site-level').
	 * @return array The filtered abilities configuration.
	 */
	public function get_config_for_server( $server ) {
		$config = $this->get_config();

		return array_filter(
			$config,
			function ( $ability_config ) use ( $server ) {
				$servers = $ability_config['servers'] ?? array();
				return in_array( $server, $servers, true );
			}
		);
	}

	/**
	 * Check if the MCP adapter is available.
	 *
	 * @return bool True if MCP adapter is available, false otherwise.
	 */
	public function is_mcp_adapter_available() {
		return function_exists( 'wp_register_ability' );
	}

	/**
	 * Clear all registered abilities.
	 *
	 * @return void
	 */
	public function clear() {
		$this->abilities = array();
	}
}
