<?php
/**
 * The Jetpack Connection package Utils class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Tracking;

/**
 * Provides utility methods for the Connection package.
 */
class Utils {

	const DEFAULT_JETPACK__API_VERSION         = 1;
	const DEFAULT_JETPACK__API_BASE            = 'https://jetpack.wordpress.com/jetpack.';
	const DEFAULT_JETPACK__WPCOM_JSON_API_BASE = 'https://public-api.wordpress.com';

	/**
	 * Enters a user token into the user_tokens option
	 *
	 * @deprecated 1.24.0 Use Automattic\Jetpack\Connection\Tokens->update_user_token() instead.
	 *
	 * @param int    $user_id The user id.
	 * @param string $token The user token.
	 * @param bool   $is_master_user Whether the user is the master user.
	 * @return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		_deprecated_function( __METHOD__, '1.24.0', 'Automattic\\Jetpack\\Connection\\Tokens->update_user_token' );
		return ( new Tokens() )->update_user_token( $user_id, $token, $is_master_user );
	}

	/**
	 * Filters the value of the api constant.
	 *
	 * @param String $constant_value The constant value.
	 * @param String $constant_name The constant name.
	 * @return mixed | null
	 */
	public static function jetpack_api_constant_filter( $constant_value, $constant_name ) {
		if ( $constant_value !== null ) {
			// If the constant value was already set elsewhere, use that value.
			return $constant_value;
		}

		if ( defined( "self::DEFAULT_$constant_name" ) ) {
			return constant( "self::DEFAULT_$constant_name" );
		}

		return null;
	}

	/**
	 * Add a filter to initialize default values of the constants.
	 */
	public static function init_default_constants() {
		add_filter(
			'jetpack_constant_default_value',
			array( __CLASS__, 'jetpack_api_constant_filter' ),
			10,
			2
		);
	}

	/**
	 * Filters the registration request body to include tracking properties.
	 *
	 * @param array $properties Already prepared tracking properties.
	 * @return array amended properties.
	 */
	public static function filter_register_request_body( $properties ) {
		$tracking        = new Tracking();
		$tracks_identity = $tracking->tracks_get_identity( get_current_user_id() );

		return array_merge(
			$properties,
			array(
				'_ui' => $tracks_identity['_ui'],
				'_ut' => $tracks_identity['_ut'],
			)
		);
	}

	/**
	 * Generate a new user from a SSO attempt.
	 *
	 * @param object $user_data WordPress.com user information.
	 */
	public static function generate_user( $user_data ) {
		$username = $user_data->login;
		/**
		 * Determines how many times the SSO module can attempt to randomly generate a user.
		 *
		 * @module sso
		 *
		 * @since jetpack-4.3.2
		 *
		 * @param int 5 By default, SSO will attempt to random generate a user up to 5 times.
		 */
		$num_tries = (int) apply_filters( 'jetpack_sso_allowed_username_generate_retries', 5 );

		$exists = username_exists( $username );
		$tries  = 0;
		while ( $exists && $tries++ < $num_tries ) {
			$username = $user_data->login . '_' . $user_data->ID . '_' . wp_rand();
			$exists   = username_exists( $username );
		}

		if ( $exists ) {
			return false;
		}

		$user               = (object) array();
		$user->user_pass    = wp_generate_password( 20 );
		$user->user_login   = wp_slash( $username );
		$user->user_email   = wp_slash( $user_data->email );
		$user->display_name = $user_data->display_name;
		$user->first_name   = $user_data->first_name;
		$user->last_name    = $user_data->last_name;
		$user->url          = $user_data->url;
		$user->description  = $user_data->description;

		if ( isset( $user_data->role ) && $user_data->role ) {
			$user->role = $user_data->role;
		}

		$created_user_id = wp_insert_user( $user );

		// `clean_user_cache()` calls `exists()` on anything non-numeric, which a WP_Error does not have.
		if ( is_wp_error( $created_user_id ) ) {
			return false;
		}

		self::set_wpcom_user_id( $created_user_id, (int) $user_data->ID );
		return get_userdata( $created_user_id );
	}

	/**
	 * Get the WordPress.com user ID bound to a local user.
	 *
	 * The `wpcom_user_id` meta is a durable, one-to-one, WordPress.com-asserted identity binding,
	 * not a cache of any one token: SSO and Premium Content read and write it too, and it outlives
	 * the connection that first established it. Do not drop it because a token went away.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $user_id The local WordPress user ID.
	 * @return int The WordPress.com user ID, or 0 when none is bound.
	 */
	public static function get_wpcom_user_id( $user_id ) {
		return (int) get_user_meta( absint( $user_id ), 'wpcom_user_id', true );
	}

	/**
	 * Bind a WordPress.com user ID to a local user, removing it from any other user first.
	 *
	 * Two local users answering to the same WordPress.com identity would make owner resolution
	 * ambiguous, so the previous holder is cleared. That only holds for writes routed through here:
	 * Premium Content writes the same key directly, so uniqueness is not guaranteed site-wide. On
	 * multisite the lookup is scoped to the current site.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $user_id       The local WordPress user ID.
	 * @param int $wpcom_user_id The WordPress.com user ID.
	 */
	public static function set_wpcom_user_id( $user_id, $wpcom_user_id ) {
		$user_id       = absint( $user_id );
		$wpcom_user_id = absint( $wpcom_user_id );

		// 0 is what `get_wpcom_user_id()` returns for "nothing bound", so it is not storable.
		if ( ! $user_id || ! $wpcom_user_id ) {
			return;
		}

		$existing = new \WP_User_Query(
			array(
				'meta_key'    => 'wpcom_user_id',
				'meta_value'  => $wpcom_user_id,
				'exclude'     => array( $user_id ),
				'fields'      => 'ID',
				'count_total' => false,
			)
		);

		foreach ( $existing->get_results() as $stale_user_id ) {
			delete_user_meta( $stale_user_id, 'wpcom_user_id' );
			clean_user_cache( $stale_user_id );
		}

		update_user_meta( $user_id, 'wpcom_user_id', $wpcom_user_id );
		clean_user_cache( $user_id );
	}

	/**
	 * Drop the WordPress.com user ID bound to a local user.
	 *
	 * Only for when the binding itself is known to be wrong — a token replaced with a different
	 * WordPress.com account. A disconnect does not make it wrong, and other subsystems store their
	 * own meaning in this key.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $user_id The local WordPress user ID.
	 */
	public static function delete_wpcom_user_id( $user_id ) {
		$user_id = absint( $user_id );

		// `clean_user_cache()` bumps the site-wide users cache salt, so skip it on the common
		// no-op path where there was nothing bound.
		if ( delete_user_meta( $user_id, 'wpcom_user_id' ) ) {
			clean_user_cache( $user_id );
		}
	}
}
