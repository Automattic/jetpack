<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Helper for MCP (Model Context Protocol) abilities metadata and storage.
 *
 * Centralizes read/write of the mcp_abilities site option for both WPCOM
 * settings and Jetpack REST API. Uses the local registry when available
 * (WordPress.com), or fetches from WordPress.com API on self-hosted sites.
 *
 * @package automattic/jetpack
 */

// Disable direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Jetpack_MCP_Abilities class.
 *
 * @since $$next-version$$
 */
class Jetpack_MCP_Abilities {

	/**
	 * Option name for storing MCP abilities.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'mcp_abilities';

	/**
	 * Transient key for caching abilities fetched from WordPress.com API.
	 *
	 * @var string
	 */
	const TRANSIENT_KEY = 'jetpack_mcp_abilities_from_api';

	/**
	 * Cache duration in seconds (1 hour).
	 *
	 * @var int
	 */
	const CACHE_DURATION = 3600;

	/**
	 * Get list of all site-level MCP ability names.
	 *
	 * Uses local registry on WordPress.com, or fetches from WordPress.com API
	 * on self-hosted Jetpack sites.
	 *
	 * @return array List of ability names.
	 */
	public static function get_all_ability_names() {
		$all_abilities = self::get_abilities_from_registry();

		if ( empty( $all_abilities ) ) {
			$all_abilities = self::get_ability_names_from_api();
		}

		return apply_filters( 'jetpack_site_mcp_abilities', $all_abilities );
	}

	/**
	 * Get ability metadata.
	 *
	 * Uses local registry on WordPress.com, or fetches from WordPress.com API
	 * on self-hosted Jetpack sites.
	 *
	 * @param string $ability_name Ability name, e.g. wpcom-mcp/posts-search.
	 * @return array Metadata with title, description, category, type, enabled (default).
	 */
	public static function get_ability_metadata( $ability_name ) {
		$ability_meta = self::get_metadata_from_registry( $ability_name );

		if ( empty( $ability_meta ) ) {
			$ability_meta = self::get_metadata_from_api( $ability_name );
		}

		return apply_filters( 'jetpack_site_mcp_ability_meta', $ability_meta, $ability_name );
	}

	/**
	 * Get ability names from the local wpcom-mcp registry (WordPress.com only).
	 *
	 * @return array List of ability names.
	 */
	private static function get_abilities_from_registry() {
		$ability_registry_file = WP_CONTENT_DIR . '/mu-plugins/wpcom-mcp/includes/AbilitiesRegistry/Registry/AbilityRegistry.php';

		if ( ! file_exists( $ability_registry_file ) ) {
			return array();
		}

		require_once $ability_registry_file;
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		$abilities_resources = Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_resources_for_server( 'site-level' );
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		$abilities_tools = Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_tools_for_server( 'site-level' );
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		$abilities_prompts = Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_prompts_for_server( 'site-level' );

		return array_merge( $abilities_resources, $abilities_tools, $abilities_prompts );
	}

	/**
	 * Get ability metadata from the local registry (WordPress.com only).
	 *
	 * @param string $ability_name Ability name.
	 * @return array Metadata or empty array.
	 */
	private static function get_metadata_from_registry( $ability_name ) {
		$ability_registry_file = WP_CONTENT_DIR . '/mu-plugins/wpcom-mcp/includes/AbilitiesRegistry/Registry/AbilityRegistry.php';

		if ( ! file_exists( $ability_registry_file ) ) {
			return array();
		}

		require_once $ability_registry_file;
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		return Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_metadata( $ability_name );
	}

	/**
	 * Fetch MCP abilities from WordPress.com API and cache the result.
	 *
	 * Expected API response format:
	 * {
	 *   "abilities": [
	 *     {
	 *       "name": "wpcom-mcp/posts-search",
	 *       "title": "Posts search",
	 *       "description": "Search posts",
	 *       "category": "search",
	 *       "type": "tool",
	 *       "enabled": true
	 *     }
	 *   ]
	 * }
	 *
	 * @return array Cached abilities keyed by name, or empty array on failure.
	 */
	private static function fetch_abilities_from_api() {
		$site_id = Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return array();
		}

