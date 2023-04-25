<?php
/*
!
 * Email AJAX
 * Jetpack CRM - https://jetpackcrm.com
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

add_action( 'wp_ajax_zbs_email_star_thread', 'zeroBSCRM_star_email_thread' );
function zeroBSCRM_star_email_thread() {

	// stars the email thread for easier finding in the "Starred" box
	check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );

	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		exit( '{processed:-1}' );
	}

	global $wpdb, $ZBSCRM_t;
	$the_thread = (int) sanitize_text_field( $_POST['emid'] );
	$sql        = $wpdb->prepare( 'UPDATE ' . $ZBSCRM_t['system_mail_hist'] . ' SET zbsmail_starred = 1 WHERE zbsmail_sender_thread = %d', $the_thread );
	$wpdb->query( $sql );
	$m['message'] = 'success';
	echo json_encode( $m );
	die();
}

add_action( 'wp_ajax_zbs_email_unstar_thread', 'zeroBSCRM_unstar_email_thread' );
function zeroBSCRM_unstar_email_thread() {

	// stars the email thread for easier finding in the "Starred" box
	check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );

	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		exit( '{processed:-1}' );
	}

	global $wpdb, $ZBSCRM_t;
	$the_thread = (int) sanitize_text_field( $_POST['emid'] );
	$sql        = $wpdb->prepare( 'UPDATE ' . $ZBSCRM_t['system_mail_hist'] . ' SET zbsmail_starred = 0 WHERE zbsmail_sender_thread = %d', $the_thread );
	$wpdb->query( $sql );
	$m['message'] = 'success';
	echo json_encode( $m );
	die();
}

add_action( 'wp_ajax_zbs_delete_email_thread', 'zeroBSCRM_delete_email_thread' );
function zeroBSCRM_delete_email_thread() {

	check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );

	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		exit( '{processed:-1}' );
	}

	global $wpdb, $ZBSCRM_t;
	$the_thread = (int) sanitize_text_field( $_POST['emid'] );
	$sql        = $wpdb->prepare( 'DELETE FROM ' . $ZBSCRM_t['system_mail_hist'] . ' WHERE zbsmail_sender_thread = %d', $the_thread );
	$wpdb->query( $sql );
	$m['message'] = 'success';
	echo json_encode( $m );
	die();
}

/*
* AJAX - Send an email against a thread in email box
*/
function zeroBSCRM_send_email_thread_ajax() {

	// check nonce
	check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );

	// check permissions
	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		exit( '{processed:-1}' );
	}

	global $zbs, $wpdb, $ZBSCRM_t;

	// retrieve thread and contact ID
	$thread_id  = (int) sanitize_text_field( $_POST['emid'] );
	$contact_id = (int) sanitize_text_field( $_POST['cid'] );

	// retrieve send to email
	$sql           = $wpdb->prepare( 'SELECT zbsmail_receiver_email FROM ' . $ZBSCRM_t['system_mail_hist'] . ' WHERE zbsmail_sender_thread = %d ORDER BY ID ASC LIMIT 0,1', $thread_id );
	$send_to_email = $wpdb->get_var( $sql );

	// fallback to email on account for contact
	if ( empty( $send_to_email ) ) {
		$send_to_email = zeroBS_customerEmail( $contact_id );
	}

	// get delivery method
	$sql             = $wpdb->prepare( 'SELECT zbsmail_sender_maildelivery_key FROM ' . $ZBSCRM_t['system_mail_hist'] . ' WHERE zbsmail_sender_thread = %d ORDER BY ID ASC LIMIT 0,1', $thread_id );
	$delivery_method = $wpdb->get_var( $sql );
	// validate still legit, else set to -1 if (empty($deliveryMethod))
	// actually, the sendmail func does this well, fallback to that

	// send
	jpcrm_send_single_email_from_box( $send_to_email, $thread_id, $delivery_method, true, false );

	// fini
	exit();
}
add_action( 'wp_ajax_zbs_email_send_thread_ui', 'zeroBSCRM_send_email_thread_ajax' );

