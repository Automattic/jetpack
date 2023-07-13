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

use Automattic\Jetpack\Assets;

/**
 * The main initializing function.
 *
 * @return void
 */
function init() {
	define_constants();
	add_extension();
	add_action( 'admin_menu', 'Automattic\Jetpack_CRM\Automations\register_page' );
	add_action( 'load-admin_page_jpcrm-automations', 'Automattic\Jetpack_CRM\Automations\admin_init' );
}

/**
 * Defines constants
 *
 * @return void
 */
function define_constants() {
	// Set the Automation Module path
	if ( ! defined( 'JPCRM_AUTOMATION_ROOT_FILE' ) ) {
		define( 'JPCRM_AUTOMATION_ROOT_FILE', __FILE__ );
	}
	if ( ! defined( 'JPCRM_AUTOMATION_MODULE_PATH' ) ) {
		define( 'JPCRM_AUTOMATION_MODULE_PATH', __DIR__ );
	}
}

/**
 * Adds Automations to the extensions
 *
 * @return void
 */
function add_extension() {
	global $zbs, $zeroBSCRM_extensionsCompleteList; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$zeroBSCRM_extensionsCompleteList['automations'] = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'fallbackname' => 'Automations',
		'imgstr'       => '<i class="fa fa-cogs" aria-hidden="true"></i>',
		'desc'         => __( 'Basic CRM Automations. Execute automation workflows.', 'zero-bs-crm' ),
		'url'          => $zbs->urls['automations'],
		'colour'       => '#787c82',
		'helpurl'      => $zbs->urls['kb-automations'],
		'shortname'    => 'Automations',
	);

	global $jpcrm_core_extension_setting_map;
	$jpcrm_core_extension_setting_map['automations'] = 'feat_automations';
}

/**
 * Register the admin page for the Automations UI
 *
 * @return void
 */
function register_page() {
	global $zbs;

	add_submenu_page(
		$zbs->slugs['automations'],
		__( 'Welcome to Jetpack CRM Automations', 'zero-bs-crm' ), // TODO: change this
		'',
		'manage_options',
		'jpcrm-automations',
		'Automattic\Jetpack_CRM\Automations\render_page'
	);
}

/**
 * Render the page for React to mount on.
 *
 * @return void
 */
function render_page() {
	echo '<div id="jetpack-crm-automations-root"></div>';
}

/**
 * Actions to run on admin init
 *
 * @return void
 */
function admin_init() {
	add_action( 'admin_enqueue_scripts', 'Automattic\Jetpack_CRM\Automations\enqueue_admin_scripts' );
}

/**
 * Enqueues the React app bundle.
 *
 * @return void
 */
function enqueue_admin_scripts() {
	Assets::register_script(
		'jetpack-crm-automations',
		'build/automations/index.js',
		ZBS_ROOTFILE,
		array(
			'in_footer'  => true,
			'textdomain' => 'zero-bs-crm',
		)
	);
	Assets::enqueue_script( 'jetpack-crm-automations' );

	wp_add_inline_script( 'jetpack-crm-automations', render_initial_state(), 'before' );
}

/**
 * Initial state to be served with the React app.
 *
 * @return string
 */
function render_initial_state() {
	/**
	 * Allow external plugins to modify Automations UI hydration data.
	 *
	 * @since TBD
	 *
	 * @param array {
	 *     Array of default data we need to render our React UI.
	 *
	 *     @type string $apiRoot The base URL for the sites REST API.
	 *     @type string $apiNonce Nonce value to communicate with the sites REST API.
	 * }
	 */
	$initial_state = apply_filters(
		'jetpack_crm_automations_initial_state',
		array(
			'apiRoot'  => esc_url_raw( rest_url() ),
			'apiNonce' => wp_create_nonce( 'wp_rest' ),
		)
	);

	return 'var jpcrmAutomationsInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $initial_state ) ) . '"));';
}

/**
 * Register the Automations as a core extension
 *
 * @param array $exts List of JPCRM extensions.
 */
function jpcrm_register_free_extension_automations( $exts ) {
	$exts['automations'] = array(
		'name'       => 'Automations',
		'i'          => 'ext/automations.png',
		'short_desc' => __( 'Basic CRM Automations. Execute automation workflows.', 'zero-bs-crm' ),
	);

	return $exts;
}

add_filter( 'jpcrm_register_free_extensions', 'Automattic\Jetpack_CRM\Automations\jpcrm_register_free_extension_automations' );

/**
 * Load the Automation module
 */
function jpcrm_load_automations_module() {
	if ( zeroBSCRM_isExtensionInstalled( 'automations' ) ) {
		global $zbs;

		require_once JPCRM_AUTOMATION_MODULE_PATH . '/includes/class-automations.php';
		$zbs->modules->load_module( 'automations', 'Automations' );
	}
}

add_action( 'jpcrm_load_modules', 'Automattic\Jetpack_CRM\Automations\jpcrm_load_automations_module' );

/**
 * Install the Automation Module
 *
 * @return bool
 */
function zeroBSCRM_extension_install_automations() {
	return jpcrm_install_core_extension( 'automations' );
}

/**
 * Uninstall the Automation Module
 * @return bool
 */
function zeroBSCRM_extension_uninstall_automations() {
	//todo: Remove any related cron jobs

	return jpcrm_uninstall_core_extension( 'automations' );
}

//function jpcrm_check_for_old_automations_ext() {
//  // todo: Check if the old automations extension is installed/activated. If so, warning message
//}

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

/*
// add jobs to system assistant
function jpcrm_add_automations_jobs_to_system_assistant( $job_list ) {

	global $zbs;

	// Made an automations - #TBC
	$job_list['made_an_automations'] = array(

			'title'           => __( 'Automate something', 'zero-bs-crm' ),
			'icon'            => 'cogss',
			'desc_incomplete' => __( 'You haven\'t made an automations yet.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'You\'ve automated something!', 'zero-bs-crm' ),
			'button_url'      => zbsLink( $zbs->modules->automations->slugs['listview'] ),
			'button_txt'      => __( 'View Automations', 'zero-bs-crm' ),
			'state'           => $zbs->modules->automations->get_automations_count() > 0,

		);

	return $job_list;
}
add_filter( 'jpcrm_system_assistant_jobs', 'jpcrm_add_automations_jobs_to_system_assistant' );
*/

init();
