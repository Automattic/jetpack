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
	'page'            => $pagination['page'],
	'perPage'         => $pagination['per_page'],
	'sortOrder'       => $pagination['order'],
	'ignoreowner'     => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_QUOTE ),
);

$quotes = $zbs->DAL->quotes->getQuotes( $args );

wp_send_json( $quotes );
