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
jpcrm_api_check_http_method( array( 'POST' ) );

$json_params    = file_get_contents( 'php://input' );
$company_params = json_decode( $json_params, true );

$perPage = 10;
if ( isset( $company_params['perpage'] ) ) {
	$perPage = sanitize_text_field( $company_params['perpage'] );
}
$page = 0;
if ( isset( $company_params['page'] ) ) {
	$page = sanitize_text_field( $company_params['page'] );
}
$withInvoices = -1;
if ( isset( $company_params['invoices'] ) ) {
	$withInvoices = sanitize_text_field( $company_params['invoices'] );
}
$withQuotes = -1;
if ( isset( $company_params['quotes'] ) ) {
	$withQuotes = sanitize_text_field( $company_params['quotes'] );
}
$searchPhrase = '';
if ( isset( $company_params['search'] ) ) {
	$searchPhrase = sanitize_text_field( $company_params['search'] );
}
$withTransactions = -1;
if ( isset( $company_params['transactions'] ) ) {
	$withTransactions = sanitize_text_field( $company_params['transactions'] );
}
$isOwned = -1;
if ( isset( $company_params['owned'] ) ) {
	$isOwned = (int) $company_params['owned'];
}

// #FORMIKENOTES -
// These should be Bools - see https://stackoverflow.com/questions/7336861/how-to-convert-string-to-boolean-php
// ... this forces them from string of "true" or "false" into a bool
$withInvoices     = $withInvoices === 'true' ? true : false;
$withQuotes       = $withQuotes === 'true' ? true : false;
$withTransactions = $withTransactions === 'true' ? true : false;
$isAssigned       = false; // ??

// needs moving to the $args version
$companies = zeroBS_getCompanies( true, $perPage, $page, $withInvoices, $withQuotes, $searchPhrase, $withTransactions, false, false, '', '', false, false, false, 'ID', 'DESC', false, $isAssigned );

wp_send_json( $companies );
