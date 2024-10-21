<?php
/**
 * Provider for the foundation pages
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

use Automattic\Jetpack_Boost\Lib\Foundation_Pages;

/**
 * Class Foundatino_Provider
 *
 * @package Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers
 */
class Foundation_Provider extends Provider {

	/**
	 * @var string
	 */
	protected static $name = 'foundation';

	public static function get_critical_source_urls( $_context_posts = array() ) {
		$foundation_pages = new Foundation_Pages();

		$urls = $foundation_pages->get_pages();

		$groups = array();
		foreach ( $urls as $url ) {
			$groups[ self::get_hash_for_url( $url ) ] = array( $url );
		}

		return $groups;
	}

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

	public static function get_keys() {
		$foundation_pages = new Foundation_Pages();
		$urls             = $foundation_pages->get_pages();

		return array_map( array( __CLASS__, 'get_hash_for_url' ), $urls );
	}

	public static function get_hash_for_url( $url ) {
		$hash = hash( 'md5', $url );

		return substr( $hash, 0, 8 );
	}

	public static function describe_key( $_key ) {
		return __( 'Foundation page', 'jetpack-boost' );
	}

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

	public static function get_success_ratio() {
		return 1;
	}
}
