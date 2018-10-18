<?php
/**
 * Module Name: Photon
 * Module Description: Serve images from our servers
 * Jumpstart Description: Mirrors and serves your images from our free and fast image CDN, improving your site’s performance with no additional load on your servers.
 * Sort Order: 25
 * Recommendation Order: 1
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance, Recommended
 * Feature: Recommended, Jumpstart, Appearance
 * Additional Search Queries: photon, image, cdn, performance, speed
 */

function jetpack_photon_dns_prefetch( $urls, $relation_type ) {
	if( 'dns-prefetch' == $relation_type ) {
		$urls[] = '//i0.wp.com';
		$urls[] = '//i1.wp.com';
		$urls[] = '//i2.wp.com';
	}
	return $urls;
}
 add_filter( 'wp_resource_hints', 'jetpack_resource_hints', 10, 2 );

Jetpack_Photon::instance();