		$cached = get_transient( self::TRANSIENT_KEY );
		if ( false !== $cached && is_array( $cached ) ) {
			return $cached;
		}

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/mcp-abilities?force=wpcom', $site_id ),
			'1.1',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );
		$data = $body ? json_decode( $body, true ) : null;

		if ( ! is_array( $data ) || empty( $data['abilities'] ) || ! is_array( $data['abilities'] ) ) {
			return array();
		}

		$by_name = array();
		foreach ( $data['abilities'] as $ability ) {
			if ( empty( $ability['name'] ) || ! is_string( $ability['name'] ) ) {
				continue;
			}
			$by_name[ $ability['name'] ] = array(
				'title'       => $ability['title'] ?? '',
				'description' => $ability['description'] ?? '',
				'category'    => $ability['category'] ?? '',
				'type'        => $ability['type'] ?? '',
				'enabled'     => ! empty( $ability['enabled'] ),
			);
		}

		set_transient( self::TRANSIENT_KEY, $by_name, self::CACHE_DURATION );

		return $by_name;
	}

	/**
	 * Get ability names from WordPress.com API (for self-hosted sites).
	 *
	 * @return array List of ability names.
	 */
	private static function get_ability_names_from_api() {
		$cached = self::fetch_abilities_from_api();

		return array_keys( $cached );
	}

	/**
	 * Get ability metadata from cached API response (for self-hosted sites).
	 *
	 * @param string $ability_name Ability name.
	 * @return array Metadata or empty array.
	 */
	private static function get_metadata_from_api( $ability_name ) {
		$cached = self::fetch_abilities_from_api();

		return $cached[ $ability_name ] ?? array();
	}

	/**
	 * Get MCP abilities for the current site in a format suitable for REST/UI.
	 *
	 * Returns an associative array of ability_name => 1|0 (enabled state).
	 * Merges stored values with registry defaults.
	 *
	 * @return array{string:int} Map of ability name to 1 (enabled) or 0 (disabled).
	 */
	public static function get_abilities_for_rest() {
		$current = get_option( self::OPTION_NAME, array() );
		if ( ! is_array( $current ) ) {
			$current = array();
		}

		$all_ability_names = self::get_all_ability_names();
		if ( empty( $all_ability_names ) ) {
			return array();
		}

		$result = array();
		foreach ( $all_ability_names as $ability_name ) {
			$meta                    = self::get_ability_metadata( $ability_name );
			$default                 = ! empty( $meta['enabled'] );
			$enabled                 = isset( $current[ $ability_name ] )
				? (bool) $current[ $ability_name ]
				: $default;
			$result[ $ability_name ] = $enabled ? 1 : 0;
		}

		return $result;
	}

	/**
	 * Get computed abilities with full metadata (for WPCOM-style responses).
	 *
	 * @return array List of ability objects with name, title, description, category, type, enabled.
	 */
	public static function get_abilities_with_metadata() {
		$abilities = self::get_abilities_for_rest();
		$result    = array();

		foreach ( $abilities as $ability_name => $enabled ) {
			$meta = self::get_ability_metadata( $ability_name );
			if ( ! empty( $meta ) ) {
				$result[ $ability_name ] = array(
					'name'        => $ability_name,
					'title'       => $meta['title'] ?? '',
					'description' => $meta['description'] ?? '',
					'category'    => $meta['category'] ?? '',
					'type'        => $meta['type'] ?? '',
					'enabled'     => (bool) $enabled,
				);
			}
		}

		return $result;
	}

	/**
	 * Set MCP abilities for the current site.
	 *
	 * @param array $value Map of ability_name => enabled (1, 0, true, false). Invalid entries are filtered out.
	 * @return true|WP_Error
	 */
	public static function set_abilities( $value ) {
		if ( ! is_array( $value ) ) {
			return new WP_Error(
				'invalid_format',
				__( 'Site MCP abilities must be an array', 'jetpack' )
			);
		}

		$all_ability_names = self::get_all_ability_names();

		// Filter to only known abilities.
		$filtered = array();
		foreach ( $value as $ability_name => $enabled ) {
			if ( ! is_string( $ability_name ) || ! in_array( $ability_name, $all_ability_names, true ) ) {
				continue;
			}
			// Normalize to 1 or 0.
			$filtered[ $ability_name ] = (bool) $enabled ? 1 : 0;
		}

		update_option( self::OPTION_NAME, $filtered );

		return true;
	}
}
