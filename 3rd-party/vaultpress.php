<?php

function jetpack_vaultpress_rewind_enabled_notice() {
	$plugin_file = 'vaultpress/vaultpress.php';

	$query_args = array(
		'action' => 'deactivate',
		'plugin' => $plugin_file,
	);
	$deactivate_url = wp_nonce_url( add_query_arg( $query_args, admin_url( 'plugins.php' ) ), "deactivate-plugin_{$plugin_file}" );
	?>
	<div class="notice notice-success">
		<h2 style="margin-bottom: 0.25em;"><?php _e( 'Jetpack is now handling your backups.', 'jetpack' ); ?></h2>
		<p><?php _e( 'Since Jetpack is taking care of business, you can now safely remove the VaultPress plugin.', 'jetpack' ); ?></p>
		<p><a class="button button-primary" href="<?php echo esc_url( $deactivate_url ); ?>"><?php _e( 'Deactivate VaultPress', 'jetpack' ); ?></a></p>
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