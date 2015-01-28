<?php
/**
 * Module Name: Photon
 * Module Description: Accelerate your site by loading images from the WordPress.com CDN.
 * Sort Order: 25
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance
 */

Jetpack::dns_prefetch( array(
	'//i0.wp.com',
	'//i1.wp.com',
	'//i2.wp.com',
) );

Jetpack_Photon::instance();