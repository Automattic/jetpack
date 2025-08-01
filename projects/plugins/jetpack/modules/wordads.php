<?php
/**
 * Module Name: Ads
 * Module Description: Earn revenue by displaying high‑quality ads on your site.
 * Sort Order: 1
 * First Introduced: 4.5.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Traffic, Appearance
 * Additional Search Queries: advertising, ad codes, ads, creator
 * Plans: premium, business, security, complete
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Load WordAds.
 */
function jetpack_load_wordads() {
	Jetpack::enable_module_configurable( __FILE__ );
	require_once __DIR__ . '/wordads/class-wordads.php';
}

jetpack_load_wordads();
