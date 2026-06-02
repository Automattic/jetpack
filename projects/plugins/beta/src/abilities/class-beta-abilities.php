<?php
/**
 * Jetpack Beta Abilities Registration.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Automattic\JetpackBeta\Admin;
use Automattic\JetpackBeta\Hooks;
use Automattic\JetpackBeta\Plugin;
use Automattic\JetpackBeta\PluginDataException;
use Automattic\JetpackBeta\Utils;
use Composer\Semver\Semver;

/**
 * Registers Jetpack Beta abilities with the WordPress Abilities API.
 */
class Beta_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-beta';

	/**
	 * Register Beta's abilities directly on the Abilities API init actions.
	 *
	 * Unlike the parent, this intentionally does NOT consult the global
	 * `jetpack_wp_abilities_enabled` rollout filter: the Beta Tester admin UI
	 * is built entirely on these abilities, and Beta is a standalone developer
	 * tool rather than part of the staged Jetpack rollout. Per-ability gating
	 * via `jetpack_wp_abilities_should_register` still applies.
	 */
	public static function init() {
		if ( did_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}
		if ( did_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => 'Jetpack Beta', // Product name, not translated.
			'description' => __( 'Abilities provided by the Jetpack Beta Tester.', 'jetpack-beta' ),
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * Returns all seven abilities: four read-only (list-plugins, get-plugin,
	 * get-settings, list-updates) and three write (activate-branch,
	 * update-settings, update-plugin).
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-beta/list-plugins'    => self::spec_list_plugins(),
			'jetpack-beta/get-plugin'      => self::spec_get_plugin(),
			'jetpack-beta/get-settings'    => self::spec_get_settings(),
			'jetpack-beta/activate-branch' => self::spec_activate_branch(),
			'jetpack-beta/update-settings' => self::spec_update_settings(),
			'jetpack-beta/list-updates'    => self::spec_list_updates(),
			'jetpack-beta/update-plugin'   => self::spec_update_plugin(),
		);
	}

	/**
	 * Shared permission check — mirrors the admin menu capability.
	 *
	 * @return bool True when the current user can manage plugins.
	 */
	public static function can_manage(): bool {
		return current_user_can( 'update_plugins' );
	}

	// -------------------------------------------------------------------------
	// Ability specs
	// -------------------------------------------------------------------------

	/**
	 * Spec: jetpack-beta/list-plugins.
	 *
	 * @return array
	 */
	private static function spec_list_plugins(): array {
		return array(
			'label'               => __( 'List Jetpack Beta plugins', 'jetpack-beta' ),
			'description'         => __(
				'Return an array of all plugins known to the Jetpack Beta Tester, together with the currently-active branch and version for each. Shape: { plugins: [ { slug, name, active_which, active_version, manage_url } ] }. `active_which` is "stable", "dev", or null when the plugin is not active. `active_version` is the human-readable pretty version, or null when not active. `manage_url` is the wp-admin URL for the plugin\'s manage screen. Read-only and idempotent — safe to poll.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
				// Zero-argument ability. The REST run endpoint calls read-only
				// abilities over GET, which cannot encode an empty object in the
				// query string, so input arrives as null. Default to an empty
				// object so input validation (type: object) passes.
				'default'              => array(),
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'plugins' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'slug'           => array( 'type' => 'string' ),
								'name'           => array( 'type' => 'string' ),
								'active_which'   => array( 'type' => array( 'string', 'null' ) ),
								'active_version' => array( 'type' => array( 'string', 'null' ) ),
								'manage_url'     => array( 'type' => 'string' ),
							),
						),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_plugins' ),
			'permission_callback' => array( __CLASS__, 'can_manage' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => false,
				),
			),
		);
	}

	/**
	 * Spec: jetpack-beta/get-plugin.
	 *
	 * @return array
	 */
	private static function spec_get_plugin(): array {
		return array(
			'label'               => __( 'Get Jetpack Beta plugin details', 'jetpack-beta' ),
			'description'         => __(
				'Return the full view-model for a single plugin managed by Jetpack Beta Tester. Input: { slug }. Output: { name, is_mu_plugin, bug_report_url, currently_running, sections, to_test_html, what_changed_html }. `currently_running` is null when the plugin is not active. `sections` is an ordered array of branch cards (existing → stable → rc → trunk → PRs → releases). `to_test_html` and `what_changed_html` are sanitized HTML strings or null. Read-only — results are cached but may trigger background network refreshes.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'       => 'object',
				'properties' => array(
					'slug' => array(
						'type'        => 'string',
						'description' => __( 'The WordPress plugin slug (e.g. "jetpack").', 'jetpack-beta' ),
					),
				),
				'required'   => array( 'slug' ),
			),
			'output_schema'       => self::plugin_view_schema(),
			'execute_callback'    => array( __CLASS__, 'get_plugin' ),
			'permission_callback' => array( __CLASS__, 'can_view_plugin' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => false,
				),
			),
		);
	}

	/**
	 * Spec: jetpack-beta/get-settings.
	 *
	 * @return array
	 */
	private static function spec_get_settings(): array {
		return array(
			'label'               => __( 'Get Jetpack Beta settings', 'jetpack-beta' ),
			'description'         => __(
				'Return the global settings for the Jetpack Beta Tester. Shape: { autoupdates, email_notifications, skip_email }. `autoupdates` is true when automatic background updates are enabled. `email_notifications` is true when email notifications for updates are enabled. `skip_email` is true when the JETPACK_BETA_SKIP_EMAIL constant is defined (e.g. on Atomic). Read-only and idempotent — safe to poll.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
				// Zero-argument ability. The REST run endpoint calls read-only
				// abilities over GET, which cannot encode an empty object in the
				// query string, so input arrives as null. Default to an empty
				// object so input validation (type: object) passes.
				'default'              => array(),
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'autoupdates'         => array( 'type' => 'boolean' ),
					'email_notifications' => array( 'type' => 'boolean' ),
					'skip_email'          => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_settings' ),
			'permission_callback' => array( __CLASS__, 'can_manage' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => false,
				),
			),
		);
	}

	/**
	 * Spec: jetpack-beta/activate-branch.
	 *
	 * @return array
	 */
	private static function spec_activate_branch(): array {
		return array(
			'label'               => __( 'Activate a Jetpack Beta branch', 'jetpack-beta' ),
			'description'         => __(
				'Download (if necessary) and activate a specific branch of a plugin managed by Jetpack Beta Tester. Input: { slug, source, id }. `source` is one of "stable", "trunk", "rc", "pr", "release", or "unknown". `id` is the branch name (for PRs) or version string (for releases); use an empty string for stable/rc/trunk. Returns { success, plugin } where `plugin` is the full plugin view-model (same shape as get-plugin). Not idempotent — will trigger a plugin deactivation/activation cycle even when the same branch is already active.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'slug'   => array(
						'type'        => 'string',
						'description' => __( 'The WordPress plugin slug (e.g. "jetpack").', 'jetpack-beta' ),
					),
					'source' => array(
						'type'        => 'string',
						'enum'        => array( 'stable', 'trunk', 'rc', 'pr', 'release', 'unknown' ),
						'description' => __( 'Branch source: "stable", "trunk", "rc", "pr", "release", or "unknown".', 'jetpack-beta' ),
					),
					'id'     => array(
						'type'        => 'string',
						'description' => __( 'Branch identifier: PR branch name, release version, or empty string for stable/rc/trunk.', 'jetpack-beta' ),
					),
				),
				'required'             => array( 'slug', 'source', 'id' ),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'success' => array( 'type' => 'boolean' ),
					'plugin'  => self::plugin_view_schema(),
					'reload'  => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'activate_branch' ),
			'permission_callback' => array( __CLASS__, 'can_view_plugin' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => false,
				),
			),
		);
	}

	/**
	 * Spec: jetpack-beta/update-settings.
	 *
	 * @return array
	 */
	private static function spec_update_settings(): array {
		return array(
			'label'               => __( 'Update Jetpack Beta settings', 'jetpack-beta' ),
			'description'         => __(
				'Update one or more global settings for the Jetpack Beta Tester. Input: { autoupdates?, email_notifications? }. Omit a key to leave that setting unchanged. Returns the full settings object (same shape as get-settings) reflecting the new values.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'autoupdates'         => array(
						'type'        => 'boolean',
						'description' => __( 'Set to true to enable automatic background updates, false to disable.', 'jetpack-beta' ),
					),
					'email_notifications' => array(
						'type'        => 'boolean',
						'description' => __( 'Set to true to enable update email notifications, false to disable. Has no effect when JETPACK_BETA_SKIP_EMAIL is defined.', 'jetpack-beta' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'autoupdates'         => array( 'type' => 'boolean' ),
					'email_notifications' => array( 'type' => 'boolean' ),
					'skip_email'          => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'update_settings' ),
			'permission_callback' => array( __CLASS__, 'can_manage' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => false,
				),
			),
		);
	}

	// -------------------------------------------------------------------------
	// Permission callbacks
	// -------------------------------------------------------------------------

	/**
	 * Permission check for get-plugin.
	 *
	 * Requires `can_manage()` and additionally enforces the same multisite /
	 * network-admin access-control rule as {@see Admin::admin_page_load()}: if
	 * the plugin being managed is network-activated (stable or dev file), the
	 * ability is denied outside of a network-admin context.
	 *
	 * @param array|null $input The input args passed to the ability.
	 * @return bool True when the current user is allowed to view the plugin.
	 */
	public static function can_view_plugin( $input ): bool {
		if ( ! self::can_manage() ) {
			return false;
		}

		// Multisite network-activation access control.
		if ( is_multisite() && ! is_network_admin() && isset( $input['slug'] ) ) {
			try {
				$plugin = Plugin::get_plugin( sanitize_key( $input['slug'] ) );
			} catch ( PluginDataException $e ) {
				// Can't fetch plugin list — fail open so the execute callback
				// can return a proper WP_Error with context.
				return true;
			}

			if ( $plugin &&
				( is_plugin_active_for_network( $plugin->plugin_file() ) ||
				is_plugin_active_for_network( $plugin->dev_plugin_file() ) )
			) {
				return false;
			}
		}

		return true;
	}

	// -------------------------------------------------------------------------
	// Execute callbacks
	// -------------------------------------------------------------------------

	/**
	 * Execute: list-plugins.
	 *
	 * Mirrors the active/version logic from plugin-select.template.php.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|\WP_Error
	 */
	public static function list_plugins( $input = null ) {
		unset( $input );

		try {
			// Bypass the cache on the explicit REST call so the on-demand list is fresh.
			return self::build_plugin_list( true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}
	}

	/**
	 * Build the list-plugins payload.
	 *
	 * Shared by the `list-plugins` ability (fresh) and the admin page bootstrap,
	 * which preloads the list using cached data for an instant first paint.
	 *
	 * @param bool $bypass_cache Whether to bypass the plugins-list transient cache.
	 * @return array{plugins: array<int, array<string, mixed>>} The list payload.
	 * @throws PluginDataException If the plugin list cannot be fetched.
	 */
	public static function build_plugin_list( bool $bypass_cache = false ): array {
		$all_plugins = Plugin::get_all_plugins( $bypass_cache );

		$plugins = array();
		foreach ( $all_plugins as $slug => $plugin ) {
			if ( $plugin->is_active( 'stable' ) ) {
				$active_which   = 'stable';
				$active_version = $plugin->stable_pretty_version();
			} elseif ( $plugin->is_active( 'dev' ) ) {
				$active_which   = 'dev';
				$active_version = $plugin->dev_pretty_version();
			} else {
				$active_which   = null;
				$active_version = null;
			}

			$plugins[] = array(
				'slug'           => $slug,
				'name'           => $plugin->get_name(),
				'active_which'   => $active_which,
				'active_version' => $active_version,
				'manage_url'     => Utils::admin_url( array( 'plugin' => $slug ) ),
			);
		}

		return array( 'plugins' => $plugins );
	}

	/**
	 * Execute: get-plugin.
	 *
	 * Resolves the slug, validates the plugin exists, then delegates to
	 * {@see self::build_plugin_view()} for the actual payload construction.
	 *
	 * @param array|null $input Must contain 'slug'.
	 * @return array|\WP_Error
	 */
	public static function get_plugin( $input = null ) {
		$slug = isset( $input['slug'] ) ? sanitize_key( $input['slug'] ) : '';
		if ( '' === $slug ) {
			return new \WP_Error( 'missing_slug', __( 'A plugin slug is required.', 'jetpack-beta' ) );
		}

		try {
			$plugin = Plugin::get_plugin( $slug, true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}

		if ( ! $plugin ) {
			return new \WP_Error(
				'unknown_plugin',
				// translators: %s: Plugin slug.
				sprintf( __( 'Plugin %s is not known.', 'jetpack-beta' ), $slug )
			);
		}

		return self::build_plugin_view( $plugin );
	}

	/**
	 * Execute: get-settings.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_settings( $input = null ) {
		unset( $input );
		return self::build_settings();
	}

	/**
	 * Execute: activate-branch.
	 *
	 * Resolves the plugin by slug, delegates the install + activation to
	 * {@see Plugin::install_and_activate()}, and returns the updated plugin
	 * view-model on success.
	 *
	 * The underlying install path uses {@see Plugin_Upgrader} which requires
	 * several wp-admin includes. These are loaded inline here — the same
	 * pattern used by the WP REST plugin-install endpoint.
	 *
	 * @param array|null $input Must contain 'slug', 'source', and 'id'.
	 * @return array|\WP_Error
	 */
	public static function activate_branch( $input = null ) {
		$slug   = isset( $input['slug'] ) ? sanitize_key( $input['slug'] ) : '';
		$source = isset( $input['source'] ) ? sanitize_text_field( $input['source'] ) : '';
		$id     = isset( $input['id'] ) ? sanitize_text_field( $input['id'] ) : '';

		if ( '' === $slug ) {
			return new \WP_Error( 'missing_slug', __( 'A plugin slug is required.', 'jetpack-beta' ) );
		}
		if ( '' === $source ) {
			return new \WP_Error( 'missing_source', __( 'A branch source is required.', 'jetpack-beta' ) );
		}

		try {
			$plugin = Plugin::get_plugin( $slug );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}

		if ( ! $plugin ) {
			return new \WP_Error(
				'unknown_plugin',
				// translators: %s: Plugin slug.
				sprintf( __( 'Plugin %s is not known.', 'jetpack-beta' ), $slug )
			);
		}

		// The Plugin_Upgrader path (invoked by install_and_activate) requires
		// these wp-admin includes. They are safe to require in a REST context —
		// the WP core REST plugin-install endpoint does the same thing.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		// install_and_activate() throws InvalidArgumentException for an unrecognized
		// source. The schema enum rejects bad values first, but guard here too so a
		// crafted request returns a clean WP_Error instead of an uncaught 500.
		try {
			$result = $plugin->install_and_activate( $source, $id );
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'invalid_source', $e->getMessage() );
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Re-resolve the plugin (bypassing the cache) to build the post-activation
		// view. Guard against a failed refresh so we return a WP_Error instead of
		// fataling on a null/exception inside build_plugin_view().
		try {
			$refreshed = Plugin::get_plugin( $slug, true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}

		if ( ! $refreshed ) {
			return new \WP_Error(
				'unknown_plugin',
				// translators: %s: Plugin slug.
				sprintf( __( 'Plugin %s is not known.', 'jetpack-beta' ), $slug )
			);
		}

		$view = self::build_plugin_view( $refreshed );
		if ( is_wp_error( $view ) ) {
			return $view;
		}

		return array(
			'success' => true,
			'plugin'  => $view,
			// Activating a branch of Jetpack Beta Tester itself swaps this plugin's
			// own PHP/JS out from under the running React app, so the client must do
			// a full page reload rather than a soft view refresh.
			'reload'  => self::is_self( $refreshed ),
		);
	}

	/**
	 * Whether the given plugin is the Jetpack Beta Tester plugin itself.
	 *
	 * @param Plugin $plugin A resolved Plugin instance.
	 * @return bool
	 */
	private static function is_self( Plugin $plugin ): bool {
		return plugin_basename( JPBETA__PLUGIN_FILE ) === $plugin->plugin_file();
	}

	/**
	 * Execute: update-settings.
	 *
	 * Applies a partial update to the Beta Tester global settings. Only keys
	 * present in `$input` are changed; absent keys are left untouched.
	 *
	 * @param array|null $input May contain 'autoupdates' (bool) and/or 'email_notifications' (bool).
	 * @return array Updated settings (same shape as get-settings).
	 */
	public static function update_settings( $input = null ) {
		if ( ! is_array( $input ) ) {
			$input = array();
		}

		if ( array_key_exists( 'autoupdates', $input ) ) {
			$value = (bool) $input['autoupdates'];
			update_option( 'jp_beta_autoupdate', (int) $value );
			if ( $value ) {
				Hooks::maybe_schedule_autoupdate();
			}
		}

		if ( array_key_exists( 'email_notifications', $input ) ) {
			if ( ! defined( 'JETPACK_BETA_SKIP_EMAIL' ) ) {
				update_option( 'jp_beta_email_notifications', (int) (bool) $input['email_notifications'] );
			}
		}

		return self::build_settings();
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	/**
	 * Build the plugin view-model payload for a resolved Plugin object.
	 *
	 * Extracted from the original get_plugin() body so that both get_plugin()
	 * and activate_branch() can return an identical, DRY payload without
	 * duplicating the large template-mirroring logic.
	 *
	 * Reproduces the view-model built by plugin-manage.template.php as a JSON-
	 * serialisable array. The section ordering mirrors the template:
	 * existing (unknown) → stable → rc → trunk → PRs → releases.
	 *
	 * @param Plugin $plugin A fully resolved Plugin instance.
	 * @return array|\WP_Error The plugin view-model, or WP_Error on data failure.
	 */
	private static function build_plugin_view( Plugin $plugin ) {
		// The Abilities REST run endpoint executes outside wp-admin, so the
		// admin include files are not loaded. to_test_content()/dev_info()
		// rely on WP_Filesystem() and get_plugin_data(); load them explicitly.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		try {
			$manifest   = $plugin->get_manifest( true );
			$wporg_data = $plugin->get_wporg_data( true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}

		// ------------------------------------------------------------------
		// Replicate the existing_branch / active_branch logic from the template.
		// ------------------------------------------------------------------
		$existing_branch = null;
		if ( file_exists( $plugin->plugin_path() ) ) {
			$tmp             = get_plugin_data( $plugin->plugin_path(), false, false );
			$existing_branch = $plugin->source_info( 'release', $tmp['Version'] );
			if ( ! $existing_branch || is_wp_error( $existing_branch ) ) {
				$existing_branch = (object) array(
					'which'          => 'stable',
					'source'         => 'unknown',
					'id'             => $tmp['Version'],
					'version'        => $tmp['Version'],
					'pretty_version' => $plugin->stable_pretty_version(),
				);
			}
		}

		$active_branch = (object) array(
			'which'  => null,
			'source' => null,
			'id'     => null,
		);
		if ( $plugin->is_active( 'stable' ) ) {
			if ( $existing_branch ) {
				$active_branch = $existing_branch;
			}
		} elseif ( $plugin->is_active( 'dev' ) ) {
			$active_branch = $plugin->dev_info();
			if ( $active_branch && ! is_wp_error( $active_branch ) ) {
				$active_branch->which          = 'dev';
				$active_branch->pretty_version = $plugin->dev_pretty_version();
			} else {
				$tmp           = get_plugin_data( $plugin->dev_plugin_path(), false, false );
				$active_branch = (object) array(
					'which'          => 'dev',
					'source'         => 'unknown',
					'id'             => $tmp['Version'],
					'version'        => $tmp['Version'],
					'pretty_version' => __( 'Unknown Development Version', 'jetpack-beta' ),
				);
			}
		}

		// ------------------------------------------------------------------
		// currently_running — null when the plugin is not active.
		// ------------------------------------------------------------------
		$currently_running = null;
		if ( null !== $active_branch->which ) {
			$currently_running = array(
				'which'          => $active_branch->which,
				'source'         => $active_branch->source,
				'id'             => $active_branch->id,
				'version'        => $active_branch->version ?? null,
				'pretty_version' => $active_branch->pretty_version ?? null,
			);
		}

		// ------------------------------------------------------------------
		// Build sections array — mirrors template order.
		// ------------------------------------------------------------------
		$sections = array();

		// Existing (unknown) stable version on disk.
		if ( $existing_branch && 'unknown' === $existing_branch->source ) {
			$sections[] = self::branch_to_section( $existing_branch, 'existing', $active_branch );
		}

		// Stable.
		$branch = $plugin->source_info( 'stable', '' );
		if ( $branch && ! is_wp_error( $branch ) ) {
			$section_item = self::branch_to_section( $branch, 'stable', $active_branch );

			// Fixup active_branch so the active stable doesn't also render as active
			// under releases below (mirrors the template's fixup block).
			if ( $active_branch->source === $branch->source && $active_branch->id === $branch->id ) {
				$active_branch->source = 'stable';
				$active_branch->id     = '';
			}

			$sections[] = $section_item;
		}

		// RC.
		$branch = $plugin->source_info( 'rc', '' );
		if ( $branch && ! is_wp_error( $branch ) ) {
			$sections[] = self::branch_to_section( $branch, 'rc', $active_branch );
		}

		// Trunk.
		$branch = $plugin->source_info( 'trunk', '' );
		if ( $branch && ! is_wp_error( $branch ) ) {
			$sections[] = self::branch_to_section( $branch, 'trunk', $active_branch );
		}

		// PRs.
		if ( ! empty( $manifest->pr ) && (array) $manifest->pr ) {
			foreach ( (array) $manifest->pr as $pr ) {
				$branch = $plugin->source_info( 'pr', $pr->branch );
				if ( $branch && ! is_wp_error( $branch ) ) {
					$sections[] = self::branch_to_section( $branch, 'pr', $active_branch );
				}
			}
		} elseif ( 'pr' === $active_branch->source ) {
			// No PR list available but one is currently active — show it.
			$sections[] = self::branch_to_section( $active_branch, 'pr', $active_branch );
		}

		// Releases — sorted newest-first with Semver::rsort().
		if ( ! empty( $wporg_data->versions ) && (array) $wporg_data->versions ) {
			$versions = array_keys( (array) $wporg_data->versions );
			$versions = Semver::rsort( $versions );
			foreach ( $versions as $v ) {
				$branch = $plugin->source_info( 'release', $v );
				if ( $branch && ! is_wp_error( $branch ) ) {
					$sections[] = self::branch_to_section( $branch, 'release', $active_branch );
				}
			}
		} elseif ( 'release' === $active_branch->source && isset( $wporg_data->version ) && $wporg_data->version !== $active_branch->id ) {
			// Old active release that no longer appears in wporg versions.
			$sections[] = self::branch_to_section( $active_branch, 'release', $active_branch );
		}

		// ------------------------------------------------------------------
		// To-test / what-changed content.
		// ------------------------------------------------------------------
		list( $to_test_html, $what_changed_html ) = Admin::to_test_content( $plugin );

		// These fragments are injected via dangerouslySetInnerHTML in the React UI,
		// so sanitize them to post-safe HTML before returning to reduce XSS risk.
		$to_test_html      = is_string( $to_test_html ) ? wp_kses_post( $to_test_html ) : null;
		$what_changed_html = is_string( $what_changed_html ) ? wp_kses_post( $what_changed_html ) : null;

		return array(
			'name'              => $plugin->get_name(),
			'is_mu_plugin'      => $plugin->is_mu_plugin(),
			'bug_report_url'    => $plugin->bug_report_url(),
			'currently_running' => $currently_running,
			'sections'          => $sections,
			'to_test_html'      => $to_test_html,
			'what_changed_html' => $what_changed_html,
		);
	}

	/**
	 * Build the current settings payload.
	 *
	 * Extracted so both get_settings() and update_settings() return an
	 * identical shape without duplicating the option reads.
	 *
	 * @return array { autoupdates: bool, email_notifications: bool, skip_email: bool }
	 */
	private static function build_settings(): array {
		return array(
			'autoupdates'         => (bool) Utils::is_set_to_autoupdate(),
			'email_notifications' => (bool) Utils::is_set_to_email_notifications(),
			'skip_email'          => defined( 'JETPACK_BETA_SKIP_EMAIL' ),
		);
	}

	/**
	 * JSON Schema object definition for a single plugin view-model.
	 *
	 * Shared between spec_get_plugin() (output_schema) and
	 * spec_activate_branch() (output_schema.properties.plugin) so the
	 * schema literal is defined in exactly one place.
	 *
	 * @return array JSON Schema object.
	 */
	private static function plugin_view_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'name'              => array( 'type' => 'string' ),
				'is_mu_plugin'      => array( 'type' => 'boolean' ),
				'bug_report_url'    => array( 'type' => 'string' ),
				'currently_running' => array(
					'type'       => array( 'object', 'null' ),
					'properties' => array(
						'which'          => array( 'type' => array( 'string', 'null' ) ),
						'source'         => array( 'type' => array( 'string', 'null' ) ),
						'id'             => array( 'type' => array( 'string', 'null' ) ),
						'version'        => array( 'type' => array( 'string', 'null' ) ),
						'pretty_version' => array( 'type' => array( 'string', 'null' ) ),
					),
				),
				'sections'          => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'section'        => array( 'type' => 'string' ),
							'source'         => array( 'type' => array( 'string', 'null' ) ),
							'id'             => array( 'type' => array( 'string', 'null' ) ),
							'branch'         => array( 'type' => array( 'string', 'null' ) ),
							'version'        => array( 'type' => array( 'string', 'null' ) ),
							'pretty_version' => array( 'type' => array( 'string', 'null' ) ),
							'pr'             => array( 'type' => array( 'integer', 'null' ) ),
							'is_active'      => array( 'type' => 'boolean' ),
						),
					),
				),
				'to_test_html'      => array( 'type' => array( 'string', 'null' ) ),
				'what_changed_html' => array( 'type' => array( 'string', 'null' ) ),
			),
		);
	}

	/**
	 * Convert a source_info object + section label into a section array item.
	 *
	 * @param object $branch      The source_info object.
	 * @param string $section     Section label: existing|stable|rc|trunk|pr|release.
	 * @param object $active_branch The currently-active branch object.
	 * @return array
	 */
	private static function branch_to_section( $branch, $section, $active_branch ): array {
		$is_active = (
			null !== $active_branch->source &&
			$active_branch->source === $branch->source &&
			$active_branch->id === $branch->id
		);

		return array(
			'section'        => $section,
			'source'         => $branch->source,
			'id'             => $branch->id,
			'branch'         => $branch->branch ?? null,
			'version'        => $branch->version ?? null,
			'pretty_version' => $branch->pretty_version ?? null,
			// PR branches carry the GitHub PR number; surfaced so the UI search
			// can match a pasted PR number or pull-request URL.
			'pr'             => isset( $branch->pr ) ? (int) $branch->pr : null,
			'is_active'      => $is_active,
		);
	}

	/**
	 * Spec: jetpack-beta/list-updates.
	 *
	 * @return array The ability spec.
	 */
	private static function spec_list_updates(): array {
		return array(
			'label'               => __( 'List available Jetpack Beta plugin updates', 'jetpack-beta' ),
			'description'         => __(
				'Return the managed plugins that have a newer build available. Optional input { slug } scopes the result to a single plugin (plus the Beta Tester itself); omit it for every managed plugin. Output: { updates: [ { plugin_file, name, new_version } ] }. Read-only, but refreshes WordPress.org/Beta update data so it is not a pure cache read.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'slug' => array( 'type' => 'string' ),
				),
				'additionalProperties' => false,
				'default'              => array(),
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'updates' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'plugin_file' => array( 'type' => 'string' ),
								'name'        => array( 'type' => 'string' ),
								'new_version' => array( 'type' => 'string' ),
							),
						),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_updates' ),
			'permission_callback' => array( __CLASS__, 'can_manage' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
				'mcp'          => array( 'public' => false ),
			),
		);
	}

	/**
	 * Spec: jetpack-beta/update-plugin.
	 *
	 * @return array The ability spec.
	 */
	private static function spec_update_plugin(): array {
		return array(
			'label'               => __( 'Update a Jetpack Beta plugin to its newest build', 'jetpack-beta' ),
			'description'         => __(
				'Run the plugin updater for a single plugin file (as reported by list-updates) to install its newest available build. Input: { plugin_file }. Output: { success, updates } where `updates` is the refreshed list-updates payload.',
				'jetpack-beta'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'plugin_file' => array( 'type' => 'string' ),
				),
				'required'             => array( 'plugin_file' ),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'success' => array( 'type' => 'boolean' ),
					'updates' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'object' ),
					),
					'reload'  => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'update_plugin' ),
			'permission_callback' => array( __CLASS__, 'can_manage' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
				'mcp'          => array( 'public' => false ),
			),
		);
	}

	/**
	 * Execute: list-updates.
	 *
	 * @param array|null $input Optional `{ slug }` to scope the result.
	 * @return array|\WP_Error The updates payload, or WP_Error on data failure.
	 */
	public static function list_updates( $input = null ) {
		$slug = isset( $input['slug'] ) && '' !== $input['slug'] ? sanitize_key( $input['slug'] ) : null;

		try {
			return self::build_updates_list( $slug );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}
	}

	/**
	 * Execute: update-plugin.
	 *
	 * @param array|null $input `{ plugin_file }` of the plugin to update.
	 * @return array|\WP_Error `{ success, updates }`, or WP_Error on failure.
	 */
	public static function update_plugin( $input = null ) {
		$plugin_file = isset( $input['plugin_file'] ) ? sanitize_text_field( wp_unslash( $input['plugin_file'] ) ) : '';
		if ( '' === $plugin_file ) {
			return new \WP_Error( 'missing_plugin_file', __( 'A plugin file is required.', 'jetpack-beta' ) );
		}

		// The Abilities REST run endpoint executes outside wp-admin, so load the
		// upgrader/update includes the same way core's plugin-update endpoint does.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/update.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Make sure the available-update data (including Beta's injected builds) is current.
		wp_clean_plugins_cache();
		wp_update_plugins();

		// Restrict updates to plugins Beta actually manages and that have a pending
		// update, so this ability can't be used to drive arbitrary plugin updates.
		try {
			$needing = Utils::plugins_needing_update( true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}
		if ( ! isset( $needing[ $plugin_file ] ) ) {
			return new \WP_Error(
				'unmanaged_plugin',
				__( 'That plugin is not a Jetpack Beta managed update.', 'jetpack-beta' )
			);
		}

		$skin     = new \WP_Ajax_Upgrader_Skin();
		$upgrader = new \Plugin_Upgrader( $skin );
		$result   = $upgrader->upgrade( $plugin_file );

		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( is_wp_error( $skin->result ) ) {
			return $skin->result;
		}
		if ( ! $result ) {
			$errors = $skin->get_errors();
			if ( is_wp_error( $errors ) && $errors->has_errors() ) {
				return $errors;
			}
			return new \WP_Error( 'update_failed', __( 'The plugin update did not complete.', 'jetpack-beta' ) );
		}

		try {
			$updates = self::build_updates_list();
		} catch ( PluginDataException $e ) {
			$updates = array( 'updates' => array() );
		}

		return array(
			'success' => true,
			'updates' => $updates['updates'],
			// Updating Jetpack Beta Tester itself replaces this plugin's own code,
			// so the client must fully reload rather than soft-refresh the list.
			'reload'  => plugin_basename( JPBETA__PLUGIN_FILE ) === $plugin_file,
		);
	}

	/**
	 * Build the list-updates payload: managed plugins with a newer build available.
	 *
	 * Ports show-needed-updates.template.php — `Utils::plugins_needing_update( true )`
	 * filtered (when `$slug` is given) to that plugin's files plus the Beta Tester.
	 *
	 * @param string|null $slug Optional plugin slug to scope the result.
	 * @return array{updates: array<int, array<string, string>>} The updates payload.
	 * @throws PluginDataException If the plugin list cannot be fetched.
	 */
	private static function build_updates_list( ?string $slug = null ): array {
		$updates = Utils::plugins_needing_update( true );

		if ( null !== $slug ) {
			$plugin = Plugin::get_plugin( $slug );
			if ( $plugin ) {
				$updates = array_intersect_key(
					$updates,
					array(
						$plugin->plugin_file()     => 1,
						$plugin->dev_plugin_file() => 1,
						JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php' => 1,
					)
				);
			}
		}

		$list = array();
		foreach ( $updates as $file => $update ) {
			$dir = dirname( $file );

			if ( JPBETA__PLUGIN_FOLDER === $dir ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WP plugin-data header.
				$name = $update->Name;
			} else {
				$is_dev      = str_ends_with( $dir, '-dev' );
				$plugin_slug = $is_dev ? substr( $dir, 0, -4 ) : $dir;
				$plugin      = Plugin::get_plugin( $plugin_slug );
				if ( $plugin ) {
					$version = $is_dev ? $plugin->dev_pretty_version() : $plugin->stable_pretty_version();
					$name    = $plugin->get_name() . ' | ' . $version;
				} else {
					// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WP plugin-data header.
					$name = $update->Name;
				}
			}

			$list[] = array(
				'plugin_file' => $file,
				'name'        => $name,
				'new_version' => $update->update->new_version ?? '',
			);
		}

		return array( 'updates' => $list );
	}
}
