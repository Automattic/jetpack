<?php

/**
 * Module Name: Lazy Images
 * Module Description: Improve performance by loading images just before they scroll into view
 * Sort Order: 24
 * Recommendation Order: 14
 * First Introduced: 5.6.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, theme, performance
 */

/**
 * This module relies heavily upon the Lazy Load plugin which was worked on by
 * Mohammad Jangda (batmoo), the WordPress.com VIP team, the TechCrunch 2011
 * redesign team, and Jake Goldman of 10up LLC.
 *
 * The JavaScript has been updated to rely on InterSection observer instead of
 * jQuery Sonar. Many thanks to Dean Hume (deanhume) and his example:
 * https://github.com/deanhume/lazy-observer-load
 */

require_once( JETPACK__PLUGIN_DIR . 'modules/lazy-images/lazy-images.php' );
Jetpack_Lazy_Images::instance();
