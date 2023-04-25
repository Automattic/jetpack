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
	$js_concatenate_enabled  = (bool) get_option( 'page_optimize-js', page_optimize_js_default() );
	$boost_js_concat_enabled = get_option( 'jetpack_boost_status_minify-js' );
	if ( $js_concatenate_enabled && false === $boost_js_concat_enabled ) {
		add_option( 'jetpack_boost_status_minify-js', true );
	}
}

if ( function_exists( 'page_optimize_js_exclude_list' ) ) {
	$boost_js_excludes = get_option( 'jetpack_boost_ds_minify_js_excludes' );
	if ( false === $boost_js_excludes ) {
		$js_excludes = implode( ',', page_optimize_js_exclude_list() );

		add_option( 'jetpack_boost_ds_minify_js_excludes', $js_excludes );
	}
}

if ( function_exists( 'page_optimize_css_default' ) ) {
	$css_concatenate_enabled  = (bool) get_option( 'page_optimize-css', page_optimize_css_default() );
	$boost_css_concat_enabled = get_option( 'jetpack_boost_status_minify-css' );
	if ( $css_concatenate_enabled && false === $boost_css_concat_enabled ) {
		add_option( 'jetpack_boost_status_minify-css', true );
	}
}

if ( function_exists( 'page_optimize_css_exclude_list' ) ) {
	$boost_css_excludes = get_option( 'jetpack_boost_ds_minify_css_excludes' );
	if ( false === $boost_css_excludes ) {
		$css_excludes = implode( ',', page_optimize_css_exclude_list() );

		add_option( 'jetpack_boost_ds_minify_css_excludes', $css_excludes );
	}
}

// Disable Page Optimize functionality.
add_filter( 'pre_option_page_optimize-js', '__return_empty_string', 0 );
add_filter( 'pre_option_page_optimize-css', '__return_empty_string', 0 );
add_filter( 'pre_option_page_optimize-load-mode', '__return_empty_string', 0 );
