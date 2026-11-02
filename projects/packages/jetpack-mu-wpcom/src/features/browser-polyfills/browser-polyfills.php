<?php
/**
 * Polyfills for JavaScript features that Gutenberg uses without polyfilling.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Load the polyfills, only in browsers that need them, before React: every block editor and
 * Gutenberg-based screen depends on it.
 *
 * @see index.js
 *
 * @param WP_Scripts $scripts The scripts registry.
 */
function jetpack_mu_wpcom_register_browser_polyfills( $scripts ) {
	$bundle     = 'jetpack-mu-wpcom-browser-polyfills';
	$asset_path = Jetpack_Mu_Wpcom::BASE_DIR . 'build/browser-polyfills/browser-polyfills.asset.php';
	if ( ! $scripts->query( 'react', 'registered' ) || $scripts->query( $bundle, 'registered' ) || ! is_readable( $asset_path ) ) {
		return;
	}

	$asset = include $asset_path;
	$scripts->add(
		$bundle,
		plugins_url( 'build/browser-polyfills/browser-polyfills.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset['dependencies'] ?? array(),
		$asset['version'] ?? false
	);

	// A sample of what the bundle provides. Skipped once the page has loaded, when document.write would wipe it.
	$has_features = '"loading" !== document.readyState || ( Array.prototype.toSorted && Object.groupBy && Promise.withResolvers && Set.prototype.union )';
	// "before" on React, not a dependency: with script concatenation, a "before" script also prints first.
	$scripts->add_inline_script( 'react', wp_get_script_polyfill( $scripts, array( $has_features => $bundle ) ), 'before' );
}

// The Gutenberg plugin re-registers React on this hook, discarding its inline scripts, so run last.
add_action( 'wp_default_scripts', 'jetpack_mu_wpcom_register_browser_polyfills', PHP_INT_MAX );
// This feature loads on plugins_loaded, after the registry may already have been set up.
if ( did_action( 'wp_default_scripts' ) ) {
	jetpack_mu_wpcom_register_browser_polyfills( wp_scripts() );
}
