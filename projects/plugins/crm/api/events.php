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

if ( isset( $event_params['owned'] ) && (int) $event_params['owned'] > 0 ) {
	$isOwned = (int) $event_params['owned'];
} else {
	$isOwned = -1;
}

// needs moving to the $args version
// v3.0 needs these objects refined, including textify for html
$events = zeroBS_getEvents( true, $per_page, $page, $isOwned );

wp_send_json( $events );


