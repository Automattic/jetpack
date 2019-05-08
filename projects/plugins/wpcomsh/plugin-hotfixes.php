<?php
// Related: https://github.com/CherryFramework/cherry-framework/issues/178
// Makes incorrect assumptions about ABSPATH and wp-content location
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );

// See: https://github.com/Automattic/jetpack/pull/12299
function wpcomsh_hotfix_jetpack_add_hamburger_toggle() {
	global $wp_admin_bar;
	wp_admin_bar_sidebar_toggle( $wp_admin_bar );
}
add_action( 'wp_before_admin_bar_render', 'wpcomsh_hotfix_jetpack_add_hamburger_toggle', 100000 );
