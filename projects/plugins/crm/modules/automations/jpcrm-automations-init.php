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

if ( ! apply_filters( 'jetpack_crm_feature_flag_automations', false ) ) {
	return;
}

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
	add_action( 'load-admin_page_jpcrm-automations', 'Automattic\Jetpack_CRM\Automations\admin_init' );
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

init();
