<?php
/**
 * Compatibility file for Page Optimize.
 *
 * This will synchronize the settings from Page Optimize to Jetpack Boost.
 * It will also disable the Page Optimize functionality.
 *
 * @package automattic/jetpack-boost
 */

if ( function_exists( 'page_optimize_js_default' ) ) {
	$page_optimize_js_concatenate = (bool) get_option( 'page_optimize-js', page_optimize_js_default() );
	$boost_js_concatenate         = get_option( 'jetpack_boost_status_minify-js' );
	// Only migrate JS Concatenation if Page Optimize has it enabled
	// and if Boost's equivalent hasn't been used at all.
	if ( $page_optimize_js_concatenate && false === $boost_js_concatenate ) {
		add_option( 'jetpack_boost_status_minify-js', true );
	}
}

if ( function_exists( 'page_optimize_js_exclude_list' ) ) {
	$boost_js_excludes = get_option( 'jetpack_boost_ds_minify_js_excludes' );
	// Only migrate this setting if Boost's equivalent hasn't been used.
	if ( false === $boost_js_excludes ) {
		$page_optimize_js_excludes = page_optimize_js_exclude_list();

		add_option( 'jetpack_boost_ds_minify_js_excludes', $page_optimize_js_excludes );
	}
}

if ( function_exists( 'page_optimize_css_default' ) ) {
	$css_concatenate       = (bool) get_option( 'page_optimize-css', page_optimize_css_default() );
	$boost_css_concatenate = get_option( 'jetpack_boost_status_minify-css' );
	// Only migrate CSS Concatenation if Page Optimize has it enabled
	// and if Boost's equivalent hasn't been used at all.
	if ( $css_concatenate && false === $boost_css_concatenate ) {
		add_option( 'jetpack_boost_status_minify-css', true );
	}
}

if ( function_exists( 'page_optimize_css_exclude_list' ) ) {
	$boost_css_excludes = get_option( 'jetpack_boost_ds_minify_css_excludes' );
	// Only migrate this setting if Boost's equivalent hasn't been used.
	if ( false === $boost_css_excludes ) {
		$page_optimize_css_excludes = page_optimize_css_exclude_list();

		add_option( 'jetpack_boost_ds_minify_css_excludes', $page_optimize_css_excludes );
	}
}

// Disable Page Optimize functionality.
remove_action( 'plugins_loaded', 'page_optimize_init' );
