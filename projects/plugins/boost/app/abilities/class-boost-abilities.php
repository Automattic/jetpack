<?php
/**
 * Jetpack Boost Abilities Registration
 *
 * Registers Jetpack Boost abilities with the WordPress Abilities API so AI
 * agents can read module state, toggle modules, fetch the latest speed score,
 * and clear the page cache through the standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Abilities;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Automattic\Jetpack_Boost\Modules\Features_Index;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;

/**
 * Registers Jetpack Boost abilities with the WordPress Abilities API.
 *
 * Surface (4 abilities, all under the `jetpack-boost/` namespace):
 *
 * - get-modules        — filtered read of every Boost module + submodule.
 * - set-module-status  — declarative toggle, idempotent.
 * - get-speed-score    — latest mobile/desktop scores from history.
 * - clear-page-cache   — flush the Boost page cache for the home URL.
 *
 * @since 4.6.0
 */
class Boost_Abilities extends Registrar {

	/**
	 * @inheritDoc
	 */
	public static function get_category_slug(): string {
		return 'jetpack-boost';
	}

	/**
	 * @inheritDoc
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack Boost" is a product name and is not translated.
			'label'       => 'Jetpack Boost',
			'description' => __( 'Abilities for inspecting and managing Jetpack Boost performance modules, speed scores, and page cache.', 'jetpack-boost' ),
		);
	}

	/**
	 * @inheritDoc
	 */
	public static function get_abilities(): array {
		$module_object_schema = array(
			'type'       => 'object',
			'properties' => array(
				'slug'       => array( 'type' => 'string' ),
				'active'     => array( 'type' => 'boolean' ),
				'available'  => array( 'type' => 'boolean' ),
				'optimizing' => array( 'type' => 'boolean' ),
			),
		);

		return array(
			'jetpack-boost/get-modules'       => array(
				'label'               => __( 'Get Boost modules', 'jetpack-boost' ),
				'description'         => __( 'List Jetpack Boost performance modules and submodules. Returns an array of { slug, active, available, optimizing }. Slugs use underscores (e.g. "critical_css", "page_cache", "image_cdn"). Pass slug to fetch a single module (returns a 0- or 1-element array; unknown slugs yield an empty array, never an error). Pass status to filter by active/inactive/available/optimizing. Use the returned slugs as input to jetpack-boost/set-module-status.', 'jetpack-boost' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'slug'   => array(
							'type'        => 'string',
							'description' => __( 'Return a single module by its slug (e.g. "critical_css", "page_cache"). Unknown slugs yield an empty array.', 'jetpack-boost' ),
							'minLength'   => 1,
						),
						'status' => array(
							'type'        => 'string',
							'description' => __( 'Filter by lifecycle state. "active" = enabled by the user. "inactive" = available but disabled. "available" = currently loadable on this site (regardless of enabled state). "optimizing" = active and currently serving optimized output.', 'jetpack-boost' ),
							'enum'        => array( 'active', 'inactive', 'available', 'optimizing' ),
						),
						'search' => array(
							'type'        => 'string',
							'description' => __( 'Case-insensitive substring match against the module slug.', 'jetpack-boost' ),
							'minLength'   => 1,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $module_object_schema,
				),
				'execute_callback'    => array( __CLASS__, 'get_modules' ),
				'permission_callback' => array( __CLASS__, 'can_view_modules' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
				),
			),

			'jetpack-boost/set-module-status' => array(
				'label'               => __( 'Set Boost module status', 'jetpack-boost' ),
				'description'         => __( 'Enable or disable a single Jetpack Boost module by slug. Required: { slug, active }. Returns { slug, active, changed }. Idempotent: setting a module to its current state returns changed=false. Slugs use underscores (e.g. "critical_css", "page_cache"). Unknown slugs return jetpack_boost_invalid_slug; modules not loadable on this site return jetpack_boost_module_unavailable; always-on modules cannot be disabled and return jetpack_boost_module_always_on — call jetpack-boost/get-modules to enumerate available slugs. Toggling a parent module also drives submodule lifecycle.', 'jetpack-boost' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'slug', 'active' ),
					'properties'           => array(
						'slug'   => array(
							'type'        => 'string',
							'description' => __( 'Module slug to toggle (e.g. "critical_css", "page_cache").', 'jetpack-boost' ),
							'minLength'   => 1,
						),
						'active' => array(
							'type'        => 'boolean',
							'description' => __( 'Desired state: true to enable, false to disable.', 'jetpack-boost' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'slug'    => array( 'type' => 'string' ),
						'active'  => array( 'type' => 'boolean' ),
						'changed' => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'set_module_status' ),
				'permission_callback' => array( __CLASS__, 'can_manage_modules' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
				),
			),

			'jetpack-boost/get-speed-score'   => array(
				'label'               => __( 'Get latest speed score', 'jetpack-boost' ),
				'description'         => __( 'Return the most recent Jetpack Boost speed score for the home URL. Returns { mobile, desktop, timestamp, is_stale, has_history }. mobile/desktop are integers 0-100 (Google PageSpeed scale) or null when no score has been recorded. timestamp is a Unix epoch in seconds. is_stale=true means the latest score is older than 24 hours or invalidated by a site change; agents should request a refresh from the Boost UI before quoting it. has_history=false means no scores have been recorded yet.', 'jetpack-boost' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'mobile'      => array( 'type' => array( 'integer', 'null' ) ),
						'desktop'     => array( 'type' => array( 'integer', 'null' ) ),
						'timestamp'   => array( 'type' => array( 'integer', 'null' ) ),
						'is_stale'    => array( 'type' => 'boolean' ),
						'has_history' => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_speed_score' ),
				'permission_callback' => array( __CLASS__, 'can_view_modules' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
				),
			),

			'jetpack-boost/clear-page-cache'  => array(
				'label'               => __( 'Clear page cache', 'jetpack-boost' ),
				'description'         => __( 'Clear every cached page under the site home URL. Idempotent: re-running on an empty cache is a no-op. Returns { cleared, message }. cleared=true means the clear request was dispatched against an active page_cache module; it does not promise that cached files actually existed (the underlying API does not surface a count). Requires the page_cache module to be active; if it is not, returns jetpack_boost_page_cache_inactive — enable it first via jetpack-boost/set-module-status with slug="page_cache".', 'jetpack-boost' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'cleared' => array( 'type' => 'boolean' ),
						'message' => array( 'type' => 'string' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'clear_page_cache' ),
				'permission_callback' => array( __CLASS__, 'can_manage_modules' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
				),
			),
		);
	}

	/**
	 * Permission check for read-only abilities.
	 *
	 * Boost has no domain-specific capability; every existing Boost surface
	 * gates on `manage_options`. We mirror that here so abilities are no more
	 * (or less) permissive than the REST and admin surfaces.
	 *
	 * @since 4.6.0
	 */
	public static function can_view_modules(): bool {
		return is_user_logged_in() && current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for write abilities.
	 *
	 * @since 4.6.0
	 */
	public static function can_manage_modules(): bool {
		return is_user_logged_in() && current_user_can( 'manage_options' );
	}

	/**
	 * Cache for `build_module_index()`. Module construction touches options for
	 * every feature, so we memoise per-request — both `get_modules()` and
	 * `set_module_status()` consume the same map.
	 *
	 * @var array<string, Module>|null
	 */
	private static $module_index_cache = null;

	/**
	 * Build a `Module` instance for every feature + submodule, keyed by slug.
	 *
	 * @return array<string, Module>
	 */
	private static function build_module_index(): array {
		if ( null !== self::$module_index_cache ) {
			return self::$module_index_cache;
		}

		$index = array();
		foreach ( Features_Index::get_all_features() as $feature_class ) {
			$module                       = new Module( new $feature_class() );
			$index[ $module->get_slug() ] = $module;
		}

		self::$module_index_cache = $index;
		return $index;
	}

	private static function render_module( Module $module ): array {
		return array(
			'slug'       => $module->get_slug(),
			'active'     => $module->is_available() && $module->is_enabled(),
			'available'  => $module->is_available(),
			'optimizing' => $module->is_optimizing(),
		);
	}

	/**
	 * Execute: filtered read of Boost modules.
	 *
	 * @since 4.6.0
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function get_modules( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		$index = self::build_module_index();

		// Single-slug short-circuit — return 0- or 1-element array, same shape as the list case.
		// A non-string slug is invalid input (not "unknown"); rejecting it prevents the bad-shape
		// fall-through where slug:123 would silently return every module.
		if ( isset( $input['slug'] ) ) {
			if ( ! is_string( $input['slug'] ) ) {
				return new \WP_Error(
					'jetpack_boost_invalid_slug',
					__( 'The slug parameter must be a string.', 'jetpack-boost' )
				);
			}
			if ( '' !== $input['slug'] ) {
				return isset( $index[ $input['slug'] ] )
					? array( self::render_module( $index[ $input['slug'] ] ) )
					: array();
			}
		}

		$status_filter = isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status']
			? $input['status']
			: null;
		$search_filter = isset( $input['search'] ) && is_string( $input['search'] ) && '' !== $input['search']
			? $input['search']
			: null;

		$out = array();
		foreach ( $index as $slug => $module ) {
			$rendered = self::render_module( $module );

			if ( null !== $status_filter ) {
				$matches = false;
				switch ( $status_filter ) {
					case 'active':
						$matches = $rendered['active'];
						break;
					case 'inactive':
						$matches = $rendered['available'] && ! $rendered['active'];
						break;
					case 'available':
						$matches = $rendered['available'];
						break;
					case 'optimizing':
						$matches = $rendered['optimizing'];
						break;
				}
				if ( ! $matches ) {
					continue;
				}
			}

			// Boost slugs are ASCII snake_case; stripos is sufficient and avoids ext-mbstring.
			if ( null !== $search_filter && false === stripos( $slug, $search_filter ) ) {
				continue;
			}

			$out[] = $rendered;
		}

		// Deterministic ordering — agents diff results across calls.
		usort(
			$out,
			static function ( $a, $b ) {
				return strcmp( $a['slug'], $b['slug'] );
			}
		);

		return $out;
	}

	/**
	 * Execute: declarative module toggle. Idempotent.
	 *
	 * @since 4.6.0
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function set_module_status( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Required-id validation: not empty(), so "0" remains a legal slug if a future module ever uses it.
		if ( ! isset( $input['slug'] ) || ! is_string( $input['slug'] ) || '' === $input['slug'] ) {
			return new \WP_Error(
				'jetpack_boost_missing_slug',
				__( 'A module slug is required. Call jetpack-boost/get-modules to enumerate available slugs.', 'jetpack-boost' )
			);
		}
		if ( ! array_key_exists( 'active', $input ) ) {
			return new \WP_Error(
				'jetpack_boost_missing_active',
				__( 'A desired active state (boolean) is required.', 'jetpack-boost' )
			);
		}
		if ( ! is_bool( $input['active'] ) ) {
			return new \WP_Error(
				'jetpack_boost_invalid_active',
				__( 'The active parameter must be a boolean. Strings like "true" / "false" are not accepted.', 'jetpack-boost' )
			);
		}

		$slug    = $input['slug'];
		$desired = $input['active'];
		$index   = self::build_module_index();

		if ( ! isset( $index[ $slug ] ) ) {
			return new \WP_Error(
				'jetpack_boost_invalid_slug',
				__( 'Unknown Boost module slug. Call jetpack-boost/get-modules to enumerate available slugs.', 'jetpack-boost' )
			);
		}

		$module = $index[ $slug ];

		if ( ! $module->is_available() ) {
			return new \WP_Error(
				'jetpack_boost_module_unavailable',
				__( 'This module is not available on this site (e.g. requires a connection or a paid plan).', 'jetpack-boost' )
			);
		}

		// Always-on modules ignore the persisted option at runtime. Writing here would leave
		// on-disk state diverged from runtime state with no rollback, so refuse the write up front.
		if ( $module->is_always_on() ) {
			if ( $desired ) {
				return array(
					'slug'    => $slug,
					'active'  => true,
					'changed' => false,
				);
			}
			return new \WP_Error(
				'jetpack_boost_module_always_on',
				__( 'This module is always on and cannot be disabled.', 'jetpack-boost' )
			);
		}

		$current = $module->is_enabled();
		if ( $desired === $current ) {
			return array(
				'slug'    => $slug,
				'active'  => $current,
				'changed' => false,
			);
		}

		if ( ! $module->update( $desired ) ) {
			return new \WP_Error(
				'jetpack_boost_module_update_failed',
				__( 'Failed to persist the module status.', 'jetpack-boost' )
			);
		}

		/**
		 * Fires when a module is enabled or disabled through the abilities surface.
		 *
		 * Mirrors the action emitted by `Modules_State_Entry::set()` so submodule
		 * lifecycle handlers fire identically regardless of caller.
		 *
		 * @param string $module_slug The module slug.
		 * @param bool   $is_active   The new state.
		 */
		do_action( 'jetpack_boost_module_status_updated', $slug, $desired );

		return array(
			'slug'    => $slug,
			'active'  => $desired,
			'changed' => true,
		);
	}

	/**
	 * Execute: latest speed score for the home URL.
	 *
	 * @since 4.6.0
	 *
	 * @param array|null $input Unused; ability has no inputs.
	 * @return array
	 */
	public static function get_speed_score( $input = null ) {
		unset( $input );

		$history = new Speed_Score_History( home_url() );
		$latest  = $history->latest();

		if ( null === $latest ) {
			return array(
				'mobile'      => null,
				'desktop'     => null,
				'timestamp'   => null,
				'is_stale'    => false,
				'has_history' => false,
			);
		}

		// `scores` may be stored as either an associative array or stdClass depending on
		// the API response payload. Normalise to array before reading.
		$scores  = isset( $latest['scores'] ) ? (array) $latest['scores'] : array();
		$mobile  = isset( $scores['mobile'] ) && is_numeric( $scores['mobile'] ) ? (int) $scores['mobile'] : null;
		$desktop = isset( $scores['desktop'] ) && is_numeric( $scores['desktop'] ) ? (int) $scores['desktop'] : null;

		return array(
			'mobile'      => $mobile,
			'desktop'     => $desktop,
			'timestamp'   => isset( $latest['timestamp'] ) ? (int) $latest['timestamp'] : null,
			'is_stale'    => $history->is_stale(),
			'has_history' => true,
		);
	}

	/**
	 * Execute: clear the Boost page cache for the home URL.
	 *
	 * @since 4.6.0
	 *
	 * @param array|null $input Unused; ability has no inputs.
	 * @return array|\WP_Error
	 */
	public static function clear_page_cache( $input = null ) {
		unset( $input );

		$page_cache = new Module( new Page_Cache() );
		if ( ! $page_cache->is_available() || ! $page_cache->is_enabled() ) {
			return new \WP_Error(
				'jetpack_boost_page_cache_inactive',
				__( 'The page_cache module is not active. Enable it first via jetpack-boost/set-module-status with slug="page_cache" and active=true.', 'jetpack-boost' )
			);
		}

		$cache = new Boost_Cache();
		// Boost_Cache::delete_recursive() returns void — no useful success/no-op signal
		// to surface to the agent. Reporting `cleared: true` after a successful module-active
		// gate is the most honest answer we can give.
		$cache->delete_recursive( home_url() );

		return array(
			'cleared' => true,
			'message' => __( 'Page cache cleared.', 'jetpack-boost' ),
		);
	}
}
