<?php
/**
 * Module Name: Google Fonts (Beta)
 * Module Description: This feature is now supported natively in WordPress when using any block theme. To use Google Fonts, refer to the WordPress.org Font Library documentation.
 * Sort Order: 1
 * Recommendation Order: 2
 * First Introduced: 10.8.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Fonts, Recommended
 * Feature: Writing
 * Additional Search Queries: fonts, webfonts, typography, creator
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Load the Google Fonts module.
 */
require_once __DIR__ . '/google-fonts/load.php';
