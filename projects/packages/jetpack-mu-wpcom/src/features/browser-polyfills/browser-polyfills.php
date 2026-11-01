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
	$loader     = 'jetpack-mu-wpcom-browser-polyfills';
	$bundle     = 'jetpack-mu-wpcom-browser-polyfills-bundle';
	$asset_path = Jetpack_Mu_Wpcom::BASE_DIR . 'build/browser-polyfills/browser-polyfills.asset.php';
	$react      = $scripts->query( 'react', 'registered' );
	if ( ! $react || ! is_readable( $asset_path ) || in_array( $loader, $react->deps, true ) ) {
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
	$scripts->add( $loader, false );
	$scripts->add_inline_script( $loader, wp_get_script_polyfill( $scripts, array( $has_features => $bundle ) ) );
	$react->deps[] = $loader;
}

// The Gutenberg plugin re-registers React on this hook, replacing its dependencies, so run last.
add_action( 'wp_default_scripts', 'jetpack_mu_wpcom_register_browser_polyfills', PHP_INT_MAX );
// This feature loads on plugins_loaded, after the registry may already have been set up.
if ( did_action( 'wp_default_scripts' ) ) {
	jetpack_mu_wpcom_register_browser_polyfills( wp_scripts() );
}
