<?php

/**
 * Notify user that VaultPress has been disabled. Hide VaultPress notice that requested attention.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_enabled_notice() {
	// The deactivation is performed here because there may be pages that admin_init runs on,
	// such as admin_ajax, that could deactivate the plugin without showing this notification.
	deactivate_plugins( 'vaultpress/vaultpress.php' );

	// Remove WP core notice that says that the plugin was activated.
	if ( isset( $_GET['activate'] ) ) {
		unset( $_GET['activate'] );
	}
	?>
	<div class="notice notice-success is-dismissible vp-deactivated">
		<p style="margin-bottom: 0.25em;"><strong><?php esc_html_e( 'Jetpack is now handling your backups.', 'jetpack' ); ?></strong></p>
		<p>
			<?php esc_html_e( 'VaultPress is no longer needed and has been deactivated.', 'jetpack' ); ?>
			<?php
				echo sprintf(
					wp_kses(
						/* Translators: first variable is the URL of the web site without the protocol, e.g. mysite.com */
						__( 'You can access your backups on your site\'s <a href="https://wordpress.com/activity-log/%s" target="_blank">Activity</a> page.', 'jetpack' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
							),
						)
					),
					esc_attr( Jetpack::build_raw_urls( get_home_url() ) )
				);
			?>
		</p>
	</div>
	<style>#vp-notice{display:none;}</style>
	<?php
}

/**
 * If Backup & Scan is enabled, remove its entry in sidebar, deactivate VaultPress, and show a notification.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_check() {
	add_action( 'admin_notices', 'jetpack_vaultpress_rewind_enabled_notice' );
	if ( Jetpack::is_active() &&
		 Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) &&
		 Jetpack::is_rewind_enabled()
		) {
		remove_submenu_page( 'jetpack', 'vaultpress' );

		add_action( 'admin_notices', 'jetpack_vaultpress_rewind_enabled_notice' );
	}
}

add_action( 'admin_init', 'jetpack_vaultpress_rewind_check', 11 );
