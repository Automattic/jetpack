<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 05/04/2017
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// } We can do this below in the templater or templates? add_action( 'wp_enqueue_scripts', 'zeroBS_portal_enqueue_stuff' );
// } ... in the end we can just dump the above line into the templates before get_header() - hacky but works

// Adds the Rewrite Endpoint for the 'clients' area of the CRM.
// } WH - this is dumped here now, because this whole thing is fired just AFTER init (to allow switch/on/off in main ZeroBSCRM.php)

function zeroBS_api_rewrite_endpoint() {
	add_rewrite_endpoint( 'zbs_api', EP_ROOT );
}
add_action( 'init', 'zeroBS_api_rewrite_endpoint' );

/**
 * Process the query and get page and items per page
 */
function jpcrm_api_process_pagination() {

	if ( isset( $_GET['page'] ) && (int) $_GET['page'] >= 0 ) {
		$page = (int) $_GET['page'];
	} else {
		$page = 0;
	}

	if ( isset( $_GET['perpage'] ) && (int) $_GET['perpage'] >= 0 ) {
		$per_page = (int) $_GET['perpage'];
	} else {
		$per_page = 10;
	}

	return array( $page, $per_page );
}

/**
 * Check and process if there is a search in the query
 */
function jpcrm_api_process_search() {
	return ( isset( $_GET['zbs_query'] ) ? sanitize_text_field( $_GET['zbs_query'] ) : '' );
}

/**
 * If there is a `replace_hyphens_with_underscores_in_json_keys` parameter in
 * the request, it is returned as an int. Otherwise returns 0.
 *
 * @return int Parameter `replace_hyphens_with_underscores_in_json_keys` from request. 0 if it isn't set.
 */
