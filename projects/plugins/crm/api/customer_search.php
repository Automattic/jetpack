<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 04/06/2019
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// Check the method
jpcrm_api_check_http_method( array( 'GET' ) );

// Process the pagination parameters from the query
$pagination                  = jpcrm_api_process_pagination();
$search_phrase               = jpcrm_api_process_search();
$replace_hyphens_in_response = jpcrm_api_process_replace_hyphens_in_json_keys();

$args = array(
	'searchPhrase' => $search_phrase,
	'page'         => $pagination['page'],
	'perPage'      => $pagination['per_page'],
	'sortOrder'    => $pagination['order'],
);

global $zbs;

if ( isset( $_GET['email'] ) ) {
	// searching email, so lets use that to override - should only be ONE match - return financial data (performant)
	$email            = sanitize_text_field( $_GET['email'] );
	$customer_matches = $zbs->DAL->contacts->getContact(
		-1,
		array(
			'email'            => $email,
			'withInvoices'     => true,
			'withTransactions' => true,
			'withTags'         => true,
		)
	);

	// Send an empty array if no matches.
	if ( ! $customer_matches ) {
		wp_send_json( array() );
	}
} else {
	// could be more matches (don't return financial data - unperformant)
	$customer_matches = zeroBS_integrations_searchCustomers( $args );
}

if ( $replace_hyphens_in_response === 1 ) {
	wp_send_json( jpcrm_api_replace_hyphens_in_json_keys_with_underscores( $customer_matches ) );
}

wp_send_json( $customer_matches );
