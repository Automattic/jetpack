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

use Automattic\Jetpack\Connection\Client;

/**
 * Render a page containing an iframe to track and redirect the user content link in emails.
 */
function jetpack_user_content_link_redirection() {
	if ( empty( $_SERVER['QUERY_STRING'] ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['user_content_redirect_domain_checking'] ) ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( empty( $_SERVER['QUERY_STRING'] ) || ! isset( $_SERVER['HTTP_HOST'] ) || ! isset( $_GET['blog_id'] ) ) {
			wp_safe_redirect( get_home_url() );
			exit();
		}

		$domain_from_request = sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$blog_id = absint( wp_unslash( $_GET['blog_id'] ) );

		if ( ! jetpack_user_content_link_is_same_domain( $domain_from_request, $blog_id ) ) {
			wp_safe_redirect( get_home_url() );
			exit();
		}
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

/**
 * Check if the domain of the request is the same as the domain of the given blog_id
 *
 * @param string $domain_from_request The domain from the request.
 * @param int    $blog_id             The blog_id to check against.
 *
 * @return bool
 */
function jetpack_user_content_link_is_same_domain( $domain_from_request, $blog_id ) {
	$request  = sprintf( '/sites/%d?fields=URL', $blog_id );
	$response = Client::wpcom_json_api_request_as_blog( $request );
	if ( is_wp_error( $response ) ) {
		return false;
	}

	$domain_from_wpcom = wp_parse_url( json_decode( wp_remote_retrieve_body( $response ) )->URL, PHP_URL_HOST );
	if ( $domain_from_request !== $domain_from_wpcom ) {
		return false;
	}

	return true;
}

// The WPCOM_USER_CONTENT_LINK_REDIRECTION flag prevents this redirection logic from running
// on Atomic in case we'd like to override the redirection logic on the Atomic end.

// phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( ! defined( 'WPCOM_USER_CONTENT_LINK_REDIRECTION' ) && isset( $_GET['action'] ) && $_GET['action'] === 'user_content_redirect' ) {
	add_action( 'init', 'jetpack_user_content_link_redirection' );
}
