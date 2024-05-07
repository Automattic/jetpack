<?php

/**
 * Handle the wpsc_delete_boost_loader action.
 * Redirects to the WP Super Cache settings page after deleting the Jetpack Boost cache loader.
 */
function wpsc_handle_delete_boost_loader() {
	if ( isset( $_POST['action'] ) && $_POST['action'] === 'wpsc_delete_boost_loader' ) {
		check_admin_referer( 'wpsc_delete_boost_loader' );

		$deleted = wpsc_delete_boost_loader();
		if ( $deleted ) {
			$redirect = add_query_arg( 'wpsc_boost_loader_deleted', '1' );
			wp_safe_redirect( $redirect );
			exit;
		}
	}
}

if ( isset( $_GET['page'] ) && $_GET['page'] === 'wpsupercache' && isset( $_POST['action'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing
	add_action( 'admin_init', 'wpsc_handle_delete_boost_loader' );
}

/**
 * Add a notice to the WP Super Cache settings page if Jetpack Boost cache loader is detected.
 * The notice contains a form to delete the Jetpack Boost cache loader.
 */
function wpsc_delete_boost_loader_form() {
	global $wpsc_advanced_cache_filename;
	?>
	<div style="padding: 10px; width: 50%" class="notice notice-error"><h2><?php esc_html_e( 'Warning! Jetpack Boost Cache Detected', 'wp-super-cache' ); ?></h2>
	<?php // translators: %s is the filename of the advanced-cache.php file ?>
	<p><?php printf( esc_html__( 'The file %s was created by the Jetpack Boost plugin.', 'wp-super-cache' ), esc_html( $wpsc_advanced_cache_filename ) ); ?></p>
	<p><?php esc_html_e( 'Please confirm that you want to use WP Super Cache instead of Jetpack Boost for caching:', 'wp-super-cache' ); ?></p>
	<form method="POST">
		<input type="hidden" name="action" value="wpsc_delete_boost_loader" />
		<?php wp_nonce_field( 'wpsc_delete_boost_loader' ); ?>
		<input type="submit" class="button button-primary" value="<?php esc_html_e( 'Use WP Super Cache for caching', 'wp-super-cache' ); ?>" class="button" />
	</form>
	</div>
	<?php
}

/**
 * Delete the Jetpack Boost cache loader.
 *
 * @return bool True if the cache loader was deleted, false otherwise.
 */
function wpsc_delete_boost_loader() {
	global $wpsc_advanced_cache_filename;
	// Cannot use wp_delete_file() because it doesn't return a boolean.
	return @unlink( $wpsc_advanced_cache_filename ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.unlink_unlink
}
