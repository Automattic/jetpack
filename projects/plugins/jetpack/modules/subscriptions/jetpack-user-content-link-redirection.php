<?php
/**
 * User Content Link Redirection
 *
 * The purpose of this file is to track user generated link clicks on the emails and redirect them to the original URL.
 * This is done by generating an iframe pointing to the track and redirect logic in .com.
 *
 * @package automattic/jetpack
 */

/**
 * Generate the iframe to track and redirect the user generated link clicks.
 */
function jetpack_user_content_link_redirection() {
	if ( empty( $_SERVER['QUERY_STRING'] ) ) {
		return;
	}
	$query_params = sanitize_text_field( wp_unslash( $_SERVER['QUERY_STRING'] ) );
	$iframe_url   = "https://subscribe.wordpress.com/?$query_params";

	echo <<<EOF
<!DOCTYPE html>
<html>
<head>
<script>
	window.addEventListener( 'message', function(event) {
		if ( event.origin !== 'https://subscribe.wordpress.com' ) {
			return;
		}
		if ( event.data.redirectUrl ) {
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
	exit;
}

// phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( isset( $_GET['action'] ) && $_GET['action'] === 'user_content_redirect' ) {
	add_action( 'init', 'jetpack_user_content_link_redirection' );
}
