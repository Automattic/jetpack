<?php
/**
 * Module Name: SEO Tools
 * Module Description: Better results on search engines and social media.
 * Jumpstart Description: Better results on search engines and social media.
 * Sort Order: 35
 * Recommendation Order: 15
 * First Introduced: 4.4
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social, Appearance
 * Feature: Traffic, Jumpstart
 * Additional Search Queries: search engine optimization, social preview, meta description, custom title format
 */

include dirname( __FILE__ ) . '/seo-tools/jetpack-seo.php';
include_once( ABSPATH . 'wp-admin/includes/plugin.php' );

// Suppress SEO Tools output if any of the following plugins is active.
$jetpack_seo_conflicting_plugins = array(
	'wordpress-seo/wp-seo.php',
	'wordpress-seo-premium/wp-seo-premium.php',
	'all-in-one-seo-pack/all_in_one_seo_pack.php',
	'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
);

foreach( $jetpack_seo_conflicting_plugins as $seo_plugin ) {
	if ( Jetpack::is_plugin_active( $seo_plugin ) ) {
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		break;
	}
}

new Jetpack_SEO;
