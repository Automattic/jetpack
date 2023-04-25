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

	// V3.0 version of API

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

		$json_params    = file_get_contents( 'php://input' );
		$potentialEvent = json_decode( $json_params, true );

		// define
		$eventFields = array();
		$eventID     = -1;

if ( is_array( $potentialEvent ) ) {

	$eventFields['title'] = '';
	if ( isset( $potentialEvent['title'] ) ) {
		$eventFields['title'] = sanitize_text_field( $potentialEvent['title'] );
	}
	$eventFields['customer'] = -1;
	if ( isset( $potentialEvent['customer'] ) ) {
		$eventFields['customer'] = (int) sanitize_text_field( $potentialEvent['customer'] );
	}

	$eventFields['notes'] = '';
	if ( isset( $potentialEvent['notes'] ) ) {
		$eventFields['notes'] = sanitize_text_field( $potentialEvent['notes'] );
	}
	$eventFields['to'] = '';
	if ( isset( $potentialEvent['to'] ) ) {
		$eventFields['to'] = sanitize_text_field( $potentialEvent['to'] );
	}
	$eventFields['from'] = '';
	if ( isset( $potentialEvent['from'] ) ) {
		$eventFields['from'] = sanitize_text_field( $potentialEvent['from'] );
	}
	$eventFields['notify'] = -1;
	if ( isset( $potentialEvent['notify'] ) ) {
		$eventFields['notify'] = (int) sanitize_text_field( $potentialEvent['notify'] );
	}
	$eventFields['complete'] = -1;
	if ( isset( $potentialEvent['complete'] ) ) {
		$eventFields['complete'] = (int) sanitize_text_field( $potentialEvent['complete'] );
	}
	$eventFields['owner'] = -1;
	if ( isset( $potentialEvent['owner'] ) ) {
		$eventFields['owner'] = (int) sanitize_text_field( $potentialEvent['owner'] );
	}

	// this was funky? $eventFields['event_id'] = -1; if (isset($new_event['event_id'])) $eventFields['event_id']   = (int)$new_event['event_id'];
	// .. this is a bit cleaner.
	if ( isset( $potentialEvent['event_id'] ) ) {
		$eventID = (int) sanitize_text_field( $potentialEvent['event_id'] );
	}
	if ( isset( $potentialEvent['id'] ) ) {
		$eventID = (int) sanitize_text_field( $potentialEvent['id'] );
	}
}

		/*
			-EVENT FIELDS ARE
			$event_fields = array(

				'title' => event title
				'customer' => ID of the customer the event is for (if any)
				'notes' => customer notes string
				'to' => to date, format date('m/d/Y H') . ":00:00";
				'from' => from date, format date('m/d/Y H') . ":00:00";
				//'notify' => 0 or 24 (never or 24 hours before)
				'complete' => 0 or 1 (boolean),
				'owner' => who owns the event (-1 for no one)
				'event_id' =>
			);
		*/

		// DAL3 Notify changes the way it's passed, now gets passed as a reminder

			// get passed (DAL3+)
			$eventReminders = array();
if ( isset( $new_event['reminders'] ) ) {
	$eventReminders = $new_event['reminders'];
}

			// sanitize event reminders input
if ( is_array( $eventReminders ) ) {

	$erArr = array();

	foreach ( $eventReminders as $er ) {

		// this just adds with correct fields
		$erArr[] = array(

			// 'event' => (int)$eventID,
			'remind_at' => (int) sanitize_text_field( $er['remind_at'] ),
			'sent'      => -1,

		);
	}

	$eventReminders = $erArr;
}

			// get old-style notify
			$eventFields['notify'] = -1; if ( isset( $new_event['notify'] ) ) {

					$oldNotify = (int) sanitize_text_field( $new_event['notify'] );

					// this was only ever 0 or 24
	if ( $oldNotify == 24 ) {
		$eventReminders[] = array(

			'remind_at' => -86400,
			'sent'      => -1,

		);
	}
			}

			$eventResult = zeroBS_integrations_addOrUpdateEvent( $eventID, $eventFields, $eventReminders );
			// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

			// thorough much? lol.
			if ( ! empty( $eventResult ) && $eventResult !== false && $eventResult !== -1 ) {

				// return what was passed...
				// this is legacy funk.. not ideal at all, should probs reload.
				$return_params = $eventFields;

				// add id (if new)
				if ( $eventID > 0 ) {
					$return_params['id'] = $eventID;
				}
				if ( $eventResult > 0 && $eventResult != $eventID ) {
					$return_params['id'] = $eventResult;
				}

				// return
				wp_send_json( $return_params );

			} else {

				// fail.
				wp_send_json( array( 'error' => 100 ) );

			}


