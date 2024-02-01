<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Admin: Settings page
 */

namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: WooSync Settings
 */
function jpcrm_settings_page_html_woosync() {
	
	global $zbs;
	$page = $_GET['tab'];
	$current_tab = 'main';

	if ( isset( $_GET['subtab'] ) ) {
		$current_tab = sanitize_text_field ( $_GET['subtab'] );
	}

	$zbs->modules->woosync->load_admin_page("settings/{$current_tab}");
	call_user_func( "Automattic\JetpackCRM\jpcrm_settings_page_html_{$page}_{$current_tab}");

	// enqueue settings styles
	if ( function_exists( 'Automattic\JetpackCRM\jpcrm_woosync_connections_styles_scripts' ) ){
		jpcrm_woosync_connections_styles_scripts();
	}

}
