<?php

function amp_get_permalink( $post_id ) {
	$pre_url = apply_filters( 'amp_pre_get_permalink', false, $post_id );

	if ( false !== $pre_url ) {
		return $pre_url;
	}

	if ( '' != get_option( 'permalink_structure' ) ) {
		$amp_url = trailingslashit( get_permalink( $post_id ) ) . user_trailingslashit( AMP_QUERY_VAR, 'single_amp' );
	} else {
		$amp_url = add_query_arg( AMP_QUERY_VAR, 1, get_permalink( $post_id ) );
	}

	return apply_filters( 'amp_get_permalink', $amp_url, $post_id );
}

function post_supports_amp( $post ) {
	// Because `add_rewrite_endpoint` doesn't let us target specific post_types :(
	if ( ! post_type_supports( $post->post_type, AMP_QUERY_VAR ) ) {
		return false;
	}

	if ( post_password_required( $post ) ) {
		return false;
	}

	if ( true === apply_filters( 'amp_skip_post', false, $post->ID, $post ) ) {
		return false;
	}

	return true;
}

/**
 * Are we currently on an AMP URL?
 *
 * Note: will always return `false` if called before the `parse_query` hook.
 */
function is_amp_endpoint() {
	return false !== get_query_var( AMP_QUERY_VAR, false );
}

function amp_get_asset_url( $file ) {
	return plugins_url( sprintf( 'assets/%s', $file ), AMP__FILE__ );
}
