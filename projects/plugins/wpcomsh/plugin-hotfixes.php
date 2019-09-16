<?php
// Related: https://github.com/CherryFramework/cherry-framework/issues/178
// Makes incorrect assumptions about ABSPATH and wp-content location
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );

// On Atomic v2 we require the path within the webroot to be the one passed to X-Accel-Redirect
function wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path( $xsendfile_path ) {
	if ( 0 === strpos( $xsendfile_path, 'srv/htdocs/' ) ) {
		$xsendfile_path = substr_replace( $xsendfile_path, '', 0, /* strlen( 'srv/htdocs/' ) */ 11 );
	}
	return $xsendfile_path;
}
add_filter( 'woocommerce_download_file_xsendfile_x_accel_redirect_file_path', 'wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path' );

// We define a Akismet Key at the Platform Level which is always assumed to be valid so don't check it all the time.
// Related: https://github.com/Automattic/jetpack/issues/12382
function wpcomsh_pre_transient_jetpack_akismet_key_is_valid( $_false ) {
    return 'valid';
}
add_filter( 'pre_transient_jetpack_akismet_key_is_valid', 'wpcomsh_pre_transient_jetpack_akismet_key_is_valid' );
