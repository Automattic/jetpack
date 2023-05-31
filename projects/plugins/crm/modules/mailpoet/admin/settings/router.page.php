<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Admin: Settings page
 */

namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: MailPoet Sync Settings
 */
function jpcrm_settings_page_html_mailpoet() {
	
	global $zbs;
	$page = $_GET['tab'];
	$current_tab = 'main';

	if ( isset( $_GET['subtab'] ) ) {
		$current_tab = sanitize_text_field ( $_GET['subtab'] );
	}

	$zbs->modules->mailpoet->load_admin_page("settings/{$current_tab}");
	call_user_func( "Automattic\JetpackCRM\jpcrm_settings_page_html_{$page}_{$current_tab}");

}