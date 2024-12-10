<?php
/**
 * Publicize Connection Fields class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Publicize Connection Fields class.
 */
class Connection_Fields {

	/**
	 * Get the publicize instance - properly typed
	 *
	 * @return Publicize
	 */
	protected static function publicize() {
		/**
		 * Publicize instance.
		 *
		 * @var Publicize $publicize
		 */
		global $publicize;

		if ( ! $publicize && function_exists( 'publicize_init' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check
			publicize_init();
		}

		return $publicize;
	}

	/**
	 * Get the meta of a connection.
	 *
	 * @param array|object $connection The connection.
	 * @return array
	 */
	protected static function get_connection_meta( $connection ) {

		return self::publicize()->get_connection_meta( $connection );
	}

	/**
	 * Get the ID of a connection.
	 *
	 * @param array $connection The connection.
	 * @return string
	 */
	public static function get_connection_id( $connection ) {
		return (string) self::publicize()->get_connection_id( $connection );
	}

	/**
	 * Returns a display name for the Connection
	 *
	 * @param string       $service_name 'facebook', 'twitter', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_display_name( $service_name, $connection ) {
		$cmeta = self::get_connection_meta( $connection );

		if ( 'mastodon' === $service_name && isset( $cmeta['external_name'] ) ) {
			return $cmeta['external_name'];
		}

		if ( isset( $cmeta['connection_data']['meta']['display_name'] ) ) {
			return $cmeta['connection_data']['meta']['display_name'];
		}

		if ( 'tumblr' === $service_name && isset( $cmeta['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			return $cmeta['connection_data']['meta']['tumblr_base_hostname'];
		}

		if ( 'twitter' === $service_name ) {
			return $cmeta['external_display'];
		}

		$connection_display = $cmeta['external_display'];

		if ( empty( $connection_display ) ) {
			$connection_display = $cmeta['external_name'];
		}

		return $connection_display;
	}

	/**
	 * Returns the external handle for the Connection.
	 *
	 * @param string       $service_name 'facebook', 'linkedin', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_external_handle( $service_name, $connection ) {
		$cmeta = self::get_connection_meta( $connection );

		switch ( $service_name ) {
			case 'mastodon':
				return $cmeta['external_display'] ?? '';

			case 'bluesky':
			case 'threads':
				return $cmeta['external_name'] ?? '';

			case 'instagram-business':
				return $cmeta['connection_data']['meta']['username'] ?? '';

			default:
				return '';
		}
	}

	/**
	 * Returns the external ID for the Connection.
	 *
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_external_id( $connection ) {
		$connection_meta = self::get_connection_meta( $connection );

		return $connection_meta['external_id'] ?? '';
	}

	/**
	 * Returns an external URL to the Connection's profile
	 *
	 * @param string       $service_name 'facebook', 'twitter', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return false|string False on failure. URL on success.
	 */
	public static function get_profile_link( $service_name, $connection ) {
		$cmeta = self::get_connection_meta( $connection );

		if ( isset( $cmeta['connection_data']['meta']['link'] ) ) {
			if ( 'facebook' === $service_name && str_starts_with( wp_parse_url( $cmeta['connection_data']['meta']['link'], PHP_URL_PATH ), '/app_scoped_user_id/' ) ) {
				// App-scoped Facebook user IDs are not usable profile links.
				return false;
			}

			return $cmeta['connection_data']['meta']['link'];
		}

		if ( 'facebook' === $service_name && isset( $cmeta['connection_data']['meta']['facebook_page'] ) ) {
			return 'https://facebook.com/' . $cmeta['connection_data']['meta']['facebook_page'];
		}

		if ( 'instagram-business' === $service_name && isset( $cmeta['connection_data']['meta']['username'] ) ) {
			return 'https://instagram.com/' . $cmeta['connection_data']['meta']['username'];
		}

		if ( 'threads' === $service_name && isset( $cmeta['external_name'] ) ) {
			return 'https://www.threads.net/@' . $cmeta['external_name'];
		}

		if ( 'mastodon' === $service_name && isset( $cmeta['external_name'] ) ) {
			return 'https://mastodon.social/@' . $cmeta['external_name'];
		}

		if ( 'nextdoor' === $service_name && isset( $cmeta['external_id'] ) ) {
			return 'https://nextdoor.com/profile/' . $cmeta['external_id'];
		}

		if ( 'tumblr' === $service_name && isset( $cmeta['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			return 'https://' . $cmeta['connection_data']['meta']['tumblr_base_hostname'];
		}

		if ( 'twitter' === $service_name ) {
			return 'https://twitter.com/' . substr( $cmeta['external_display'], 1 ); // Has a leading '@'.
		}

		if ( 'bluesky' === $service_name ) {
			return 'https://bsky.app/profile/' . $cmeta['external_id'];
		}

		if ( 'linkedin' === $service_name ) {
			if ( ! isset( $cmeta['connection_data']['meta']['profile_url'] ) ) {
				return false;
			}

			$profile_url_query      = wp_parse_url( $cmeta['connection_data']['meta']['profile_url'], PHP_URL_QUERY );
			$profile_url_query_args = array();
			wp_parse_str( $profile_url_query, $profile_url_query_args );

			$id = null;

			if ( isset( $profile_url_query_args['key'] ) ) {
				$id = $profile_url_query_args['key'];
			} elseif ( isset( $profile_url_query_args['id'] ) ) {
				$id = $profile_url_query_args['id'];
			} else {
				return false;
			}

			return esc_url_raw( add_query_arg( 'id', rawurlencode( $id ), 'https://www.linkedin.com/profile/view' ) );
		}

		return false; // no fallback. we just won't link it.
	}

	/**
	 * Returns a profile picture for the Connection
	 *
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_profile_picture( $connection ) {
		$cmeta = self::get_connection_meta( $connection );

		if ( isset( $cmeta['profile_picture'] ) ) {
			return $cmeta['profile_picture'];
		}

		return '';
	}

	/**
	 * Returns a display name for the Service
	 *
	 * @param string $service_name 'facebook', 'twitter', etc.
	 * @return string
	 */
	public static function get_service_label( $service_name ) {
		return self::publicize()->get_service_label( $service_name );
	}

	/**
	 * Returns whether the Connection is shared
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return bool
	 */
	public static function is_shared( $connection ) {
		return empty( self::get_user_id( $connection ) );
	}

	/**
	 * Returns the status for the Connection
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_status( $connection ) {
		return $connection['status'] ?? 'ok';
	}

	/**
	 * Returns the user ID for the Connection
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return int
	 */
	public static function get_user_id( $connection ) {
		$connection_meta = self::get_connection_meta( $connection );

		$connection_data = $connection_meta['connection_data'];

		return (int) $connection_data['user_id'];
	}
}
