<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Factories;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\Jetpack\AbilitiesRegistry\Registry\AbilityRegistry;

/**
 * Executor Factory
 *
 * Creates executor instances on-demand using configuration from abilities-config.php
 * No hardcoded ability names - everything comes from the config file
 */
class ExecutorFactory {
	/**
	 * Factory instance
	 *
	 * @var ExecutorFactory|null
	 */
	private static $instance = null;
	
	/**
	 * Executor cache
	 *
	 * @var array
	 */
	private $executor_cache = array();

	public static function instance(): ExecutorFactory {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

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
