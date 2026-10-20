<?php
/**
 * Module Name: SEO Tools
 * Module Description: Optimize titles, meta descriptions, and social previews for better search results.
 * Sort Order: 35
 * Recommendation Order: 15
 * First Introduced: 4.4
 * Requires Connection: No
 * Requires User Connection: No
 * Auto Activate: No
 * Module Tags: Social, Appearance
 * Feature: Traffic
 * Additional Search Queries: search engine optimization, social preview, meta description, custom title format, seo, sitemap, open graph, search engine, title tag
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Suppress SEO Tools output if any of the following plugins is active. Paid editions come
// before the free plugins they run alongside, so the first match names the right one.
$jetpack_seo_conflicting_plugins = array(
	'wordpress-seo-premium/wp-seo-premium.php'        => 'Yoast SEO Premium',
	'wordpress-seo/wp-seo.php'                        => 'Yoast SEO',
	'all-in-one-seo-pack-pro/all_in_one_seo_pack.php' => 'All in One SEO Pro',
	'all-in-one-seo-pack/all_in_one_seo_pack.php'     => 'All in One SEO',
	'seo-by-rank-math/rank-math.php'                  => 'Rank Math SEO',
	'autodescription/autodescription.php'             => 'The SEO Framework',
	'slim-seo/slim-seo.php'                           => 'Slim SEO',
	'wp-seopress-pro/seopress-pro.php'                => 'SEOPress PRO',
	'wp-seopress/seopress.php'                        => 'SEOPress',
	'seo-key-pro/seo-key.php'                         => 'SEOKEY Pro',
	'seo-key/seo-key.php'                             => 'SEOKEY',
);

foreach ( $jetpack_seo_conflicting_plugins as $seo_plugin => $seo_plugin_name ) {
	if ( Jetpack::is_plugin_active( $seo_plugin ) ) {
		// Disable all custom meta tags that SEO tools manages.
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		// Also disable default meta tags.
		add_filter( 'jetpack_seo_meta_tags_enabled', '__return_false' );

		// Let the SEO dashboard name the plugin that now owns the output.
		add_filter(
			'jetpack_seo_conflicting_plugin',
			static function () use ( $seo_plugin_name ) {
				return $seo_plugin_name;
			}
		);
		break;
	}
}

/** This filter is documented in modules/seo-tools/class-jetpack-seo-utils.php */
if ( ! apply_filters( 'jetpack_disable_seo_tools', false ) ) {
	require_once __DIR__ . '/seo-tools/class-jetpack-seo.php';
	new Jetpack_SEO();

	require_once __DIR__ . '/seo-tools/class-jetpack-seo-admin-columns.php';
	Jetpack_SEO_Admin_Columns::init();
}
