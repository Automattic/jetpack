<?php

function jetpack_vaultpress_rewind_enabled_notice() {
	$plugin_file = 'vaultpress/vaultpress.php';

	deactivate_plugins( $plugin_file );
	?>
	<div class="notice notice-success vp-deactivated">
		<h2 style="margin-bottom: 0.25em;"><?php _e( 'Jetpack is now handling your backups.', 'jetpack' ); ?></h2>
		<p><?php _e( 'VaultPress is no longer needed and has been deactivated.', 'jetpack' ); ?></p>
	</div>
	<?php
}

// If Rewind is enabled, then show a notification to disable VaultPress.
function jetpack_vaultpress_rewind_check() {
	if ( Jetpack::is_active() &&
		 Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) &&
		 Jetpack::is_rewind_enabled()
		) {
		add_action( 'admin_notices', 'jetpack_vaultpress_rewind_enabled_notice' );
	}
}


add_action( 'admin_init', 'jetpack_vaultpress_rewind_check', 11 );