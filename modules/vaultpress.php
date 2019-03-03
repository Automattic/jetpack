<?php
/**
 * Module Name: Backups and Scanning
 * Module Description: Protect your site with daily or real-time backups and automated virus scanning and threat detection.
 * First Introduced: 0:1.2
 * Sort Order: 32
 * Deactivate: false
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Feature: Security, Health
 * Additional Search Queries: backup, cloud backup, database backup, restore, wordpress backup, backup plugin, wordpress backup plugin, back up, backup wordpress, backwpup, vaultpress, backups, off-site backups, offsite backup, offsite, off-site, antivirus, malware scanner, security, virus, viruses, prevent viruses, scan, anti-virus, antimalware, protection, safe browsing, malware, wp security, wordpress security
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
