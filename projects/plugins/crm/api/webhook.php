<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2022 Automattic
 *
 * Date: 1922-08-30
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

function jpcrm_api_invalid_webhook() {
	$reply = array(
		'status'  => __( 'Invalid webhook request', 'zero-bs-crm' ),
		'message' => __( 'Please ensure you are using the proper webhook action name and that the webhook is enabled in the CRM.', 'zero-bs-crm' ),
	);
	wp_send_json_error( $reply, 400 );
}

// Check the method
jpcrm_api_check_http_method( array( 'POST' ) );

$valid_webhook_actions = array();

$valid_webhook_actions = apply_filters( 'jpcrm_api_valid_webhook_actions', $valid_webhook_actions );

/*
Send some data like this:

{
	"action": "action_name",
	"data": {
	"field1":1.23,
	"field2":"4.56"
	}
}

*/

$raw_input   = file_get_contents( 'php://input' );
$parsed_data = json_decode( $raw_input, true );

// missing an action
if ( empty( $parsed_data['action'] ) ) {
	jpcrm_api_invalid_request();
}

$webhook_action = sanitize_text_field( $parsed_data['action'] );

// this is not sanitised
$webhook_data = empty( $parsed_data['data'] ) ? false : $parsed_data['data'];

// invalid webhook action
if ( ! in_array( $webhook_action, $valid_webhook_actions ) ) {
	jpcrm_api_invalid_webhook();
}

// note again that the data will need to be sanitised on the receiving end
do_action( 'jpcrm_webhook_' . $webhook_action, $webhook_data );

// by default, send success, but the action can override this
wp_send_json_success();
