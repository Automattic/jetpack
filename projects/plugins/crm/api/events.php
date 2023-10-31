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

/**
 * Allow events to be filtered by owner. Docs are ambiguous about
 * whether we should use `owned` or `owner`, so let's support both.
 */
// phpcs:disable WordPress.Security.NonceVerification.Recommended
if ( isset( $_GET['owner'] ) && (int) $_GET['owner'] > 0 ) {
	$owner = (int) $_GET['owner'];
} elseif ( isset( $_GET['owned'] ) && (int) $_GET['owned'] > 0 ) {
	$owner = (int) $_GET['owned'];
} else {
	$owner = -1;
}
// phpcs:enable WordPress.Security.NonceVerification.Recommended

$args = array(
	'withAssigned' => true,
	'page'         => $page,
	'perPage'      => $per_page,
	'ownedBy'      => $owner,
	'ignoreowner'  => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_TASK ),
);

global $zbs;
$tasks = $zbs->DAL->events->getEvents( $args ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

wp_send_json( $tasks );
