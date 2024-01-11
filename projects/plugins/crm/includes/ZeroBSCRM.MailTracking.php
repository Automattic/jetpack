<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2.5
 *
 * Copyright 2020 Automattic
 *
 * Date: 09/01/2017
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

	#1 - Client Portal Welcome Email
	#2 - Quote Accepted Email
	#3 - Email Invoice 
	#4 - New Quote 
	#5 - Task Notification (leave for now)...
	#6 - Client Portal Password Reset

	// Define globals for EMAIL TEMPLATES
	define( 'ZBSEMAIL_CLIENTPORTALWELCOME', 1 );
	define( 'ZBSEMAIL_QUOTEACCEPTED', 2 );
	define( 'ZBSEMAIL_EMAILINVOICE', 3 );
	define( 'ZBSEMAIL_NEWQUOTE', 4 );
	define( 'ZBSEMAIL_TASK_NOTIFICATION', 5 );
	define( 'ZBSEMAIL_CLIENTPORTALPWREST', 6 );
	define( 'ZBSEMAIL_STATEMENT', 7 );

/* ======================================================
  Email tracking functions
   ====================================================== */

#} This tracks emails being opened by loading a 1px by 1px gif
add_action('init','zeroBSCRM_mailTracking_track');
function zeroBSCRM_mailTracking_track(){
	
	if (isset($_GET['zbspostman']) && !empty($_GET['zbspostman'])){

		$potentialHash = sanitize_text_field( $_GET['zbspostman'] );

		if (!empty($potentialHash)){

			// attempt to get history row for pixel
			$row = zeroBSCRM_mailTracking_getEmailFromHash($potentialHash);

			// found one?
			if (is_array($row)){

				// make new opened count
				$openedCount = 1; if (isset($row['zbsmail_opened'])) { $openedCount = (int)$row['zbsmail_opened']; $openedCount++; }
				$firstOpen 	 = 0; if (isset($row['zbsmail_firstopened'])) { $firstOpen = (int)$row['zbsmail_firstopened'];}
				
				
				// log it
				zeroBSCRM_mailTracking_logOpen($potentialHash,-1,$openedCount, $firstOpen);


			}

			header( 'Content-Type: image/gif' );

			// Full path to the image on the server it is in /i/blank.gif
			$localBlankGif = ZEROBSCRM_PATH . 'i/blank.gif';

			// Now actually output the image requested (intentionally disregarding if the database was affected)
			header( 'Pragma: public' );
			header( 'Expires: 0' );
			header( 'Cache-Control: must-revalidate, post-check=0, pre-check=0' );
			header( 'Cache-Control: private',false );
			header( 'Content-Disposition: attachment; filename="blank.gif"' );
			header( 'Content-Transfer-Encoding: binary' );			
			readfile( $localBlankGif );

			exit;
		}
	
	}



}


