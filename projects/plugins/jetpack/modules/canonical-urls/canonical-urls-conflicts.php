<?php
/**
 * Conflict check for the Canonical URLs module, also loaded while the module is off (see module-extras.php).
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Disable canonical URL output when a conflicting SEO plugin is active.
add_filter( 'jetpack_disable_canonical_urls', 'jetpack_canonical_urls_check_conflicts' );

/**
 * Check if a conflicting SEO plugin is active and disable canonical URL output.
 *
 * @since 15.6
 *
 * @param bool $disabled Whether canonical URL output is already disabled.
 * @return bool Whether canonical URL output should be disabled.
 */
function jetpack_canonical_urls_check_conflicts( $disabled ) {
	// WordPress.com Simple's stub Jetpack class lacks this method, and Simple runs no plugins.
	if ( $disabled || ! method_exists( 'Jetpack', 'is_plugin_active' ) ) {
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
