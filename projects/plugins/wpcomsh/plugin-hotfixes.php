<?php
// Related: https://github.com/CherryFramework/cherry-framework/issues/178
// Makes incorrect assumptions about ABSPATH and wp-content location
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );

// We define a Akismet Key at the Platform Level which is always assumed to be valid so don't check it all the time.
// Related: https://github.com/Automattic/jetpack/issues/12382
function wpcomsh_pre_transient_jetpack_akismet_key_is_valid( $_false ) {
    return 'valid';
}
add_filter( 'pre_transient_jetpack_akismet_key_is_valid', 'wpcomsh_pre_transient_jetpack_akismet_key_is_valid' );
