<?php
/**
 * Provider for the foundation pages
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

use Automattic\Jetpack_Boost\Lib\Foundation_Pages;

/**
 * Class Foundation_Provider
 *
 * @package Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers
 */
class Foundation_Provider extends Provider {

	/**
	 * @var string
	 */
	protected static $name = 'foundation';

	/**
	 * Get the providers for foundation pages.
	 *
	 * @param array $_context_posts Context posts, not used. Foundation pages are always available.
	 * @return array
	 */
	public static function get_critical_source_urls( $_context_posts = array() ) {
		$foundation_pages = new Foundation_Pages();

		$urls = $foundation_pages->get_pages();

		$groups = array();
		foreach ( $urls as $url ) {
			$groups[ self::get_hash_for_url( $url ) ] = array( $url );
		}

		return $groups;
	}

	/**
	 * Get the current storage keys for foundation pages.
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

		return add_query_arg( $wp->query_vars, home_url( '/' ) );
	}

	/**
	 * Get the keys for foundation pages.
	 *
	 * @return array
	 */
	public static function get_keys() {
		$foundation_pages = new Foundation_Pages();
		$urls             = $foundation_pages->get_pages();

		return array_map( array( __CLASS__, 'get_hash_for_url' ), $urls );
	}

	/**
	 * @inheritdoc
	 */
	public static function get_hash_for_url( $url ) {
		$hash = hash( 'md5', $url );

		return substr( $hash, 0, 8 );
	}

	/**
	 * @inheritdoc
	 */
	public static function describe_key( $_key ) {
		return __( 'Foundation page', 'jetpack-boost' );
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
