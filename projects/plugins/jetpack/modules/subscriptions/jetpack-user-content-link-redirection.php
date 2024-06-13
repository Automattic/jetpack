<?php
/**
 * User Content Link Redirection
 *
 * The purpose of this file is to track and redirect user content links in emails.
 * This renders an iframe pointing to subscribe.wordpress.com which will track and
 * return the destination url for the iframe parent to redirect to.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Render a page containing an iframe to track and redirect the user content link in emails.
 */
function jetpack_user_content_link_redirection() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( empty( $_SERVER['QUERY_STRING'] ) || empty( $_SERVER['HTTP_HOST'] ) || empty( $_GET['blog_id'] ) ) {
		wp_safe_redirect( get_home_url() );
		exit();
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$request_blog_id = absint( wp_unslash( $_GET['blog_id'] ) );
	$actual_blog_id  = Connection_Manager::get_site_id( true );

	if ( $actual_blog_id !== $request_blog_id ) {
		wp_die( esc_html__( 'Invalid link.', 'jetpack' ), 400 );
		exit();
	}

	$query_params = sanitize_text_field( wp_unslash( $_SERVER['QUERY_STRING'] ) );
	$iframe_url   = "https://subscribe.wordpress.com/?$query_params";

	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
	echo <<<EOF
<!DOCTYPE html>
<html>
<head>
<script>
	let messageReceived = false;
	window.addEventListener( 'message', function(event) {
		if ( event.origin !== 'https://subscribe.wordpress.com' || messageReceived ) {
			return;
		}
		if ( event.data.redirectUrl ) {
			messageReceived = true;
			window.location.href = event.data.redirectUrl;
		}
	} );
</script>
</head>
<body>
EOF;
	echo '<iframe id="user-content-link-redirection" hidden aria-hidden="true" tabindex="-1" width="0" height="0" style="display: none" src="' . esc_url( $iframe_url ) . '"></iframe>';
	echo <<<EOF
</body>
</html>
EOF;
    // phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}

// The WPCOM_USER_CONTENT_LINK_REDIRECTION flag prevents this redirection logic from running
// on Atomic in case we'd like to override the redirection logic on the Atomic end.

// phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( ! defined( 'WPCOM_USER_CONTENT_LINK_REDIRECTION' ) && isset( $_GET['action'] ) && $_GET['action'] === 'user_content_redirect' ) {
	add_action( 'init', 'jetpack_user_content_link_redirection' );
}
