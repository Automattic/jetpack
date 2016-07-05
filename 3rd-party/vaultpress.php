<?php

/**
 * For backward compatibility with VaultPress 1.8.3 to play nicely with Jetpack 4.1
 */
add_action( 'init', 'jetpack_vaultpress_sync_options' );
function jetpack_vaultpress_sync_options() {
	if ( ! class_exists( 'VaultPress' ) ) {
		return;
	}
	$vaultpress = VaultPress::init();
	Jetpack_Sync::sync_options( __FILE__, $vaultpress->auto_register_option, $vaultpress->option_name );
}
