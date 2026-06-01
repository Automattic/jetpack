<?php
/**
 * Jetpack Beta Abilities Registration.
 *
 * @package automattic/jetpack-beta
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod -- Abilities API added in WP 6.9.

namespace Automattic\JetpackBeta\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Automattic\JetpackBeta\Admin;
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
	 * Returns the three read abilities. Write abilities (activate-branch,
	 * update-settings) are added in a follow-up commit.
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-beta/list-plugins' => self::spec_list_plugins(),
			'jetpack-beta/get-plugin'   => self::spec_get_plugin(),
			'jetpack-beta/get-settings' => self::spec_get_settings(),
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
				'Return the full view-model for a single plugin managed by Jetpack Beta Tester. Input: { slug }. Output: { name, is_mu_plugin, bug_report_url, currently_running, sections, to_test_html, what_changed_html, needed_updates }. `currently_running` is null when the plugin is not active. `sections` is an ordered array of branch cards (existing → stable → rc → trunk → PRs → releases). `to_test_html` and `what_changed_html` are sanitized HTML strings or null. `needed_updates` is an array of plugin files that have pending updates. Read-only — results are cached but may trigger background network refreshes.',
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
			'output_schema'       => array(
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
								'is_active'      => array( 'type' => 'boolean' ),
							),
						),
					),
					'to_test_html'      => array( 'type' => array( 'string', 'null' ) ),
					'what_changed_html' => array( 'type' => array( 'string', 'null' ) ),
					'needed_updates'    => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
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
			$all_plugins = Plugin::get_all_plugins( true );
		} catch ( PluginDataException $e ) {
			return new \WP_Error( 'plugin_data_error', $e->getMessage() );
		}

		$plugins = array();
		foreach ( $all_plugins as $slug => $plugin ) {
			if ( $plugin->is_active( 'stable' ) ) {
				$active_which   = 'stable';
				$active_version = $plugin->stable_pretty_version() ?? null;
			} elseif ( $plugin->is_active( 'dev' ) ) {
				$active_which   = 'dev';
				$active_version = $plugin->dev_pretty_version() ?? null;
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
	 * Reproduces the view-model built by plugin-manage.template.php as a JSON-
	 * serialisable array. The section ordering mirrors the template:
	 * existing (unknown) → stable → rc → trunk → PRs → releases.
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

		// ------------------------------------------------------------------
		// Needed updates — port of show-needed-updates.template.php logic.
		// ------------------------------------------------------------------
		$needed_updates = self::get_needed_updates_for_plugin( $plugin );

		return array(
			'name'              => $plugin->get_name(),
			'is_mu_plugin'      => $plugin->is_mu_plugin(),
			'bug_report_url'    => $plugin->bug_report_url(),
			'currently_running' => $currently_running,
			'sections'          => $sections,
			'to_test_html'      => $to_test_html,
			'what_changed_html' => $what_changed_html,
			'needed_updates'    => $needed_updates,
		);
	}

	/**
	 * Execute: get-settings.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_settings( $input = null ) {
		unset( $input );

		return array(
			'autoupdates'         => (bool) Utils::is_set_to_autoupdate(),
			'email_notifications' => (bool) Utils::is_set_to_email_notifications(),
			'skip_email'          => defined( 'JETPACK_BETA_SKIP_EMAIL' ),
		);
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

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
			'is_active'      => $is_active,
		);
	}

	/**
	 * Return an array of plugin files that have pending updates, scoped to the
	 * given plugin (plus the Beta Tester itself).
	 *
	 * Mirrors the logic in show-needed-updates.template.php: calls
	 * `Utils::plugins_needing_update( true )` to include stable versions, then
	 * filters the result to only the files relevant to this plugin and the
	 * Jetpack Beta Tester itself.
	 *
	 * @param Plugin $plugin Plugin to check.
	 * @return string[] Plugin file paths that have available updates.
	 */
	private static function get_needed_updates_for_plugin( Plugin $plugin ): array {
		try {
			$updates = Utils::plugins_needing_update( true );
		} catch ( \Exception $e ) {
			return array();
		}

		$relevant = array(
			$plugin->plugin_file()                      => 1,
			$plugin->dev_plugin_file()                  => 1,
			JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php' => 1,
		);

		return array_keys( array_intersect_key( $updates, $relevant ) );
	}
}
