<?php
/**
 * Canonical URL tag output for non-singular pages.
 *
 * Previously exposed as the standalone Jetpack "Canonical URLs" module; now
 * absorbed into the SEO Tools module and loaded from
 * `modules/seo-tools.php` when the `jetpack_seo_canonical_urls_enabled`
 * option is set. The on/off toggle lives in the SEO Settings screen.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Disable canonical URL output when a conflicting SEO plugin is active.
add_filter( 'jetpack_disable_canonical_urls', 'jetpack_canonical_urls_check_conflicts' );

/**
 * Can be used to prevent the canonical URL output.
 *
 * @since 15.6
 *
 * @param bool $disabled Whether canonical URL output is disabled. Defaults to false.
 */
if ( ! apply_filters( 'jetpack_disable_canonical_urls', false ) ) {
	require_once __DIR__ . '/class-jetpack-canonical-urls-resolver.php';
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

	if ( class_exists( 'Jetpack_SEO_Utils' )
		&& ! empty( Jetpack_SEO_Utils::get_active_conflicting_plugins() )
	) {
		return true;
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
