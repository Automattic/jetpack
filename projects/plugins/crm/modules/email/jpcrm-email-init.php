<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Email Module initialization
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Email;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( ! apply_filters( 'jetpack_crm_feature_flag_email', false ) ) {
	return;
}

/**
 * Load the Email module.
 *
 * This is a core module that will always be loaded, so we do not allow it to be enabled/deactivated.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function load_module() {
	define_constants();

	require_once JPCRM_EMAIL_MODULE_PATH . '/admin/admin-page-init.php';
	initialize_email_page();
	require_once JPCRM_EMAIL_MODULE_PATH . '/sync/class-jpcrm-inbox-sync.php';
	new Inbox_Sync();
}

add_action( 'jpcrm_load_modules', __NAMESPACE__ . '\load_module' );

/**
 * Defines constants
 *
 * @since $$next-version$$
 *
 * @return void
 */
function define_constants() {
	if ( ! defined( 'JPCRM_EMAIL_MODULE_ROOT_FILE' ) ) {
		define( 'JPCRM_EMAIL_MODULE_ROOT_FILE', __FILE__ );
	}
	if ( ! defined( 'JPCRM_EMAIL_MODULE_PATH' ) ) {
		define( 'JPCRM_EMAIL_MODULE_PATH', __DIR__ );
	}
}
