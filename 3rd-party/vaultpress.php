<?php

/**
 * Notify user that VaultPress has been disabled. Hide VaultPress notice that requested attention.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_enabled_notice() {
	?>
	<div class="notice notice-success vp-deactivated">
		<h2 style="margin-bottom: 0.25em;"><?php _e( 'Jetpack is now handling your backups.', 'jetpack' ); ?></h2>
		<p><?php _e( 'VaultPress is no longer needed and has been deactivated.', 'jetpack' ); ?></p>
	</div>
	<style>#vp-notice{display:none;}</style>
	<?php
}

/**
 * If Rewind is enabled, remove its entry in sidebar, deactivate VaultPress, and show a notification.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_check() {
	if ( Jetpack::is_active() &&
		 Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) &&
		 Jetpack::is_rewind_enabled()
		) {
		remove_submenu_page( 'jetpack', 'vaultpress' );

		deactivate_plugins( 'vaultpress/vaultpress.php' );

		add_action( 'admin_notices', 'jetpack_vaultpress_rewind_enabled_notice' );
	}
}

add_action( 'admin_init', 'jetpack_vaultpress_rewind_check', 11 );
