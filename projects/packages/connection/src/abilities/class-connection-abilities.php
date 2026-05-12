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
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_Options;
use WP_Error;

/**
 * Registers Jetpack Connection abilities with the WordPress Abilities API.
 *
 * Exposes two read-only abilities — one for site-level connection state, one
 * for the calling user's connection state — so AI agents can answer
 * "is this site connected?" and "is the current user connected?" without
 * having to reverse-engineer Jetpack_Options keys.
 *
 * Writes (registering a new site, disconnecting a user, transferring
 * ownership) are deliberately deferred to a follow-up PR.
 */
class Connection_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-connection';
	const ERROR_PREFIX  = 'jetpack_connection_';

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
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Connection',
			'description' => __( 'Abilities for inspecting the site\'s and the current user\'s Jetpack connection state.', 'jetpack-connection' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-connection/get-connection-status' => self::spec_get_connection_status(),
			'jetpack-connection/get-current-user-connection' => self::spec_get_current_user_connection(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-connection/get-connection-status.
	 */
	private static function spec_get_connection_status(): array {
		return array(
			'label'               => __( 'Get Jetpack connection status', 'jetpack-connection' ),
			'description'         => __(
				'Return the site-level Jetpack connection state in one zero-argument call. Shape: { site_connected, user_connected, master_user, plan_class, blog_id, registration_url, jetpack_version }. `site_connected` is true when the site has a blog id and a blog token. `user_connected` is true when at least one user has linked their WordPress.com account. `master_user` is the local user id of the connection owner (the user who registered the site), or null if there is no owner. `plan_class` is the slug of the currently active Jetpack/WordPress.com plan (e.g. "free", "personal", "premium", "business"), or null when no plan is known. `blog_id` is the WordPress.com site id, or null when the site has not been registered. `registration_url` is the wp-admin URL the site owner should visit to register the site when `site_connected` is false; null once the site is connected. `jetpack_version` is the running Jetpack plugin version, or null when the constant is not defined (which means Jetpack itself is not loaded — the abilities are still callable through any other connection-consuming plugin). Read-only and idempotent — safe to poll. Call jetpack-connection/get-current-user-connection for the calling user\'s individual link state.',
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
					'site_connected'   => array( 'type' => 'boolean' ),
					'user_connected'   => array( 'type' => 'boolean' ),
					'master_user'      => array( 'type' => array( 'integer', 'null' ) ),
					'plan_class'       => array( 'type' => array( 'string', 'null' ) ),
					'blog_id'          => array( 'type' => array( 'integer', 'null' ) ),
					'registration_url' => array( 'type' => array( 'string', 'null' ) ),
					'jetpack_version'  => array( 'type' => array( 'string', 'null' ) ),
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
			),
		);
	}

	/**
	 * Spec: jetpack-connection/get-current-user-connection.
	 */
	private static function spec_get_current_user_connection(): array {
		return array(
			'label'               => __( 'Get current user Jetpack connection', 'jetpack-connection' ),
			'description'         => __(
				'Return the calling user\'s Jetpack connection state in one zero-argument call. Shape: { id, login, connected, is_master_user, connect_url }. `id` is the local WordPress user id and `login` is their user_login. `connected` is true when the user has linked their WordPress.com account (a user token exists for this id). `is_master_user` is true when this user is the connection owner — the user who originally registered the site to WordPress.com. `connect_url` is the wp-admin URL the user should visit to link their account when `connected` is false; null when the user is already connected. Read-only and idempotent. Fails with jetpack_connection_not_logged_in when called by an anonymous request — the caller must be authenticated. Call jetpack-connection/get-connection-status for the site-wide view.',
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
					'id'             => array( 'type' => 'integer' ),
					'login'          => array( 'type' => 'string' ),
					'connected'      => array( 'type' => 'boolean' ),
					'is_master_user' => array( 'type' => 'boolean' ),
					'connect_url'    => array( 'type' => array( 'string', 'null' ) ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_current_user_connection' ),
			'permission_callback' => array( __CLASS__, 'can_view_connection' ),
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
	 * Permission check: any authenticated user can read connection state.
	 *
	 * Connection state is not sensitive in itself (the same data is exposed
	 * on the Jetpack admin page and through several existing REST endpoints),
	 * but anonymous callers have no legitimate need to inspect it, so we
	 * still require an authenticated request.
	 *
	 * @return bool
	 */
	public static function can_view_connection(): bool {
		return is_user_logged_in();
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

		$manager        = self::get_manager();
		$site_connected = (bool) $manager->is_connected();
		$user_connected = (bool) $manager->has_connected_user();

		$master_user_raw = Jetpack_Options::get_option( 'master_user' );
		$master_user     = is_numeric( $master_user_raw ) && (int) $master_user_raw > 0 ? (int) $master_user_raw : null;

		$blog_id_raw = Jetpack_Options::get_option( 'id' );
		$blog_id     = is_numeric( $blog_id_raw ) && (int) $blog_id_raw > 0 ? (int) $blog_id_raw : null;

		// The active plan is stored by the Jetpack plugin under `jetpack_active_plan`,
		// not as one of the connection package's own option names — read it directly
		// from the options table. Absent on connection-only consumers (Boost, Search,
		// etc.), in which case `plan_class` is null.
		$plan      = get_option( 'jetpack_active_plan' );
		$plan_slug = is_array( $plan ) && isset( $plan['product_slug'] ) && is_string( $plan['product_slug'] ) && '' !== $plan['product_slug']
			? (string) $plan['product_slug']
			: null;

		$jetpack_version_raw = Constants::get_constant( 'JETPACK__VERSION' );
		$jetpack_version     = is_string( $jetpack_version_raw ) && '' !== $jetpack_version_raw ? $jetpack_version_raw : null;

		return array(
			'site_connected'   => $site_connected,
			'user_connected'   => $user_connected,
			'master_user'      => $master_user,
			'plan_class'       => $plan_slug,
			'blog_id'          => $blog_id,
			'registration_url' => $site_connected ? null : self::registration_url(),
			'jetpack_version'  => $jetpack_version,
		);
	}

	/**
	 * Execute: get-current-user-connection.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_current_user_connection( $input = null ) {
		unset( $input );

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'not_logged_in',
				__( 'You must be logged in to inspect the current user\'s Jetpack connection. Authenticate the request and try again.', 'jetpack-connection' )
			);
		}

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'not_logged_in',
				__( 'The current user could not be loaded. Authenticate the request and try again.', 'jetpack-connection' )
			);
		}

		$manager        = self::get_manager();
		$connected      = (bool) $manager->is_user_connected( $user_id );
		$is_master_user = false;
		$master_user    = Jetpack_Options::get_option( 'master_user' );
		if ( is_numeric( $master_user ) && (int) $master_user === $user_id ) {
			$is_master_user = true;
		}

		return array(
			'id'             => $user_id,
			'login'          => (string) $user->user_login,
			'connected'      => $connected,
			'is_master_user' => $is_master_user,
			'connect_url'    => $connected ? null : self::connect_url(),
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
	 * free and cheap to poll. The Jetpack admin page handles the actual
	 * registration handshake from there.
	 *
	 * @return string
	 */
	private static function registration_url(): string {
		return admin_url( 'admin.php?page=jetpack' );
	}

	/**
	 * Build the wp-admin URL the current user should visit to link their
	 * WordPress.com account. Same rationale as `registration_url()` — stable,
	 * side-effect free. The Jetpack admin page brokers the actual
	 * authorization request.
	 *
	 * @return string
	 */
	private static function connect_url(): string {
		return admin_url( 'admin.php?page=jetpack' );
	}
}
