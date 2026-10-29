<?php
/**
 * Conflict check for the Canonical URLs module, also loaded while the module is off (see module-extras.php).
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once dirname( __DIR__ ) . '/seo-tools/seo-tools-conflicts.php';

// Disable canonical URL output when a conflicting SEO plugin is active.
add_filter( 'jetpack_disable_canonical_urls', 'jetpack_canonical_urls_check_conflicts' );

/**
 * Check if a conflicting SEO plugin is active and disable canonical URL output.
 *
 * @since 15.6
 * @since $$next-version$$ Reads the `jetpack_seo_conflicting_plugin` filter instead of its own plugin list.
 *
 * @param bool $disabled Whether canonical URL output is already disabled.
 * @return bool Whether canonical URL output should be disabled.
 */
function jetpack_canonical_urls_check_conflicts( $disabled ) {
	return $disabled || jetpack_seo_has_conflicting_plugin();
}
