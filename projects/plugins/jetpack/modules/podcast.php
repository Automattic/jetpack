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

// Podcast intentionally omits module-introduction metadata. This keeps it out
// of version-ranged upgrade activation for existing sites, while Auto Activate
// enables it when a new installation loads the complete default module list.

// Core (feed, settings, block) is local WordPress — no connection needed.
// Loading is wired in Jetpack::late_initialization() (not here) so it also
// covers disconnected sites, which load_modules() skips.
