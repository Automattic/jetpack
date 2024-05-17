<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Admin: Connections page AJAX
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Language labels for JS
 */
function jpcrm_woosync_connections_js_language_labels( $language_array = array() ){

	// add our labels

	// connections page
	$language_array['connect-woo']                       = __( 'Connect WooCommerce Store', 'zero-bs-crm' );
	$language_array['connect-woo-site-url']              = __( 'Enter your Store URL:', 'zero-bs-crm' );
	$language_array['connect-woo-site-placeholder']      = __( 'e.g. https://examplestore.com', 'zero-bs-crm' );
	$language_array['connect-woo-go']                    = __( 'Connect Store', 'zero-bs-crm' );
	$language_array['connect-woo-invalid-url']           = __( 'Invalid URL', 'zero-bs-crm' );
	$language_array['connect-woo-invalid-url-empty']     = __( 'Please enter your store URL!', 'zero-bs-crm' );
	$language_array['connect-woo-invalid-url-detail']    = __( 'This doesn\'t look like a valid URL. If this is not correct, please contact support.', 'zero-bs-crm' );
	$language_array['connect-woo-invalid-url-http']      = __( 'Invalid URL - Store URL must use HTTPS', 'zero-bs-crm' );
	$language_array['connect-woo-invalid-url-duplicate'] = __( 'This Store URL already exists!', 'zero-bs-crm' );
	$language_array['connect-woo-ajax-error']            = __( 'AJAX Error', 'zero-bs-crm' );

	return $language_array;

}
add_filter( 'zbs_globaljs_lang', 'jpcrm_woosync_connections_js_language_labels' );


/**
 * JS Vars (get added to jpcrm_root var stack)
 */
function jpcrm_woosync_connections_js_vars( $var_array = array() ){

	global $zbs;

	// add our vars
	// now retrieved via AJAX - $var_array['connect_woo_querystring'] = $this->get_external_woo_url_for_oauth_query_string();
	$var_array['woosync_token'] = wp_create_nonce( "jpcrm-woosync-ajax-nonce" );

	// add array of sync sites
	$sync_sites = $zbs->modules->woosync->settings->get( 'sync_sites' );
	$woosync_connections = array();
	foreach ( $sync_sites as $site ) {
		$woosync_connections[] = rtrim( $site['domain'], '/' );
	}
	$var_array['woosync_connections'] = $woosync_connections;

	return $var_array;

}
add_filter( 'zbs_globaljs_vars', 'jpcrm_woosync_connections_js_vars' );

// Send a quote via email
add_action( 'wp_ajax_jpcrm_woosync_get_auth_url', 'jpcrm_woosync_ajax_get_auth_url' );
function jpcrm_woosync_ajax_get_auth_url(){
	
	// Check nonce
	check_ajax_referer( 'jpcrm-woosync-ajax-nonce', 'sec' );

	// Check perms
	if ( !zeroBSCRM_isZBSAdminOrAdmin() ) { 
		zeroBSCRM_sendJSONError(array());
	}

	// retrieve params
	if ( isset( $_POST['site_url'] ) ){

		$site_url = sanitize_text_field( $_POST['site_url'] );

		if ( !empty( $site_url ) ){

			global $zbs;

			zeroBSCRM_sendJSONSuccess( array(
				'target_url' => $zbs->modules->woosync->get_external_woo_url_for_oauth( $site_url )
			));

		}

	}

	zeroBSCRM_sendJSONError(array());
}