// Adds open tracking pixel to a html email
/* As per our brain-melting convo of 10/05/18: https://epicplugins.slack.com/archives/G075SD73P/p1525956136000217

	$messageHTML = html
	$who = either WPID of user sending, 
					OR 
					-10 = sys email to customer,
					-11 quote proposal accepted sent to admin,
					-12 you have a new quote sent to contact,
					-13 task notification sent to owner of task
					-14 you have a new invoice sent to customer,
					-15 you have a statement sent to customer,
					-16 you have a new invoice sent to company,
					-17 you have a new quote sent to company
	$user =  CONTACT ID associated OR if to team member, their WPID
	$email = target email
	$item = TEMPLATE_ID
	$subject = subject
	

// THIS WAS decommissioned by WH in favour of hashed pixels :)
function zeroBSCRM_mailTracking_addPixel($messageHTML='', $who = -1, $user=-1, $email='', $item=-1, $subject=''){


	//this surely needs a hash which is decoded via PHP side..
	$tracker = site_url() . '?zbs-email-tracker=1&zbs-who=' . urlencode( $who ) . '&zbs-user=' . urlencode( $user ) . '&email-zbs=' . sanitize_email($email) . '&zbs-item=' . urlencode($item) . '&zbs-subj=' . urlencode($subject);
	$trackingImg = '<img alt="" src="'.$tracker.'" width="1" height="1" border="0" />';

	//Add the tracker to the message.

		// first we try and jam into </body>, if none, (THATS WEIRD), we just append...
		if (strpos($messageHTML,'</body') > 0){

			// prepend </body with our img
			$messageHTML = str_replace('</body',$trackingImg.'</body',$messageHTML);

		} else {
			
			// just append, though that's funky... no body?
			$messageHTML .= $trackingImg;
		}
	
	return $messageHTML;
}*/
function zeroBSCRM_mailTracking_addPixel($messageHTML='', $hash=''){

	// NOTE if an empty hash is passed, this'll still return body, but without any pixel
	if (empty($hash)) return $messageHTML;


	//this surely needs a hash which is decoded via PHP side..
	$tracker = site_url() . '?zbspostman=' . urlencode($hash);
	$trackingImg = '<img alt="" src="'.$tracker.'" width="1" height="1" border="0" />';

	//Add the tracker to the message.

		// first we try and jam into </body>, if none, (THATS WEIRD), we just append...
		if (strpos($messageHTML,'</body') > 0){

			// prepend </body with our img
			$messageHTML = str_replace('</body',$trackingImg.'</body',$messageHTML);

		} else {
			
			// just append, though that's funky... no body?
			$messageHTML .= $trackingImg;
		}
	
	return $messageHTML;
}


// Saves presence of tracking pixel image
/* As per our brain-melting convo of 10/05/18: https://epicplugins.slack.com/archives/G075SD73P/p1525956136000217
.. WH rewrote the db table to make more simple sense (naming) so now:

	$emailTypeID = type of email, e.g. mailTemplate ID 
					OR -999 for direct email from UI
	$targetObjID = contactID or wp user id if sent to admin
	$senderWPID = either WPID of user sending, 
					OR 
					-10 = sys email to customer,
					-11 quote proposal accepted sent to admin,
					-12 you have a new quote sent to contact,
					-13 task notification sent to owner of task
					-14 you have a new invoice sent to customer,
					-15 you have a statement sent to customer,
					-16 you have a new invoice sent to company,
					-17 you have a new quote sent to company
	$senderEmailAddress = sent from email
	$associatedObjID = associated obj id, e.g. Invoice ID, 
					OR -999 for direct email from UI (yes MS used this twice in this case)
	$emailSubject = the email subject

*/
function zeroBSCRM_mailTracking_logEmail($emailTypeID=-1, $targetObjID=-1, $senderWPID = 0, $senderEmailAddress='', $associatedObjID=-1, $emailSubject='',$returnHash = true, $emailContent='', $thread = -1, $email_to = '', $in_or_out = 'sent', $mailDeliveryMethod = ''){
	//track the template ID into the history, along with the contact ID (or admin ID)..
	//$who = 0 customer, 1 CRM team...
	global $wpdb, $ZBSCRM_t;

	// MAKE A HASH - this isn't particularly legitimate, #torethink
	$hash = sha1(time().$emailTypeID.$associatedObjID.$senderEmailAddress.$emailSubject.$senderWPID.rand(0,99999).$targetObjID);

	if($thread == -1){
		//then we are making a new thread. Otherwise, it will be passed via the function / other send boxes
		$sql = "SELECT MAX(zbsmail_sender_thread) as max_thread FROM " . $ZBSCRM_t['system_mail_hist'];
		$max_thread = (int)$wpdb->get_var($sql);
		$max_thread++;
		$thread = $max_thread;
	}

	$email_data = array( 
		'zbs_site' => -1,
		'zbs_team' => -1,
		'zbs_owner' => -1,
		'zbsmail_type' => $emailTypeID, // prev zbs_emailID
		'zbsmail_sent' => -1,
		'zbsmail_assoc_objid' => $associatedObjID, // prev zbsmail_assoc_objid
		'zbsmail_sender_email' => $senderEmailAddress, // prev zbsmail_sender_email
		'zbsmail_subject' => $emailSubject,
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'zbsmail_content'                 => $emailContent, // THIS IS FREE of formatting e.g. not put through a specific format (wp_kses) - do that a level up/when passing content
		'zbsmail_sender_wpid' => $senderWPID,   // prev zbsmail_sender_wpid
		'zbsmail_target_objid' => $targetObjID,  // prev zbsmail_target_objid
		'zbsmail_hash' => $hash,

		'zbsmail_status' => $in_or_out,
		'zbsmail_starred' => 0,

		'zbsmail_sender_thread' => $thread,
		'zbsmail_receiver_email' => $email_to,

		// maildelivery method
		'zbsmail_sender_maildelivery_key' => $mailDeliveryMethod,


		'zbsmail_lastopened' => 0,
		'zbsmail_lastclicked' => 0,
		'zbsmail_created' => time()
	);

	if ($wpdb->insert( 
		$ZBSCRM_t['system_mail_hist'], 
		$email_data, 
		array( 
		'%d',    //zbs_site
		'%d',    //zbs_team
		'%d',    //zbs_owner
		'%d',    //zbs_emailID
		'%d',    //sent
		'%d',    //item
		'%s',    //email
		'%s',    //subject
		'%s',	 //body
		'%d',    //who
		'%d',    //userID
		'%s',    //hash

		'%s',    //status (inbox, sent, draft, scheduled)
		'%d',    //0 = not starred, 1 = starred

		'%d', 	//the thread we are sending
		'%s',   //sent to which email

		'%s',   //mail delivery method key

		'%d',	 //last opened
		'%d',    //lastclicked
		'%d',    //created
		) 
	) > 0){
		// inserted, let's move on
		
		// return id?
		if (!$returnHash) $newSysTemplateHist = $wpdb->insert_id;

		// otherwise return hash (used in tracking pixel)
		return $hash;

	} else {
		return false;
	}
}

