<?php
/**
 * Jetpack Modules Abilities Registration
 *
 * Registers Jetpack module management abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;

/**
 * Registers Jetpack module management abilities with the WordPress Abilities API.
 *
 * Exposes a filtered read (`get-modules`) and a declarative state-setter
 * (`set-module-status`) so AI agents can discover and toggle Jetpack modules
 * through the standard `wp-abilities/v1` REST surface.
 */
class Modules_Abilities extends Registrar {

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'jetpack';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack',
			'description' => __( 'Abilities exposed by the Jetpack plugin.', 'jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		$module_schema = array(
			'type'       => 'object',
			'properties' => array(
				'slug'                     => array( 'type' => 'string' ),
				'name'                     => array( 'type' => 'string' ),
				'description'              => array( 'type' => 'string' ),
				'active'                   => array( 'type' => 'boolean' ),
				'sort'                     => array( 'type' => 'integer' ),
				'feature'                  => array(
					'type'  => 'array',
					'items' => array( 'type' => 'string' ),
				),
				'plan_classes'             => array(
					'type'  => 'array',
					'items' => array( 'type' => 'string' ),
				),
				'requires_connection'      => array( 'type' => 'boolean' ),
				'requires_user_connection' => array( 'type' => 'boolean' ),
				'auto_activate'            => array( 'type' => 'string' ),
			),
		);

