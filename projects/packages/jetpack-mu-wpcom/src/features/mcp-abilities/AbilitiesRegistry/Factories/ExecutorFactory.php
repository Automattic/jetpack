<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Factories;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry;

/**
 * Executor Factory
 *
 * Creates executor instances on-demand using configuration from abilities-config.php
 * No hardcoded ability names - everything comes from the config file
 */
class ExecutorFactory {
	/**
	 * Singleton instance.
	 *
	 * @var ExecutorFactory|null
	 */
	private static ?ExecutorFactory $instance = null;

	/**
	 * Cache of created executor instances.
	 *
	 * @var array<string, ExecutorInterface>
	 */
	private array $executor_cache = array();

	/**
	 * Get the singleton instance.
	 *
	 * @return ExecutorFactory The factory instance.
	 */
	public static function instance(): ExecutorFactory {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Create an executor instance for the given ability.
	 *
	 * @param string $ability_name The name of the ability.
	 * @return ExecutorInterface|null The executor instance or null if not found.
	 */
	public function create_executor( string $ability_name ): ?ExecutorInterface {
		// Return cached instance if available
		if ( isset( $this->executor_cache[ $ability_name ] ) ) {
			return $this->executor_cache[ $ability_name ];
		}

		// Get executor class from registry (no hardcoded mapping!)
		$executor_class = AbilityRegistry::get_executor_class( $ability_name );

		if ( ! $executor_class ) {
			return null; // No executor defined for this ability
		}

		// Lazy load the executor class
		if ( ! class_exists( $executor_class ) ) {
			return null;
		}

		// Create and cache the executor
		$executor = new $executor_class();
		if ( $executor instanceof ExecutorInterface ) {
			$this->executor_cache[ $ability_name ] = $executor;

			return $executor;
		}

		return null;
	}

	/**
	 * Check if an executor exists for the given ability.
	 *
	 * @param string $ability_name The name of the ability.
	 * @return bool True if executor exists, false otherwise.
	 */
	public function has_executor( string $ability_name ): bool {
		return null !== AbilityRegistry::get_executor_class( $ability_name );
	}

	/**
	 * Get all available executors (for debugging/testing)
	 */
	public function get_available_executors(): array {
		$executors = array();

		foreach ( AbilityRegistry::get_all_names() as $ability_name ) {
			$executor_class = AbilityRegistry::get_executor_class( $ability_name );
			if ( $executor_class ) {
				$executors[ $ability_name ] = $executor_class;
			}
		}

		return $executors;
	}
}