// This function updates line to say 'SENT'
// it just updates the 'sent' flag :)
function zeroBSCRM_mailTracking_logSend($hash='',$ID=-1){

	global $wpdb, $ZBSCRM_t;

	// build where
	$whereArr = array(); $whereTypeArr = array();
	if (!empty($hash)) {
		$whereArr['zbsmail_hash'] = $hash;
		$whereTypeArr[] = '%s';
	}
	if (!empty($ID) && $ID > 0) {
		$whereArr['ID'] = $ID;
		$whereTypeArr[] = '%d';
	}

	if (count($whereArr) > 0){

		  if ($wpdb->update($ZBSCRM_t['system_mail_hist'],
		  array( 
		    'zbsmail_sent' => 1,
		  ), 
		  $whereArr,
		  $whereTypeArr,
		  array(
		    '%d'
		    )
		  ) !== false){

		  	return true;

		  }

	}

	return false;
}


// This function updates line to say 'opened' ++increments opened and updates zbsmail_lastopened	
function zeroBSCRM_mailTracking_logOpen($hash='', $ID=-1, $newOpenedCount = 1, $firstOpen = 0){

	global $wpdb, $ZBSCRM_t;



	// build where
	$whereArr = array(); $whereTypeArr = array();
	if (!empty($hash)) {
		$whereArr['zbsmail_hash'] = $hash;
		$whereTypeArr[] = '%s';
	}
	if (!empty($ID) && $ID > 0) {
		$whereArr['ID'] = $ID;
		$whereTypeArr[] = '%d';
	}

	#} so we only record the first opened the once.
	$data = array( 
		'zbsmail_opened' => $newOpenedCount,
		'zbsmail_lastopened' => time()
	);

	$data_format = 		  array(
		'%d',
		'%d'
	);




	if($firstOpen == 0){
		$data['zbsmail_firstopened'] = time();
		$data_format[] = '%d';
	}

	if (count($whereArr) > 0){


	/*

	$wpdb->update( 
	'table', 
	array( 
		'column1' => 'value1',	// string
		'column2' => 'value2'	// integer (number) 
	), 
	array( 'ID' => 1 ), 
	array( 
		'%s',	// value1
		'%d'	// value2
	), 
	array( '%d' ) 
);

	*/

	//this had a bug in the whereArr and data_format were the wrong way around (to check in core branch)
		$rows_updated = $wpdb->update($ZBSCRM_t['system_mail_hist'],
		  $data, 
		  $whereArr,
		  $data_format,
		  $whereTypeArr
		);

		if($rows_updated){
			return true;
		}

	}

	return false;
}








