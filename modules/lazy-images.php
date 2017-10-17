<?php

/**
 * Module Name: Lazy Images
 * Module Description: Improve performance by loading images just before they scroll into view
 * Sort Order: 24
 * Recommendation Order: 14
 * First Introduced: 5.5
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, theme, pwa, performance, push
 */

include dirname( __FILE__ ) . "/lazy-images/lazy-images.php";
Jetpack_Lazy_Images::instance();