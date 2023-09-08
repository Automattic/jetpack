<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Email admin page initialization
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Email;

use Automattic\Jetpack\Assets;

/**
 * The main initializing function.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function initialize_email_page() {
	add_action( 'load-admin_page_jpcrm-emails', __NAMESPACE__ . '\admin_init' );
}

/**
 * Actions to run on admin init
 *
 * @since $$next-version$$
 *
 * @return void
 */
function admin_init() {
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_admin_scripts' );
}

/**
 * Enqueues the React app bundle.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function enqueue_admin_scripts() {
	Assets::register_script(
		'jetpack-crm-email',
		'build/email/index.js',
		ZBS_ROOTFILE,
		array(
			'in_footer'  => true,
			'textdomain' => 'zero-bs-crm',
		)
	);
	Assets::enqueue_script( 'jetpack-crm-email' );

	wp_add_inline_script( 'jetpack-crm-email', render_initial_state(), 'before' );
}

/**
 * Initial state to be served with the React app.
 *
 * @since $$next-version$$
 *
 * @return string
 */
function render_initial_state() {
	/**
	 * Allow external plugins to modify Email UI hydration data.
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
		'jetpack_crm_email_initial_state',
		array(
			'apiRoot'  => esc_url_raw( rest_url() ),
			'apiNonce' => wp_create_nonce( 'wp_rest' ),
		)
	);

	return 'var jpcrmEmailInitialState=JSON.parse(decodeURIComponent( "' . rawurlencode( wp_json_encode( $initial_state ) ) . '" ) );';
}