		return array(
			'jetpack/get-modules'       => array(
				'label'               => __( 'Get Jetpack modules', 'jetpack' ),
				'description'         => __( 'Return zero or more Jetpack modules as an array. Each element has { slug, name, description, active, sort, feature, plan_classes, requires_connection, requires_user_connection, auto_activate }. Combine slug / active / feature / search filters to narrow the list. When slug is provided and unknown, the result is an empty array (not an error). Use this before calling jetpack/set-module-status to enumerate legal slugs.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'slug'    => array(
							'type'        => 'string',
							'description' => __( 'Return a single module by slug. Unknown slugs yield an empty array.', 'jetpack' ),
							'minLength'   => 1,
						),
						'active'  => array(
							'type'        => 'boolean',
							'description' => __( 'When set, only return modules whose current active state matches this value.', 'jetpack' ),
						),
						'feature' => array(
							'type'        => 'string',
							'description' => __( 'Case-insensitive match against a module\'s feature tag (e.g. "Recommended", "Security", "Performance").', 'jetpack' ),
							'minLength'   => 1,
						),
						'search'  => array(
							'type'        => 'string',
							'description' => __( 'Case-insensitive substring match against the module name, slug, and description.', 'jetpack' ),
							'minLength'   => 1,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $module_schema,
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
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),

			'jetpack/set-module-status' => array(
				'label'               => __( 'Set Jetpack module status', 'jetpack' ),
				'description'         => __( 'Set a Jetpack module\'s active state. Idempotent — setting a module to its current state returns changed=false. Returns { slug, active, changed }. Call jetpack/get-modules first to enumerate valid slugs. Modules requiring a Jetpack connection or a paid plan may fail with jetpack_modules_activate_failed; the message indicates the next step.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'slug', 'active' ),
					'properties'           => array(
						'slug'   => array(
							'type'        => 'string',
							'description' => __( 'The Jetpack module slug (e.g. "stats", "sso", "sharedaddy").', 'jetpack' ),
							'minLength'   => 1,
						),
						'active' => array(
							'type'        => 'boolean',
							'description' => __( 'Desired active state. true activates the module; false deactivates it.', 'jetpack' ),
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
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),
		);
	}

	/**
	 * Permission check: can the current user read module listings?
	 *
	 * Mirrors the capability used by the Jetpack admin page so subscribers and
	 * contributors are denied.
	 */
	public static function can_view_modules(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/**
	 * Permission check: can the current user toggle modules?
	 */
	public static function can_manage_modules(): bool {
		return current_user_can( 'jetpack_manage_modules' )
			&& current_user_can( 'jetpack_activate_modules' );
	}

	/**
	 * Build the high-signal summary shape used by `get-modules`.
	 *
	 * Adapts the raw `Jetpack::get_module()` array down to the fields agents
	 * actually consume — dropping internal bookkeeping like `module_tags`,
	 * changelog URLs, and file paths. Applies the site's current locale to
	 * `name` and `description` so agent-facing output mirrors what a user
	 * would see in the admin UI.
	 *
	 * @param string $slug      Module slug.
	 * @param bool   $is_active Whether the module is currently active. Passed in to avoid
	 *                          O(N) calls to the `jetpack_active_modules` filter in a list loop.
	 * @return array|null Compact module entry, or null when the module has no info.
	 */
	private static function summarize_module( $slug, $is_active ) {
		$mod = Jetpack::get_module( $slug );
		if ( ! is_array( $mod ) ) {
			return null;
		}

		$i18n = function_exists( 'jetpack_get_module_i18n' ) ? jetpack_get_module_i18n( $slug ) : array();
		$name = isset( $i18n['name'] ) ? (string) $i18n['name'] : ( isset( $mod['name'] ) ? (string) $mod['name'] : $slug );
		$desc = isset( $i18n['description'] ) ? (string) $i18n['description'] : ( isset( $mod['description'] ) ? (string) $mod['description'] : '' );

		return array(
			'slug'                     => $slug,
			'name'                     => $name,
			'description'              => $desc,
			'active'                   => $is_active,
			'sort'                     => isset( $mod['sort'] ) ? (int) $mod['sort'] : 10,
			'feature'                  => isset( $mod['feature'] ) && is_array( $mod['feature'] ) ? array_values( $mod['feature'] ) : array(),
			'plan_classes'             => isset( $mod['plan_classes'] ) && is_array( $mod['plan_classes'] ) ? array_values( $mod['plan_classes'] ) : array(),
			'requires_connection'      => ! empty( $mod['requires_connection'] ),
			'requires_user_connection' => ! empty( $mod['requires_user_connection'] ),
			'auto_activate'            => isset( $mod['auto_activate'] ) ? (string) $mod['auto_activate'] : 'No',
		);
	}

	/**
	 * Consolidated read callback. Returns an array of module summaries.
	 *
	 * When `slug` is provided, returns a 0- or 1-element array; unknown slugs
	 * yield an empty array rather than a `WP_Error` so the shape is uniform.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array
	 */
	public static function get_modules( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Fetch the active-slug map once per call — `Jetpack::is_module_active()` fires the
		// user-extensible `jetpack_active_modules` filter on each call, so looking up
		// active state per-module in a loop amplifies any hook cost by N.
		$active_map = array_flip( Jetpack::get_active_modules() );

		// Narrow the candidate set up front when `slug` is supplied; remaining
		// filters (active / feature / search) still apply so combinations like
		// { slug: 'stats', active: false } correctly return an empty array when
		// stats is active.
		if ( isset( $input['slug'] ) && is_string( $input['slug'] ) && '' !== $input['slug'] ) {
			if ( ! Jetpack::is_module( $input['slug'] ) ) {
				return array();
			}
			$candidate_slugs = array( $input['slug'] );
		} else {
			$candidate_slugs = Jetpack::get_available_modules();
		}

		$active_filter  = array_key_exists( 'active', $input ) && is_bool( $input['active'] ) ? $input['active'] : null;
		$feature_filter = isset( $input['feature'] ) && is_string( $input['feature'] ) && '' !== $input['feature']
			? strtolower( $input['feature'] )
			: null;
		$search_filter  = isset( $input['search'] ) && is_string( $input['search'] ) && '' !== $input['search']
			? strtolower( $input['search'] )
			: null;

		$out = array();
		foreach ( $candidate_slugs as $slug ) {
			$summary = self::summarize_module( $slug, isset( $active_map[ $slug ] ) );
			if ( null === $summary ) {
				continue;
			}

			if ( null !== $active_filter && $summary['active'] !== $active_filter ) {
				continue;
			}

			if ( null !== $feature_filter ) {
				$features_lower = array_map( 'strtolower', $summary['feature'] );
				if ( ! in_array( $feature_filter, $features_lower, true ) ) {
					continue;
				}
			}

			if ( null !== $search_filter ) {
				$haystack = strtolower( $summary['slug'] . ' ' . $summary['name'] . ' ' . $summary['description'] );
				if ( false === strpos( $haystack, $search_filter ) ) {
					continue;
				}
			}

			$out[] = $summary;
		}

		usort(
			$out,
			static function ( $a, $b ) {
				if ( $a['sort'] === $b['sort'] ) {
					return strcmp( $a['slug'], $b['slug'] );
				}
				return $a['sort'] <=> $b['sort'];
			}
		);

		return $out;
	}

	/**
	 * Declarative state-setter callback. Idempotent: returns changed=false
	 * when the desired state already matches current state.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function set_module_status( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['slug'] ) || ! is_string( $input['slug'] ) || '' === $input['slug'] ) {
			return new \WP_Error(
				'jetpack_modules_missing_slug',
				__( 'A module slug is required. Call jetpack/get-modules to enumerate valid slugs.', 'jetpack' )
			);
		}

		if ( ! array_key_exists( 'active', $input ) ) {
			return new \WP_Error(
				'jetpack_modules_missing_active',
				__( 'A desired active state (boolean) is required.', 'jetpack' )
			);
		}
		if ( ! is_bool( $input['active'] ) ) {
			return new \WP_Error(
				'jetpack_modules_invalid_active',
				__( 'The active parameter must be a boolean. Strings like "true" / "false" are not accepted.', 'jetpack' )
			);
		}

		$slug    = $input['slug'];
		$desired = $input['active'];

		if ( ! Jetpack::is_module( $slug ) ) {
			return new \WP_Error(
				'jetpack_modules_invalid_slug',
				__( 'Unknown Jetpack module slug. Call jetpack/get-modules to enumerate valid slugs.', 'jetpack' )
			);
		}

		$current = Jetpack::is_module_active( $slug );

		if ( $desired === $current ) {
			return array(
				'slug'    => $slug,
				'active'  => $current,
				'changed' => false,
			);
		}

		if ( $desired ) {
			// Preflight: Jetpack::activate_module() ignores its $exit/$redirect flags when a
			// conflicting standalone plugin (e.g. WordPress.com Stats vs. the stats module) is
			// active — it calls wp_safe_redirect()+exit() and would terminate this REST request
			// mid-response. Refuse here with a structured error instead.
			$conflict = self::find_conflicting_active_plugin( $slug );
			if ( null !== $conflict ) {
				return new \WP_Error(
					'jetpack_modules_conflicting_plugin_active',
					sprintf(
						/* translators: %s: name of the conflicting plugin that must be deactivated first. */
						__( 'Cannot activate the module while a conflicting plugin (%s) is active. Deactivate it on the WordPress Plugins screen, then retry.', 'jetpack' ),
						$conflict
					)
				);
			}

			// Always pass exit=false, redirect=false so the ability runs headless over REST.
			$ok = Jetpack::activate_module( $slug, false, false );
			if ( ! $ok ) {
				return new \WP_Error(
					'jetpack_modules_activate_failed',
					__( 'Unable to activate the module. It may require a Jetpack connection or a higher plan. Inspect requires_connection and plan_classes on the module and retry after those preconditions are met.', 'jetpack' )
				);
			}
		} else {
			$ok = Jetpack::deactivate_module( $slug );
			if ( ! $ok ) {
				return new \WP_Error(
					'jetpack_modules_deactivate_failed',
					__( 'Unable to deactivate the module.', 'jetpack' )
				);
			}
		}

