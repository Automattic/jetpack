<?php
/**
 * Module Name: Google Fonts (Beta)
 * Module Description: Customize your site's typography with a selection of Google Fonts.
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
