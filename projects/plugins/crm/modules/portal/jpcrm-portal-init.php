<?php
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

/**
*	This function inits everything needed. 
*	This is the only function directly called by this php file.
*/
function jpcrm_portal_init() {
	add_filter( 'jpcrm_register_free_extensions', 'jpcrm_register_free_extension_portal' );
	add_action( 'jpcrm_load_modules', 'jpcrm_load_portal' );
	
	jpcrm_portal_init_add_portal_to_complete_list();
	jpcrm_portal_init_add_portal_to_setting_map();
	require_once 'jpcrm-compatibility-functions.php';
}
jpcrm_portal_init(); // Inits everything.

function jpcrm_load_portal() {
	global $zbs;
	
	if ( zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
		require_once JPCRM_MODULES_PATH . 'portal/class-client-portal.php';
		$zbs->modules->load_module( 'portal', 'Client_Portal' );
	}
}

function jpcrm_register_free_extension_portal( $exts ) {
	$exts['portal'] = array(
		'name'       => __( 'Client Portal', 'zero-bs-crm' ),
		'i'          => 'cpp.png',
		'short_desc' => __( 'Adds a client area to your CRM install so they can see  their documents.', 'zero-bs-crm' ),
	);
	return $exts;
}

function jpcrm_portal_init_add_portal_to_complete_list() {
	global $zeroBSCRM_extensionsCompleteList;

	$zeroBSCRM_extensionsCompleteList['portal'] = array(
			'fallbackname' => 'Client Portal',
			'imgstr'       => '<i class="fa fa-users" aria-hidden="true"></i>',
			'desc'         => __( 'Add a client area to your website.', 'zero-bs-crm' ),
			'url'          => 'https://jetpackcrm.com/feature/client-portal/',
			'colour'       => '#833a3a',
			'helpurl'      => 'https://kb.jetpackcrm.com/article-categories/client-portal/',
			'shortName'    => 'Portal'
	);
}

/**
 * This function is using the prefix 'zeroBSCRM_' because core needs this 
 * prefix to call the function. This should not be renamed.
 */
function zeroBSCRM_extension_name_portal() {
	return __('Client Portal',"zero-bs-crm");
}

function jpcrm_portal_init_add_portal_to_setting_map() {
	global $jpcrm_core_extension_setting_map;

	$jpcrm_core_extension_setting_map['portal'] = 'feat_portal';
}

/**
*  This function starts with the old prefix because the CRM uses the prefix
*  to dinamically call the function. 
*  e.g.:
*   call_user_func( 'zeroBSCRM_extension_install_' . $safe_function_string );
*/
function zeroBSCRM_extension_install_portal() {

	$result = jpcrm_install_core_extension( 'portal' );

	if ( $result ) {
		// Create the page if it's not there.
		zeroBSCRM_portal_checkCreatePage();
	}
	// Mark the rewrite rules as changed since they just got added now.
	jpcrm_client_portal_set_rewrite_rules_changed();
	return $result;
}

/**
*  This function starts with the old prefix because the CRM uses the prefix
*  to dinamically call the function. 
*  e.g.:
*   call_user_func( 'zeroBSCRM_extension_uninstall_' . $safe_function_string );
*/
function zeroBSCRM_extension_uninstall_portal() {
	return jpcrm_uninstall_core_extension( 'portal' );
}

/**
 * Marks the rewrite rules as changed so the Client Portal can flush them.
 */
function jpcrm_client_portal_set_rewrite_rules_changed() {
	update_option('jpcrm_client_portal_rewrite_rules_changed', 1, false);
}

/*
 * Flushes the rewrite rules if needed.
 */
function jpcrm_client_portal_flush_rewrite_rules_if_needed() {
	$rules_changed_option = get_option( 'jpcrm_client_portal_rewrite_rules_changed' );
	if ($rules_changed_option == 1) {
		flush_rewrite_rules();
		delete_option( 'jpcrm_client_portal_rewrite_rules_changed' );
	}
}

/*
 * Checks if an incompatible (old) version of client portal pro is activated and
 * deactivates it if needed. This function is added to the init hook.
 */
function jpcrm_intercept_incompatible_client_portal_pro() {
	if ( is_admin() && defined('ZBS_CLIENTPORTALPRO_ROOTFILE') ) {
		$portal_pro_data = get_file_data(
			ZBS_CLIENTPORTALPRO_ROOTFILE, 
			[ 'Version' => 'Version', ], 
			'plugin'
		);

		if ( version_compare($portal_pro_data[ 'Version' ], '2.0', '<') ) {
			// Deactivates and adds a notice and transient if successful
			if ( jpcrm_extensions_deactivate_by_key( 'clientportalpro' ) ) {
				// check not fired within past day
				$existing_transient = get_transient( 'clientportalpro.incompatible.version.deactivated' );
				if ( !$existing_transient ) {
					zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'clientportalpro.incompatible.version.deactivated', '' );
					set_transient( 'clientportalpro.incompatible.version.deactivated', 'clientportalpro.incompatible.version.deactivated', HOUR_IN_SECONDS * 24 );
				}
				// If the plugin was just activated, this keeps it from saying "plugin activated".
				if ( isset( $_GET['activate'] ) ) {
					unset( $_GET['activate'] );
				}
			}
		}
	}
}
add_action( 'init', 'jpcrm_intercept_incompatible_client_portal_pro' );