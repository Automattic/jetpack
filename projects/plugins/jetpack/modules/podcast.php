<?php
/**
 * Module Name: Podcast
 * Module Description: Publish, manage, and grow your podcast right from your site.
 * Sort Order: 38
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: podcast, podcasts, podcasting, audio, episodes, rss, feed, distribution
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Core (feed, settings, block) is local WordPress — no connection needed.
// Loading is wired in Jetpack::late_initialization() (not here) so it also
// covers disconnected sites, which load_modules() skips.
