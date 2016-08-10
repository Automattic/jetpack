<?php
/**
 * Module Name: Sitemaps
 * Module Description: Allow your site to be indexed by search engines.
 * Sort Order: 13
 * First Introduced: 3.9
 * Requires Connection: No
 * Auto Activate: Public
 * Module Tags: Recommended, Traffic
 * Additional Search Queries: sitemap, traffic, search, site map, seo
 */

if ( '1' == get_option( 'blog_public' ) ) {
	include_once 'sitemaps/sitemaps.php';
}
