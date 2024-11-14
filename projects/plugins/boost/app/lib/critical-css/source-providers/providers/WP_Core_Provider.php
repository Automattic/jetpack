<?php
/**
 * Provides core support for critical CSS
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

/**
 * Class WP_Core_Provider.
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class WP_Core_Provider extends Provider {

	/**
	 * Provider name.
	 *
	 * @var string
	 */
	protected static $name = 'core';

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public static function get_critical_source_urls( $context_posts = array() ) {
		$urls = array();

		$front_page = (int) get_option( 'page_on_front' );
		$posts_page = (int) get_option( 'page_for_posts' );

		if ( ! empty( $front_page ) && empty( $context_posts ) ) {
			$permalink = get_permalink( $front_page );
			if ( ! empty( $permalink ) ) {
				$urls['front_page'] = array( $permalink );
			}
		}

		$context_post_types = wp_list_pluck( $context_posts, 'post_type' );
		$context_post_ids   = wp_list_pluck( $context_posts, 'ID' );

		// The blog page is only in context if the context posts include a 'post' post_type.
		// Or, if the blog page itself is in context.
		if ( empty( $context_post_types ) || in_array( 'post', $context_post_types, true ) || in_array( $posts_page, $context_post_ids, true ) ) {
			if ( ! empty( $posts_page ) ) {
				$permalink = get_permalink( $posts_page );
				if ( ! empty( $permalink ) ) {
					$urls['posts_page'] = array( $permalink );
				}
			}
		}

		if ( ! $front_page && ! isset( $urls['posts_page'] ) ) {
			$urls['posts_page'] = array( home_url( '/' ) );
		}

		return $urls;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_keys() {
		$keys = array( 'posts_page' );

		if ( ! empty( get_option( 'page_on_front' ) ) ) {
			$keys[] = 'front_page';
		}

		return $keys;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
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

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_edit_url( $provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		if ( $provider_key === 'core_front_page' ) {
			$front_page_id = get_option( 'page_on_front' );
			if ( ! empty( $front_page_id ) ) {
				return get_edit_post_link( $front_page_id, 'link' );
			}
		}

		return null;
	}

	// phpcs:ignore
	/** @inheritdoc */
	public static function describe_key( $provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		$page = substr( $provider_key, strlen( static::$name ) + 1 );

		switch ( $page ) {
			case 'posts_page':
				return __( 'Posts page', 'jetpack-boost' );

			case 'front_page':
				return __( 'Front page', 'jetpack-boost' );

			default:
				return $provider_key;
		}
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_success_ratio() {
		return 1;
	}
}
