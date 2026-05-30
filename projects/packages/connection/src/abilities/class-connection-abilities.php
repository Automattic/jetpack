<?php
/**
 * Jetpack Connection Abilities Registration.
 *
 * Registers Jetpack Connection abilities with the WordPress Abilities API so
 * AI agents can inspect the site's connection state through the standard
 * `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack-connection
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Connection\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Package_Version;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_Options;

/**
 * Registers Jetpack Connection abilities with the WordPress Abilities API.
 *
 * Exposes a single read-only ability for site-level connection state so AI
 * agents can answer "is this site registered?" without having to
 * reverse-engineer Jetpack_Options keys.
 *
 * Writes (registering a new site, disconnecting a user, transferring
 * ownership) are deliberately deferred to a follow-up PR.
 */
class Connection_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 *
	 * The `jetpack` ability-category is shared with other Jetpack registrars
	 * (e.g. the Modules_Abilities class in the Jetpack plugin). Only the first
	 * registration wins, so the English source string is kept byte-identical
	 * across registrars to keep the visible category text consistent
	 * regardless of load order.
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack',
			'description' => __( 'Abilities provided by Jetpack.', 'jetpack-connection' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack/get-connection-status' => self::spec_get_connection_status(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack/get-connection-status.
	 */
	private static function spec_get_connection_status(): array {
		return array(
			'label'               => __( 'Get Jetpack connection status', 'jetpack-connection' ),
			'description'         => __(
				'Return the site-level Jetpack connection state in one zero-argument call. Shape: { site_registered, user_connected, master_user, blog_id, registration_url, connection_version }. `site_registered` is true when the site has a blog id and a blog token. `user_connected` is true when at least one user has linked their WordPress.com account. `master_user` is the local user id of the connection owner (the user who registered the site), or null if there is no owner. `blog_id` is the WordPress.com site id, or null when the site has not been registered. `registration_url` is the wp-admin URL the site owner should visit to register the site when `site_registered` is false; null once the site is registered. `connection_version` is the running Jetpack Connection package version. Read-only and idempotent — safe to poll.',
				'jetpack-connection'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site_registered'    => array( 'type' => 'boolean' ),
					'user_connected'     => array( 'type' => 'boolean' ),
					'master_user'        => array( 'type' => array( 'integer', 'null' ) ),
					'blog_id'            => array( 'type' => array( 'integer', 'null' ) ),
					'registration_url'   => array( 'type' => array( 'string', 'null' ) ),
					'connection_version' => array( 'type' => 'string' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_connection_status' ),
			'permission_callback' => array( __CLASS__, 'can_view_connection' ),
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
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission check: mirrors the capability used by the Jetpack admin page.
	 *
	 * Connection state is not sensitive in itself (the same data is exposed
	 * on the Jetpack admin page and through several existing REST endpoints),
	 * but subscribers and contributors have no legitimate need to inspect it.
	 * Gating on `jetpack_admin_page` aligns with how {@see Modules_Abilities}
	 * scopes its read.
	 *
	 * @return bool
	 */
	public static function can_view_connection(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-connection-status.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_connection_status( $input = null ) {
		unset( $input );

		$manager         = self::get_manager();
		$site_registered = (bool) $manager->is_connected();
		$user_connected  = (bool) $manager->has_connected_user();

		$master_user_raw = Jetpack_Options::get_option( 'master_user' );
		$master_user     = is_numeric( $master_user_raw ) && (int) $master_user_raw > 0 ? (int) $master_user_raw : null;

		$blog_id_raw = Jetpack_Options::get_option( 'id' );
		$blog_id     = is_numeric( $blog_id_raw ) && (int) $blog_id_raw > 0 ? (int) $blog_id_raw : null;

		return array(
			'site_registered'    => $site_registered,
			'user_connected'     => $user_connected,
			'master_user'        => $master_user,
			'blog_id'            => $blog_id,
			'registration_url'   => $site_registered ? null : self::registration_url(),
			'connection_version' => Package_Version::PACKAGE_VERSION,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Return a Connection_Manager instance. Filterable for tests so they can
	 * inject a partial mock without having to seed Jetpack_Options + tokens.
	 *
	 * @return Connection_Manager
	 */
	protected static function get_manager(): Connection_Manager {
		/**
		 * Filters the Connection_Manager instance used by the Connection abilities.
		 *
		 * Tests inject a partial mock here; production callers should leave
		 * the default. The filter callback receives the package-default
		 * instance and must return a Connection_Manager — non-Manager
		 * returns are discarded.
		 *
		 * @since 8.4.0
		 *
		 * @param Connection_Manager $manager The default instance.
		 */
		$instance = apply_filters( 'jetpack_connection_abilities_manager', new Connection_Manager() );
		return $instance instanceof Connection_Manager ? $instance : new Connection_Manager();
	}

	/**
	 * Build the wp-admin URL the site owner should visit to register the
	 * site to WordPress.com. We deliberately return a stable admin URL (no
	 * secret generation, no XML-RPC roundtrip) so this read stays side-effect
	 * free and cheap to poll. The destination page handles the actual
	 * registration handshake from there.
	 *
	 * WP 7.0+ ships a core "Connectors" screen at `wp-admin/options-connectors.php`
	 * with a Jetpack card registered by {@see Jetpack_Connector}. We probe
	 * for the file directly (rather than a `class_exists()` on the registry)
	 * because the file is what actually serves the URL — if it isn't on
	 * disk, the redirect 404s regardless of which classes have loaded.
	 *
	 * @return string
	 */
	private static function registration_url(): string {
		if ( defined( 'ABSPATH' ) && file_exists( ABSPATH . 'wp-admin/options-connectors.php' ) ) {
			return admin_url( 'options-connectors.php' );
		}
		return admin_url( 'admin.php?page=jetpack' );
	}
}
