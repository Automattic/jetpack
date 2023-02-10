<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



/* ======================================================
   DB GENERIC/OBJ Helpers (not DAL GET etc.)
   ====================================================== */

function zeroBSCRM_getMailDeliveryAccs(){

  $zbsSMTPAccs = zeroBSCRM_getSetting('smtpaccs');
  if (!is_array($zbsSMTPAccs)) $zbsSMTPAccs = array();

  return $zbsSMTPAccs;

}

function zeroBSCRM_getMailDeliveryDefault(){

  return zeroBSCRM_getSetting('smtpaccsdef');

}

// NOTE a number of these fields are now dummy (not used)
// WH has refined func below.
/*
function zeroBSCRM_insertEmailTemplate($ID=-1,$from_name='',$from_address='',$reply_to='', $cc='', $bcc='',$subject='',$content='',$active=0){
	global $wpdb, $ZBSCRM_t;
          #} Add header line
          if ($wpdb->insert( 
          $ZBSCRM_t['system_mail_templates'], 
          array( 
	        'zbs_site' 				=> -1,
	        'zbs_team' 				=> -1,
	        'zbs_owner' 			=> -1,
	        'zbsmail_id' 			=> $ID,
	        'zbsmail_active' 		=> $active,
	        'zbsmail_fromname' 		=> $from_name,
	        'zbsmail_fromaddress' 	=> $from_address,
	        'zbsmail_replyto' 		=> $reply_to,
	        'zbsmail_ccto' 			=> $cc,
	        'zbsmail_bccto' 		=> $bcc,
	        'zbsmail_subject' 		=> $subject,
	        'zbsmail_body' 			=> $content,
	        'zbsmail_created' 		=> time(),
	        'zbsmail_lastupdated' 	=> time(),
          ), 
          array( 
            '%d',    //zbs_site
            '%d',    //zbs_team
            '%d',    //zbs_owner
            '%d',    //zbs_id
            '%d',    //active
            '%s',    //fromname
            '%s',    //fromaddress
            '%s',    //replyto
            '%s',    //ccto
            '%s',    //bccto
            '%s',    //subject
            '%s',    //body
            '%d',    //created
            '%d',    //lastupdated
          ) 
        ) > 0){
            // inserted, let's move on
            $newSysTemplate = $wpdb->insert_id;
        } else {

          // could not insert?!
          return false;


        }
} */
function zeroBSCRM_insertEmailTemplate($ID=-1,$deliverymethod='', $bcc='',$subject='',$content='',$active=0){
	global $wpdb, $ZBSCRM_t;
          #} Add header line
          if ($wpdb->insert( 
          $ZBSCRM_t['system_mail_templates'], 
          array( 
	        'zbs_site' 				=> -1,
	        'zbs_team' 				=> -1,
	        'zbs_owner' 			=> -1,
	        'zbsmail_id' 			=> $ID,
	        'zbsmail_active' 		=> $active,
	        'zbsmail_fromname' 		=> '',
	        'zbsmail_fromaddress' 	=> '',
	        'zbsmail_replyto' 		=> '',
	        'zbsmail_deliverymethod'=> $deliverymethod,
	        'zbsmail_ccto' 			=> '',
	        'zbsmail_bccto' 		=> $bcc,
	        'zbsmail_subject' 		=> $subject,
	        'zbsmail_body' 			=> $content,
	        'zbsmail_created' 		=> time(),
	        'zbsmail_lastupdated' 	=> time(),
          ), 
          array( 
            '%d',    //zbs_site
            '%d',    //zbs_team
            '%d',    //zbs_owner
            '%d',    //zbs_id
            '%d',    //active
            '%s',    //fromname
            '%s',    //fromaddress
            '%s',    //replyto
            '%s',    //deliverymethod
            '%s',    //ccto
            '%s',    //bccto
            '%s',    //subject
            '%s',    //body
            '%d',    //created
            '%d',    //lastupdated
          ) 
        ) > 0){
            // inserted, let's move on
            $newSysTemplate = $wpdb->insert_id;
        } else {

          // could not insert?!
          return false;
  

        }
}

