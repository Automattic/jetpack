<?php //phpcs:ignoreFile Squiz.Commenting.VariableComment.Missing,Generic.Commenting.DocComment.MissingShort,Squiz.Commenting.FunctionComment.MissingParamTag
/**
 * Provides core support for critical CSS
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers;

/**
 * Class WP_Core_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class WP_Core_Provider extends Provider {

	protected static $name = 'core';

	/** @inheritdoc */
	public static function get_critical_source_urls() {
		$urls = array();

		$front_page = get_option( 'page_on_front' );
		if ( ! empty( $front_page ) ) {
			$urls['front_page'] = (array) get_permalink( $front_page );
		}

		$posts_page = get_option( 'page_for_posts' );
		if ( ! empty( $posts_page ) ) {
			$urls['posts_page'] = (array) get_permalink( $posts_page );
		} else {
			$urls['posts_page'] = (array) home_url( '/' );
		}

		return $urls;
	}

	/** @inheritdoc */
	public static function get_keys() {
		$keys = array( 'posts_page' );

		if ( ! empty( get_option( 'page_on_front' ) ) ) {
			$keys[] = 'front_page';
		}

		return $keys;
	}

	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( is_home() ) {
			$key = 'posts_page';
		} elseif ( is_front_page() ) {
			$key = 'front_page';
		}

		if ( ! isset( $key ) ) {
			return array();
		}

		// For example: "core_posts_page".
		return array( self::$name . '_' . $key );
	}

	/** @inheritdoc */
	public static function describe_key( $key ) {
		$page = substr( $key, strlen( static::$name ) + 1 );

		switch ( $page ) {
			case 'posts_page':
				return __( 'Posts page', 'jetpack-boost' );

			case 'front_page':
				return __( 'Front page', 'jetpack-boost' );

			default:
				return $key;
		}
	}

	/** @inheritdoc */
	public static function get_success_ratio() {
		return 1;
	}
}
