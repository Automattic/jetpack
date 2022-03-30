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

// We disallow facebook-for-woocommerce full batch API sync because of large option DB churn
// Related: pcTzPI-6r-p2
// Related: pcTzPI-64-p2
function wpcomsh_disallow_fb_for_woo_full_batch_api_sync( $allow_full_sync, $product_count ) {
	// Disable only for sites with a large number of products.
	$max_products_for_safe_full_sync = 5000;
	if ( $product_count > $max_products_for_safe_full_sync ) {
		return false;
	}

	return $allow_full_sync;
}
add_filter( 'facebook_for_woocommerce_allow_full_batch_api_sync', 'wpcomsh_disallow_fb_for_woo_full_batch_api_sync', 10, 2 );
