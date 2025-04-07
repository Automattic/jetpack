<?php
/**
 * Provider for the cornerstone pages
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

/**
 * Class Cornerstone_Provider
 *
 * @package Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers
 */
class Cornerstone_Provider extends Provider {

	/**
	 * @var string
	 */
	protected static $name = 'cornerstone';

	/**
	 * Get the providers for cornerstone pages.
	 *
	 * @param array $_context_posts Context posts, not used. Cornerstone pages are always available.
	 * @return array
	 */
	public static function get_critical_source_urls( $_context_posts = array() ) {
		$urls = Cornerstone_Utils::get_list();

		$groups = array();
		foreach ( $urls as $url ) {
			$groups[ self::get_hash_for_url( $url ) ] = array( $url );
		}

		return $groups;
	}

	/**
	 * Get the current storage keys for cornerstone pages.
	 *
	 * @return array
	 */
	public static function get_current_storage_keys() {
		$current_url = self::get_request_url();
		return array( self::$name . '_' . self::get_hash_for_url( $current_url ) );
	}

	private static function get_request_url() {
		global $wp;

		// If pretty parmalinks are enabled, use the request. Otherwise, use the query vars.
		if ( get_option( 'permalink_structure' ) ) {
			return home_url( $wp->request );
		}

		return add_query_arg( $wp->query_vars, home_url() );
	}

	/**
	 * Get the keys for cornerstone pages.
	 *
	 * @return array
	 */
	public static function get_keys() {
		$urls = Cornerstone_Utils::get_list();

		return array_map( array( __CLASS__, 'get_hash_for_url' ), $urls );
	}

	/**
	 * @inheritdoc
	 */
	public static function get_hash_for_url( $url ) {
		// Remove the home_url from the beginning of the URL.
		$home_url = home_url();
		if ( stripos( $url, $home_url ) === 0 ) {
			$url = substr( $url, strlen( $home_url ) );
		}

		$url = ltrim( $url, '/' );
		$url = untrailingslashit( $url );

		$hash = hash( 'md5', $url );

		return substr( $hash, 0, 8 );
	}

	/**
	 * @inheritdoc
	 */
	public static function describe_key( $_key ) {
		return __( 'Cornerstone page', 'jetpack-boost' );
	}

	/**
	 * @inheritdoc
	 */
	public static function get_edit_url( $key ) {
		$hash = substr( $key, strlen( self::$name ) + 1 );

		$source_urls = self::get_critical_source_urls();

		if ( ! isset( $source_urls[ $hash ] ) ) {
			return null;
		}

		$post_id = url_to_postid( $source_urls[ $hash ][0] );

		if ( ! $post_id ) {
			return null;
		}

		return get_edit_post_link( $post_id );
	}

	/**
	 * @inheritdoc
	 */
	public static function get_success_ratio() {
		return 1;
	}
}
