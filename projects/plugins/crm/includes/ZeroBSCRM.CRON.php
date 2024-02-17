<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2.3
 *
 * Copyright 2020 Automattic
 *
 * Date: 15/12/16
 */

/*
	To add to cron:

		1) Add to list (#1)
		2) Add func x 2 (#2)


	To see what cron is enabled:
	http://wordpress.stackexchange.com/questions/98032/is-there-a-quick-way-to-view-the-wp-cron-schedule
	<?php

	$cron_jobs = get_option( 'cron' );
	print_r($cron_jobs);

	?>


*/

/*
======================================================
	Wrapper Arr (lists of cron to add)
	====================================================== */

	global $zbscrm_CRONList;

	$zbscrm_CRONList = array(

		##WLREMOVE
		'zbstele'            => 'daily',
		'zbsext'             => 'daily',
		##/WLREMOVE

		'zbsnotifyevents'    => 'hourly',
		// 'clearTempHashes'    => 'hourly'
		'zbsclearseclogs'    => 'daily',
		'jpcrm_cron_watcher' => 'twicedaily',
	);

	/*
	======================================================
	/Wrapper Arr (lists of cron to add)
	====================================================== */

	/*
	======================================================
	Add Jetpack CRM Custom schedule (5m)
	// https://wordpress.stackexchange.com/questions/208135/how-to-run-a-function-every-5-minutes
	====================================================== */
	function zeroBSCRM_cronSchedules( $schedules ) {
		if ( ! isset( $schedules['5min'] ) ) {
			$schedules['5min'] = array(
				'interval' => 5 * 60,
				'display'  => __( 'Once every 5 minutes', 'zero-bs-crm' ),
			);
		}
		return $schedules;
	}
	add_filter( 'cron_schedules', 'zeroBSCRM_cronSchedules' );
	/*
	======================================================
	/Add Jetpack CRM Custom schedule (5m)
	====================================================== */

	function zeroBSCRM_deactivateCrons() {

		global $zbscrm_CRONList;

		foreach ( $zbscrm_CRONList as $cronName => $timingStr ) {

			wp_clear_scheduled_hook( $cronName );

		}
	}
	register_deactivation_hook( ZBS_ROOTFILE, 'zeroBSCRM_deactivateCrons' );

	/*
	======================================================
	Actual Action Funcs #2
	====================================================== */

	// ======= Clear Auto-drafts
	function zeroBSCRM_cron_clearAutoDrafts() {

		// } Simple
		// only show these for legacy users using DAL<3
		// #backward-compatibility
		global $zbs;
		if ( ! $zbs->isDAL3() ) {
			zeroBSCRM_clearCPTAutoDrafts();
		}
	}

	add_action( 'zbsclearautodrafts', 'zeroBSCRM_cron_clearAutoDrafts' );

	function jpcrm_cron_notify_tasks() {

		// } Simple
		jpcrm_notify_tasks();
	}
	add_action( 'zbsnotifyevents', 'jpcrm_cron_notify_tasks' );

	function jpcrm_cron_watcher() {
		global $zbscrm_CRONList;

		// Get all the cronjobs from extensions to be watched
		$cronjobs_to_monitor = apply_filters( 'jpcrm_cron_to_monitor', $zbscrm_CRONList );

		if ( is_array( $cronjobs_to_monitor ) ) {

			foreach ( $cronjobs_to_monitor as $cron_name => $recurrence ) {
				// Check if the cronjob is working/scheduled
				if ( ! wp_next_scheduled( $cron_name ) ) {
					wp_schedule_event( time(), $recurrence, $cron_name );
				}
			}
		}
	}
	add_action( 'jpcrm_cron_watcher', 'jpcrm_cron_watcher' );
	register_activation_hook( ZBS_ROOTFILE, 'jpcrm_cron_watcher' );

	// ======= Clear temporary hashes
	/*
	function zeroBSCRM_cron_clearTempHashes() {

		#} Simple
		zeroBSCRM_clearTemporaryHashes();

	}

	add_action('zbscleartemphashes', 'zeroBSCRM_cron_clearTempHashes'); */

	// ======= Clear security logs (from easy-pay hash requests) *after 72h
	function zeroBSCRM_cron_clearSecLogs() {

		// } Simple
		zeroBSCRM_clearSecurityLogs();
	}

	add_action( 'zbsclearseclogs', 'zeroBSCRM_cron_clearSecLogs' );

	/*
	======================================================
	/ Actual Action Funcs
	====================================================== */

	/*
	======================================================
	CRONNABLE FUNCTION (should house these somewhere)
	====================================================== */

	// Notify user of upcoming task (task)
	function jpcrm_notify_tasks() {

		// is the email notification active? (if not, nothing to do)
		if ( ! zeroBSCRM_get_email_status( ZBSEMAIL_TASK_NOTIFICATION ) ) {
			return;
		}

		global $zbs;

		// retrieve upcoming task reminders
		$due_task_reminders = $zbs->DAL->eventreminders->getEventreminders(
			array(

				'dueBefore' => time() + 3600, // anytime within next hour
				'dueAfter'  => time() - 3600, // anytime from -1h
				'sent'      => false, // reminders which hasn't been sent

			)
		);

		// cycle through them, if any
		foreach ( $due_task_reminders as $task_reminder ) {

			$task = $zbs->DAL->events->getEvent( $task_reminder['event'] );

			// check if task
			// check task not complete (if so, no need to send)
			// check if task has owner
			if ( is_array( $task ) && $task['complete'] !== 1 && $task['owner'] > 0 ) {

				// retrieve target (task owner)
				$owner_info = get_userdata( $task['owner'] );
				if ( $owner_info > 0 ) {

					// email
					$owner_email = $owner_info->user_email;

					// send notification email (tracking dealt with by zeroBSCRM_mailDelivery_sendMessage)

					// ==========================================================================================
					// =================================== MAIL SENDING =========================================

					// generate html
					$emailHTML = jpcrm_task_generate_notification_html( true, $owner_email, $task['id'], $task );

						// build send array
						$mailArray = array(
							'toEmail'  => $owner_email,
							'toName'   => '',
							'subject'  => zeroBSCRM_mailTemplate_getSubject( ZBSEMAIL_TASK_NOTIFICATION ),
							'headers'  => zeroBSCRM_mailTemplate_getHeaders( ZBSEMAIL_TASK_NOTIFICATION ),
							'body'     => $emailHTML,
							'textbody' => '',
							'options'  => array(
								'html' => 1,
							),
							'tracking' => array(
								// tracking :D (auto-inserted pixel + saved in history db)
								'emailTypeID'     => ZBSEMAIL_TASK_NOTIFICATION,
								'targetObjID'     => $task['owner'],
								'senderWPID'      => -13,
								'associatedObjID' => $task['id'],
							),
						);

						// Sends email, including tracking, via setting stored route out, (or default if none)
						// and logs tracking :)

						// discern delivery method
						$mailDeliveryMethod = zeroBSCRM_mailTemplate_getMailDelMethod( ZBSEMAIL_TASK_NOTIFICATION ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						if ( ! isset( $mailDeliveryMethod ) || empty( $mailDeliveryMethod ) ) {
							$mailDeliveryMethod = -1;
						}

						// send
						$sent = zeroBSCRM_mailDelivery_sendMessage( $mailDeliveryMethod, $mailArray );

						// mark as sent
						$zbs->DAL->eventreminders->setSentStatus( $task_reminder['id'], 1 );

						// =================================== / MAIL SENDING =======================================
						// ==========================================================================================

				} // / if owner exists as wp user

			} // / if task, if task not complete, if task has owner

		}
	}
