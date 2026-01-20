<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Admin: Settings page
 */

namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit( 0 );

/**
 * Page: WooSync Settings
 */
function jpcrm_settings_page_html_woosync() {

	global $zbs;
	$page        = 'woosync';
	$current_tab = 'main';

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Navigation parameter, not data modification.
	if ( isset( $_GET['subtab'] ) ) {
		$current_tab = sanitize_text_field( wp_unslash( $_GET['subtab'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		// Only allow alphanumeric characters, hyphens, and underscores to prevent path traversal.
		if ( ! preg_match( '/^[a-zA-Z0-9_-]+$/', $current_tab ) ) {
			$current_tab = 'main';
		}
	}

	$zbs->modules->woosync->load_admin_page( "settings/{$current_tab}" );
	call_user_func( "Automattic\JetpackCRM\jpcrm_settings_page_html_{$page}_{$current_tab}" );

	// enqueue settings styles
	if ( function_exists( 'Automattic\JetpackCRM\jpcrm_woosync_connections_styles_scripts' ) ){
		jpcrm_woosync_connections_styles_scripts();
	}

}
