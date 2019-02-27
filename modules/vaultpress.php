<?php
/**
 * Module Name: Data Backups
 * Module Description: Every bit and byte of your site is backed up safely - daily or in real-time - to an off-site location.
 * First Introduced: 0:1.2
 * Sort Order: 32
 * Deactivate: false
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Feature: Security, Health
 * Additional Search Queries: backup, cloud backup, database backup, restore, wordpress backup, backup plugin, wordpress backup plugin, back up, backup wordpress, backwpup, vaultpress
 */

add_action( 'jetpack_modules_loaded', 'vaultpress_jetpack_stub' );

function vaultpress_jetpack_stub() {
	if ( class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' ) ) {
		Jetpack::enable_module_configurable( __FILE__ );
		Jetpack::module_configuration_load( __FILE__, 'vaultpress_jetpack_configure' );
		add_filter( 'jetpack_module_free_text_vaultpress', 'vaultpress_jetpack_module_free_text' );
	}
}

function vaultpress_jetpack_module_free_text() {
	return __( 'Active', 'jetpack' );
}

function vaultpress_jetpack_configure() {
	wp_safe_redirect( menu_page_url( 'vaultpress', false ) );
	exit;
}