function zeroBSCRM_get_email_history($page=0, $limit=50, $userID = -1, $type='', $email=-1, $thread=false, $threadID = -1, $star=false, $justCust = true){
	global $wpdb, $ZBSCRM_t;

	$order = 'DESC';
	$extra_sql = "";
	if($userID > 0){
		$extra_sql = $wpdb->prepare(" WHERE zbsmail_target_objid = %d",  $userID);
	}
	if($type != ''){
		#} this is our inboxes condition here for zbsmail_target_objid > 0
		$extra_sql = $wpdb->prepare(" WHERE zbsmail_status = %s AND zbsmail_target_objid >= 0 AND zbsmail_sender_wpid >= 0",  $type);
	}
	if($email > 0){
		$extra_sql = $wpdb->prepare(" WHERE ID = %d",  $email);
	}
	if($thread){
		$extra_sql .= " GROUP BY zbsmail_sender_thread";
	}
	if($threadID >= 0){
		$extra_sql = $wpdb->prepare(" WHERE zbsmail_sender_thread = %d",  $threadID);
	}
	if($threadID >= 0 && $userID > 0){
		$extra_sql = $wpdb->prepare(" WHERE zbsmail_target_objid = %d AND zbsmail_sender_thread = %d", $userID, $threadID);	
		$order = 'ASC';
	}
	if($star && $thread){
		$extra_sql = " WHERE zbsmail_starred = 1 GROUP BY zbsmail_sender_thread";
	}
	$limit = (int)$limit; $page = (int)$page;
	$sql = "SELECT * FROM " . $ZBSCRM_t['system_mail_hist'] . $extra_sql . " ORDER BY zbsmail_created ".$order." LIMIT $limit OFFSET $page";
	

	$r = $wpdb->get_results($sql);



	return $r;
}

function zeroBSCRM_mailDelivery_getTemplateStats($ID){
	//get our stats...
	global $wpdb, $ZBSCRM_t;
	$sql = $wpdb->prepare("SELECT count(ID) as zbs_sent, count(zbsmail_opened) as zbs_opened, count(zbsmail_clicked) as zbs_clicked, sum(zbsmail_opened) as total_opens, sum(zbsmail_clicked) as total_clicks FROM " . $ZBSCRM_t['system_mail_hist'] . " WHERE zbsmail_type = %d", $ID);
	$r = $wpdb->get_results($sql);

	if(is_array($r) && $r[0]->zbs_sent > 0){
		$sent = $r[0]->zbs_sent;
		$open = round(100*($r[0]->zbs_opened / $r[0]->zbs_sent),0);
		$click = round(100*($r[0]->zbs_clicked / $r[0]->zbs_sent),0);
		esc_html_e($sent . " SENT, ".$open."% OPENED", 'zero-bs-crm');
	}else{
		esc_html_e("0 SENT, 0% OPENED", 'zero-bs-crm');		
	}
}

function zeroBSCRM_get_email_status($ID){
	//gets whether an email is active or not (i.e. client portal)
	global $wpdb, $ZBSCRM_t;
	$sql = $wpdb->prepare("SELECT zbsmail_active FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d", $ID);
	$r = $wpdb->get_results($sql);

	if ( isset( $r[0] ) && $r[0]->zbsmail_active == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- strict comparison breaks functionality.
		return true;
	}else{
		return false;
	}
}

//gets an email line based on a passed hash
function zeroBSCRM_mailTracking_getEmailFromHash($hash=''){
	
	global $wpdb, $ZBSCRM_t;
	$sql = $wpdb->prepare("SELECT * FROM " . $ZBSCRM_t['system_mail_hist'] . " WHERE zbsmail_hash = %s", $hash);
	$r = $wpdb->get_row($sql,'ARRAY_A');

	if (is_array($r)) return $r;

	return false;

}


/* ======================================================
  / Email tracking functions
   ====================================================== */