add_action( 'wp_ajax_zbs_email_customer_panel', 'zeroBSCRM_emails_customer_panel' );
function zeroBSCRM_emails_customer_panel() {

	check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );

	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		exit( '{processed:-1}' );
	}

	$customerID = (int) sanitize_text_field( $_POST['cid'] );
	$threadID   = (int) sanitize_text_field( $_POST['emid'] );

	$ret['customer'] = zeroBS_getCustomer( $customerID, true, true, true );

	$ret['avatar'] = zeroBS_customerAvatarHTML( $customerID );

	$ret['trans_value'] = zeroBSCRM_formatCurrency( zeroBS_customerTransactionsValue( $customerID, $ret['customer']['transactions'] ) );
	$ret['inv_value']   = zeroBSCRM_formatCurrency( zeroBS_customerInvoicesValue( $customerID, $ret['customer']['invoices'] ) );
	$ret['quote_value'] = zeroBSCRM_formatCurrency( zeroBS_customerQuotesValue( $customerID, $ret['customer']['quotes'] ) );

	$ret['tasks'] = zeroBSCRM_getTaskList( $customerID );

	$email = zeroBSCRM_get_email_history( 0, 50, $customerID, '', -1, false, $threadID );

	zeroBSCRM_mark_as_read( $threadID );

	global $zbs;

	$e = 0;
	foreach ( $email as $em ) {
		$email_ret[ $e ]['the_id']          = $em->ID;
		$email_ret[ $e ]['date']            = zeroBSCRM_locale_utsToDate( $em->zbsmail_created );
		$email_ret[ $e ]['zbsmail_subject'] = $em->zbsmail_subject;
		if ( $em->zbsmail_content == null ) {
			$email_ret[ $e ]['zbsmail_content'] = __( 'No content was stored for this message', 'zero-bs-crm' );
		} else {
			$email_ret[ $e ]['zbsmail_content'] = wp_kses( zeroBSCRM_io_WPEditor_DBToHTML( $em->zbsmail_content ), $zbs->acceptable_html );
		}
		$email_ret[ $e ]['zbsmail_opened']     = $em->zbsmail_opened;
		$email_ret[ $e ]['zbsmail_lastopened'] = zeroBSCRM_locale_utsToDatetimeWP( $em->zbsmail_firstopened );
		$email_ret[ $e ]['in_or_out']          = $em->zbsmail_status;
		if ( $em->zbsmail_status == 'inbox' ) {
			$email_ret[ $e ]['avatar'] = zeroBS_customerAvatarHTML( $em->zbsmail_target_objid );
		} else {
			$email_ret[ $e ]['avatar'] = jpcrm_get_avatar( $em->zbsmail_sender_wpid, 35 );
		}
		++$e;
	}

	$ret['email'] = $email_ret;

	echo json_encode( $ret, true );
	die();
}

function zeroBSCRM_mark_as_read( $threadID = -1 ) {
	global $wpdb, $ZBSCRM_t;
	if ( $threadID >= 0 ) {
		$sql = $wpdb->prepare( 'UPDATE ' . $ZBSCRM_t['system_mail_hist'] . " SET zbsmail_opened = 1, zbsmail_lastopened = %d, zbsmail_firstopened = %d WHERE zbsmail_sender_thread = %d AND zbsmail_status = 'inbox' AND zbsmail_opened = 0", time(), time(), $threadID );
	}
	$wpdb->query( $sql );
}

