<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Traits;

use Automattic\WpcomMcp\AbilitiesRegistry\Factories\ExecutorFactory;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry;

/**
 * Ability Delegation Trait
 *
 * Combines functionality for self-identification and executor delegation.
 * This trait provides a unified approach for abilities to identify themselves
 * and delegate execution to their executors.
 */
trait AbilityTrait {

	/**
	 * Cache for ability name to avoid repeated lookups.
	 *
	 * @var string|null
	 */
	private ?string $ability_name_cache = null;

	/**
	 * Get the ability name for this class.
	 *
	 * @return string The ability name.
	 * @throws \RuntimeException If ability name is not found in configuration.
	 */
	public function get_ability_name(): string {
		if ( null === $this->ability_name_cache ) {
			$this->ability_name_cache = AbilityRegistry::get_name_for_class( static::class );

			if ( null === $this->ability_name_cache ) {
				throw new \RuntimeException(
					sprintf( 'Ability name not found for class %s. Check abilities-config.php', static::class )
				);
			}
		}

		return $this->ability_name_cache;
	}

	/**
	 * Execute the ability by delegating to its executor.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return \WP_Error|array The execution result or error.
	 */
	public function execute( array $input = array() ): \WP_Error|array {
		$executor = $this->get_executor();

		if ( is_wp_error( $executor ) ) {
			return $executor;
		}

		return $executor->execute( $input );
	}

	/**
	 * Check permission by delegating to the executor.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		$executor = $this->get_executor();

		if ( is_wp_error( $executor ) ) {
			// Log the error for debugging but return false for permissions
			return false;
		}

		return $executor->check_permission( $input );
	}

	/**
	 * Get the executor instance for this ability.
	 *
	 * @return ExecutorInterface|\WP_Error The executor instance or error.
	 */
	private function get_executor(): ExecutorInterface|\WP_Error {
		$ability_name = $this->get_ability_name();
		$executor     = ExecutorFactory::instance()->create_executor( $ability_name );

		if ( ! $executor ) {
			return new \WP_Error(
				'executor_unavailable',
				sprintf(
					'Cannot execute the ability %s.',
					$ability_name
				),
				array(
					'status'  => 500,
					'ability' => $ability_name,
				)
			);
		}

		return $executor;
	}
}
