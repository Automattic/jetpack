<?php
/**
 * Post Like From Email
 *
 * Handles Like-button clicks originating from post-notification emails on
 * Atomic/WoW sites by proxying the request to the wpcom/v2/email-like endpoint
 * (which validates the HMAC and records the like server-side), then redirecting
 * the visitor to the post permalink.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Request is authenticated server-side via HMAC, not via WP nonces.

use Automattic\Jetpack\Connection\Client;

/**
 * Detect a like-from-email request, forward it to wpcom, and redirect to the post.
 *
 * The response body from the wpcom endpoint is intentionally ignored — the visitor
 * always lands on the post permalink.
 *
 * @return void
 */
function wpcom_handle_post_like_from_email() {
	if ( ! isset( $_GET['like'] ) || ! isset( $_GET['postid'] ) || ! isset( $_GET['like_actor'] ) || ! isset( $_GET['like_hmac'] ) ) {
		return;
	}

	if ( 1 !== (int) $_GET['like'] ) {
		return;
	}

	// On wpcom, the like is already handled at the same priority — bail to avoid
	// double-firing if jetpack-mu-wpcom is loaded inside wpcom.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return;
	}

	$postid     = (int) $_GET['postid'];
	$like_actor = sanitize_text_field( wp_unslash( $_GET['like_actor'] ) );
	$like_hmac  = sanitize_text_field( wp_unslash( $_GET['like_hmac'] ) );

	if ( $postid <= 0 || '' === $like_actor || '' === $like_hmac ) {
		return;
	}

	$blog_id = get_wpcom_blog_id();
	if ( ! $blog_id ) {
		return;
	}

	Client::wpcom_json_api_request_as_blog(
		'/sites/' . $blog_id . '/email-like',
		'2',
		array(
			'method'  => 'POST',
			'headers' => array(
				'content-type' => 'application/json',
			),
		),
		wp_json_encode(
			array(
				'post_id'    => $postid,
				'like_actor' => $like_actor,
				'like_hmac'  => $like_hmac,
			),
			JSON_UNESCAPED_SLASHES
		),
		'wpcom'
	);

	$permalink = get_permalink( $postid );
	if ( ! $permalink ) {
		$permalink = home_url( '/' );
	}

	wp_safe_redirect( $permalink );
	exit;
}
add_action( 'template_redirect', 'wpcom_handle_post_like_from_email', 1 );
