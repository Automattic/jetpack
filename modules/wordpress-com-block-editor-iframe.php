<?php
/**
 * WordPress.com Block Editor Iframe
 * Allow new block editor posts to be composed on WordPress.com.
 * This is auto-loaded as of Jetpack v7.4 for sites connected to WordPress.com only.
 *
 * @package Jetpack
 */

/**
 * Prevents frame options header from firing if this is a whitelisted iframe request.
 */
function jetpack_disable_send_frame_options_header() {
	if ( jetpack_framing_allowed() ) {
		remove_action( 'admin_init', 'send_frame_options_header' );
	}
}
add_action( 'admin_init', 'jetpack_disable_send_frame_options_header', 9 );

/**
 * Adds custom admin body class if this is a whitelisted iframe request.
 *
 * @param string $classes Admin body classes.
 * @return string
 */
function jetpack_add_iframed_body_class( $classes ) {
	if ( jetpack_framing_allowed() ) {
		$classes .= ' is-iframed ';
	}

	return $classes;
}
add_filter( 'admin_body_class', 'jetpack_add_iframed_body_class' );

/**
 * Checks whether this is a whitelisted iframe request.
 *
 * @return bool
 */
function jetpack_framing_allowed() {
	if ( empty( $_GET['frame-nonce'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return false;
	}

	$verified = jetpack_verify_frame_nonce(
		$_GET['frame-nonce'],  // phpcs:ignore WordPress.Security.NonceVerification
		'frame-' . Jetpack_Options::get_option( 'id' )
	);

	if ( $verified && ! defined( 'IFRAME_REQUEST' ) ) {
		define( 'IFRAME_REQUEST', true );
	}

	return (bool) $verified;
}

/**
 * Verify that correct nonce was used with time limit.
 *
 * The user is given an amount of time to use the token, so therefore, since the
 * UID and $action remain the same, the independent variable is the time.
 *
 * @param string $nonce  Nonce that was used in the form to verify.
 * @param string $action Should give context to what is taking place and be the same when nonce was created.
 * @return false|int False if the nonce is invalid, 1 if the nonce is valid and generated between
 *                   0-12 hours ago, 2 if the nonce is valid and generated between 12-24 hours ago.
 */
function jetpack_verify_frame_nonce( $nonce, $action ) {
	$nonce = (string) $nonce;
	if ( empty( $nonce ) ) {
		return false;
	}

	$user_id = get_current_user_id();
	if ( ! $user_id ) {
		return false;
	}

	$i = wp_nonce_tick();
	add_filter( 'salt', 'jetpack_filter_salt', 10, 2 );

	// Nonce generated 0-12 hours ago.
	$expected = substr( wp_hash( $i . $action . $user_id, 'jetpack_frame_nonce' ), -12, 10 );
	if ( hash_equals( $expected, $nonce ) ) {
		remove_filter( 'salt', 'jetpack_filter_salt' );
		return 1;
	}

	// Nonce generated 12-24 hours ago.
	$expected = substr( wp_hash( ( $i - 1 ) . $action . $user_id, 'jetpack_frame_nonce' ), -12, 10 );
	if ( hash_equals( $expected, $nonce ) ) {
		remove_filter( 'salt', 'jetpack_filter_salt' );
		return 2;
	}

	remove_filter( 'salt', 'jetpack_filter_salt' );

	// Invalid nonce.
	return false;
}

/**
 * Filters the WordPress salt.
 *
 * @param string $salt   Salt for the given scheme.
 * @param string $scheme Authentication scheme.
 * @return string
 */
function jetpack_filter_salt( $salt, $scheme ) {
	if ( 'jetpack_frame_nonce' === $scheme ) {
		$token = Jetpack_Data::get_access_token( get_current_user_id() );

		if ( $token ) {
			$salt = $token->secret;
		}
	}

	return $salt;
}
