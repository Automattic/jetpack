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
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// Check the method
// Ultimately this should be switched to GET, but the docs have it as POST, so best to wait for a rewrite
// Also seems to mostly be a duplicate of customer_search, other than not being able to search by email...

global $zbs;

$json_params     = file_get_contents( 'php://input' );
$customer_params = json_decode( $json_params, true );

$perPage = 10;
if ( isset( $customer_params['perpage'] ) ) {
	$perPage = sanitize_text_field( $customer_params['perpage'] );
}
$page = 0;
if ( isset( $customer_params['page'] ) ) {
	$page = sanitize_text_field( $customer_params['page'] );
}
$withInvoices = -1;
if ( isset( $customer_params['invoices'] ) ) {
	$withInvoices = sanitize_text_field( $customer_params['invoices'] );
}
$withQuotes = -1;
if ( isset( $customer_params['quotes'] ) ) {
	$withQuotes = sanitize_text_field( $customer_params['quotes'] );
}
$searchPhrase = '';
if ( isset( $customer_params['search'] ) ) {
	$searchPhrase = sanitize_text_field( $customer_params['search'] );
}
$withTransactions = -1;
if ( isset( $customer_params['transactions'] ) ) {
	$withTransactions = sanitize_text_field( $customer_params['transactions'] );
}
$isOwned = -1;
if ( isset( $customer_params['owned'] ) ) {
	$isOwned = (int) $customer_params['owned'];
}

$companyID = -1;
if ( isset( $customer_params['company'] ) ) {
	$companyID = (int) $customer_params['company'];
}

// #FORMIKENOTES -
// These should be Bools - see https://stackoverflow.com/questions/7336861/how-to-convert-string-to-boolean-php
// ... this forces them from string of "true" or "false" into a bool
$withInvoices     = $withInvoices === 'true' ? true : false;
$withQuotes       = $withQuotes === 'true' ? true : false;
$withTransactions = $withTransactions === 'true' ? true : false;

$args = array(
	// Search/Filtering (leave as false to ignore)
	'searchPhrase'     => $searchPhrase,
	'inCompany'        => $companyID,
	'ownedBy'          => $isOwned,
	'withCustomFields' => true,
	'withQuotes'       => $withQuotes,
	'withInvoices'     => $withInvoices,
	'withTransactions' => $withTransactions,
	'page'             => $page,
	'perPage'          => $perPage,
	'ignoreowner'      => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT ),
);

$customers = $zbs->DAL->contacts->getContacts( $args );

wp_send_json( $customers );


