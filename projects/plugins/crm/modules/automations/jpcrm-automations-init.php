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

use Automattic\Jetpack\CRM\Automation\Automation_Bootstrap;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( ! apply_filters( 'jetpack_crm_feature_flag_automations', false ) ) {
	return;
}

/**
 * This is a temporary filter to disable the UI until we have completed building it
 *
 * @todo Remove this filter when the core Automation UI is ready to be released.
 *
 * @param bool $load_ui Whether to load the UI or not.
 * @return bool Whether to load the UI or not.
 */
function disable_ui_if_feature_flag_is_disabled( $load_ui ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return apply_filters( 'jetpack_crm_feature_flag_automations', false );
}

add_filter( 'jetpack_crm_automations_load_ui', __NAMESPACE__ . '\disable_ui_if_feature_flag_is_disabled', 99 );

/**
 * Load the Automation module.
 *
 * This is a core module that will always be loaded, so we do not allow it to be enabled/deactivated.
 *
 * @since 6.2.0
 *
 * @return void
 */
function load_module() {
	define_constants();

	require_once JPCRM_AUTOMATIONS_MODULE_PATH . '/admin/admin-page-init.php';
	initialize_admin_page();

	$bootstrap = new Automation_Bootstrap();
	$bootstrap->init();
}

add_action( 'jpcrm_load_modules', __NAMESPACE__ . '\load_module' );

/**
 * Defines constants
 *
 * @since 6.2.0
 *
 * @return void
 */
function define_constants() {
	if ( ! defined( 'JPCRM_AUTOMATIONS_MODULE_ROOT_FILE' ) ) {
		define( 'JPCRM_AUTOMATIONS_MODULE_ROOT_FILE', __FILE__ );
	}
	if ( ! defined( 'JPCRM_AUTOMATIONS_MODULE_PATH' ) ) {
		define( 'JPCRM_AUTOMATIONS_MODULE_PATH', __DIR__ );
	}
}
