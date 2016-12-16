<?php
/**
 * Module Name: Sitemaps
 * Module Description: Make it easy for search engines to find your site.
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
