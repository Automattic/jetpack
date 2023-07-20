<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation Module initialization
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Automations;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( ! apply_filters( 'jetpack_crm_feature_flag_automations', false ) ) {
	return;
}

/**
 * Load the Automation module.
 *
 * This is a core module that will always be loaded so we do not allow it to be enabled/deactivated.
 *
 * @since $$next-version$$
 * @global \ZeroBSCRM $zbs
 *
 * @return void
 */
function load_module() {
	global $zbs;

	define_constants();

	require_once JPCRM_AUTOMATION_MODULE_PATH . 'automations/admin/admin-page-init.php';
	initialize_admin_page();
}

add_action( 'jpcrm_load_modules', 'Automattic\Jetpack_CRM\Modules\Automations\load_module' );

/**
 * Defines constants
 *
 * @since $$next-version$$
 *
 * @return void
 */
function define_constants() {
	if ( ! defined( 'JPCRM_AUTOMATION_MODULE_ROOT_FILE' ) ) {
		define( 'JPCRM_AUTOMATION_MODULE_ROOT_FILE', __FILE__ );
	}
	if ( ! defined( 'JPCRM_AUTOMATION_MODULE_PATH' ) ) {
		define( 'JPCRM_AUTOMATION_MODULE_PATH', __DIR__ );
	}
}

/**
 * Sniff features for Automation
 */
function jpcrm_sniff_feature_for_automations() {
	/*
	Example of sniff for features
	global $zbs;

	if ( !zeroBSCRM_isExtensionInstalled( 'automations' ) ) {

	// check if Automation _is_ active & prompt
	$zbs->feature_sniffer->sniff_for_plugin(
		array(
		'feature_slug'    => 'automations',
		'plugin_slug'     => 'automations/jetpackcrm-ext-automations.php',
		'more_info_link'  => $zbs->urls['kb-automations'],
		)
	);

	}
	*/
}

//add_action( 'jpcrm_sniff_features', 'jpcrm_sniff_feature_for_automations' );
