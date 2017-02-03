<?php
/**
 * Sitemap-related constants.
 *
 * @package Jetpack
 * @since 4.7.0
 * @author Automattic
 */

/**
 * Maximum size (in bytes) of a sitemap xml file.
 * Per the spec, max value is 10485760 (10MB).
 *
 * @link http://www.sitemaps.org/
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_MAX_BYTES' ) ) {
	define( 'JP_SITEMAP_MAX_BYTES', 10485760 );
}

/**
 * Maximum size (in url nodes) of a sitemap xml file.
 * Per the spec, max value is 50000.
 *
 * @link http://www.sitemaps.org/
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_MAX_ITEMS' ) ) {
	define( 'JP_SITEMAP_MAX_ITEMS', 10 );
}

/**
 * Maximum size (in url nodes) of a news sitemap xml file.
 * Per the spec, max value is 1000.
 *
 * @link https://support.google.com/news/publisher/answer/74288?hl=en
 * @since 4.7.0
 */
if ( ! defined( 'JP_NEWS_SITEMAP_MAX_ITEMS' ) ) {
	define( 'JP_NEWS_SITEMAP_MAX_ITEMS', 1000 );
}

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
