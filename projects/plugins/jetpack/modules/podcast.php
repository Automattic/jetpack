<?php
/**
 * Module Name: Podcast
 * Module Description: Publish, manage, and grow your podcast right from your site.
 * Sort Order: 38
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: podcast, podcasts, podcasting, audio, episodes, rss, feed, distribution
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Podcast\Podcast;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// The package self-gates on the `jetpack_podcast_for_the_world` filter for
// self-hosted sites, and the module itself is only listed when that filter is
// true (see Jetpack::filter_available_modules_podcast()). Jetpack::late_initialization()
// also calls this on every request (idempotent) so it loads while disconnected.
Podcast::init();
