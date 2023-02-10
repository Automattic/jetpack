<?php

// block direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

jpcrm_api_check_http_method( array( 'GET' ) );

global $zbs;

$reply = array(
	'status'  => __( 'Successful Connection', 'zero-bs-crm' ),
	'message' => __( 'Your API Connection with Jetpack CRM is functioning correctly.', 'zero-bs-crm' ),
	'crm_version' => $zbs->version,
	'db_version' => $zbs->db_version,
);

// eventually we can list modules and extension versions, but we'll first
// need to work out load order, so right now just give some empty arrays
if ( isset( $_GET['full'] ) ) {
	$active_extensions_and_ver = array();

	foreach ( zeroBSCRM_installedProExt() as $ext ) {
		// not active, so we don't care
		if ( $ext['active'] != 1 ) {
			continue;
		}
		$active_extensions_and_ver[$ext['key']] = array(
			'name'    => $ext['name'],
			'version' => $ext['ver'],
		);
	}
	$reply['modules'] = jpcrm_core_modules_installed();
	$reply['extensions'] = $active_extensions_and_ver;
}

wp_send_json_success( $reply );