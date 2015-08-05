<?php
/**
 * Module Name: Photon
 * Module Description: Image speed performance.
 * Jumpstart Description: mirrors and serves your images from our free and fast image CDN, improving your site’s performance with no additional load on your servers.
 * Sort Order: 25
 * Recommendation Order: 1
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance, Recommended
 * Feature: Recommended, Jumpstart, Performance-Security
 */

Jetpack::dns_prefetch( array(
	'//i0.wp.com',
	'//i1.wp.com',
	'//i2.wp.com',
) );

Jetpack_Photon::instance();