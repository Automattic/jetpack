<?php
/**
 * Module Name: WordPress.com Compose
 * Module Description: Allow new block editor posts to be composed on WordPress.com.
 * Jumpstart Description: Allow new block editor posts to be composed on WordPress.com.
 * Sort Order: 15
 * First Introduced: 7.2
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: iframes, allow, compose, WordPress.com, block
 */

function jetpack_disable_send_frame_options_header() {
	if ( jetpack_framing_allowed() ) {
		remove_action( 'admin_init', 'send_frame_options_header' );
	}
}
add_action( 'admin_init', 'jetpack_disable_send_frame_options_header', 1 ); // High priority to get ahead of send_frame_options_header

function jetpack_get_frame_nonce() {
	return wp_create_nonce( 'frame-' . Jetpack_Options::get_option( 'id' ) );
}

function jetpack_framing_allowed() {
	if ( ! empty( $_GET['frame-nonce'] ) && false !== strpos( $_GET['frame-nonce'], '.' ) ) {
		list( $token, $signature ) = explode( '.', $_GET['frame-nonce'] );
		$_GET['token']     = $token;
		$_GET['signature'] = $signature;

		$verified = Jetpack::init()->verify_xml_rpc_signature();

		if ( $verified ) {
			if ( ! defined( 'IFRAME_REQUEST' ) ) {
				define( 'IFRAME_REQUEST', true );
			}

			return true;
		}
	}

	return false;
}

/**
 * Automatically add frame-nonce to any admin_url() calls when the current page is framed.
 */
function jetpack_auto_frame_nonce( $url ) {
	if ( jetpack_framing_allowed() ) {
	//	$url = add_query_arg( array( 'frame-nonce' => jetpack_get_frame_nonce() ), $url );
	}
	return $url;
}
add_filter( 'admin_url', 'jetpack_auto_frame_nonce' );

function jetpack_add_iframed_body_class( $classes ) {
	if ( jetpack_framing_allowed() ) {
		$classes .= ' is-iframed ';
	}
	return $classes;
}
add_filter( 'admin_body_class', 'jetpack_add_iframed_body_class' );
