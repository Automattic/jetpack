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

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

$json_params    = file_get_contents( 'php://input' );
$potential_task = json_decode( $json_params, true );

// define
$task_fields    = array();
$task_id        = -1;
$task_reminders = array();

if ( is_array( $potential_task ) ) {

	$task_fields['title'] = '';
	if ( isset( $potential_task['title'] ) ) {
		$task_fields['title'] = sanitize_text_field( $potential_task['title'] );
	}

	$task_fields['customer'] = -1;
	if ( isset( $potential_task['customer'] ) ) {
		$task_fields['customer'] = (int) sanitize_text_field( $potential_task['customer'] );
	}

	$task_fields['notes'] = '';
	if ( isset( $potential_task['notes'] ) ) {
		$task_fields['notes'] = sanitize_text_field( $potential_task['notes'] );
	}
	$task_fields['to'] = '';
	if ( isset( $potential_task['to'] ) ) {
		$task_fields['to'] = sanitize_text_field( $potential_task['to'] );
	}
	$task_fields['from'] = '';
	if ( isset( $potential_task['from'] ) ) {
		$task_fields['from'] = sanitize_text_field( $potential_task['from'] );
	}

	$task_fields['notify'] = -1;
	if ( isset( $potential_task['notify'] ) && (int) $potential_task['notify'] === 24 ) {
		$task_fields['notify'] = 24;
		// the current setup uses a separate array for task reminders
		$task_reminders[] = array(
			'remind_at' => -86400,
			'sent'      => -1,
		);
	}

	$task_fields['complete'] = -1;
	if ( isset( $potential_task['complete'] ) ) {
		$task_fields['complete'] = (int) $potential_task['complete'];
	}

	$task_fields['owner'] = -1;
	if ( isset( $potential_task['owner'] ) ) {
		$task_fields['owner'] = (int) $potential_task['owner'];
	}

	if ( isset( $potential_task['event_id'] ) ) {
		$task_id = (int) $potential_task['event_id'];
	}
	if ( isset( $potential_task['id'] ) ) {
		$task_id = (int) $potential_task['id'];
	}
}

/*
	Task fields:
	$task_fields = array(
		'title' => task title
		'customer' => ID of the customer the task is for (if any)
		'notes' => task description
		'to' => to date, format date('m/d/Y H') . ":00:00";
		'from' => from date, format date('m/d/Y H') . ":00:00";
		'notify' => 0 or 24 (never or 24 hours before)
		'complete' => 0 or 1 (boolean),
		'owner' => who owns the task (-1 for no one)
		'event_id' =>
	);
*/

$task_result = zeroBS_integrations_addOrUpdateTask( $task_id, $task_fields, $task_reminders );
// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

// thorough much? lol.
if ( ! empty( $task_result ) && $task_result !== false && $task_result !== -1 ) {

	// return what was passed...
	// this is legacy funk.. not ideal at all, should probs reload.
	$return_params = $task_fields;

	// add ID to returned output
	if ( $task_id > 0 ) {
		$return_params['id'] = $task_id;
	}
	if ( $task_result > 0 && $task_result != $task_id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		$return_params['id'] = $task_result;
	}

	// return
	wp_send_json( $return_params );

} else {

	// fail.
	wp_send_json( array( 'error' => 100 ) );

}
