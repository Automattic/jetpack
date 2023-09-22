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
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_SERVER['QUERY_STRING'] ) || ( isset( $_GET['action'] ) && 'user_content_redirect' !== $_GET['action'] ) ) {
		return;
	}

	$query_params = sanitize_text_field( wp_unslash( $_SERVER['QUERY_STRING'] ) ); // sanitization
	?>
	<iframe id="trackingIframe" src='<?php echo esc_url( "https://subscribe.wordpress.com/?$query_params" ); ?>'></iframe>

	<script>
		window.addEventListener("message", function(event) {
			if (event.origin !== "https://subscribe.wordpress.com") {
				return;
			}

			if (event.data.redirectUrl) {
				window.location.href = event.data.redirectUrl;
			}
		});
	</script>
	<?php
	exit;
}

// If this was loaded by Jetpack's mu-wpcom-plugin, execute right away.
if ( defined( 'WPCOM_USER_CONTENT_LINK_REDIRECTION' ) ) {
	jetpack_user_content_link_redirection();
} else {
	add_action( 'init', 'jetpack_user_content_link_redirection' );
}
