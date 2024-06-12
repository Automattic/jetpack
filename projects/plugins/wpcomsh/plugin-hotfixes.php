<?php
/**
 * Hotfix file.
 *
 * @package wpcomsh
 */

/**
 * Cherry Framework makes incorrect assumptions about ABSPATH and wp-content location.
 *
 * @see https://github.com/CherryFramework/cherry-framework/issues/178
 *
 * @param string $url URL.
 * @return string
 */
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );

/**
 * On Atomic v2 we require the path within the webroot to be the one passed to X-Accel-Redirect
 *
 * @param string $xsendfile_path File path.
 * @return string
 */
function wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path( $xsendfile_path ) {
	if ( 0 === strpos( $xsendfile_path, 'srv/htdocs/' ) ) {
		// 11 is the length of the string 'srv/htdocs/'.
		$xsendfile_path = substr_replace( $xsendfile_path, '', 0, 11 );
	}
	return $xsendfile_path;
}
add_filter( 'woocommerce_download_file_xsendfile_x_accel_redirect_file_path', 'wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path' );

/**
 * We define a Akismet Key at the Platform Level which is always assumed to be valid so don't check it all the time.
 *
 * @see https://github.com/Automattic/jetpack/issues/12382
 *
 * @return string
 */
function wpcomsh_pre_transient_jetpack_akismet_key_is_valid() {
	return 'valid';
}
add_filter( 'pre_transient_jetpack_akismet_key_is_valid', 'wpcomsh_pre_transient_jetpack_akismet_key_is_valid' );

/**
 * We disallow facebook-for-woocommerce full batch API sync because of large option DB churn.
 *
 * @see pcTzPI-6r-p2
 * @see pcTzPI-64-p2
 *
 * @param bool $allow_full_sync Whether to allow full sync.
 * @param int  $product_count   Amount of products.
 *
 * @return bool
 */
function wpcomsh_disallow_fb_for_woo_full_batch_api_sync( $allow_full_sync, $product_count ) {
	// Disable only for sites with a large number of products.
	$max_products_for_safe_full_sync = 5000;
	if ( $product_count > $max_products_for_safe_full_sync ) {
		return false;
	}

	return $allow_full_sync;
}
add_filter( 'facebook_for_woocommerce_allow_full_batch_api_sync', 'wpcomsh_disallow_fb_for_woo_full_batch_api_sync', 10, 2 );

/**
 * TODO: Remove this once Page Optimize stops breaking CSS load order (has any version after v0.5.1)
 * This is a temporary fix for a page-optimize bug that causes spinner icons to show
 * all the time in the plugins list auto-update column
 *
 * @see https://github.com/Automattic/wpcomsh/pull/699
 */
function wpcomsh_patch_auto_update_spinner_style() {
	$current_screen = get_current_screen();
	if ( isset( $current_screen->id ) && 'plugins' === $current_screen->id ) {
		wp_add_inline_style(
			'dashicons',
			'.toggle-auto-update .dashicons.hidden { display: none; }'
		);
	}
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_patch_auto_update_spinner_style', 999 );

/**
 * Temporary hotfix.
 * Sharing buttons / Icon-only
 * See https://github.com/Automattic/jetpack/issues/29083.
 * To-do: remove once Jetpack 11.9-a.7 is released on WoA.
 */
add_action(
	'wp_footer',
	function () {
		echo '<style>
			.sd-social-icon .sd-content ul li a.sd-button>span {
				margin-left: 0;
			}
		</style>';
	}
);

/**
 * Fixes an infinite redirect bug when trying to access the Site Editor
 * Gutenberg already removed it: https://github.com/WordPress/gutenberg/pull/48283
 *
 * @see https://github.com/Automattic/wp-calypso/issues/74072
 *
 * @todo: remove after Gutenberg 15.3.x lands on WoA
 */
function wpcomsh_maybe_remove_gutenberg_site_editor_redirect() {
	if ( has_filter( 'wp_redirect', 'gutenberg_prevent_site_editor_redirection' ) ) {
		remove_filter( 'wp_redirect', 'gutenberg_prevent_site_editor_redirection', 1 );
	}
}
add_action( 'plugins_loaded', 'wpcomsh_maybe_remove_gutenberg_site_editor_redirect' );