function jpcrm_api_process_replace_hyphens_in_json_keys() {
	return ( isset( $_GET['replace_hyphens_with_underscores_in_json_keys'] ) ? (int) $_GET['replace_hyphens_with_underscores_in_json_keys'] : 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * If there is a `external_api_name` parameter in
 * the request, it is returned as a string. Otherwise returns the bool false.
 *
 * @return string|bool Parameter `external_api_name` from request. Returns false if it isn't set.
 */
function jpcrm_api_process_external_api_name() {
	return ( isset( $_GET['external_api_name'] ) ? sanitize_text_field( wp_unslash( $_GET['external_api_name'] ) ) : false ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * Generate API invalid request error
 */
function jpcrm_api_invalid_request() {
	$reply = array(
		'status'  => __( 'Bad request', 'zero-bs-crm' ),
		'message' => __( 'The API request was invalid.', 'zero-bs-crm' ),
	);
	wp_send_json_error( $reply, 400 );
}

/**
 * Generate API unauthorised request error
 */
function jpcrm_api_unauthorised_request() {
	$reply = array(
		'status'  => __( 'Unauthorized', 'zero-bs-crm' ),
		'message' => __( 'Please ensure your Jetpack CRM API key and secret are correctly configured.', 'zero-bs-crm' ),
	);
	wp_send_json_error( $reply, 401 );
}

/**
 * Generate API forbidden request error
 */
function jpcrm_api_forbidden_request() {
	$reply = array(
		'status'  => __( 'Forbidden', 'zero-bs-crm' ),
		'message' => __( 'You do not have permission to access this resource.', 'zero-bs-crm' ),
	);
	wp_send_json_error( $reply, 403 );
}

/**
 * Generate API invalid method error
 */
function jpcrm_api_invalid_method() {
	$reply = array(
		'status'  => __( 'Method not allowed', 'zero-bs-crm' ),
		'message' => __( 'Please ensure you are using the proper method (e.g. POST or GET).', 'zero-bs-crm' ),
	);
	wp_send_json_error( $reply, 405 );
}

/**
 * Generate API teapot error
 */
function jpcrm_api_teapot() {
	$reply = array(
		'status'  => 'I\'m a teapot',
		'message' => 'As per RFC 2324 (section 2.3.2), this response is short and stout.',
	);
	wp_send_json_error( $reply, 418 );
}

/**
 * Check if the request is authorised via the API key/secret
 *
 * @return bool or error
 */
function jpcrm_api_check_authentication() {

	if ( ! jpcrm_is_api_request_authorised() ) {
		jpcrm_api_unauthorised_request();
	}

	return true;
}

/**
 * Check if the request matches the expected HTTP methods
 *
 * @param array $methods_allowed List of the request HTTP methods (GET, POST, PUSH, DELETE)
 * @return bool or error
 */
function jpcrm_api_check_http_method( $methods_allowed = array( 'GET' ) ) {

	if ( ! in_array( $_SERVER['REQUEST_METHOD'], $methods_allowed ) ) {
		if ( $_SERVER['REQUEST_METHOD'] == 'BREW' ) {
			jpcrm_api_teapot();
		} else {
			jpcrm_api_invalid_method();
		}
	}
	return true;
}

/**
 * Manage an API Error response with the correct headers and encode the data to JSON
 *
 * @param string $errorMsg
 * @param int    $headerCode
 */
function zeroBSCRM_API_error( $errorMsg = 'Error', $header_code = 400 ) {

	// } 400 = general error
	// } 403 = perms
	wp_send_json( array( 'error' => $errorMsg ), $header_code );
}

// now to locate the templates...
// http://jeroensormani.com/how-to-add-template-files-in-your-plugin/

/**
 * Locate template.
 *
 * Locate the called template.
 * Search Order:
 * 1. /templates not over-ridable
 *
 * @since 1.2.7
 *
 * @param   string $template_name          Template to load.
 * @param   string $string $template_path  Path to templates.
 * @param   string $default_path           Default path to template files.
 * @return  string                          Path to the template file.
 */
function zeroBSCRM_API_locate_api_endpoint( $template_name, $template_path = '', $default_path = '' ) {
	// Set variable to search in zerobscrm-plugin-templates folder of theme.
	if ( ! $template_path ) {
		$template_path = 'zerobscrm-plugin-templates/';
	}
	// Set default plugin templates path.
	if ( ! $default_path ) {
		$default_path = ZEROBSCRM_PATH . 'api/'; // Path to the template folder
	}
	// Search template file in theme folder.
	$template = locate_template(
		array(
			$template_path . $template_name,
			$template_name,
		)
	);
	// Get plugins template file.
	if ( ! $template ) {
		$template = $default_path . $template_name;
	}
	return apply_filters( 'zeroBSCRM_API_locate_api_endpoint', $template, $template_name, $template_path, $default_path );
}

/**
 * Get template.
 *
 * Search for the template and include the file.
 *
 * @since 1.2.7
 *
 * @see zeroBSCRM_API_get_template()
 *
 * @param string $template_name          Template to load.
 * @param array  $args                   Args passed for the template file.
 * @param string $string $template_path  Path to templates.
 * @param string $default_path           Default path to template files.
 */
function zeroBSCRM_API_get_api_endpoint( $template_name, $args = array(), $tempate_path = '', $default_path = '' ) {
	if ( is_array( $args ) && isset( $args ) ) {
		extract( $args );
	}
	$template_file = zeroBSCRM_API_locate_api_endpoint( $template_name, $tempate_path, $default_path );
	if ( ! file_exists( $template_file ) ) {
		_doing_it_wrong( __FUNCTION__, sprintf( '<code>%s</code> does not exist.', esc_html( $template_file ) ), '1.0.0' );
		return;
	}
	include $template_file;
}

// function similar to is_user_logged_in()
function jpcrm_is_api_request_authorised() {

	// WH - I've added api_secret here to bolster security,
	// We should switch authentication method to "headers" not parameters - will be cleaner :)

	// unclear if we're still needing this...
	// we are coming from GROOVE HQ - define in wp-config.php
	if ( defined( 'GROOVE_API_TOKEN' ) && ! empty( $_GET['api_token'] ) ) {
		if ( hash_equals( sanitize_text_field( $_GET['api_token'], GROOVE_API_TOKEN ) ) ) {
			// and define that we've checked
			if ( ! defined( 'ZBSGROOVECHECKED' ) ) {
				define( 'ZBSGROOVECHECKED', time() );
			}
			return true;
		}
	}

	// the the API key/secret are currently in the URL
	$possible_api_key    = isset( $_GET['api_key'] ) ? sanitize_text_field( $_GET['api_key'] ) : '';
	$possible_api_secret = isset( $_GET['api_secret'] ) ? sanitize_text_field( $_GET['api_secret'] ) : '';

	// a required value is empty, so not authorised
	if ( empty( $possible_api_key ) || empty( $possible_api_secret ) ) {
		return false;
	}

	$api_key = zeroBSCRM_getAPIKey();

	// provided key doesn't match, so not authorised
	if ( ! hash_equals( $possible_api_key, $api_key ) ) {
		return false;
	}

	global $zbs;
	$zbs->load_encryption();
	$hashed_possible_api_secret = $zbs->encryption->hash( $possible_api_secret );
	$hashed_api_secret          = zeroBSCRM_getAPISecret();

	// provided secret doesn't match, so not authorised
	if ( ! hash_equals( $hashed_possible_api_secret, $hashed_api_secret ) ) {
		return false;
	}

	return true;
}

function zeroBSCRM_getAPIEndpoint() {
	return site_url( '/zbs_api/' ); // , 'https' );
}

function jpcrm_generate_api_publishable_key() {
	global $zbs;
	$zbs->load_encryption();
	$api_publishable_key = 'jpcrm_pk_' . $zbs->encryption->get_rand_hex();
	return $api_publishable_key;
}

function jpcrm_generate_api_secret_key() {
	global $zbs;
	$zbs->load_encryption();
	$api_secret_key = 'jpcrm_sk_' . $zbs->encryption->get_rand_hex();
	return $api_secret_key;
}

/*
SAME CODE AS IN PORTAL, BUT REPLACED WITH api_endpoint stuff. Templates (to return the JSON) are in /api/endpoints/ folder
*/

add_filter( 'template_include', 'zeroBSCRM_API_api_endpoint', 99 );

function zeroBSCRM_API_api_endpoint( $template ) {

	$zbsAPIQuery = get_query_var( 'zbs_api', false );

	// We only want to interfere where zbs_api is set :)
	// ... as this is called for ALL page loads
	if ( $zbsAPIQuery === false ) {
		return $template;
	}

	// check if API key/secret are correct, or die with 403
	jpcrm_api_check_authentication();

	// Break it up if / present
	if ( strpos( $zbsAPIQuery, '/' ) ) {
		$zbsAPIRequest = explode( '/', $zbsAPIQuery );
	} else {
		// no / in it, so must just be a 1 worder like "invoices", here just jam in array so it matches prev exploded req.
		$zbsAPIRequest = array( $zbsAPIQuery );
	}

	// no endpoint was specified, so die with 400
	if ( empty( $zbsAPIRequest[0] ) ) {
		jpcrm_api_invalid_request();
	}

	// hard-coded valid endpoints; we could at some point do this dynamically
	$valid_api_endpoints = array(
		'status',
		'webhook',
		'create_customer',
		'create_transaction',
		'create_event',
		'create_company',
		'customer_search',
		'customers',
		'invoices',
		'quotes',
		'events',
		'companies',
		'transactions',
	);

	// invalid endpoint was specified, so die with 400
	if ( ! in_array( $zbsAPIRequest[0], $valid_api_endpoints ) ) {
		jpcrm_api_invalid_request();
	}

	return zeroBSCRM_API_get_api_endpoint( $zbsAPIRequest[0] . '.php' );
}

if ( ! function_exists( 'hash_equals' ) ) {
	function hash_equals( $str1, $str2 ) {
		if ( strlen( $str1 ) != strlen( $str2 ) ) {
			return false;
		} else {
			$res = $str1 ^ $str2;
			$ret = 0;
			for ( $i = strlen( $res ) - 1; $i >= 0; $i-- ) {
				$ret |= ord( $res[ $i ] );
			}
			return ! $ret;
		}
	}
}

// generate new API credentials
function jpcrm_generate_api_creds() {

	global $zbs;
	$new_publishable_key = jpcrm_generate_api_publishable_key();
	$zbs->DAL->updateSetting( 'api_key', $new_publishable_key );

	$new_secret_key    = jpcrm_generate_api_secret_key();
	$hashed_api_secret = $zbs->encryption->hash( $new_secret_key );
	$zbs->DAL->updateSetting( 'api_secret', $hashed_api_secret );

	return array(
		'key'    => $new_publishable_key,
		'secret' => $new_secret_key,
	);
}

// each CRM is  only given one API (for now)
function zeroBSCRM_getAPIKey() {

	global $zbs;
	return $zbs->DAL->setting( 'api_key' );
}

// each CRM is  only given one API (for now)
function zeroBSCRM_getAPISecret() {

	global $zbs;
	return $zbs->DAL->setting( 'api_secret' );
}

/**
 * Replaces hyphens in key identifiers from a json array with underscores.
 * Some services do not accept hyphens in their key identifiers, e.g. Zapier:
 * https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#keyschema
 *
 * If we expand use of this, we should consider making it recursive.
 *
 * @param array $input_array The array with keys needing to be changed, e.g.: [ { "id":"1", "custom-price":"10" }, { "id":"2", "custom-price":"20" }, ].
 * @return array Array with changed keys, e.g.: [ { "id":"1", "custom_price":"10" }, { "id":"2", "custom_price":"20" }, ].
 */
function jpcrm_api_replace_hyphens_in_json_keys_with_underscores( $input_array ) {
	$new_array = array();
	foreach ( $input_array as $original_item ) {
		$new_array[] = array_combine(
			array_map(
				function ( $key ) {
					return str_replace( '-', '_', $key );
				},
				array_keys( $original_item )
			),
			$original_item
		);
	}
	return $new_array;
}
