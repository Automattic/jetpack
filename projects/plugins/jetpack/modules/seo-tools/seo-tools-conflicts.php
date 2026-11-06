<?php
/**
 * Conflicting SEO plugin detection, also loaded while the SEO Tools module is off (see module-extras.php).
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Name the SEO plugin that owns the site's SEO output, for SEO Tools, Canonical URLs and the SEO dashboard.
add_filter( 'jetpack_seo_conflicting_plugin', 'jetpack_seo_detect_conflicting_plugin' );

/**
 * Return the display name of the first active SEO plugin Jetpack steps aside for.
 *
 * @since $$next-version$$
 *
 * @param string|null $plugin A name reported by an earlier callback, or null.
 * @return string|null The plugin's display name, or null when none is active.
 */
function jetpack_seo_detect_conflicting_plugin( $plugin ) {
	// WordPress.com Simple's stub Jetpack class lacks this method, and Simple runs no plugins.
	if ( $plugin || ! method_exists( 'Jetpack', 'get_active_plugins' ) ) {
		return $plugin;
	}

	// Read the list once: this runs on every SEO Tools check, front end included.
	$active_plugins = Jetpack::get_active_plugins();

	// Paid editions come before the free plugins they run alongside, so the first match names the right one.
	$conflicting_plugins = array(
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

	foreach ( $conflicting_plugins as $file => $name ) {
		if ( in_array( $file, $active_plugins, true ) ) {
			return $name;
		}
	}

	return $plugin;
}

/**
 * Whether `jetpack_seo_conflicting_plugin` names a plugin, by the same rule the SEO dashboard uses.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function jetpack_seo_has_conflicting_plugin() {
	/** This filter is documented in projects/packages/seo/src/class-seo-tools.php */
	$plugin = apply_filters( 'jetpack_seo_conflicting_plugin', null );

	return is_string( $plugin ) && '' !== trim( $plugin );
}
