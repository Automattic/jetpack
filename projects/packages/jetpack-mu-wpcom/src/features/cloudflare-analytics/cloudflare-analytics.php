<?php
/**
 * Cloudflare Analytics
 * Let WPCOM users automatically insert a Cloudflare analytics JS snippet into their site footer.
 *
 * @since 5.26.1 -- Ported from Jetpack.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Cloudflare_Analytics;

/**
 * Add Cloudflare Analytics tracking code to the head.
 *
 * @since 5.26.1 -- Ported from Jetpack.
 */
function insert_tracking_id() {
	$option = get_option( 'jetpack_cloudflare_analytics' );

	if (
		! empty( $option['code'] )
		&& ! is_admin()
		&& (
			! class_exists( 'Jetpack_AMP_Support' )
			|| ( class_exists( 'Jetpack_AMP_Support' ) && ! \Jetpack_AMP_Support::is_amp_request() )
		)
	) {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		printf(
			"<!-- Jetpack Cloudflare Web Analytics -->
<script defer
	src='https://static.cloudflareinsights.com/beacon.min.js'
	data-cf-beacon='{\"token\": \"%s\"}'>
</script>
<!-- End Jetpack Cloudflare Web Analytics -->\r\n",
			esc_html( $option['code'] )
		);
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript
	}
}
add_action( 'wp_footer', __NAMESPACE__ . '\insert_tracking_id', 999 );
