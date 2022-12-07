<?php

function wpsc_preload_notification_scripts() {
	global $cache_path;

	// GET parameters are only checked to ensure this script is only laoded on necessary pages.
	// phpcs:disable WordPress.Security.NonceVerification.Recommended

	if (
		isset( $_GET['page'] ) && $_GET['page'] === 'wpsupercache' &&
		isset( $_GET['tab'] ) && $_GET['tab'] === 'preload' &&
		file_exists( $cache_path . 'preload_permalink.txt' )
	) {
		// Unslashing a local filesystem path which may include Windows \ separators seems like a bad idea.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$document_root = empty( $_SERVER['DOCUMENT_ROOT'] ) ? '' : $_SERVER['DOCUMENT_ROOT'];

		wp_enqueue_script(
			'preload-notification',
			plugins_url( '/preload-notification.js', __FILE__ ),
			array( 'jquery' ),
			'1.0',
			1
		);

		wp_localize_script(
			'preload-notification',
			'wpsc_preload_ajax',
			array(
				'preload_permalink_url' => home_url( str_replace( $document_root, '', $cache_path ) . '/preload_permalink.txt' ),
			)
		);
	}

	// phpcs:enable WordPress.Security.NonceVerification.Recommended
}
add_action( 'admin_enqueue_scripts', 'wpsc_preload_notification_scripts' );
