<?php
/**
 * Sitemap-related constants.
 *
 * @package Jetpack
 * @since 4.7.0
 * @author Automattic
 */

/*
 * These constants represent the types of various kinds of sitemaps.
 * Note: these strings are used as 'post_types' in the database, and
 * so must be at most 20 characters long.
 */

if ( ! defined( 'JP_MASTER_SITEMAP_TYPE' ) ) {
	define( 'JP_MASTER_SITEMAP_TYPE', 'jp_sitemap_master' );
}

if ( ! defined( 'JP_PAGE_SITEMAP_TYPE' ) ) {
	define( 'JP_PAGE_SITEMAP_TYPE', 'jp_sitemap' );
}

if ( ! defined( 'JP_PAGE_SITEMAP_INDEX_TYPE' ) ) {
	define( 'JP_PAGE_SITEMAP_INDEX_TYPE', 'jp_sitemap_index' );
}

if ( ! defined( 'JP_IMAGE_SITEMAP_TYPE' ) ) {
	define( 'JP_IMAGE_SITEMAP_TYPE', 'jp_img_sitemap' );
}

if ( ! defined( 'JP_IMAGE_SITEMAP_INDEX_TYPE' ) ) {
	define( 'JP_IMAGE_SITEMAP_INDEX_TYPE', 'jp_img_sitemap_index' );
}

if ( ! defined( 'JP_VIDEO_SITEMAP_TYPE' ) ) {
	define( 'JP_VIDEO_SITEMAP_TYPE', 'jp_vid_sitemap' );
}

if ( ! defined( 'JP_VIDEO_SITEMAP_INDEX_TYPE' ) ) {
	define( 'JP_VIDEO_SITEMAP_INDEX_TYPE', 'jp_vid_sitemap_index' );
}
