<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Registry;

/**
 * Centralized Ability Registry
 *
 * Loads configuration from abilities-config.php and provides
 * a single source of truth for all ability names and metadata
 */
final class AbilityRegistry {

	/**
	 * Cached ability configuration
	 *
	 * @var array|null
	 */
	private static $config = null;

	/**
	 * Load ability configuration from file
	 */
	private static function load_config(): array {
		if ( null === self::$config ) {
			$config_file = __DIR__ . '/../abilities-config.php';

			self::$config = require $config_file;
		}

		return self::$config;
	}

	/**
	 * Get all ability names
	 */
	public static function get_all_names(): array {
		return array_keys( self::load_config() );
	}

	/**
	 * Get abilities by type (tool, resource, prompt)
	 */
	public static function get_abilities_by_type( string $type ): array {
		$config = self::load_config();

		return array_filter(
			$config,
			fn( $metadata ) => $metadata['type'] === $type
		);
	}

	/**
	 * Get abilities by server group
	 */
	public static function get_abilities_by_server( string $server_name ): array {
		$config    = self::load_config();
		$abilities = array();

		foreach ( $config as $name => $metadata ) {
			if ( in_array( $server_name, $metadata['servers'], true ) ) {
				$abilities[ $name ] = $metadata;
			}
		}

		/**
		 * Filter abilities available for a specific server.
		 *
		 * Allows external code to enable/disable abilities per server.
		 * For now, this filter doesn't modify the abilities list.
		 *
		 * @param array  $abilities   Array of abilities keyed by ability name
		 * @param string $server_name The server name being queried
		 */
		return apply_filters( 'wpcom_mcp_abilities_for_server', $abilities, $server_name );
	}

	/**
	 * Get ability names for server
	 */
	public static function get_names_for_server( string $server_name ): array {
		return array_keys( self::get_abilities_by_server( $server_name ) );
	}

	/**
	 * Get tools for server
	 */
	public static function get_tools_for_server( string $server_name ): array {
		$abilities = self::get_abilities_by_server( $server_name );

		return array_keys( array_filter( $abilities, fn( $metadata ) => 'tool' === $metadata['type'] ) );
	}

	/**
	 * Get resources for server
	 */
	public static function get_resources_for_server( string $server_name ): array {
		$abilities = self::get_abilities_by_server( $server_name );

		return array_keys( array_filter( $abilities, fn( $metadata ) => 'resource' === $metadata['type'] ) );
	}

	/**
	 * Get prompts for server
	 */
	public static function get_prompts_for_server( string $server_name ): array {
		$abilities = self::get_abilities_by_server( $server_name );

		return array_keys( array_filter( $abilities, fn( $metadata ) => 'prompt' === $metadata['type'] ) );
	}

	/**
	 * Get ability metadata
	 */
	public static function get_metadata( string $ability_name ): ?array {
		$config = self::load_config();

		return $config[ $ability_name ] ?? null;
	}

	/**
	 * Get executor class for ability
	 */
	public static function get_executor_class( string $ability_name ): ?string {
		$metadata = self::get_metadata( $ability_name );

		return $metadata['executor'] ?? null;
	}

	/**
	 * Get ability class for ability name
	 */
	public static function get_ability_class( string $ability_name ): ?string {
		$metadata = self::get_metadata( $ability_name );

		return $metadata['class'] ?? null;
	}

	/**
	 * Check if ability exists
	 */
	public static function has_ability( string $ability_name ): bool {
		$config = self::load_config();

		return isset( $config[ $ability_name ] );
	}

	/**
	 * Get resource URI for ability
	 */
	public static function get_resource_uri( string $ability_name ): string {
		return 'WordPress://' . $ability_name;
	}

	/**
	 * Get ability name constant for a class
	 *
	 * This allows abilities to self-identify their name without hardcoding
	 */
	public static function get_name_for_class( string $class_name ): ?string {
		$config = self::load_config();

		foreach ( $config as $name => $metadata ) {
			if ( $metadata['class'] === $class_name ) {
				return $name;
			}
		}

		return null;
	}
}
