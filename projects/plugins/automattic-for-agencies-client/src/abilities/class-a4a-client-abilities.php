<?php
/**
 * Automattic for Agencies Client Abilities Registration.
 *
 * Registers Automattic for Agencies Client abilities with the WordPress
 * Abilities API so AI agents can inspect this site's A4A client state
 * through the standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/automattic-for-agencies-client
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\A4A_Client\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Plugin_Storage;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_Options;

/**
 * Registers Automattic for Agencies Client abilities with the WordPress Abilities API.
 *
 * Exposes a single zero-argument read describing this site's A4A Client
 * plugin state — whether the plugin is registered with the shared Jetpack
 * connection, whether the connection itself is established, and which
 * site/user identifiers are available locally. Designed so an agent can
 * answer "is this site set up for Automattic for Agencies?" without having
 * to inspect plugin internals.
 *
 * The agency identity (id, name, contact email, assignment timestamp),
 * license inventory, and aggregated site-issue feed all live in the
 * upstream A4A portal — there is no local data source for them on the
 * client. Those reads are intentionally deferred; ship what's real.
 */
class A4A_Client_Abilities extends Registrar {

	const CATEGORY_SLUG          = 'jetpack-a4a-client';
	const ERROR_PREFIX           = 'jetpack_a4a_client_';
	const CONNECTION_PLUGIN_SLUG = 'automattic-for-agencies-client';

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
			// "Automattic for Agencies" is a product name and should not be translated.
			'label'       => 'Automattic for Agencies Client',
			'description' => __( 'Abilities for inspecting this site\'s Automattic for Agencies Client state.', 'automattic-for-agencies-client' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-a4a-client/get-status' => self::spec_get_status(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-a4a-client/get-status.
	 */
	private static function spec_get_status(): array {
		return array(
			'label'               => __( 'Get Automattic for Agencies Client status', 'automattic-for-agencies-client' ),
			'description'         => __(
				'Return the Automattic for Agencies Client state for this site in one zero-argument call. Shape: { plugin_slug, plugin_name, plugin_version, plugin_registered_with_connection, site_connected, user_connected, blog_id, master_user_id, settings_url }. `plugin_slug` is the fixed slug used to register this plugin with the shared Jetpack connection ("automattic-for-agencies-client"). `plugin_name` is the human-readable plugin name. `plugin_version` is the running plugin version, or null when the constant is not defined. `plugin_registered_with_connection` is true when this plugin has registered itself with the shared Jetpack connection registry (Plugin_Storage); false before plugins_loaded completes or if the plugin was removed. `site_connected` is true when the site has a blog id and a blog token. `user_connected` is true when at least one user has linked their WordPress.com account through the shared connection. `blog_id` is the WordPress.com site id, or null when the site has not been registered. `master_user_id` is the local user id of the connection owner, or null. `settings_url` is the wp-admin URL of this plugin\'s settings screen. Read-only and idempotent — safe to poll. Agency identity (agency id/name/contact email/assignment timestamp), license inventory, and aggregated site-issue feed live in the upstream Automattic for Agencies portal — there is no local data source for them on this client and they are not exposed by this ability.',
				'automattic-for-agencies-client'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'plugin_slug'                       => array( 'type' => 'string' ),
					'plugin_name'                       => array( 'type' => 'string' ),
					'plugin_version'                    => array( 'type' => array( 'string', 'null' ) ),
					'plugin_registered_with_connection' => array( 'type' => 'boolean' ),
					'site_connected'                    => array( 'type' => 'boolean' ),
					'user_connected'                    => array( 'type' => 'boolean' ),
					'blog_id'                           => array( 'type' => array( 'integer', 'null' ) ),
					'master_user_id'                    => array( 'type' => array( 'integer', 'null' ) ),
					'settings_url'                      => array( 'type' => 'string' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_status' ),
			'permission_callback' => array( __CLASS__, 'can_view_status' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission check: match the capability used to render the plugin's
	 * settings submenu (`manage_options`). The plugin's admin screen is
	 * registered with the same capability, so reusing it keeps the ability
	 * surface aligned with the existing UI gate.
	 *
	 * @return bool
	 */
	public static function can_view_status(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-status.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_status( $input = null ) {
		unset( $input );

		$manager        = self::get_manager();
		$site_connected = (bool) $manager->is_connected();
		$user_connected = (bool) $manager->has_connected_user();

		$blog_id_raw = Jetpack_Options::get_option( 'id' );
		$blog_id     = is_numeric( $blog_id_raw ) && (int) $blog_id_raw > 0 ? (int) $blog_id_raw : null;

		$master_user_raw = Jetpack_Options::get_option( 'master_user' );
		$master_user_id  = is_numeric( $master_user_raw ) && (int) $master_user_raw > 0 ? (int) $master_user_raw : null;

		$plugin_registered = false;
		if ( class_exists( Plugin_Storage::class ) ) {
			$entry = Plugin_Storage::get_one( self::CONNECTION_PLUGIN_SLUG );
			// `get_one` returns null when the slug is not registered, an array
			// when it is, or WP_Error if called before Plugin_Storage::configure
			// has run. Anything but a non-empty array means "not (yet) registered".
			$plugin_registered = is_array( $entry );
		}

		$plugin_version = defined( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_VERSION' ) && '' !== (string) constant( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_VERSION' )
			? (string) constant( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_VERSION' )
			: self::read_plugin_version_from_header();

		$plugin_name = defined( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_NAME' )
			? (string) constant( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_NAME' )
			: 'Automattic for Agencies Client';

		$plugin_slug = defined( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG' )
			? (string) constant( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG' )
			: self::CONNECTION_PLUGIN_SLUG;

		return array(
			'plugin_slug'                       => $plugin_slug,
			'plugin_name'                       => $plugin_name,
			'plugin_version'                    => $plugin_version,
			'plugin_registered_with_connection' => $plugin_registered,
			'site_connected'                    => $site_connected,
			'user_connected'                    => $user_connected,
			'blog_id'                           => $blog_id,
			'master_user_id'                    => $master_user_id,
			'settings_url'                      => admin_url( 'options-general.php?page=' . $plugin_slug ),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Return the plugin-scoped Connection_Manager instance.
	 *
	 * Filterable so tests can inject a partial mock without having to seed
	 * Jetpack_Options + tokens. The default uses the plugin's own slug,
	 * matching the production wiring in `Automattic_For_Agencies_Client::init()`.
	 *
	 * @return Connection_Manager
	 */
	protected static function get_manager(): Connection_Manager {
		/**
		 * Filters the Connection_Manager instance used by the A4A Client abilities.
		 *
		 * @since 0.9.0
		 *
		 * @param Connection_Manager $manager The default instance, scoped to the A4A Client plugin slug.
		 */
		$instance = apply_filters( 'jetpack_a4a_client_abilities_manager', new Connection_Manager( self::CONNECTION_PLUGIN_SLUG ) );
		return $instance instanceof Connection_Manager ? $instance : new Connection_Manager( self::CONNECTION_PLUGIN_SLUG );
	}

	/**
	 * Read the plugin version from the main plugin file header as a fallback
	 * when no version constant is defined. The plugin's bootstrap does not
	 * currently define a `*_VERSION` constant, so this helper guarantees the
	 * status payload still reports a version when possible. Returns null if
	 * the file is unreadable or has no `Version:` header.
	 *
	 * @return string|null
	 */
	private static function read_plugin_version_from_header(): ?string {
		if ( ! defined( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE' ) ) {
			return null;
		}

		$file = (string) constant( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE' );
		if ( '' === $file || ! is_readable( $file ) ) {
			return null;
		}

		if ( ! function_exists( 'get_file_data' ) ) {
			return null;
		}

		$data    = get_file_data( $file, array( 'Version' => 'Version' ) );
		$version = isset( $data['Version'] ) ? trim( (string) $data['Version'] ) : '';

		return '' === $version ? null : $version;
	}
}
