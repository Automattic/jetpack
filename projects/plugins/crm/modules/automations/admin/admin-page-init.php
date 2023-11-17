<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation admin page initialization
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Automations;

use Automattic\Jetpack\Assets;

/**
 * The main initializing function.
 *
 * @since 6.2.0
 *
 * @return void
 */
function initialize_admin_page() {
	add_action( 'load-jetpack-crm_page_jpcrm-automations', __NAMESPACE__ . '\admin_init' );
}

/**
 * Actions to run on admin init
 *
 * @since 6.2.0
 *
 * @return void
 */
function admin_init() {
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_admin_scripts' );
}

/**
 * Enqueues the React app bundle.
 *
 * @since 6.2.0
 *
 * @return void
 */
function enqueue_admin_scripts() {
	Assets::register_script(
		'jetpack-crm-automations',
		'build/automations-admin/index.js',
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
 * @since 6.2.0
 *
 * @return string
 */
function render_initial_state() {
	/**
	 * Allow external plugins to modify Automations UI hydration data.
	 *
	 * @since 6.1.0
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

	return 'var jpcrmAutomationsInitialState=JSON.parse(decodeURIComponent( "' . rawurlencode( wp_json_encode( $initial_state ) ) . '" ) );';
}