/*
* Send an email against a thread in email box
*
* Note, this is fired by AJAX and by main.page.php `zeroBSCRM_pages_admin_sendmail()` on first send (centralised here)
*/
function jpcrm_send_single_email_from_box( $send_to_email = '', $thread_id = -1, $delivery_method = -1, $exit_json = true, $do_nl2br = false ) {

	// check permissions
	if ( ! zeroBSCRM_permsSendEmailContacts() ) {
		if ( $exit_json ) {
			exit( '{processed:-1}' );
		} else {
			exit();
		}
	}

	// this function is used via AJAX and direct POST, so for now check for two separate nonces
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'jpcrm-update-client-details' ) ) {
		check_ajax_referer( 'zbscrmjs-glob-ajax-nonce', 'sec' );
	}

	// proceed
	global $wpdb, $ZBSCRM_t, $zbs;

	// declare
	$result = false;

	// got valid send-to email?
	if ( zeroBSCRM_validateEmail( $send_to_email ) ) {

		// build email
		$subject = '';
		if ( isset( $_POST['zbs-send-email-title'] ) ) {
			$subject = zeroBSCRM_textProcess( $_POST['zbs-send-email-title'] );
		}
		$content = '';
		if ( isset( $_POST['zbs_send_email_content'] ) ) {
			$content = zeroBSCRM_textProcess( $_POST['zbs_send_email_content'] );
		}
		if ( $do_nl2br ) {
			$content = nl2br( $content );
		}
		$contact_id = (int) zeroBS_getCustomerIDWithEmail( $send_to_email );

		// only send to existing contacts
		if ( $contact_id <= 0 ) {
			$m['message'] = __( 'No contact found under the specified email!', 'zero-bs-crm' );
			return;
		}
		$uid = get_current_user_id();

		// load templater
		$placeholder_templating = $zbs->get_templating();
		$generic_replacements   = $placeholder_templating->get_generic_replacements();

		// retrieve contact
		$contact_object = zeroBS_getCustomer( $contact_id );

		// process subject
		$subject = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), zeroBSCRM_textExpose( $subject ), $generic_replacements, array( ZBS_TYPE_CONTACT => $contact_object ) );

		// build content html
		$content = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), zeroBSCRM_textExpose( $content ), $generic_replacements, array( ZBS_TYPE_CONTACT => $contact_object ) );

		// build overall html & headers
		$email_html = jpcrm_mailTemplates_single_send_templated( true, $content, $subject, $contact_object );
		$headers    = array( 'Content-Type: text/html; charset=UTF-8' );

		// get which del method naming convention:
		$namingConvention = zeroBSCRM_getSetting( 'directmsgfrom' );
		switch ( $namingConvention ) {

			case 1: // Agent Name @ CRM Name
				$user_info = get_userdata( $uid );

				$agentName = $user_info->first_name . ' ' . $user_info->last_name;
				if ( $agentName == ' ' ) {
					$agentName = $user_info->display_name;
				}

				$agentName     = ucwords( $agentName );
				$emailFromName = $agentName;

				$crmName = zeroBSCRM_mailDelivery_defaultFromname();
				if ( ! empty( $crmName ) ) {
					$emailFromName .= ' @ ' . $crmName;
				}

				break;
			case 2: // CRM Name
				$emailFromName = zeroBSCRM_mailDelivery_defaultFromname();

				break;
			case 3: // Mail Delivery Name
				// just pass empty and it'll default
				$emailFromName = '';

				break;
		}

		// build mail array
		$mailArray = array(
			'toEmail'  => $send_to_email,
			'toName'   => '',
			'subject'  => $subject,
			'headers'  => $headers,
			'body'     => $email_html,
			'textbody' => '',
			'thread'   => $thread_id,
			'content'  => $content, // not the full HTML just the content
			'options'  => array(
				'html' => 1,
			),
			'tracking' => array(
				// tracking :D (auto-inserted pixel + saved in history db)
				'emailTypeID'     => -999, // mike's used -999 to mean direct email
				'targetObjID'     => $contact_id,
				'senderWPID'      => $uid,
				'associatedObjID' => -999, // mike's used -999 to mean direct email (yes twice?)
			),
		);

		// if any, add
		if ( ! empty( $emailFromName ) ) {
			$mailArray['overrideSendName'] = $emailFromName;
		}

		// Sends email, including tracking
		$sent = zeroBSCRM_mailDelivery_sendMessage( $delivery_method, $mailArray );

		// Add log - temp, needs to also remember which camp + link to
		$newLogID = zeroBS_addUpdateContactLog(
			$contact_id,
			-1,
			-1,
			array(
				'type'           => 'Email',
				'shortdesc'      => __( 'Email Sent', 'zero-bs-crm' ),
				'longdesc'       => __( 'Email sent with the subject: ', 'zero-bs-crm' ) . $subject,
				// meta keyval for later linking
				'meta_assoc_src' => 'singlemail',
			)
		);

		// success
		$m['message'] = 'success';
		$result       = true;

	} else {

		// invalid email address
		$m['message'] = __( 'That is not a valid email. Please enter a valid email', 'zero-bs-crm' );

	}

	if ( $exit_json ) {

		echo json_encode( $m );
		exit();

	} else {

		return $result;

	}
}
