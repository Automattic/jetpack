<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 04/06/2019
 */

/* ======================================================
     Breaking Checks ( stops direct access )
   ====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
   / Breaking Checks
   ====================================================== */

// Check the method
jpcrm_api_check_http_method( array( 'GET' ) );

// Process the pagination parameters from the query
list( $page, $per_page ) = jpcrm_api_process_pagination();

$search_phrase = jpcrm_api_process_search();

$args = array(
	'searchPhrase'	=> $search_phrase,
	'perPage'				=> $per_page,
	'page'					=> $page,
);

global $zbs;

if(isset($_GET['email'])){
	//searching email, so lets use that to override - should only be ONE match - return financial data (performant)
	$email = sanitize_text_field( $_GET['email'] );
	$customer_matches = $zbs->DAL->contacts->getContact( -1, array( 'email' => $email, 'withInvoices' => true, 'withTransactions' => true ) );

	if ( !$customer_matches ) {
		wp_send_json( array() );
	}

	// Groove Sidebar has extra information, will do this way, for file compatibility
	if(isset( $_GET['api_token'] ) && defined( 'ZBSGROOVECHECKED' )){
		//then it's coming from Groove, so send back total value and last purchased information
		$customerID = $customer_matches['id'];
		$total_value = zeroBS_customerTotalValue( $customerID, $customer_matches['invoices'], $customer_matches['transactions'] );
		$customer_matches['total_value'] = $total_value;


		//also needs
		/**
		 * purchase_item
		 * purchase_value
		 * purchase_date
		 */

		if ( isset( $customer_matches['transactions'] ) && is_array( $customer_matches['transactions'] ) && count( $customer_matches['transactions'] ) > 0 ) {

			$customer_matches['purchase_item'] = $customer_matches['transactions'][0]['meta']['item'];
			$customer_matches['purchase_value'] = $customer_matches['transactions'][0]['meta']['total'];
			$customer_matches['purchase_date'] = $customer_matches['transactions'][0]['created'];

		}

		/* should also format the bl00dy dates */

	}
	
} else {
	// could be more matches (don't return financial data - unperformant)
	$customer_matches = zeroBS_integrations_searchCustomers( $args );
}

if ( $zbs->zapier ) {
	wp_send_json( $zbs->zapier->use_valid_key_names( $customer_matches ) );
}
wp_send_json( $customer_matches );

?>