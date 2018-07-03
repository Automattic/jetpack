<?php

/**
 * Module Name: Lazy Images
 * Module Description: Lazy load images
 * Jumpstart Description: Lazy-loading images improve your site's speed and create a smoother viewing experience. Images will load as visitors scroll down the screen, instead of all at once.
 * Sort Order: 24
 * Recommendation Order: 14
 * First Introduced: 5.6.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Recommended
 * Feature: Appearance, Jumpstart
 * Additional Search Queries: mobile, theme, performance, image
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

/*
 * Initialize lazy images on the wp action so that conditional
 * tags are safe to use.
 *
 * As an example, this is important if a theme wants to disable lazy images except
 * on single posts, pages, or attachments by short-circuiting lazy images when
 * is_singular() returns false.
 *
 * See: https://github.com/Automattic/jetpack/issues/8888
 */

add_action( 'wp', array( 'Jetpack_Lazy_Images', 'instance' ) );