// NOTE a number of these fields are now dummy (not used)
// WH has refined func below.
/*
function zeroBSCRM_updateEmailTemplate($ID=-1,$from_name='',$from_address='',$reply_to='', $cc='', $bcc='',$subject='',$content=''){

	global $wpdb, $ZBSCRM_t;

		if ($wpdb->update( 
		$ZBSCRM_t['system_mail_templates'], 
		array( 
		'zbs_site' 				=> -1,
		'zbs_team' 				=> -1,
		'zbs_owner' 			=> -1,
		'zbsmail_fromname' 		=> $from_name,
		'zbsmail_fromaddress' 	=> $from_address,
		'zbsmail_replyto' 		=> $reply_to,
		'zbsmail_ccto' 			=> $cc,
		'zbsmail_bccto' 		=> $bcc,
		'zbsmail_subject' 		=> $subject,
		'zbsmail_body' 			=> $content,
		'zbsmail_lastupdated' 	=> time(),
		), 
		array( // where
		'zbsmail_id'  => $ID,
		),
		array( 
		'%d',    //zbs_site
		'%d',    //zbs_team
		'%d',    //zbs_owner
		'%s',    //fromname
		'%s',    //fromaddress
		'%s',    //replyto
		'%s',    //ccto
		'%s',    //bccto
		'%s',    //subject
		'%s',    //body
		'%d',    //lastupdated
		),
		array(
		'%d'
		)
		) !== false){


		} else {
		return false;

		}
}

*/

function zeroBSCRM_updateEmailTemplate($ID=-1,$deliverymethod='', $bcc='',$subject='',$content=''){

	global $wpdb, $ZBSCRM_t;

		if ($wpdb->update( 
		$ZBSCRM_t['system_mail_templates'], 
		array( 
		'zbs_site' 				=> -1,
		'zbs_team' 				=> -1,
		'zbs_owner' 			=> -1,
		'zbsmail_deliverymethod'=> $deliverymethod,
		'zbsmail_bccto' 		=> $bcc,
		'zbsmail_subject' 		=> $subject,
		'zbsmail_body' 			=> $content,
		'zbsmail_lastupdated' 	=> time(),
		), 
		array( // where
		'zbsmail_id'  => $ID,
		),
		array( 
		'%d',    //zbs_site
		'%d',    //zbs_team
		'%d',    //zbs_owner
		'%s',    //deliverymethod
		'%s',    //bccto
		'%s',    //subject
		'%s',    //body
		'%d',    //lastupdated
		),
		array(
		'%d'
		)
		) !== false){


		} else {
		return false;

		}
}



function zeroBSCRM_mailTemplate_exists($ID){
	global $wpdb, $ZBSCRM_t;
	
	$ID = (int)$ID;

	$sql = $wpdb->prepare("SELECT zbsmail_id FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d", $ID);
	$r = $wpdb->get_results($sql);
	return count($r);
}

// Returns the total count of mail templates
function zeroBSCRM_mailTemplate_count(){
	global $wpdb, $ZBSCRM_t;
	return $wpdb->get_var("SELECT COUNT(zbsmail_id) FROM " . $ZBSCRM_t['system_mail_templates']);
}


function zeroBSCRM_mailTemplate_get($ID=-1){
	global $wpdb, $ZBSCRM_t;

	$ID = (int)$ID;

	if($ID > 0){
		$sql = $wpdb->prepare("SELECT * FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d",$ID);
		return zeroBSCRM_mailTemplate_tidy($wpdb->get_row($sql));
	}else{
		return false;
	}
}

/**
 * tidy's the object from wp db into clean array
 * Especially necessary so we can stripslashes.
 * WH Note: For speed today, am just going to override that which need it. These hsould all be proper tidy_ funcs eventually :(
 * Hope MS does in future.
 *
 * @param array $obj (DB obj)
 *
 * @return array (clean obj)
 */
