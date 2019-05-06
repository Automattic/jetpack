<?php
// Related: https://github.com/CherryFramework/cherry-framework/issues/178
// Makes incorrect assumptions about ABSPATH and wp-content location
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );


// On Atomic v2 we require the path within the webroot to be the one passed to X-Accel-Redirect
function wpcomsh_woocommerce_download_file_xsendfile( $file_path, $filename ) {
	if ( 	defined( 'IS_ATOMIC' )
		&& IS_ATOMIC
		&& has_filter( 'woocommerce_download_file_xsendfile', array( 'WC_Download_Handler', 'download_file_xsendfile' ) )
		) {
		$_parsed_url = parse_url( $file_path );
		$_parsed_wp_siteurl = parse_url( WP_SITEURL );
		list( /* skip ext */, $_file_type ) = wp_check_filetype( $filename );
		if ( ! $_file_type ) {
			$_file_type = 'application/force-download';
		}
		// If the url matches our expected hostname and we have a path, just try and X-Accel-Redirect the path from the doc root
		// See: p9F6qB-359-p2
		if ( ( $_parsed_url['host'] == $_parsed_wp_siteurl['host'] ) && isset( $_parsed_url['path'] ) ) {
			nocache_headers();
			header( 'X-Robots-Tag: noindex, nofollow', true );
			header( "Content-Type: {$_file_type}" );
			header( 'Content-Description: File Transfer' );
			header( 'Content-Disposition: attachment; filename="'. $filename . '";' );
			header( 'Content-Transfer-Encoding: binary' );
			header( "X-Accel-Redirect: /{$_parsed_url['path']}" );
			exit();
		}
	}
}
add_action( 'woocommerce_download_file_xsendfile', 'wpcomsh_woocommerce_download_file_xsendfile', 9, 2 );