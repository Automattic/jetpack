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
jpcrm_api_check_http_method( array( 'GET' ) );

// Process the pagination parameters from the query
list( $page, $per_page ) = jpcrm_api_process_pagination();

global $zbs;

$args = array(
	// Search/Filtering (leave as false to ignore)
	'searchPhrase'    => '',
	// 'inArr'                   => $inArray,
	// 'quickFilters'    => $quickFilters,
	// 'isTagged'            => $hasTagIDs,
	// 'withAssigned'    => $withCustomerDeets,
	'suppressContent' => true, // NO HTML!
	'sortByField'     => 'ID',
	'sortOrder'       => 'DESC',
	'page'            => $page,
	'perPage'         => $per_page,
	'ignoreowner'     => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_QUOTE ),
);

$quotes = $zbs->DAL->quotes->getQuotes( $args );

wp_send_json( $quotes );


