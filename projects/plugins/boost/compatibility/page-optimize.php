<?php
/**
 * Compatibility file for Page Optimize.
 *
 * This will synchronize the settings from Page Optimize to Jetpack Boost.
 *
 * @package automattic/jetpack-boost
 */

$js_concatenate_enabled  = (bool) get_option( 'page_optimize-js', page_optimize_js_default() );
$boost_js_concat_enabled = get_option( 'jetpack_boost_status_minify-js' );
if ( $js_concatenate_enabled && false === $boost_js_concat_enabled ) {
	add_option( 'jetpack_boost_status_minify-js', true );
}

$boost_js_excludes = get_option( 'jetpack_boost_ds_minify_js_excludes' );
if ( false === $boost_js_excludes ) {
	$js_excludes = implode( ',', page_optimize_js_exclude_list() );

	add_option( 'jetpack_boost_ds_minify_js_excludes', $js_excludes );
}

$css_concatenate_enabled  = (bool) get_option( 'page_optimize-css', page_optimize_css_default() );
$boost_css_concat_enabled = get_option( 'jetpack_boost_status_minify-css' );
if ( $css_concatenate_enabled && false === $boost_css_concat_enabled ) {
	add_option( 'jetpack_boost_status_minify-css', true );
}

$boost_css_excludes = get_option( 'jetpack_boost_ds_minify_css_excludes' );
if ( false === $boost_css_excludes ) {
	$css_excludes = implode( ',', page_optimize_css_exclude_list() );

	add_option( 'jetpack_boost_ds_minify_css_excludes', $css_excludes );
}
