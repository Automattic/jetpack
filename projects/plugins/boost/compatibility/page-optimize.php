<?php

function jetpack_boost_page_optimize_js_excludes( $default ) {
	$exclude_list = get_option( 'page_optimize-js-exclude' );
	if ( ! $exclude_list ) {
		return $default;
	}

	delete_option( 'page_optimize-js-exclude' );
	add_option( 'jetpack_boost_ds_minify_js_excludes', $exclude_list );

	return $exclude_list;
}

function jetpack_boost_page_optimize_css_excludes( $default ) {
	$exclude_list = get_option( 'page_optimize-css-exclude' );
	if ( ! $exclude_list ) {
		return $default;
	}

	delete_option( 'page_optimize-css-exclude' );
	add_option( 'jetpack_boost_ds_minify_css_excludes', $exclude_list );

	return $exclude_list;
}

add_filter( 'default_option_jetpack_boost_ds_minify_js_excludes', 'jetpack_boost_page_optimize_js_excludes' );
add_filter( 'default_option_jetpack_boost_ds_minify_css_excludes', 'jetpack_boost_page_optimize_css_excludes' );
