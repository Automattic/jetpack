<?php

// phpcs:disable WordPress.Security.NonceVerification.Recommended

function wpsc_preload_notification_scripts() {
	if (
		isset( $_GET['page'] ) && $_GET['page'] === 'wpsupercache' &&
		isset( $_GET['tab'] ) && $_GET['tab'] === 'preload'
	) {
		wp_enqueue_script(
			'preload-notification',
			plugins_url( '/js/preload-notification.js', __DIR__ ),
			array( 'jquery', 'wp-i18n' ),
			WPSC_VERSION_ID,
			true
		);

		wp_localize_script(
			'preload-notification',
			'wpsc_preload_ajax',
			array(
				'ajax_url'       => admin_url( 'admin-ajax.php' ),
				'preload_status' => wpsc_get_preload_status( true ),
			)
		);
	}
}

add_action( 'admin_footer', 'wpsc_preload_notification_scripts' );
