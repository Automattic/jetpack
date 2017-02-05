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

/**
 * Batch size for database queries.
 *
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_BATCH_SIZE' ) ) {
	define( 'JP_SITEMAP_BATCH_SIZE', 1000 );
}

/**
 * Number of sitemap files to update on each run.
 *
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_UPDATE_SIZE' ) ) {
	define( 'JP_SITEMAP_UPDATE_SIZE', 400 );
}

/**
 * Number of seconds between sitemap updates.
 *
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_INTERVAL' ) ) {
	define( 'JP_SITEMAP_INTERVAL', 10 );
}

/**
 * Number of seconds to lock the sitemap state.
 *
 * @since 4.7.0
 */
if ( ! defined( 'JP_SITEMAP_LOCK_INTERVAL' ) ) {
	define( 'JP_SITEMAP_LOCK_INTERVAL', 60 * 15 );
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

/**
 * The name (with extension) of a sitemap file of the given
 * type and number.
 *
 * @since 4.7.0
 *
 * @param string $type The sitemap type.
 * @param string $number The sitemap number.
 *
 * @return string The filename.
 */
function jp_sitemap_filename( $type, $number ) {
	if ( ! is_int( $number ) ) {
		return esc_html( "error-not-int-$type-$number.xml" );
	} elseif ( JP_MASTER_SITEMAP_TYPE === $type ) {
		return 'sitemap.xml';
	} elseif ( JP_PAGE_SITEMAP_TYPE === $type ) {
		return "sitemap-$number.xml";
	} elseif ( JP_PAGE_SITEMAP_INDEX_TYPE === $type ) {
		return "sitemap-index-$number.xml";
	} elseif ( JP_IMAGE_SITEMAP_TYPE === $type ) {
		return "image-sitemap-$number.xml";
	} elseif ( JP_IMAGE_SITEMAP_INDEX_TYPE === $type ) {
		return "image-sitemap-index-$number.xml";
	} elseif ( JP_VIDEO_SITEMAP_TYPE === $type ) {
		return "video-sitemap-$number.xml";
	} elseif ( JP_VIDEO_SITEMAP_INDEX_TYPE === $type ) {
		return "video-sitemap-index-$number.xml";
	} else {
		return esc_html( "error-bad-type-$type-$number.xml" );
	}
}

/**
 * A human-friendly name for each sitemap type (for debug messages).
 *
 * @since 4.7.0
 *
 * @param string $type The sitemap type.
 *
 * @return string The sitemap debug name.
 */
function jp_sitemap_debug_name( $type ) {
	if ( JP_PAGE_SITEMAP_TYPE === $type ) {
		return 'Sitemap';
	} elseif ( JP_PAGE_SITEMAP_INDEX_TYPE === $type ) {
		return 'Sitemap Index';
	} elseif ( JP_IMAGE_SITEMAP_TYPE === $type ) {
		return 'Image Sitemap';
	} elseif ( JP_IMAGE_SITEMAP_INDEX_TYPE === $type ) {
		return 'Image Sitemap Index';
	} elseif ( JP_VIDEO_SITEMAP_TYPE === $type ) {
		return 'Video Sitemap';
	} elseif ( JP_VIDEO_SITEMAP_INDEX_TYPE === $type ) {
		return 'Video Sitemap Index';
	}
}