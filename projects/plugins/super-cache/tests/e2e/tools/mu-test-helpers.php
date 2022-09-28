<?php
/**
 * Helper tools for testing WP Super Cache.
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

/**
 * Allow per-request login via HTTP header for a single request. Makes testing easier.
 */
function wpsc_test_header_login() {
	if ( ! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
		$auth = sanitize_text_field( wp_unslash( $_SERVER['HTTP_AUTHORIZATION'] ) );
		if ( 0 === stripos( $auth, 'test ' ) ) {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			list( $user, $pass ) = explode( ':', base64_decode( substr( $auth, 5 ) ) );

			$user = wp_signon(
				array(
					'user_login'    => $user,
					'user_password' => $pass,
				)
			);

			wp_set_current_user( $user->ID, $user->user_login );
			do_action( 'wp_login', $user->user_login );
		}
	}
}
add_action( 'init', 'wpsc_test_header_login' );