function zeroBSCRM_mailTemplate_tidy($obj=false){


	if (isset($obj->ID)){

		// these need escaping
		$obj->zbsmail_fromname = zeroBSCRM_stripSlashes($obj->zbsmail_fromname,true);
		$obj->zbsmail_subject = zeroBSCRM_stripSlashes($obj->zbsmail_subject,true);
		$obj->zbsmail_body = zeroBSCRM_stripSlashes($obj->zbsmail_body,true);

	}

	return $obj;

}


function zeroBSCRM_mailTemplate_getAll(){
	global $wpdb, $ZBSCRM_t;
	$sql = "SELECT zbsmail_id, zbsmail_active FROM " . $ZBSCRM_t['system_mail_templates'];
	$r = $wpdb->get_results($sql);
	return $r;
}

function zeroBSCRM_mailTemplate_getSubject($ID){
	//used for system emails only
	global $wpdb, $ZBSCRM_t;
	$sql = $wpdb->prepare("SELECT zbsmail_subject FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d", $ID);
	/* $r = $wpdb->get_results($sql);
	if(count($r) > 0){
		return $r[0]->zbsmail_subject;
	}else{
		return false;
	} */
	return zeroBSCRM_stripSlashes($wpdb->get_var($sql));
}

function zeroBSCRM_mailTemplate_getMailDelMethod($ID){
	//used for system emails only
	global $wpdb, $ZBSCRM_t;
	$sql = $wpdb->prepare("SELECT zbsmail_deliverymethod FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d", $ID);
	return $wpdb->get_var($sql);
}

/* ======================================================
	ZBS Template List Population	
   ====================================================== */


//MS function which populates the database with the standard HTML templates for each system email
//listing the templates into an array + our recommended content
   // WH 2.97.4 - added $wpdb->delete's below, as somehow someone was re-firing this func a second time
   // ... not really an elegant way of ensuring templates are there in the db. Leaving for now
   // ... but when more free time, clean up this routine, bringing in all templates :)
function zeroBSCRM_populateEmailTemplateList(){
	
	global $wpdb,$ZBSCRM_t;  //need to define this if using it below.. how did this slip through checks?
	#IDs 
	#0 - the template itself....  can allow this to be edited.. or upsell it to be edited :/ 
	$ID = 0;

	#} default is admin email and CRM name	
	//now all done via zeroBSCRM_mailDelivery_defaultFromname
	$from_name = zeroBSCRM_mailDelivery_defaultFromname();

	/* This wasn't used in end, switched to default mail delivery opt 
	$from_address = zeroBSCRM_mailDelivery_defaultEmail();; //default WordPress admin email ?
	$reply_to = '';
	$cc = ''; */
	$deliveryMethod = zeroBSCRM_getMailDeliveryDefault(); 


	$bcc = '';

	#} The email stuff...
	$subject = "";
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('maintemplate');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}

	#IDs 
	#1 - Client Portal Welcome Email
	$ID = 1;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("Your Client Portal", 'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('clientportal');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}

	#IDs 
	#2 - Quote Accepted Email
	$ID = 2;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("Quote Accepted",'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('quoteaccepted');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}


	#IDs 
	#3 - Email Invoice 
	$ID = 3;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("You have received an Invoice",'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('invoicesent');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}


	#IDs 
	#4 - New Quote 
	$ID = 4;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("You have received a new Proposal",'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('quotesent');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}

	#IDs
	#5 - Event Notification (leave for now)...

	$ID = 5;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("Your Event starts soon", 'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('eventnotification');

	// BRUTAL DELETE old one (avoids dupes)
	$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	}

	#6 - Client Portal Password Reset
	// this will be added via a migration for those who've not already got it :)
	/* just add via migration :) 2962
	$ID = 6;
	$reply_to = '';
	$cc = '';
	$bcc = '';

	#} The email stuff...
	$subject = __("Your Client Portal Password", 'zero-bs-crm');
	$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('clientportalpwreset');

	$active = 1; //1 = true..
	if(zeroBSCRM_mailTemplate_exists($ID) == 0){
		$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
		//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
		zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
	} */
}
/* ======================================================
	/ Mail Template DAL
   ====================================================== */