<?php
/**
 * Module Name: WordPress.com Block Editor Iframe
 * Module Description: Allow new block editor posts to be composed on WordPress.com.
 * Jumpstart Description: Allow new block editor posts to be composed on WordPress.com.
 * Sort Order: 15
 * First Introduced: 7.3
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: iframes, allow, compose, WordPress.com, block, editor, post
 */

function jetpack_disable_send_frame_options_header() {
	if ( jetpack_framing_allowed() ) {
		remove_action( 'admin_init', 'send_frame_options_header' );
	}
}
add_action( 'admin_init', 'jetpack_disable_send_frame_options_header', 1 ); // High priority to get ahead of send_frame_options_header

function jetpack_framing_allowed() {
	if ( empty( $_GET['frame-nonce'] ) || false === strpos( $_GET['frame-nonce'], '.' ) ) {
		return false;
	}

	list( $token, $signature ) = explode( '.', $_GET['frame-nonce'] );

	$verified = Jetpack::init()->verify_xml_rpc_signature( $token, $signature );

	if ( $verified && ! defined( 'IFRAME_REQUEST' ) ) {
		define( 'IFRAME_REQUEST', true );
	}

	return (bool) $verified;
}

function jetpack_add_iframed_body_class( $classes ) {
	if ( jetpack_framing_allowed() ) {
		$classes .= ' is-iframed ';
	}
	return $classes;
}
add_filter( 'admin_body_class', 'jetpack_add_iframed_body_class' );
