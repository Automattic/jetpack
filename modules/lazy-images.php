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

// TODO: Add attribution here

require_once( JETPACK__PLUGIN_DIR . 'modules/lazy-images/lazy-images.php' );
Jetpack_Lazy_Images::instance();
