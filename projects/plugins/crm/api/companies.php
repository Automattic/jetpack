<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 04/06/2019
 *
 * @package automattic/jetpack-crm
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}

// Check the method
// Ultimately this should be switched to GET, but the docs have it as POST, so best to wait for a rewrite
jpcrm_api_check_http_method( array( 'POST' ) );

$json_params    = file_get_contents( 'php://input' );
$company_params = json_decode( $json_params, true );

$items_per_page = 10;
if ( isset( $company_params['perpage'] ) ) {
	$items_per_page = sanitize_text_field( $company_params['perpage'] );
}
$page_num = 0;
if ( isset( $company_params['page'] ) ) {
	$page_num = sanitize_text_field( $company_params['page'] );
}
$with_invoices = -1;
if ( isset( $company_params['invoices'] ) ) {
	$with_invoices = sanitize_text_field( $company_params['invoices'] );
}
$with_quotes = -1;
if ( isset( $company_params['quotes'] ) ) {
	$with_quotes = sanitize_text_field( $company_params['quotes'] );
}
$with_transactions = -1;
if ( isset( $company_params['transactions'] ) ) {
	$with_transactions = sanitize_text_field( $company_params['transactions'] );
}
$search_phrase = '';
if ( isset( $company_params['search'] ) ) {
	$search_phrase = sanitize_text_field( $company_params['search'] );
}
$owned_by = -1;
if ( isset( $company_params['owned'] ) ) {
	$owned_by = (int) $company_params['owned'];
}

// ... this forces them from string of "true" or "false" into a bool
$with_invoices     = $with_invoices === 'true' ? true : false;
$with_quotes       = $with_quotes === 'true' ? true : false;
$with_transactions = $with_transactions === 'true' ? true : false;

$args = array(
	'perPage'          => $items_per_page,
	'page'             => $page_num,
	'searchPhrase'     => $search_phrase,
	'ownedBy'          => $owned_by,
	'withQuotes'       => $with_quotes,
	'withInvoices'     => $with_invoices,
	'withTransactions' => $with_transactions,
	'sortByField'      => 'ID',
	'sortOrder'        => 'DESC',
);

global $zbs;
$companies = $zbs->DAL->companies->getCompanies( $args ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable,WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

wp_send_json( $companies );
