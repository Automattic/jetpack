<?php
/**
 * User Content Tracking Redirects
 *
 * The purpose of this file is to track user generated link clicks on the emails and redirect them to the original URL.
 * This is done by generating an iframe pointing to the track and redirect logic in .com.
 *
 * @package automattic/jetpack
 */

add_action( 'init', 'jetpack_user_content_tracking_redirect' );

/**
 * Generate the iframe to track and redirect the user generated link clicks.
 */
function jetpack_user_content_tracking_redirect() {
	if ( ! isset( $_SERVER['QUERY_STRING'] ) ) {
		return;
	}

	$query_params = sanitize_text_field( wp_unslash( $_SERVER['QUERY_STRING'] ) ); // sanitization
	?>
	<iframe id="trackingIframe" src='<?php echo esc_url( "https://wordpress.com/?$query_params" ); ?>'></iframe>

	<script>
		window.addEventListener("message", function(event) {
			if (event.origin !== "https://wordpress.com") {
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
