<?php
/**
 * The Jetpack Connection package Utils class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Tracking;

/**
 * Provides utility methods for the Connection package.
 */
class Utils {

	const DEFAULT_JETPACK__API_VERSION         = 1;
	const DEFAULT_JETPACK__API_BASE            = 'https://jetpack.wordpress.com/jetpack.';
	const DEFAULT_JETPACK__WPCOM_JSON_API_BASE = 'https://public-api.wordpress.com';

	const HTTPS_CHECK_OPTION_PREFIX = 'jetpack_sync_https_history_';
	const HTTPS_CHECK_HISTORY       = 5;

	/**
	 * This method used to set the URL scheme to HTTP when HTTPS requests can't be made.
	 * Now it returns the exact same URL you pass as an argument.
	 *
	 * @param string $url The url.
	 * @return string The exact same url.
	 *
	 * @deprecated 9.1.0 Jetpack can't function properly on servers that don't support outbound HTTPS requests.
	 */
	public static function fix_url_for_bad_hosts( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.1.0' );
		return $url;
	}

	/**
	 * Enters a user token into the user_tokens option
	 *
	 * @deprecated 9.5 Use Automattic\Jetpack\Connection\Tokens->update_user_token() instead.
	 *
	 * @param int    $user_id The user id.
	 * @param string $token The user token.
	 * @param bool   $is_master_user Whether the user is the master user.
	 * @return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Tokens->update_user_token' );
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
		if ( ! is_null( $constant_value ) ) {
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
	 * Return URL from option or PHP constant.
	 *
	 * @param string $option_name (e.g. 'home').
	 *
	 * @return mixed|null URL.
	 */
	public static function get_raw_url( $option_name ) {
		$value    = null;
		$constant = ( 'home' === $option_name )
			? 'WP_HOME'
			: 'WP_SITEURL';

		// Since we disregard the constant for multisites in ms-default-filters.php,
		// let's also use the db value if this is a multisite.
		if ( ! is_multisite() && Constants::is_defined( $constant ) ) {
			$value = Constants::get_constant( $constant );
		} else {
			// Let's get the option from the database so that we can bypass filters. This will help
			// ensure that we get more uniform values.
			$value = \Jetpack_Options::get_raw_option( $option_name );
		}

		return $value;
	}

	/**
	 * Normalize domains by removing www unless declared in the site's option.
	 *
	 * @param string   $option Option value from the site.
	 * @param callable $url_function Function retrieving the URL to normalize.
	 * @return mixed|string URL.
	 */
	public static function normalize_www_in_url( $option, $url_function ) {
		$url        = wp_parse_url( call_user_func( $url_function ) );
		$option_url = wp_parse_url( get_option( $option ) );

		if ( ! $option_url || ! $url ) {
			return $url;
		}

		if ( "www.{$option_url[ 'host' ]}" === $url['host'] ) {
			// remove www if not present in option URL.
			$url['host'] = $option_url['host'];
		}
		if ( "www.{$url[ 'host' ]}" === $option_url['host'] ) {
			// add www if present in option URL.
			$url['host'] = $option_url['host'];
		}

		$normalized_url = "{$url['scheme']}://{$url['host']}";
		if ( isset( $url['path'] ) ) {
			$normalized_url .= "{$url['path']}";
		}

		if ( isset( $url['query'] ) ) {
			$normalized_url .= "?{$url['query']}";
		}

		return $normalized_url;
	}

	/**
	 * Return URL with a normalized protocol.
	 *
	 * @param callable $callable Function to retrieve URL option.
	 * @param string   $new_value URL Protocol to set URLs to.
	 * @return string Normalized URL.
	 */
	public static function get_protocol_normalized_url( $callable, $new_value ) {
		$option_key = self::HTTPS_CHECK_OPTION_PREFIX . $callable;

		$parsed_url = wp_parse_url( $new_value );
		if ( ! $parsed_url ) {
			return $new_value;
		}
		if ( array_key_exists( 'scheme', $parsed_url ) ) {
			$scheme = $parsed_url['scheme'];
		} else {
			$scheme = '';
		}
		$scheme_history   = get_option( $option_key, array() );
		$scheme_history[] = $scheme;

		// Limit length to self::HTTPS_CHECK_HISTORY.
		$scheme_history = array_slice( $scheme_history, ( self::HTTPS_CHECK_HISTORY * -1 ) );

		update_option( $option_key, $scheme_history );

		$forced_scheme = in_array( 'https', $scheme_history, true ) ? 'https' : 'http';

		return set_url_scheme( $new_value, $forced_scheme );
	}

	/**
	 * Helper function that is used when getting home or siteurl values. Decides
	 * whether to get the raw or filtered value.
	 *
	 * @param string $url_type URL to get, home or siteurl.
	 * @return string
	 */
	public static function get_raw_or_filtered_url( $url_type ) {
		$url_function = ( 'home' === $url_type )
			? 'home_url'
			: 'site_url';

		if (
			! Constants::is_defined( 'JETPACK_SYNC_USE_RAW_URL' ) ||
			Constants::get_constant( 'JETPACK_SYNC_USE_RAW_URL' )
		) {
			$scheme = is_ssl() ? 'https' : 'http';
			$url    = self::get_raw_url( $url_type );
			$url    = set_url_scheme( $url, $scheme );
		} else {
			$url = self::normalize_www_in_url( $url_type, $url_function );
		}

		return self::get_protocol_normalized_url( $url_function, $url );
	}

	/**
	 * Return the escaped home_url.
	 *
	 * @return string
	 */
	public static function home_url() {
		$url = self::get_raw_or_filtered_url( 'home' );

		/**
		 * Allows overriding of the home_url value that is synced back to WordPress.com.
		 *
		 * @since 5.2.0
		 *
		 * @param string $home_url
		 */
		return esc_url_raw( apply_filters( 'jetpack_sync_home_url', $url ) );
	}

	/**
	 * Return the escaped siteurl.
	 *
	 * @return string
	 */
	public static function site_url() {
		$url = self::get_raw_or_filtered_url( 'siteurl' );

		/**
		 * Allows overriding of the site_url value that is synced back to WordPress.com.
		 *
		 * @since 5.2.0
		 *
		 * @param string $site_url
		 */
		return esc_url_raw( apply_filters( 'jetpack_sync_site_url', $url ) );
	}

	/**
	 * Return main site URL with a normalized protocol.
	 *
	 * @return string
	 */
	public static function main_network_site_url() {
		return self::get_protocol_normalized_url( 'main_network_site_url', network_site_url() );
	}
}
