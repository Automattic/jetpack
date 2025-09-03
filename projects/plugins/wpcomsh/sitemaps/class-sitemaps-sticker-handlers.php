<?php
/**
 * Enables either the suspend cache addition or the use of XMLWriter for sitemaps if their respective blog stickers are active.
 *
 * @package sitemaps
 */

add_filter(
	'jetpack_sitemap_suspend_cache_addition',
	function ( $suspend_cache_addition ) {
		$blog_sticker = 'jetpack-sitemaps-suspend-cache-addition';

		if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( $blog_sticker, Jetpack_Options::get_option( 'id' ) ) ) {
			return true;
		}

		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( $blog_sticker ) ) {
			return true;
		}
		return $suspend_cache_addition;
	},
	10,
	1
);

add_filter(
	'jetpack_sitemap_use_xmlwriter',
	function ( $use_xmlwriter ) {
		$blog_sticker = 'jetpack-sitemaps-use-xmlwriter';

		if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( $blog_sticker, Jetpack_Options::get_option( 'id' ) ) ) {
			return true;
		}

		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( $blog_sticker ) ) {
			return true;
		}
		return $use_xmlwriter;
	},
	10,
	1
);
