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
$pagination = jpcrm_api_process_pagination();
$args       = array(
	'withAssigned' => false,
	'withTags'     => false,
	'page'         => $pagination['page'],
	'perPage'      => $pagination['per_page'],
	'sortOrder'    => $pagination['order'],
);

global $zbs;
$transactions = $zbs->DAL->transactions->getTransactions( $args ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

wp_send_json( $transactions );
