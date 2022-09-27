<?php
/**
 * Tiny script for mu-plugins to inject the exact time plus a random value into the footer to verify caching.
 *
 * @package none. This line exists to stop the linter wasting even more of my time.
 */

/**
 * Inject a random / time sensitive value into the footer.
 */
function wpsc_test_inject_footer() {
	$rand = wp_rand( 0, 1000000 );
	$time = microtime();

	echo '<!-- ' . esc_html( $time ) . ' ' . esc_html( $rand ) . ' -->';
}
add_action( 'wp_footer', 'wpsc_test_inject_footer' );
