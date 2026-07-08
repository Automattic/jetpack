<?php
/**
 * Module Name: Canonical URLs
 * Module Description: Add canonical URL tags to archive pages to prevent duplicate content in search engines.
 * Sort Order: 36
 * First Introduced: 15.6
 * Requires Connection: No
 * Requires User Connection: No
 * Auto Activate: No
 * Module Tags: Traffic
 * Feature: Traffic
 * Additional Search Queries: canonical, seo, duplicate content, woocommerce, archive
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Disable canonical URL output when a conflicting SEO plugin is active.
add_filter( 'jetpack_disable_canonical_urls', 'jetpack_canonical_urls_check_conflicts' );

/**
 * Can be used to prevent the Canonical URLs module from outputting canonical tags.
 *
 * @module canonical-urls
 *
 * @since 15.6
 *
 * @param bool $disabled Whether canonical URL output is disabled. Defaults to false.
 */
if ( ! apply_filters( 'jetpack_disable_canonical_urls', false ) ) {
	require_once __DIR__ . '/canonical-urls/class-jetpack-canonical-urls-resolver.php';
	add_action( 'wp_head', 'jetpack_canonical_urls_output_tag' );
}

/**
 * Check if a conflicting SEO plugin is active and disable canonical URL output.
 *
 * @since 15.6
 *
 * @param bool $disabled Whether canonical URL output is already disabled.
 * @return bool Whether canonical URL output should be disabled.
 */
function jetpack_canonical_urls_check_conflicts( $disabled ) {
	if ( $disabled ) {
		return $disabled;
	}

	$conflicting_plugins = array(
		'wordpress-seo/wp-seo.php',
		'wordpress-seo-premium/wp-seo-premium.php',
		'all-in-one-seo-pack/all_in_one_seo_pack.php',
		'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
		'seo-by-rank-math/rank-math.php',
		'autodescription/autodescription.php',
		'slim-seo/slim-seo.php',
		'wp-seopress/seopress.php',
		'wp-seopress-pro/seopress-pro.php',
		'seo-key/seo-key.php',
		'seo-key-pro/seo-key.php',
	);

	foreach ( $conflicting_plugins as $plugin ) {
		if ( Jetpack::is_plugin_active( $plugin ) ) {
			return true;
		}
	}

	return $disabled;
}

/**
 * Output the canonical link tag for non-singular pages.
 *
 * WordPress core handles singular posts/pages via rel_canonical(),
 * so this function only outputs canonical tags for archive pages.
 *
 * @since 15.6
 */
function jetpack_canonical_urls_output_tag() {
	if ( is_singular() ) {
		return;
	}

	$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

	if ( ! empty( $url ) ) {
		echo '<link rel="canonical" href="' . esc_url( $url ) . '" />' . "\n";
	}
}