		// Re-check state: activate_module() / deactivate_module() can return truthy even when a
		// pre_update_option_jetpack_active_modules filter blocks the option write, so the response
		// would otherwise lie about reaching the requested state.
		$actual = Jetpack::is_module_active( $slug );
		if ( $desired !== $actual ) {
			return new \WP_Error(
				'jetpack_modules_state_mismatch',
				__( 'The module did not reach the requested state. A filter on jetpack_active_modules may have rejected the change.', 'jetpack' )
			);
		}

		return array(
			'slug'    => $slug,
			'active'  => $actual,
			'changed' => true,
		);
	}

	/**
	 * Return the human-readable name of the first standalone plugin currently active that
	 * would force {@see Jetpack::activate_module()} to redirect/exit, or null when none.
	 *
	 * Mirrors the lookup in {@see Jetpack_Client_Server::deactivate_plugin()}: prefer the
	 * known plugin file path, fall back to a name match across active plugins.
	 *
	 * @param string $slug Module slug.
	 * @return string|null
	 */
	private static function find_conflicting_active_plugin( $slug ) {
		$jetpack = Jetpack::init();
		if ( empty( $jetpack->plugins_to_deactivate[ $slug ] ) ) {
			return null;
		}

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$active_plugins = null;
		foreach ( $jetpack->plugins_to_deactivate[ $slug ] as $candidate ) {
			list( $plugin_file, $plugin_name ) = $candidate;

			if ( is_plugin_active( $plugin_file ) ) {
				return $plugin_name;
			}

			if ( null === $active_plugins ) {
				$active_plugins = Jetpack::get_active_plugins();
			}
			foreach ( $active_plugins as $active ) {
				$data = get_plugin_data( WP_PLUGIN_DIR . '/' . $active );
				if ( isset( $data['Name'] ) && $data['Name'] === $plugin_name ) {
					return $plugin_name;
				}
			}
		}

		return null;
	}
}
