<?php
/**
 * Module Name: Image CDN
 * Module Description:  Mirrors and serves your images from our free and fast image CDN, improving your site’s performance with no additional load on your servers.
 * Jumpstart Description: Mirrors and serves your images from our free and fast image CDN, improving your site’s performance with no additional load on your servers.
 * Sort Order: 25
 * Recommendation Order: 1
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance, Recommended
 * Feature: Recommended, Jumpstart, Appearance
 * Additional Search Queries: photon, photo cdn, image cdn, speed, compression, resize, responsive images, responsive, content distribution network, optimize, page speed, image optimize, photon jetpack
 */

Jetpack::dns_prefetch( array(
	'//i0.wp.com',
	'//i1.wp.com',
	'//i2.wp.com',
) );

Jetpack_Photon::instance();
