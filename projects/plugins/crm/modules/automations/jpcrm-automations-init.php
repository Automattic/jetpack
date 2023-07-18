<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation Module initialization
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Automations;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( ! apply_filters( 'jetpack_crm_feature_flag_automations', false ) ) {
	return;
}

/**
 * The main initializing function.
 *
 * @return void
 */
function init() {
	require_once JPCRM_MODULES_PATH . 'automations/admin-page-init.php';
	initialize_admin_page();
}

init();
