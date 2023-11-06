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


   /*

		This file contains functions from DAL1 & DAL2 which have been translated into DAL2.5
		This, along with DAL2, provide backward compatability with all other extensions etc.
		- Note: First half of this file (customer funcs etc.) is the same as DAL2.LegacySupport.php first half, but going forwards, we only maintain this file.

		Leaving peeps in a few states (until migrated):
		1) Still on DAL1, using DAL.LegacySuport.php
			-> Requires Migration ->
		2) Still on DAL2, using DAL2.PHP, DAL.LegacySupport.php & DAL2.LegacySupport.php, & loading DAL objs but not using (except for contacts, logs, segments)
			-> Requires Migration ->
		3) Up to date fully, using DAL2.Helpers.php & fully using DAL objs.

		.. fresh installs will silently migrate up to 3), older ones will manually have to run the wizs

   */



// ====================================================================================================================================
// ====================================================================================================================================
// ==================== DAL 2.0 FUNCS =================================================================================================
// ====================================================================================================================================
// ====================================================================================================================================
   

/* ======================================================
  	Unchanged DAL2->3 (Mostly customer/contact + log relatead)
   ====================================================== */

function zeroBS_getCustomer($cID=-1,$withInvoices=false,$withQuotes=false,$withTransactions=false){

	global $zbs; return $zbs->DAL->contacts->getContact($cID,array(

			// with what?
			'withCustomFields'	=> true,
			'withQuotes' 		=> $withQuotes,
			'withInvoices' 		=> $withInvoices,
			'withTransactions' 	=> $withTransactions,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)
			
			));

}

function zeroBS_getCustomerName($contactID=-1){

	global $zbs; return $zbs->DAL->contacts->getContactFullNameEtc($contactID,array(),array(
			'incFirstLineAddr' 	=> true,
			'incID'				=> true
			));

}
function zeroBS_customerName($contactID='',$contactArr=false,$incFirstLineAddr=true,$incID=true){
	
	global $zbs; return $zbs->DAL->contacts->getContactFullNameEtc($contactID,$contactArr,array(
			'incFirstLineAddr' 	=> $incFirstLineAddr,
			'incID'				=> $incID
			));
	
	
}
function zeroBS_getCustomerNameShort($contactID=-1){

	global $zbs; return $zbs->DAL->contacts->getContactFullNameEtc($contactID,array(),array(
			'incFirstLineAddr' 	=> false,
			'incID'				=> false
			));
}

function zeroBS_customerAddr($contactID='',$contactArr=array(),$addrFormat = 'short',$delimiter= ', '){
	
	global $zbs; return $zbs->DAL->contacts->getContactAddress($contactID,array(),array(
			'addrFormat'		=> $addrFormat,
			'delimiter'			=> $delimiter
			));

}

#} Returns a str of address, ($third param = 'short','full')
#} Pass an ID OR a customerMeta array (saves loading ;) - in fact doesn't even work with ID yet... lol)
function zeroBS_customerSecondAddr($contactID='',$contactArr=array(),$addrFormat = 'short',$delimiter= ', '){
	
	global $zbs; return $zbs->DAL->contacts->getContact2ndAddress($contactID,array(),array(
			'addrFormat'		=> $addrFormat,
			'delimiter'			=> $delimiter
			));

}

function zeroBS_customerEmail($contactID='',$contactArr=false){
	
	global $zbs; return $zbs->DAL->contacts->getContactEmail($contactID);

}

/**
 * Retrieves all emails againast a contact
 *
 * @var int contactID
 */
function zeroBS_customerEmails($contactID=''){
	
	global $zbs; return $zbs->DAL->contacts->getContactEmails($contactID);

}

function zeroBS_customerMobile($contactID='',$contactArr=false){
	
	global $zbs; return $zbs->DAL->contacts->getContactMobile($contactID);

}


function zeroBS_customerAvatar($contactID='',$contactArr=false){
	
	global $zbs; return $zbs->DAL->contacts->getContactAvatar($contactID);

}

function zeroBS_customerAvatarHTML($contactID='',$contactArr=false,$size=100,$extraClasses=''){
	
	global $zbs; return $zbs->DAL->contacts->getContactAvatarHTML($contactID,$size,$extraClasses);

}


function zeroBS_customerCountByStatus($status=''){
	
	global $zbs; return $zbs->DAL->contacts->getContactCount(array(
			'withStatus' => $status,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

}
function zeroBS_customerCount(){

	global $zbs; return $zbs->DAL->contacts->getContactCount(array('ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

}

#} Retrieves company post id if associated with customer
// note 2.5+ can have multiple co's, but this'll only return first ID, need to move away from this
function zeroBS_getCustomerCompanyID($cID=-1){

	global $zbs; $coArr = $zbs->DAL->contacts->getContactCompanies($cID);
	if (is_array($coArr) && count($coArr) > 0) return $coArr[0]['id'];

	return false;
}

#} sets company id associated with customer (note this'll override any existing val)
// note 2.5+ can have multiple co's, but this'll only add first ID, need to move away from this
function zeroBS_setCustomerCompanyID($cID=-1,$coID=-1){

	global $zbs;
	if (!empty($cID) && !empty($coID)) {
							
		return $zbs->DAL->contacts->addUpdateContactCompanies(array(
					'id' 			=> $cID,
					'companyIDs' 	=> array($coID)));
						
	}

	return false;
}
function zbsCRM_addUpdateCustomerCompany($customerID=-1,$companyID=-1){

	global $zbs;
	if (!empty($customerID) && !empty($companyID)) {
							
		return $zbs->DAL->contacts->addUpdateContactCompanies(array(
					'id' 			=> $customerID,
					'companyIDs' 	=> array($companyID)));
						
	}

	return false;

}

function zeroBS_getCustomerCount($companyID=false){

	global $zbs;

	if (!empty($companyID)){

		return $zbs->DAL->contacts->getContactCount(array('inCompany' => $companyID,'ignoreowner'=>true));

	} else {

		return $zbs->DAL->contacts->getContactCount(array('ignoreowner'=>true));

	}

	return 0;
}



#} Retrieves wp id for a customer
function zeroBS_getCustomerWPID($cID=-1){

	global $zbs; return $zbs->DAL->contacts->getContactWPID($cID);

}

#} Retrieves wp id for a customer
function zeroBS_getCustomerIDFromWPID($wpID=-1){

	global $zbs; return $zbs->DAL->contacts->getContact(-1,array(
			'WPID'=>$wpID,
			'onlyID'=>1,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

}

#} Sets a WP id against a customer
function zeroBS_setCustomerWPID($cID=-1,$wpID=-1){

	global $zbs; return $zbs->DAL->contacts->addUpdateContactWPID(array('id'=>$cID,'WPID'=>$wpID));

}

function zeroBSCRM_getCustomerTags($hide_empty=false){
	
	global $zbs; 
	
	return $zbs->DAL->getTagsForObjType(array(
			'objtypeid'=>ZBS_TYPE_CONTACT,
			'excludeEmpty'=>$hide_empty,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));
	
}

// either or 
function zeroBSCRM_setContactTags($cID=-1,$tags=array(),$tagIDs=array(),$mode='replace'){

	if ($cID > 0){

		$args = array(

            'id'            => $cID,
            'mode'          => $mode
			);

		// got tags?
		if ( is_array( $tags ) && ! empty( $tags ) ) {
			$args['tags'] = $tags;
		} elseif ( is_array( $tagIDs ) && ! empty( $tagIDs ) ) {
			$args['tagIDs'] = $tagIDs;
		} else {
			return false;
		}

		global $zbs;

		return $zbs->DAL->contacts->addUpdateContactTags($args);

	}

	return false;

}
function zeroBSCRM_getContactTagsArr($hide_empty=true){
	
	global $zbs; 
	
	return $zbs->DAL->getTagsForObjType(array(
		'objtypeid'=>ZBS_TYPE_CONTACT,
		'excludeEmpty'=>$hide_empty,
		'withCount' => true,
		'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));
	
}
function zeroBS_getCustomerIcoHTML($cID=-1,$additionalClasses=''){

	$thumbHTML = '<i class="fa fa-user" aria-hidden="true"></i>';

	global $zbs; $thumbURL = $zbs->DAL->contacts->getContactAvatarURL($cID);
	if (!empty($thumbURL)) {

		$thumbHTML = '<img src="'.$thumb_url.'" alt="" />';

	}

	return '<div class="zbs-co-img '.$additionalClasses.'">'.$thumbHTML.'</div>';
}


function zeroBS_getCustomerIDWithEmail($custEmail=''){
	/**
	 *  @var $custEmail the customer email you want to check if a contact exists for
	 * 
	 *  @return returns return $potentialRes->ID from $zbs->DAL->contacts->getContact()..
	 * 
	 */

	global $zbs; 
	return $zbs->DAL->contacts->getContact(-1,array(
			'email'=>$custEmail,
			'onlyID'=>true,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

}


function zeroBS_searchCustomers($args=array(),$withMoneyData=false){

	// here I've shoehorned old into new,
	// NOTE: 
	// this WONT return same exact fields

	$args['ignoreowner'] = zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT);

	if ($withMoneyData){

			$args['withInvoices'] = true;
			$args['withTransactions'] = true;
	}

	global $zbs; return $zbs->DAL->contacts->getContacts($args);
}

/**
 * Enables or disables the client portal access for a contact, by ID.
 *
 * @param int    $contact_id The id of the CRM Contact to be enabled or disabled.
 * @param string $enable_or_disable String indicating if the selected contact should be enabled or disabled. Use 'disable' to disable, otherwise the contact will be enabled.
 *
 * @return bool True in case of success, false otherwise.
 */
function zeroBSCRM_customerPortalDisableEnable( $contact_id = -1, $enable_or_disable = 'disable' ) {
	global $zbs;

	if ( zeroBSCRM_permsCustomers() && ! empty( $contact_id ) ) {
		// Verify this user can be changed.
		// Has to have singular role of `zerobs_customer`. This helps to avoid users changing each others accounts via crm.
		$wp_user_id  = zeroBSCRM_getClientPortalUserID( $contact_id );
		$user_object = get_userdata( $wp_user_id );
		if ( jpcrm_role_check( $user_object, array(), array(), array( 'zerobs_customer' ) ) ) {
			if ( $enable_or_disable === 'disable' ) {
				return $zbs->DAL->updateMeta( ZBS_TYPE_CONTACT, $contact_id, 'portal_disabled', true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			} else {
				return $zbs->DAL->updateMeta( ZBS_TYPE_CONTACT, $contact_id, 'portal_disabled', false ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			}
		}
	}

	return false;
}


/*
 * Resets the password for client portal access for a contact, by ID
 */
function zeroBSCRM_customerPortalPWReset( $contact_id=-1 ) {

	global $zbs;

	if ( zeroBSCRM_permsCustomers() && !empty( $contact_id ) ) {
		
		$wp_user_id = zeroBS_getCustomerWPID( $contact_id );
		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$contact_email = $contact['email'];
    $user_object = get_userdata( $contact_email );

		if ( $wp_user_id > 0 && !empty( $contact_email ) ) {

			// Verify this user can be changed
			// (Has to have singular role of `zerobs_customer`. This helps to avoid users resetting each others passwords via crm)
    	if ( jpcrm_role_check( $user_object, array(), array(), array( 'zerobs_customer' ) ) ) {

				return false;

			}

			// generate new pw
			$new_password = wp_generate_password( 12, false );

			// update
			wp_set_password( $new_password, $wp_user_id );

			// email?

			// check if the email is active..
			$active = zeroBSCRM_get_email_status( ZBSEMAIL_CLIENTPORTALPWREST );

			if ( $active ) {

				// send welcome email (tracking will now be dealt with by zeroBSCRM_mailDelivery_sendMessage)

				// ==========================================================================================
				// =================================== MAIL SENDING =========================================

				// generate html
				$emailHTML = zeroBSCRM_Portal_generatePWresetNotificationHTML( $new_password, true, $contact );

				// build send array
				$mailArray = array(
					'toEmail'  => $contact_email,
					'toName'   => '',
					'subject'  => zeroBSCRM_mailTemplate_getSubject(ZBSEMAIL_CLIENTPORTALPWREST),
					'headers'  => zeroBSCRM_mailTemplate_getHeaders(ZBSEMAIL_CLIENTPORTALPWREST),
					'body'     => $emailHTML,
					'textbody' => '',
					'options'  => array(
						'html'     => 1
					),
					'tracking' => array( 
						// tracking :D (auto-inserted pixel + saved in history db)
						'emailTypeID'     => ZBSEMAIL_CLIENTPORTALPWREST,
						'targetObjID'     => $contact_id,
						'senderWPID'      => -10,
						'associatedObjID' => -1, // none
					),
				);

				// Sends email, including tracking, via setting stored route out, (or default if none)
				// and logs trcking :)

				// discern del method
				$mailDeliveryMethod = zeroBSCRM_mailTemplate_getMailDelMethod(ZBSEMAIL_CLIENTPORTALPWREST);
				if (!isset($mailDeliveryMethod) || empty($mailDeliveryMethod)) $mailDeliveryMethod = -1;

				// send
				$sent = zeroBSCRM_mailDelivery_sendMessage($mailDeliveryMethod,$mailArray);


				// =================================== / MAIL SENDING =======================================
				// ==========================================================================================

			}


			return $new_password;

		} // if wpid

	}

	return false;

}

// Returns bool of whether or not a specific customer can access client portal
function zeroBSCRM_isCustomerPortalDisabled( $contact_id=-1 ) {

	// No Contact ID, no entry, unless Admin or Jetpack CRM Admin we can let those in.
	$contact_id = (int)$contact_id;
	if ( $contact_id < 1 ) {
		if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
			return false;
		}
		return true;
	} else {

		// return check
		global $zbs;
		return $zbs->DAL->contacts->getContactMeta( $contact_id, 'portal_disabled' );

	}

	// default = closed door
	return true;

}

// loads customer record + creates a portal user for record
// replaces zeroBSCRM_genPortalUser
function zeroBSCRM_createClientPortalUserFromRecord($cID=-1){

	if (!empty($cID)){

		global $zbs;

		// existing? 
		$existing = zeroBSCRM_getClientPortalUserID($cID);
		if (!empty($existing) || $existing > 0) return false;

		$email = $zbs->DAL->contacts->getContactEmail($cID);
		$contact = $zbs->DAL->contacts->getContact($cID,array('fields'=>array('zbsc_fname','zbsc_lname')));
		$fname = ''; if (isset($contact['fname']) && !empty($contact['fname'])) $fname = $contact['fname'];
		$lname = ''; if (isset($contact['lname']) && !empty($contact['lname'])) $lname = $contact['lname'];

		// fire
		return zeroBSCRM_createClientPortalUser($cID,$email,12,$fname,$lname);

	} 

	return false;

}

function zeroBSCRM_getClientPortalUserID($cID=-1){

		if (!empty($cID)){

			global $zbs;

			//first lets check if a user already exists with that email..
			$email = $zbs->DAL->contacts->getContactEmail($cID);
			if (!empty($email)){
				$userID = email_exists($email);
				if($userID != null){
					//update_post_meta($cID, 'zbs_portal_wpid', $userID);
					$zbs->DAL->contacts->addUpdateContactWPID(array('id'=>$cID,'WPID'=>$userID));
				}
			}else{
				//no email in meta, but might be linked?
				//$userID = get_post_meta($cID, 'zbs_portal_wpid', true);
				$userID = $zbs->DAL->contacts->getContactWPID($cID);
			}
        return $userID;
    }
    return false;
}

function zeroBSCRM_getClientPortalUserWPObj($cID=-1){

		if (!empty($cID)){

			global $zbs;

        	//$user_id = zeroBSCRM_getClientPortalUserID($cID);
        	$user_id = $zbs->DAL->contacts->getContactWPID($cID);

        return new WP_User( $user_id );

    }

    return false;

}

// Function to update the zbs<->wp user link
function zeroBSCRM_setClientPortalUser($cID=-1,$wpUserID=-1){

	if ($cID > 0 && $wpUserID > 0){

		global $zbs;
		$zbs->DAL->contacts->addUpdateContactWPID(array('id'=>$cID,'WPID'=>$wpUserID));
		
		return true;

	}

	return false;

}

function zeroBSCRM_createClientPortalUser( $cID=-1, $email='', $passwordLength=12, $first_name='', $last_name='' ) {

	// fail if bad params
	if ( empty( $cID ) || empty( $email ) || !zeroBSCRM_validateEmail( $email ) ) {
		return false;
	}

	// fail if email already exists as a WP user
	if ( email_exists( $email ) ) {
		return false;
	}

	global $zbs;

	$password = wp_generate_password( $passwordLength, false );

	// organise WP user details
	$wpUserDeets = array(
		'user_email'  => $email,
		'user_login'  => $email,
		'user_pass'   => $password,
		'nickname'    => $email,
		'first_name'  => empty( $first_name ) ? '' : $first_name,
		'last_name'   => empty( $last_name ) ? '' : $last_name,
	);

	// create WP user
	$user_id = wp_insert_user( $wpUserDeets );

	// retrieve created user
	$user = new WP_User( $user_id );

	// fail if the user doesn't exist
	if ( !$user->exists() ) {
		return false;
	}

	// link WP user ID to contact
	$zbs->DAL->contacts->addUpdateContactWPID( array( 'id' => $cID, 'WPID' => $user_id ) );

	// any extra assigned role? (from settings)
	$extraRole = zeroBSCRM_getSetting( 'portalusers_extrarole' );

	// add role(s)
	if ( ! empty( $extraRole ) ) {
		// Set the WP role first, then the JPCRM role
		$user->set_role( $extraRole );
		$user->add_role( 'zerobs_customer' );
	} else {
		$user->set_role( 'zerobs_customer' );
	}

	// check if the email template is active, and if it is, send...
	$active = zeroBSCRM_get_email_status(ZBSEMAIL_CLIENTPORTALWELCOME);
	if ( $active ){

		// generate html
		$emailHTML = zeroBSCRM_Portal_generateNotificationHTML( $password, true, $email, $cID );

		// build send array
		$mailArray = array(
			'toEmail'   => $email,
			'toName'    => '',
			'subject'   => zeroBSCRM_mailTemplate_getSubject( ZBSEMAIL_CLIENTPORTALWELCOME ),
			'headers'   => zeroBSCRM_mailTemplate_getHeaders( ZBSEMAIL_CLIENTPORTALWELCOME ),
			'body'      => $emailHTML,
			'textbody'  => '',
			'options'   => array(
				'html'      => 1
			),
			'tracking'  => array( 
				// tracking :D (auto-inserted pixel + saved in history db)
				'emailTypeID'     => ZBSEMAIL_CLIENTPORTALWELCOME,
				'targetObjID'     => $cID,
				'senderWPID'      => -10,
				'associatedObjID' => -1 // none
			)
		);

		// Sends email, including tracking, via setting stored route out, (or default if none)
		// and logs tracking :)

		// discern del method
		$mailDeliveryMethod = zeroBSCRM_mailTemplate_getMailDelMethod( ZBSEMAIL_CLIENTPORTALWELCOME );
		if ( !isset( $mailDeliveryMethod ) || empty( $mailDeliveryMethod ) ) {
			$mailDeliveryMethod = -1;
		}

		// send
		$sent = zeroBSCRM_mailDelivery_sendMessage( $mailDeliveryMethod, $mailArray );

	}

	// IA
	zeroBSCRM_FireInternalAutomator(
		'clientwpuser.new',
		array(
			'id'        => $user_id,
			'againstid' => $cID,
			'userEmail' => $email,
		)
	);

}



// THIS IS NOW DEPRECATED db2+
// (META used to be all deets, it's now normal deets - as table)
#} Quick wrapper to future-proof.
#} Should later replace all get_post_meta's with this
function zeroBS_getCustomerMeta($cID=-1){

	// zeroBSCRM_DEPRECATEDMSG('Use of function: zeroBS_getCustomerMeta');

	global $zbs;

	//if (!empty($cID)) return get_post_meta($cID, 'zbs_customer_meta', true);
	// Return contact directly DB2+
	if (!empty($cID)) return $zbs->DAL->contacts->getContact($cID,array('ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

	return false;

}
// generates a 'demo' customer object (excluding custom fields)
function zeroBS_getDemoCustomer(){

	global $zbs, $zbsCustomerFields;

	$ret = array();

	$demoData = array(

		'status'           => array( 'Lead', 'Customer' ),
		'prefix' => array('Mr', 'Mrs', 'Miss'),
		'fname' => array('John','Jim','Mike','Melvin','Janet','Jennifer','Judy','Julie'),
		'lname' => array('Smith','Jones','Scott','Filbert'),
		'fullname' => array('John Smith','Jim Ellison','Mike Myers','Melvin Malcolms'),
		'addr1' => array('101 Red Street','26 Somerset Street','1 London Road'),
		'addr2' => array('Winchester','Leeds Village','Webleck'),
		'city' => array('London','Los Angeles','Leeds','Exeter'),
		'county' => array('London','Hertfordshire','California','Montana'),
		'postcode' => array('A1 1XU','AO12 3RR','E1 3XG','M1 3LF'),
		'secaddr_addr1' => array('101 Red Street','26 Somerset Street','1 London Road'),
		'secaddr_addr2' => array('Winchester','Leeds Village','Webleck'),
		'secaddr_city' => array('London','Los Angeles','Leeds','Exeter'),
		'secaddr_county' => array('London','Hertfordshire','California','Buckinghamshire'),
		'secaddr_postcode' => array('A1 1XU','AO12 3RR','E1 3XG','M1 3LF'),
		// dirty repetition...
		'secaddr1' => array('101 Red Street','26 Somerset Street','1 London Road'),
		'secaddr2' => array('Winchester','Leeds Village','Webleck'),
		'seccity' => array('London','Los Angeles','Leeds','Exeter'),
		'seccounty' => array('London','Hertfordshire','California','Buckinghamshire'),
		'secpostcode' => array('A1 1XU','AO12 3RR','E1 3XG','M1 3LF'),
		'hometel' => array('01010 123 345', '01234 546 789'),
		'worktel' => array('01010 123 345', '01234 546 789'),
		'mobtel' => array('07812 345 678'),
		'email' => array('random@email.com','not.real@gmail.com','nonsense@email.com')

	);

	foreach ($zbsCustomerFields as $fK => $fV){

		$ret[$fK] = '';
		if (isset($demoData[$fK])) $ret[$fK] = $demoData[$fK][mt_rand(0, count($demoData[$fK]) - 1)];

	}

	// add fullname
	$ret['fullname'] = $demoData['fullname'][mt_rand(0, count($demoData['fullname']) - 1)];

	// fill in some randoms
	$ret['status'] = $demoData['status'][mt_rand(0, count($demoData['status']) - 1)];

	return $ret;

}
function zeroBS_getCustomerExtraMetaVal($cID=-1,$extraMetaKey=false){

	if (!empty($cID) && !empty($extraMetaKey)) {

		global $zbs;

		// quick
		$cleanKey = strtolower(str_replace(' ','_',$extraMetaKey));

		//return get_post_meta($cID, 'zbs_customer_extra_'.$cleanKey, true);
		return $zbs->DAL->contacts->getContactMeta($cID,'extra_'.$cleanKey);

	}

	return false;

}

#} sets an extra meta val
function zeroBS_setCustomerExtraMetaVal($cID=-1,$extraMetaKey=false,$extraMetaVal=false){

	if (!empty($cID) && !empty($extraMetaKey)) {

		// quick
		$cleanKey = strtolower(str_replace(' ','_',$extraMetaKey));

		global $zbs;

		//return update_post_meta($cID, 'zbs_customer_extra_'.$cleanKey, $extraMetaVal);
		return $zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$cID,'extra_'.$extraMetaKey,$extraMetaVal);

	}

	return false;

}
function zeroBS_getCustomerSocialAccounts($cID=-1){

	global $zbs;

	//if (!empty($cID)) return get_post_meta($cID, 'zbs_customer_socials', true);
	if (!empty($cID)) return $zbs->DAL->contacts->getContactSocials($cID);

	return false;
}
function zeroBS_updateCustomerSocialAccounts($cID=-1,$accArray=array()){

	if (!empty($cID) && is_array($accArray)){ //return update_post_meta($cID, 'zbs_customer_socials', $accArray);
		
		global $zbs;
		#} Enact
		return $zbs->DAL->contacts->addUpdateContact(array(
			'id'			=>	$cID,
			'limitedFields'	=>array(
				array('key'=>'zbsc_tw','val'=>$accArray['tw'],'type'=>'%s'),
				array('key'=>'zbsc_li','val'=>$accArray['li'],'type'=>'%s'),
				array('key'=>'zbsc_fb','val'=>$accArray['fb'],'type'=>'%s')
				)));

	}

	return false;
}


function zeroBSCRM_getCustomerFiles($cID=-1){

		if (!empty($cID)){

			global $zbs;

	        //return get_post_meta($cID, 'zbs_customer_files', true);
			//return $zbs->DAL->contacts->getContactMeta($cID,'files');
			return zeroBSCRM_files_getFiles('customer',$cID);

	    }

    return false;

}
// maintainIndexs keeps the files original index .e.g. 1,2 so that can match when doing portal stuff (as we're using legacy indx)
function zeroBSCRM_getCustomerPortalFiles($cID=-1){

		if (!empty($cID)){

			global $zbs;

	        //return get_post_meta($cID, 'zbs_customer_files', true);
			//return $zbs->DAL->contacts->getContactMeta($cID,'files');
			$ret = array(); $files = zeroBSCRM_files_getFiles('customer',$cID);
			$fileIndex = 0;
			if (is_array($files)) foreach ($files as $f){
			
				// APPROVED portal files
				if (isset($f['portal']) && $f['portal'] == 1) $ret[$fileIndex] = $f;

				$fileIndex++;

			}
			return $ret;

	    }

    return false;

}
function zeroBSCRM_updateCustomerFiles($cID=-1,$filesArray=false){

		if (!empty($cID)){

			global $zbs;

	        //return update_post_meta($cID, 'zbs_customer_files', $filesArray); 
			return $zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$cID,'files',$filesArray);

	    }

    return false;

}

#} As of v1.1 can pass searchphrase
#} As of v1.2 can pass tags
#} As of v2.2 has associated func getCustomersCountIncParams for getting the TOTAL for a search (ignoring pages)
#} As of v2.2 can also get ,$withTags=false,$withAssigned=false,$withLastLog=false
#} As of v2.2 can also pass quickfilters (Damn this has got messy): lead, customer, over100, over200, over300, over400, over500
	// ... in array like ('lead')
#} 2.52+ AVOID using this, call getContacts directly plz, this is just for backward compatibility :)
function zeroBS_getCustomers(
		$withFullDetails=false, 
		$perPage=10,
		$page=0,
		$withInvoices=false,
		$withQuotes=false,
		$searchPhrase='',
		$withTransactions=false,
		$argsOverride=false,
		$companyID=false,
		$hasTagIDs='',
		$inArr = '',
		$withTags=false,
		$withAssigned=false,
		$withLastLog=false,
		$sortByField='ID',
		$sortOrder='DESC',
		$quickFilters=false,
		$ownedByID = false,
		$withValues=false
		){
	 /* DAL3.0: $withValues */

	#} Query Performance index
	#global $zbsQPI; if (!isset($zbsQPI)) $zbsQPI = array();
	#$zbsQPI['retrieveCustomers2getCustomers'] = zeroBSCRM_mtime_float();

	// $withFullDetails = irrelevant with new DB2 (always returns)
	// $argsOverride CAN NO LONGER WORK :)
	if ($argsOverride !== false) zeroBSCRM_DEPRECATEDMSG('Use of $argsOverride in zeroBS_getCustomers is no longer relevant (DB2)');

	global $zbs;

		// this needs translating for new dbfields:
		// FOR NOW
		if ($sortByField == 'post_id') $sortByField = 'ID';
		if ($sortByField == 'post_title') $sortByField = 'zbsc_lname';
		if ($sortByField == 'post_excerpt') $sortByField = 'zbsc_lname';
		
		/* we need to prepend zbsc_ when not using cf */
	    $custFields = $zbs->DAL->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_CONTACT));

		// needs to check if field name is custom field:
		$sortIsCustomField = false; if (is_array($custFields) && array_key_exists($sortByField,$custFields)) $sortIsCustomField = true;
		if (!$sortIsCustomField && $sortByField != 'ID') $sortByField = 'zbsc_'.$sortByField;


		// catch empties
		if (empty($sortByField)) $sortByField = 'ID';
		if (empty($sortOrder)) $sortOrder = 'desc';

		// legacy from dal1
		$actualPage = $page;
		if (!$zbs->isDAL2()) $actualPage = $page-1;  // only DAL1 needed this
		if ($actualPage < 0) $actualPage = 0;

		// make ARGS
		$args = array(

			// Search/Filtering (leave as false to ignore)
			'searchPhrase' => $searchPhrase,
			'inCompany'		=> $companyID,
			'inArr'			=> $inArr,
			'quickFilters'	=> $quickFilters,
			'isTagged'		=> $hasTagIDs,
			'ownedBy' 		=> $ownedByID,

			'withCustomFields'	=> true,
			'withQuotes' 		=> $withQuotes,
			'withInvoices' 		=> $withInvoices,
			'withTransactions' 	=> $withTransactions,
			'withLogs' 			=> false,
			'withLastLog'		=> $withLastLog,
			'withTags' 			=> $withTags,
			'withOwner' 		=> $withAssigned,
			'withValues' 		=> $withValues,

			'sortByField' 	=> $sortByField,
			'sortOrder' 	=> $sortOrder,
			'page'			=> $actualPage,
			'perPage'		=> $perPage,

			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)


		);

		// here ignore owners = true the default, because we're not really forcing ownership anywhere overall,
		// when we do, we should change this/make it check
		if ($ownedByID !== false) {

			$args['ignoreowner'] = false;

		}

		return $zbs->DAL->contacts->getContacts($args);

}

#} As of 2.2 - matches getCustomers but returns a total figure (no deets)
// NOTE, params are same except first 5 + withTransactions removed:
// $withFullDetails=false,$perPage=10,$page=0,$withInvoices=false,$withQuotes=false,$withTransactions=false,
// - trimmed returns for efficiency (is just a count really :o dirty.)
// https://codex.wordpress.org/Class_Reference/WP_Query
function zeroBS_getCustomersCountIncParams(
	$searchPhrase='',
	$argsOverride=false,
	$companyID=false, 
	$hasTagIDs='', 
	$inArr = '',
	$quickFilters=''){


	// $withFullDetails = irrelevant with new DB2 (always returns)
	// $argsOverride CAN NO LONGER WORK :)
	if ($argsOverride !== false) zeroBSCRM_DEPRECATEDMSG('Use of $argsOverride in zeroBS_getCustomersCountIncParams is no longer relevant (DB2)');

	global $zbs;

		// make ARGS
		$args = array(

			// Search/Filtering (leave as false to ignore)
			'searchPhrase' => $searchPhrase,
			'inCompany'		=> $companyID,
			'inArr'			=> $inArr,
			'quickFilters'	=> $quickFilters,
			'isTagged'		=> $hasTagIDs,

			// just count
			'count'			=>true,

			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

		);

		return (int)$zbs->DAL->contacts->getContacts($args);

}



#} same as above but wrapped in contact view link
function zeroBS_getCustomerIcoLinked($cID=-1,$incName=false,$extraClasses = '',$maxSize=100){

	$extraHTML = ''; if ($incName){

		$cName = zeroBS_getCustomerNameShort($cID);

		if (!empty($cName)) $extraHTML = '<span class="">'.$cName.'</span>';
	}

	return '<div class="zbs-co-img'.$extraClasses.'"><a href = "'. jpcrm_esc_link('view',$cID,'zerobs_customer') .'">' . zeroBS_customerAvatarHTML($cID,-1,$maxSize).'</a>'.$extraHTML.'</div>';

}


#} same as above but wrapped in contact view link + semantic ui label img link
function zeroBS_getCustomerIcoLinkedLabel($cID=-1){

	$extraHTML = ''; 
	$cName = zeroBS_getCustomerNameShort($cID);
	if (!empty($cName)) 
		$extraHTML = '<span>'.$cName.'</span>';
	else {
		$cEmail = zeroBS_customerEmail($cID);
		if (!empty($cEmail)) $extraHTML = '<span>'.$cEmail.'</span>';
	}

	$extraClasses = ' ui image label';

	return '<a href="'. jpcrm_esc_link('view',$cID,'zerobs_customer') .'" class="'.$extraClasses.'">' . zeroBS_customerAvatarHTML($cID).$extraHTML.'</a>';

}


#} same as above but with no image (for non-avatar mode)
function zeroBS_getCustomerLinkedLabel($cID=-1){

	$extraHTML = ''; 
	$cName = zeroBS_getCustomerNameShort($cID);
	if (!empty($cName)) 
		$extraHTML = '<span>'.$cName.'</span>';
	else {
		$cEmail = zeroBS_customerEmail($cID);
		if (!empty($cEmail)) $extraHTML = '<span>'.$cEmail.'</span>';
	}
	// for empties, add no
	if (empty($extraHTML)) $extraHTML = '<span>#'.$cID.'</span>';

	$extraClasses = ' ui label';

	return '<a href="'. jpcrm_esc_link('view',$cID,'zerobs_customer') .'" class="'.$extraClasses.'">' .$extraHTML.'</a>';

}


/* Centralised delete customer func, including sub-element removal */
function zeroBS_deleteCustomer($id=-1,$saveOrphans=true){

	if (!empty($id)){

		global $zbs;

		return $zbs->DAL->contacts->deleteContact(array('id'=>$id,'saveOrphans'=>$saveOrphans));

	}

	return false;
}


function zeroBS_getCustomerIDWithExternalSource($externalSource='',$externalID=''){

	global $zbs;

	#} No empties, no random externalSources :)
	if (!empty($externalSource) && !empty($externalID) && array_key_exists($externalSource,$zbs->external_sources)){

		#} If here, is legit.
		$approvedExternalSource = $externalSource;

		global $zbs;

		return $zbs->DAL->contacts->getContact(-1,array(
				'externalSource' 	=> $approvedExternalSource,
				'externalSourceUID' => $externalID,
				'onlyID'			=> true,
				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)
			));

	}


	return false;

}


function zeroBSCRM_getCustomerTagsByID($cID=-1,$justIDs=false){

		if (!empty($cID)){
		
			global $zbs;

			return $zbs->DAL->getTagsForObjID(array(
				'objtypeid'=>ZBS_TYPE_CONTACT,
				'objid'=>$cID,
				'onlyID'=>$justIDs,
				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

		}

}


// NOTE: $objType is temporary until DB2 fully rolled out all tables
function zeroBS_getOwner($objID=-1,$withDeets=true,$objType=-1,$knownOwnerID=-1){

	if ($objID !== -1 && $objType !== -1){

		$objType = jpcrm_upconvert_obj_type( $objType );

		global $zbs;
		$retObj = false;

		// if passed, save the db call
		if ($knownOwnerID > 0){

			$userIDofOwner = $knownOwnerID;

		} else {
			
			$userIDofOwner = $zbs->DAL->getObjectOwner(array(
				            'objID'         => $objID,
				            'objTypeID'       => $objType
				        ));

		}

		if (isset($userIDofOwner) && !empty($userIDofOwner)){

			// check if user can be owner (is zbs admin)
			// check on the assign, is less performance impacting
			// if (! user_can($userIDofOwner,'admin_zerobs_usr') return false;

			if ($withDeets){

				#} Retrieve owner deets
				$retObj = zeroBS_getOwnerObj($userIDofOwner);

			} else return $userIDofOwner;

		}
				
		
		return $retObj;

	} 

	return false;
}

/**
 * Retrieves the owner object based on a given WP user ID.
 *
 * This function gets the owner's data without revealing sensitive information
 * (e.g. `user_pass`).
 *
 * @param int $wp_user_id The WordPress user ID. Default is -1.
 *
 * @return array|bool Returns an associative array containing the 'ID' and 'OBJ' (user data object) if successful, false otherwise.
 */
function zeroBS_getOwnerObj( $wp_user_id = -1 ) {
	if ( $wp_user_id > 0 ) {

		$user = get_userdata( $wp_user_id );

		if ( ! isset( $user->ID ) || ! isset( $user->data ) ) {
			return false;
		}

		/**
		 * Ideally we'd restructure this, but the return result is used extensively,
		 * particularly from `zeroBS_getOwner` calls. For now we'll explicitly set what
		 * fields are provided (e.g. don't show `user_pass`).
		 */
		$user_data = (object) array(
			'ID'            => $user->data->ID,
			'user_login'    => $user->data->user_login,
			'user_nicename' => $user->data->user_nicename,
			'display_name'  => $user->data->display_name,
		);

		return array(
			'ID'  => $wp_user_id,
			'OBJ' => $user_data,
		);

	}

	return false;
}

// NOTE - this is very generic & not to be used in future code
// Use the direct $zbs->DAL->contacts->addUpdateContact code example in below rather than this generic.
// kthx.
function zeroBS_setOwner($objID=-1,$ownerID=-1,$objTypeID=false){

	if ($objID !== -1 && $objTypeID !== false){
        
        // here we check that the potential owner CAN even own
        if (!user_can($ownerID,'admin_zerobs_usr')) return false;

        /* DAL3 simplifies this

		// BECAUSE db2 doesn't have all objects as tables, find out the type + then switch here
		// ... we need to pass object really to third param, until we switch DB over
		if (!$objType) $objType = get_post_type($postID);

		// if not new db2:
		if ($objType !== false && $objType !== 'zerobs_customer'){

			return update_post_meta($postID, 'zbs_owner', (int)$ownerID);

		} else {

			global $zbs;

			return $zbs->DAL->contacts->addUpdateContact(array(
					'id'			=>	$postID,
					'limitedFields'	=>array(
						array('key'=>'zbs_owner','val'=>$ownerID,'type'=>'%d')
						)));
		} */
		global $zbs;

		return $zbs->DAL->setFieldByID(array(

                'objID' => $objID,
                'objTypeID' => $objTypeID,

                'colname' => 'zbs_owner',
                'coldatatype' => '%d', // %d/s
                'newValue' => $ownerID,

                ));

	} 

	return false;
}



#} Needed for Dave, added to core (but also to a custom extension for him). having it here too
#} will mean when we move DB his code won't break. PLS dont rename
function zeroBS_getAllContactsForOwner($owner=-1, $page=1){

	if (!empty($owner)){

		global $zbs;

		return $zbs->DAL->contacts->getContacts(array(

			'ownedBy' => $owner,
			'perPage' => 10,
			'page' 	  => $page

			));

	}

	return false;
}


function zeroBSCRM_mergeCustomers($dominantID=-1,$slaveID=-1){

   	if (!empty($dominantID) && !empty($slaveID)){

   		// load both
   		$master = zeroBS_getCustomer($dominantID);
   		$slave = zeroBS_getCustomer($slaveID,true,true,true);

   		if (isset($master['id']) && isset($slave['id'])){

   			global $zbs;

   			try {

   				// all set, merge
   				$changes = array();
   				$conflictingChanges = array();

   				$fieldPrefix = ''; if (!$zbs->isDAL2()) $fieldPrefix = 'zbsc_';

   				// copy details from slave fields -> master fields 
   					// where detail not present?
   					// into second address?

   					$masterNewMeta = false;
   					$masterHasSecondAddr = false;  // this'll let us copy over first from slave if empty :)
					$slaveHasFirstAddr = false; $slaveHasSecondAddr = false; $slaveFirstAddrStr = ''; $slaveSecondAddrStr = '';

					// if this gets filled, it'll be added as aka below
					$slaveEmailAddress = false;

   					// because these are just arrays (in meta) - we do a kind of compare, save a new ver, 
   					// ..and add any mismatches to conflicting changes in a meaningful way

					// DB2 converted these from obj[meta] -> obj

					// first, just copy through slave email if present
					if (isset($slave['email']) && !empty($slave['email'])) $slaveEmailAddress = $slave['email'];

					// we start with the master :)
					$masterNewMeta = $master;

   					global $zbsCustomerFields, $zbsAddressFields;

   					// first, any empties (excluding addr) in master, get patched from secondary
            		foreach ($zbsCustomerFields as $fieldKey => $fieldDeets){

            			// ignore addrs here
            			if (!isset($fieldDeets['migrate']) || $fieldDeets['migrate'] != 'addresses'){
            				// present in master?
            				if (!isset($master[$fieldKey]) || empty($master[$fieldKey])){

            					// NOT PRESENT IN MASTER

            					// was not set, or empty, in master
            					// present in slave?
            					if (isset($slave[$fieldKey]) && !empty($slave[$fieldKey])){

            						// a change :) - note requires zbsc_ here for some annoying reason, leaving for now
            						$masterNewMeta[$fieldPrefix.$fieldKey] = $slave[$fieldKey];

            						//hopefully DB2 doesnt..
            						// Does for now lol $masterNewMeta[$fieldKey] = $slave[$fieldKey];
            						$changes[] = __('Copied field',"zero-bs-crm").' "'.$fieldDeets[1].'" '.__('from secondary record over main record, (main was empty).',"zero-bs-crm");

            					}

            				} else {

            					// if slave had value?
            					// (no need to worry about emails, dealt with separately)
            					if (isset($slave[$fieldKey]) && !empty($slave[$fieldKey]) && $fieldKey !== 'email'){

                					// master val already present, conflicting change:
                					$conflictingChanges[] = __('Field not copied',"zero-bs-crm").' "'.$fieldDeets[1].'" '.__('from secondary record over main record, (main had value). Value was',"zero-bs-crm").' "'.$slave[$fieldKey].'"';

                				}

            				}


            			} else {

            				// ADDRESSES. Here we just use the foreach to check if the master has any secaddr fields
            				// just sets a flag used below in logic :)
						if ( str_starts_with( $fieldKey, 'secaddr_' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

            					// check presence (of any secaddr_ field)
            					if (isset($master[$fieldKey]) && !empty($master[$fieldKey])) $masterHasSecondAddr = true;

            					// does slave have secondary?
            					if (isset($slave[$fieldKey]) && !empty($slave[$fieldKey])) {
            						
            						// clearly has (bits of) second addr
            						$slaveHasSecondAddr = true;

            						// we also build this str which'll be shown as conflicting change (so we don't "loose" this data)
            						if (!empty($slaveSecondAddrStr)) $slaveSecondAddrStr .= ', ';
            						$slaveSecondAddrStr .= $slave[$fieldKey];

            					}

            				} else {

            					// first address
            					if (isset($slave[$fieldKey]) && !empty($slave[$fieldKey])) {

            						// clearly has (bits of) first addr
            						$slaveHasFirstAddr = true;

            						// we also build this str which'll be shown as conflicting change (so we don't "loose" this data)
            						if (!empty($slaveFirstAddrStr)) $slaveFirstAddrStr .= ', ';
            						$slaveFirstAddrStr .= $slave[$fieldKey];

            					}
            					
            				}

            			}

            		}


   					// addr's

   					// if master has no sec addr, just copy first addr from slave :)
   					if (!$masterHasSecondAddr){

   						// copy first addr from slave
   						foreach ($zbsAddressFields as $addrFieldKey => $addrFieldDeets){

   							// from slave first to master second - note requires zbsc_ here for some annoying reason, leaving for now
   							// Hopefully db2 doesnt 
   							$masterNewMeta[$fieldPrefix.'secaddr_'.$addrFieldKey] = $slave[$addrFieldKey];
   							// Does for now lol $masterNewMeta['secaddr_'.$addrFieldKey] = $slave[$addrFieldKey];


   						}
   						$changes[] = __('Copied address from secondary record into "secondary address" for main record',"zero-bs-crm");

   						// any second addr from slave just goes into logs
   						if ($slaveHasSecondAddr){

   								// provide old addr string			   								
								$conflictingChanges[] = __('Address not copied. Secondary address from secondary record could not be copied (master already had two addresses).',"zero-bs-crm")."\r\n".__('Address',"zero-bs-crm").': '."\r\n".$slaveSecondAddrStr;


   						}


   					} else {

   						// master already has two addresses, dump (any) secondary addresses into conflicting changes

   						if ($slaveHasFirstAddr){

   								// provide old addr string			   								
								$conflictingChanges[] = __('Address not copied. Address from secondary record could not be copied (master already had two addresses).',"zero-bs-crm")."\r\n".__('Address',"zero-bs-crm").': '."\r\n".$slaveFirstAddrStr;


   						}
   						if ($slaveHasSecondAddr){

   								// provide old addr string			   								
								$conflictingChanges[] = __('Address not copied. Secondary address from secondary record could not be copied (master already had two addresses).',"zero-bs-crm")."\r\n".__('Address',"zero-bs-crm").': '."\r\n".$slaveSecondAddrStr;


   						}
   					}


   				// assign social profiles from slave -> master
   				// GET THESE BEFORE updating!
   				$masterSocial = zeroBS_getCustomerSocialAccounts($dominantID);
   				$slaveSocial = zeroBS_getCustomerSocialAccounts($slaveID);

	            // UPDATE MASTER META:
	            zeroBS_addUpdateCustomer($dominantID,$masterNewMeta,'','','',false,false,false,-1,$fieldPrefix);

   				$masterNewSocial = $masterSocial;

		        global $zbsSocialAccountTypes;

		        if (count($zbsSocialAccountTypes) > 0) {

		        	foreach ($zbsSocialAccountTypes as $socialKey => $socialAccType){

			        		// master / slave has this acc?
			        		// for simplicity (not perf.) we grab which has which, first
			        		$masterHas = false; $slaveHas = false;
			        		if (is_array($masterSocial) && isset($masterSocial[$socialKey]) && !empty($masterSocial[$socialKey])) { $masterHas = true; }
			        		if (is_array($slaveSocial) && isset($slaveSocial[$socialKey]) && !empty($slaveSocial[$socialKey])) { $slaveHas = true; }

			        		// what's up.
			        		if ($masterHas && $slaveHas){

			        			// conflicting change
			        			$conflictingChanges[] = __('Social account not copied.',"zero-bs-crm").' "'.$socialAccType['name'].'" of "'.$slaveSocial[$socialKey].'" '.__('from secondary record (master already has a ',"zero-bs-crm").$socialAccType['name'].' '.__('account.',"zero-bs-crm");


			        		} elseif ($masterHas && !$slaveHas){

			        			// no change

			        		} elseif ($slaveHas && !$masterHas){

			        			// copy slave -> master
			        			$masterNewSocial[$socialKey] = $slaveSocial[$socialKey];
			   					$changes[] = __('Copied social account from secondary record into main record',"zero-bs-crm").' ('.$socialAccType['name'].').';


			        		}

			        }

			        // UPDATE SOCIAL
			        zeroBS_updateCustomerSocialAccounts($dominantID,$masterNewSocial);

			    }


   				// assign files from slave -> master

   				/* Array
				(
				    [0] => Array
				        (
				            [file] => /app/public/wp-content/uploads/zbscrm-store/aa250965422e9aea-Document-20243.pdf
				            [url] => http://zbsphp5.dev/wp-content/uploads/zbscrm-store/aa250965422e9aea-Document-20243.pdf
				            [type] => application/pdf
				            [error] => 
				            [priv] => 1
				        )

				)
				*/

   					$slaveFiles = zeroBSCRM_getCustomerFiles($slaveID);

   					if (is_array($slaveFiles) && count($slaveFiles) > 0){

   						$masterFiles = zeroBSCRM_getCustomerFiles($dominantID);

   						if (!is_array($masterFiles)) $masterFiles = array();

   						foreach ($slaveFiles as $zbsFile){

   							// add
   							$masterFiles[] = $zbsFile;

   							// changelog

                                $filename = basename($zbsFile['file']);

                                // if in privatised system, ignore first hash in name
                                if (isset($zbsFile['priv'])){

                                    $filename = substr($filename,strpos($filename, '-')+1);
                                }

   							$changes[] = __('Moved file to main record',"zero-bs-crm").' ('.$filename.')';


   						}

   						// save master files
   						zeroBSCRM_updateCustomerFiles($dominantID,$masterFiles);


   					}

   				// assign company from slave -> master

   					$masterCompany = zeroBS_getCustomerCompanyID($dominantID);
   					$slaveCompany = zeroBS_getCustomerCompanyID($slaveID);
   					if (empty($masterCompany)){

   						// slave co present, update main
   						if (!empty($slaveCompany)){

   							zeroBS_setCustomerCompanyID($dominantID,$slaveCompany);
   							$changes[] = __('Assigned main record to secondary record\'s '.jpcrm_label_company(),"zero-bs-crm").' (#'.$slaveCompany.').';


   						}


   					} else {

   						// master has co already, does slave?
   						if (!empty($slaveCompany) && $slaveCompany != $masterCompany){
							
							// conflicting change
			        		$conflictingChanges[] = __('Secondary contact was assigned to '.jpcrm_label_company().', whereas main record was assigned to another '.jpcrm_label_company().'.',"zero-bs-crm").' (#'.$slaveCompany.').';


   						}

   					}

   				// assign quotes from slave -> master

   					// got quotes?
   					if (is_array($slave['quotes']) && count($slave['quotes']) > 0){

                        $quoteOffset = zeroBSCRM_getQuoteOffset();

   						foreach ($slave['quotes'] as $quote){

                                // id for passing to logs
   								$qID = '';
                                #TRANSITIONTOMETANO
                                if (isset($quote['zbsid'])) $qID = $quote['zbsid'];

                                // for quotes, we just "switch" the owner meta :)
                                zeroBSCRM_changeQuoteCustomer($quote['id'],$dominantID);
                                $changes[] = __('Assigned quote from secondary record onto main record',"zero-bs-crm").' (#'.$qID.').';
                                

   						}



   					} // / has quotes

   				// assign invs from slave -> master

   					// got invoices?
   					if (is_array($slave['invoices']) && count($slave['invoices']) > 0){

   						foreach ($slave['invoices'] as $invoice){

                                // for invs, we just "switch" the owner meta :)
                                zeroBSCRM_changeInvoiceCustomer($invoice['id'],$dominantID);
                                $changes[] = __('Assigned invoice from secondary record onto main record',"zero-bs-crm").' (#'.$invoice['id'].').';
                                

   						}


   					} // / has invoices


   				// assign trans from slave -> master

   					// got invoices?
   					if (is_array($slave['transactions']) && count($slave['transactions']) > 0){

   						foreach ($slave['transactions'] as $transaction){

                                // for trans, we just "switch" the owner meta :)
                                zeroBSCRM_changeTransactionCustomer($transaction['id'],$dominantID);
                                $changes[] = __('Assigned transaction from secondary record onto main record',"zero-bs-crm").' (#'.$transaction['id'].').';
                                

   						}


   					} // / has invoices



   				// assign events from slave -> master

   					// get events
   					$events = zeroBS_getEventsByCustomerID($slaveID,true,10000,0);
   					if (is_array($events) && count($events) > 0){

   						foreach ($events as $event){

                                // for events, we just "switch" the meta val :)
                                zeroBSCRM_changeEventCustomer($event['id'],$dominantID);
											$changes[] = __( 'Assigned task from secondary record onto main record', 'zero-bs-crm' ) . ' (#' . $event['id'] . ').';
                                

   						}



   					} // / has invoices



   				// assign logs(?) from slave -> master

   					// for now save these as a random text meta against customer (not sure how to expose as of yet, but don't want to loose)
   					$slaveLogs = zeroBSCRM_getContactLogs($slaveID,true,10000,0); // id created name meta
   					if (is_array($slaveLogs) && count($slaveLogs) > 0){

   						/* in fact, just save as json encode :D - rough but quicker
   						// brutal str builder.
   						$logStr = '';

   						foreach ($slaveLogs as $log){

   							if (!empty($logStr)) $logStr .= "\r\n";


   						} */

        				//update_post_meta($dominantID, 'zbs_merged_customer_log_bk_'.time(), json_encode($slaveLogs)); 
        				// no $change here, as this is kinda secret, kthx
						$zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$dominantID,'merged_customer_log_bk_'.time(),$slaveLogs);

   					}


   				// assign tags(?) from slave -> master
   					
   					// get slave tags as ID array
   					$slaveTagsIDs = zeroBSCRM_getCustomerTagsByID($slaveID,true);
   					if (is_array($slaveTagsIDs) && count($slaveTagsIDs) > 0){

							// add tags to master (append mode)
							//wp_set_object_terms($dominantID, $slaveTagsIDs, 'zerobscrm_customertag', true );
   							$zbs->DAL->addUpdateObjectTags(array(
							'objid' 		=> $dominantID,
							'objtype' 		=> ZBS_TYPE_CONTACT,
							'tagIDs'		=> $slaveTagsIDs,
							'mode'			=> 'append'
							));
							$changes[] = __('Tagged main record with',"zero-bs-crm").' '.count($slaveTagsIDs).' '.__('tags from secondary record.',"zero-bs-crm");


   					}

   				// AKA / alias

   					// second email -> alias first
   					if (!empty($slaveEmailAddress)){


   						// add as alias
   						zeroBS_addCustomerAlias($dominantID,$slaveEmailAddress);
   						$changes[] = __('Added secondary record email as alias/aka of main record',"zero-bs-crm").' ('.$slaveEmailAddress.')';


   					}



   				// Customer image

   					//(for now, left to die)


   				// delete slave
   				zeroBS_deleteCustomer($slaveID,false);
   				$changes[] = __('Removed secondary record',"zero-bs-crm").' (#'.$slaveID.')';

   				// assign log for changes + conflicting changes

   					// strbuild
   					$shortDesc ='"'.$slave['name'].'" (#'.$slave['id'].') '.__('into this record',"zero-bs-crm");
   					$longDesc = '';

   						// changes 
   						if (is_array($changes) && count($changes) > 0) {

   							$longDesc .= '<strong>'.__('Record Changes',"zero-bs-crm").':</strong><br />';

   							// cycle through em
   							foreach ($changes as $c){

   								$longDesc .= '<br />'.$c;
   								
   							}

   						} else {

   							$longDesc .= '<strong>'.__('No Changes',"zero-bs-crm").'</strong>';

   						}

   						// conflicting changes
   						if (is_array($conflictingChanges) && count($conflictingChanges) > 0) {

   							$longDesc .= '<br />=============================<br /><strong>'.__('Conflicting Changes',"zero-bs-crm").':</strong><br />';

   							// cycle through em
   							foreach ($conflictingChanges as $c){

   								$longDesc .= '<br />'.$c;

   							}

   						} else {

   							$longDesc .= '<br />=============================<br /><strong>'.__('No Conflicting Changes',"zero-bs-crm").'</strong>';

   						}


   					// MASTER LOG :D
   					zeroBS_addUpdateContactLog($dominantID,-1,-1,array(
   						'type' => 'Bulk Action: Merge',
   						'shortdesc' => $shortDesc,
   						'longdesc' => $longDesc)
   					);

   					return true;

   			} catch (Exception $e){

   				// failed somehow! 
   				echo 'ERROR:'.$e->getMessage();

   			}

   		} // / if id's

   	}

   	return false;

}

function zeroBS_addUpdateCustomer(

		$cID = -1,
		$cFields = array(),

		$externalSource='',
		$externalID='',
		$customerDate='',

		$fallBackLog = false,
		$extraMeta = false,
		$automatorPassthrough = false,
		$owner = -1,

		$metaBuilderPrefix = 'zbsc_'

		){

	#} return
	$ret = false;

	if (isset($cFields) && count($cFields) > 0){

		#} New flag
		$newCustomer = false; $originalStatus = '';

		global $zbs;


			if ($cID > 0){

				#} Retrieve / check?
				$postID = $cID;

				#} Build "existing meta" to pass, (so we only update fields pushed here)
				$existingMeta = $zbs->DAL->contacts->getContact($postID,array());


				$originalDate = time();
				if (isset($existingMeta) && is_array($existingMeta) && isset($existingMeta['createduts']) && !empty($existingMeta['createduts'])) $originalDate = $existingMeta['createduts'];

				if (!empty($customerDate) && $customerDate != ''){

					#} DATE PASSED TO THE FUNCTION
					$customerDateTimeStamp = strtotime($customerDate);
					#} ORIGINAL POST CREATION DATE 
					// no need, db2 = UTS $originalDateTimeStamp = strtotime($originalDate);
					$originalDateTimeStamp = $originalDate;

					#} Compare, if $customerDateTimeStamp < then update with passed date
					if($customerDateTimeStamp < $originalDateTimeStamp){

						// straight in there :)
						  $zbs->DAL->contacts->addUpdateContact(array(
								'id'			=>	$postID,
								'limitedFields'	=>array(
									array('key'=>'zbsc_created','val'=>$customerDateTimeStamp,'type'=>'%d')
									)));
					}
				}

			// WH changed 20/05/18 
			// 20/05/18 - Previously this would reload the EXISTING database data 
			// THEN 'override' any passed fields
			// THEN save that down
			// ... this was required when we used old meta objs. (pre db2)
			// ... so if we're now DAL2, we can do away with that and simply pass what's to be updated and mode do_not_update_blanks
			$existingMeta = array();


			} else {

				// DB2: Probably can rethink this whole func, (do we even need it?) e.g. header post mentality used here
				// for now I've just edited in place, but def refactor in time
				
				#} Set flag
				$newCustomer = true;
		
				#} Set up empty meta arr

					#} DATE PASSED TO THE FUNCTION
					$customerDateTimeStamp = strtotime($customerDate);
					#} DAL2 needs timestamp :)
					$existingMeta = array('created' => $customerDateTimeStamp);

			}

			#} Build using centralised func below, passing any existing meta (updates not overwrites)
			$zbsCustomerMeta = zeroBS_buildCustomerMeta($cFields,$existingMeta,$metaBuilderPrefix,'',true);

			/* dealt with in DAL2 now :)
			// log any change of status
			if (!empty($zbsCustomerMeta['status']) && !empty($originalStatus) && $zbsCustomerMeta['status'] != $originalStatus){

				// status change
				$statusChange = array(
					'from' => $originalStatus,
					'to' => $zbsCustomerMeta['status']
					);
			} */


			/* dealt with in DAL2 now :)
			#} If no status, and default is specified in settings, add that in :)
			if (is_null($zbsCustomerMeta['status']) || !isset($zbsCustomerMeta['status']) || empty($zbsCustomerMeta['status'])){

				$defaultStatusStr = zeroBSCRM_getSetting('defaultstatus');

				// allow "empties" if (!empty($defaultStatusStr)) 
				$zbsCustomerMeta['status'] = $defaultStatusStr;

			}
			*/


            $we_have_tags = false; //set to false.. duh..

            # TAG customer (if exists) - clean etc here too 
            if(!empty($cFields['tags'])){
				$tags 		= $cFields['tags'];
				#} Santize tags
				if(is_array($tags)){
					$customer_tags = filter_var_array($tags,FILTER_UNSAFE_RAW); 
					// Formerly this used FILTER_SANITIZE_STRING, which is now deprecated as it was fairly broken. This is basically equivalent.
					// @todo Replace this with something more correct.
					foreach ( $customer_tags as $k => $v ) {
						$customer_tags[$k] = strtr(
							strip_tags( $v ),
							array(
								"\0" => '',
								'"' => '&#34;',
								"'" => '&#39;',
								"<" => '',
							)
						);
					}
					$we_have_tags = true;
				}

                if($we_have_tags){

                	$zbsCustomerMeta['tags'] = array();
					foreach($customer_tags as $cTag){

						// find/add tag
						//wp_set_object_terms($postID , $cTag, 'zerobscrm_customertag', true );
						$tagID = $zbs->DAL->addUpdateTag(array(
							'data'=>array(
								'objtype' 		=> ZBS_TYPE_CONTACT,
								'name' 			=> $cTag
								)));

						if (!empty($tagID)) $zbsCustomerMeta['tags'][] = $tagID;

					}
				}
			}


			#} Add external source/externalid
			#} No empties, no random externalSources :)
			$extSourceArr = -1; $approvedExternalSource = ''; #} As this is passed to automator :)
			if (!empty($externalSource) && !empty($externalID) && array_key_exists($externalSource,$zbs->external_sources)){

				#} If here, is legit.
				$approvedExternalSource = $externalSource;

				#} Add/Update record flag
                // 2.4+ Migrated away from this method to new update_post_meta($postID, 'zbs_customer_ext_'.$approvedExternalSource, $externalID);
                // 2.52+ Moved to new DAL method :)
                
                $extSourceArr = array(
                    'source' => $approvedExternalSource,
                    'uid' => $externalID
                    );

               	// add/update
                // DB2, this is just used below :)zeroBS_updateExternalSource($postID,$extSourceArr);
                $zbsCustomerMeta['externalSources'] = array($extSourceArr);

			} #} Otherwise will just be a random customer no ext source

			#} Got owner?
			if ($owner !== -1) $zbsCustomerMeta['owner'] = $owner;


			#} Update record (All IA is now fired intrinsicly )
            // DB2 update_post_meta($postID, 'zbs_customer_meta', $zbsCustomerMeta);
			return $zbs->DAL->contacts->addUpdateContact(array(
					'id'	=>	$cID,
					'data' 	=> $zbsCustomerMeta,
					'extraMeta' => $extraMeta,
					'automatorPassthrough' => $automatorPassthrough,
					'fallBackLog' => $fallBackLog
					));


			/* This now get's passed above, and dealt with by DAL
            #} Any extra meta keyval pairs?
            $confirmedExtraMeta = false;
            if (isset($extraMeta) && is_array($extraMeta)) {

            	$confirmedExtraMeta = array();

                	foreach ($extraMeta as $k => $v){

                	#} This won't fix stupid keys, just catch basic fails... 
                	$cleanKey = strtolower(str_replace(' ','_',$k));

                	#} Brutal update
                	//update_post_meta($postID, 'zbs_customer_extra_'.$cleanKey, $v);
                	$zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$postID,'extra_'.$cleanKey,$v);

                	#} Add it to this, which passes to IA
                	$confirmedExtraMeta[$cleanKey] = $v;

                }

            } */


            /* NOW DEALT WITH IN DAL2 :)


			#} INTERNAL AUTOMATOR 
			#} & 
			#} FALLBACKS

			if ($newCustomer){

				#} Add to automator
				zeroBSCRM_FireInternalAutomator('customer.new',array(
	                'id'=>$postID,
	                'customerMeta'=>$zbsCustomerMeta,
	                'extsource'=>$approvedExternalSource,
	                'automatorpassthrough'=>$automatorPassthrough, #} This passes through any custom log titles or whatever into the Internal automator recipe.
	                'customerExtraMeta'=>$confirmedExtraMeta #} This is the "extraMeta" passed (as saved)
	            ));


				// (WH) Moved this to fire on the IA... 
				// do_action('zbs_new_customer', $postID);   //fire the hook here...

			} else {

				#} Customer Update here (automator)?
				#} TODO


				#} FALLBACK 
				#} (This fires for customers that weren't added because they already exist.)
				#} e.g. x@g.com exists, so add log "x@g.com filled out form"
				#} Requires a type and a shortdesc
				if (
					isset($fallBackLog) && is_array($fallBackLog) 
					&& isset($fallBackLog['type']) && !empty($fallBackLog['type'])
					&& isset($fallBackLog['shortdesc']) && !empty($fallBackLog['shortdesc'])
				){

					#} Brutal add, maybe validate more?!

					#} Long desc if present:
					$zbsNoteLongDesc = ''; if (isset($fallBackLog['longdesc']) && !empty($fallBackLog['longdesc'])) $zbsNoteLongDesc = $fallBackLog['longdesc'];

						#} Only raw checked... but proceed.
						$newOrUpdatedLogID = zeroBS_addUpdateContactLog($postID,-1,-1,array(
							#} Anything here will get wrapped into an array and added as the meta vals
							'type' => $fallBackLog['type'],
							'shortdesc' => $fallBackLog['shortdesc'],
							'longdesc' => $zbsNoteLongDesc
						));


				}



	            // catch dirty flag (update of status) (note, after update_post_meta - as separate)
	            //if (isset($_POST['zbsc_status_dirtyflag']) && $_POST['zbsc_status_dirtyflag'] == "1"){
				// actually here, it's set above
				if (isset($statusChange) && is_array($statusChange)){

	                // status has changed

	                // IA
	                zeroBSCRM_FireInternalAutomator('customer.status.update',array(
	                    'id'=>$postID,
	                    'againstid' => $postID,
	                    'userMeta'=> $zbsCustomerMeta,
	                    'from' => $statusChange['from'],
	                    'to' => $statusChange['to']
	                    ));

	            }


			} */



			#} REQ?
			#} MAKE SURE if you change any post_name features you also look at: "NAMECHANGES" in this file (when a post updates it'll auto replace these...)
	        #$newCName = zeroBS_customerName('',$zbsMeta,true,false)


			#} Return customerID if success :)
			//$ret = $postID;



	}



	return $ret;

}


/* ======================================================
	 Contact -> aliases
   ====================================================== */
#} See if already in use/exists
function zeroBS_canUseCustomerAlias($alias=''){

	// now can call this generic:
	return zeroBS_canUseAlias(ZBS_TYPE_CONTACT,$alias);

}


#} Get specific alias if exists
function zeroBS_getCustomerAlias($cID=-1,$alias=''){

	return zeroBS_getObjAlias(ZBS_TYPE_CONTACT,$cID,$alias);

}

#} Get specific alias if exists
function zeroBS_getCustomerAliasByID($cID=-1,$aliasID=-1){

	return zeroBS_getAliasByID(ZBS_TYPE_CONTACT,$cID,$aliasID);

}

#} Get All Aliases against a contact.
function zeroBS_getCustomerAliases($cID=-1){

	return zeroBS_getObjAliases(ZBS_TYPE_CONTACT,$cID);

}

#} add Aliases to a contact.
function zeroBS_addCustomerAlias($cID=-1,$alias=''){

	return zeroBS_addObjAlias(ZBS_TYPE_CONTACT,$cID,$alias);

}

#} remove Alias from an contact
function zeroBS_removeCustomerAlias($cID=-1,$alias=''){

	return zeroBS_removeObjAlias(ZBS_TYPE_CONTACT,$cID,$alias);

}

#} remove Alias from a contact.
function zeroBS_removeCustomerAliasByID($cID=-1,$aliasID=-1){

	return zeroBS_removeObjAliasByID(ZBS_TYPE_CONTACT,$cID,$aliasID);

}



/* ======================================================
	/ Contact -> aliases
   ====================================================== */


function zeroBSCRM_getLog($lID=-1){

	if ($lID !== -1){

		global $zbs;

		return $zbs->DAL->logs->getLog(array(
			'id' => $lID,
			'incMeta' => true,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)));

	} 

	return false;
}

function zeroBSCRM_getContactLogs($customerID=-1,$withFullDetails=false,$perPage=100,$page=0,$searchPhrase='',$argsOverride=false){
			

		if (!empty($customerID) && $customerID !== -1 && $customerID !== false){

			global $zbs;
			return $zbs->DAL->logs->getLogsForObj(array(

					'objtype' => ZBS_TYPE_CONTACT,
					'objid' => $customerID,

					'searchPhrase' 	=> $searchPhrase,

					'incMeta' 	=> $withFullDetails,

					'sortByField' 	=> 'zbsl_created',
					'sortOrder' 	=> 'DESC',
					'page'			=> $page,
					'perPage'		=> $perPage,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

				));

		}
		return array();
}

function zeroBSCRM_getAllContactLogs($withFullDetails=false,$perPage=100,$page=0,$searchPhrase='',$argsOverride=false){
			
	global $zbs;
	return $zbs->DAL->logs->getLogsForANYObj(array(

			'objtype' => ZBS_TYPE_CONTACT,

			'searchPhrase' 	=> $searchPhrase,

			'incMeta' 	=> $withFullDetails,

			'sortByField' 	=> 'zbsl_created',
			'sortOrder' 	=> 'DESC',
			'page'			=> $page,
			'perPage'		=> $perPage,
			'ignoreowner'	=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

		));
}
function zeroBSCRM_getCompanyLogs($companyID=false,$withFullDetails=false,$perPage=100,$page=0,$searchPhrase='',$argsOverride=false){
			
		// DAL 3+ :)
		if (!empty($companyID)){
			global $zbs;

			return $zbs->DAL->logs->getLogsForObj(array(

					'objtype' => ZBS_TYPE_COMPANY,
					'objid' => $companyID,

					'searchPhrase' 	=> $searchPhrase,

					'incMeta' 	=> $withFullDetails,

					'sortByField' 	=> 'zbsl_created',
					'sortOrder' 	=> 'DESC',
					'page'			=> $page,
					'perPage'		=> $perPage,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

				));
			
		}
		return array();

}

function zeroBSCRM_getObjCreationLog($objID=-1,$objType=ZBS_TYPE_CONTACT){
			

		if (!empty($objID) && $objID !== -1 && $objID !== false){

			global $zbs;
			return $zbs->DAL->getLogsForObj(array(

					'objtype' => $objType,
					'objid' => $objID,

					'notetype' 	=> 'Created',

					'incMeta' 	=> true,

					'sortByField' 	=> 'zbsl_created',
					'sortOrder' 	=> 'ASC',
					'page'			=> 0,
					'perPage'		=> 1,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

				));

		}
}
function zeroBSCRM_logTypeStrToDB($str=''){

	global $zbs;
	return $zbs->DAL->logs->logTypeIn($str);

}

function zeroBSCRM_getMostRecentContactLog($objID=false,$withFullDetails=false,$restrictToTypes=false){

		if (!empty($objID)){

			global $zbs;

			return $zbs->DAL->logs->getLogsForObj(array(

					'objtype' => ZBS_TYPE_COMPANY,
					'objid' => $objID,

					'notetypes' => $restrictToTypes,

					'incMeta' 	=> $withFullDetails,

					'sortByField' 	=> 'zbsl_created',
					'sortOrder' 	=> 'DESC',
					'page'			=> 0,
					'perPage'		=> 1,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

				));

		}
}

function zeroBSCRM_getMostRecentCompanyLog($objID=false,$withFullDetails=false,$restrictToTypes=false){

		if (!empty($objID)){

			global $zbs;

			return $zbs->DAL->logs->getLogsForObj(array(

					'objtype' => ZBS_TYPE_COMPANY,
					'objid' => $objID,

					'notetypes' => $restrictToTypes,

					'incMeta' 	=> $withFullDetails,

					'sortByField' 	=> 'zbsl_created',
					'sortOrder' 	=> 'DESC',
					'page'			=> 0,
					'perPage'		=> 1,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

				));

		}
}


function zeroBS_searchLogs($querystring){

	global $zbs;

	return $zbs->DAL->logs->getLogsForANYObj(array(
			'searchPhrase' => $querystring,
			'perPage' => 100,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)
		));
}

function zeroBS_allLogs(){

	global $zbs;

	return $zbs->DAL->logs->getLogsForANYObj(array(
			'perPage' => 100,
			'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)
		));
}




function zeroBS_addUpdateLog(

		$cID = -1,
		$logID = -1,
		$logDate = -1,

		/* 
		#} Process with metaboxes.php funcs, is easier :)

			$zbsNoteAgainstPostID
			$zbsNoteType
			$zbsNoteShortDesc
			$zbsNoteLongDesc

			NOTE!: as of 31/05/17 WOODY started putting 
			'meta_assoc_id' in these - e.g. if it's an 'email sent' log, this meta_assoc_id will be the CAMPAIGN id
			'meta_assoc_src' would then be mailcamp

		*/

		$noteFields = array(),

		$objType='', /* contact or 'zerobs_contact' */
		$owner = -1

		){

			global $zbs;


		// DAL3 all obj logs: if ($objType == 'zerobs_customer'){
			//zeroBSCRM_DEPRECATEDMSG('zeroBS_addUpdateLog has been replaced by zeroBS_addUpdateContactLog etc. or (better still) DAL2 calls direct');
			//return zeroBS_addUpdateContactLog($cID,$logID,$logDate,$noteFields,$owner);
		// DAL3 NO CPT LOGS: 
			//} else 
			// fallback

		// translate zerobs_customer to 1
		$typeID = $zbs->DAL->objTypeID($objType);

		// got type?
		if ($typeID !== -1){

			// assume this'll work. (should do.)
			return zeroBS_addUpdateObjLog($typeID,$cID,$logID,$logDate,$noteFields,$owner);

		}

		// no TYPE
		zeroBSCRM_DEPRECATEDMSG('zeroBS_addUpdateLog has been replaced by DAL3 logging. Please do no use, or at least pass an object type');
		return false;


}
// really should just be calling direct at this point, or zeroBS_addUpdateObjLog at least
function zeroBS_addUpdateContactLog(
		$cID = -1,
		$logID = -1,
		$logDate = -1,
		$noteFields = array(),
		$owner = -1
		){

		// wrapper for this:
		return zeroBS_addUpdateObjLog(ZBS_TYPE_CONTACT,$cID,$logID,$logDate,$noteFields,$owner);

}

// generic add obj log
function zeroBS_addUpdateObjLog(
		$objTypeID = -1, 
		$objID = -1,
		$logID = -1,
		$logDate = -1,
		$noteFields = array(),
		$owner = -1
		){

		if ($objTypeID > 0){

			$logType = '';
			$logShortDesc = '';
			$logLongDesc = '';
			$logMeta = -1;
			$logCreated = -1;
			$pinned = -1;
			if (isset($noteFields['type'])) $logType = zeroBSCRM_permifyLogType($noteFields['type']);
			if (isset($noteFields['shortdesc'])) $logShortDesc = $noteFields['shortdesc'];
			if (isset($noteFields['longdesc'])) $logLongDesc = $noteFields['longdesc'];
			if (isset($noteFields['meta'])) $logMeta = $noteFields['meta'];
			if (isset($noteFields['pinned'])) $pinned = $noteFields['pinned'];
			if ($logDate !== -1) {
				$logCreated = strtotime($logDate);
			}
			else {
				$logCreated = -1;
			}

			global $zbs;

			return $zbs->DAL->logs->addUpdateLog(array(

					'id'    => $logID,
					'owner' => $owner,

					// fields (directly)
					'data'  => array(

						'objtype'   => $objTypeID,
						'objid'     => $objID,
						'type'      => $logType,
						'shortdesc' => $logShortDesc,
						'longdesc'  => $logLongDesc,

						'meta'      => $logMeta,
						'pinned'    => $pinned,

						'created'   => $logCreated
						
					)));

		} 

		return false;

}




// allows us to lazily 'hotswap' wp_set_post_terms in extensions (e.g. pre DAL2 it'll just fire wp_set_post_terms)
// ... here it does DAL2 equiv
// WH Note: if using old WP method (wp_set_post_terms) can pass tags or tagIDS - DB2 currently only accepts tagIDs - to add in
// ... to get around this I've temp added $usingTagIDS=true flag
// still used in bulk-tagger and groove-connect extensions as of 9 May 1923
function zeroBSCRM_DAL2_set_post_terms($cID=-1,$tags=array(),$taxonomy='zerobscrm_customertag',$append=true,$usingTagIDS=true){

	zeroBSCRM_DEPRECATEDMSG('zeroBSCRM_DAL2_set_post_terms has been replaced by DAL3 tagging. Please do no use');		
	
	global $zbs;

	// if we have tooo....
	$possibleObjTypeID = $zbs->DAL->cptTaxonomyToObjID($taxonomy);

	if ($possibleObjTypeID > 0){

		$mode = 'replace'; if ($append) $mode = 'append';

		$fieldName = 'tagIDs'; if (!$usingTagIDS) $fieldName = 'tags';

		return $zbs->DAL->addUpdateObjectTags(array(
														'objid' 		=> $cID,
														'objtype' 		=> $possibleObjTypeID,
														$fieldName		=> $tags,
														'mode'			=> $mode
												));

	}
	return false;

}

// allows us to lazily 'hotswap' wp_set_object_terms in extensions (e.g. pre DAL2 it'll just fire wp_set_object_terms)
// ... here it does DAL2 equiv
// WH Note: if using old WP method (wp_set_object_terms) can pass tags or tagIDS - DB2 currently only accepts tagIDs - to add in
// ... to get around this I've temp added $usingTagIDS=true flag
// still used in several extensions as of 9 May 1923
function zeroBSCRM_DAL2_set_object_terms($cID=-1,$tags=array(),$taxonomy='zerobscrm_customertag',$append=true,$usingTagIDS=true){

	zeroBSCRM_DEPRECATEDMSG('zeroBSCRM_DAL2_set_object_terms has been replaced by DAL3 tagging. Please do no use');		
	
	global $zbs;

	// if we have tooo....
	$possibleObjTypeID = $zbs->DAL->cptTaxonomyToObjID($taxonomy);

	if ($possibleObjTypeID > 0){

		$mode = 'replace'; if ($append) $mode = 'append';

		$fieldName = 'tagIDs'; if (!$usingTagIDS) $fieldName = 'tags';

		return $zbs->DAL->addUpdateObjectTags(array(
														'objid' 		=> $cID,
														'objtype' 		=> $possibleObjTypeID,
														$fieldName		=> $tags,
														'mode'			=> $mode
												));

	}
	return false;
	/*
	// we only switch out for customer tags, rest just go old way
	if ($taxonomy == 'zerobscrm_customertag'){

		global $zbs;

		$mode = 'replace'; if ($append) $mode = 'append';

		$fieldName = 'tagIDs'; if (!$usingTagIDS) $fieldName = 'tags';

		return $zbs->DAL->addUpdateObjectTags(array(
														'objid' 		=> $cID,
														'objtype' 		=> ZBS_TYPE_CONTACT,
														$fieldName		=> $tags,
														'mode'			=> $mode
												));

	} else {

		//https://codex.wordpress.org/Function_Reference/wp_set_object_terms
		return wp_set_object_terms($cID,$tags,$taxonomy,$append);
		
	} */

}

// allows us to lazily 'hotswap' wp_set_object_terms in extensions (e.g. pre DAL2 it'll just fire wp_set_object_terms)
// ... here it does DAL2 equiv
// WH Note: if using old WP method (wp_remove_object_terms) can pass tags or tagIDS - DB2 currently only accepts tagIDs - to add in
// ... to get around this I've temp added $usingTagIDS=true flag
// still used in csv-importer-pro as of 9 May 1923
function zeroBSCRM_DAL2_remove_object_terms($cID=-1,$tags=array(),$taxonomy='zerobscrm_customertag',$usingTagIDS=true){

	zeroBSCRM_DEPRECATEDMSG('zeroBSCRM_DAL2_remove_object_terms has been replaced by DAL3 tagging. Please do no use');		
	
	global $zbs;

	// if we have tooo....
	$possibleObjTypeID = $zbs->DAL->cptTaxonomyToObjID($taxonomy);

	if ($possibleObjTypeID > 0){

		$fieldName = 'tagIDs'; if (!$usingTagIDS) $fieldName = 'tags';

		return $zbs->DAL->addUpdateObjectTags(array(
														'objid' 		=> $cID,
														'objtype' 		=> $possibleObjTypeID,
														$fieldName		=> $tags,
														'mode' 			=> 'remove'
												));

	}
	return false;
	/*
	// we only switch out for customer tags, rest just go old way
	if ($taxonomy == 'zerobscrm_customertag'){

		global $zbs;

		$fieldName = 'tagIDs'; if (!$usingTagIDS) $fieldName = 'tags';

		return $zbs->DAL->addUpdateObjectTags(array(
														'objid' 		=> $cID,
														'objtype' 		=> ZBS_TYPE_CONTACT,
														$fieldName		=> $tags,
														'mode' 			=> 'remove'
												));

	} else {

		//https://codex.wordpress.org/Function_Reference/wp_remove_object_terms
		return wp_remove_object_terms($cID,$tags,$taxonomy);
		
	} */

}
 


// for now, wrapper for past! - moved this to zeroBS_buildContactMeta
function zeroBS_buildCustomerMeta($arraySource=array(),$startingArray=array(),$fieldPrefix='zbsc_',$outputPrefix='',$removeEmpties=false,$autoGenAutonumbers=false){

	// This is no longer req, as we can use the generic from 3.0 :)
	//return zeroBS_buildContactMeta($arraySource,$startingArray,$fieldPrefix,$outputPrefix,$removeEmpties);
	return zeroBS_buildObjArr($arraySource,$startingArray,$fieldPrefix,$outputPrefix,$removeEmpties,ZBS_TYPE_CONTACT,$autoGenAutonumbers);

}


#} This takes an array source (can be $_POST) and builds out a meta field array for it..
#} This lets us use the same fields array for Metaboxes.php and any custom integrations
#} e.g. $zbsCustomerMeta = zeroBS_buildCustomerMeta($_POST);
#} e.g. $zbsCustomerMeta = zeroBS_buildCustomerMeta($importedMetaFields);
#} e.g. $zbsCustomerMeta = zeroBS_buildCustomerMeta(array('zbsc_fname'=>'Woody'));
#} 27/09/16: Can now also pass starting array, which lets you "override" fields present in $arraySource, without loosing originals not passed
#} 12/04/18: Added prefix so as to be able to pass normal array e.g. fname (by passing empty fieldPrefix)
#} 3.0: this was moved to generic zeroBS_buildObjArr :)
function zeroBS_buildContactMeta($arraySource=array(),$startingArray=array(),$fieldPrefix='zbsc_',$outputPrefix='',$removeEmpties=false,$autoGenAutonumbers=false){

	// moved to generic, just return that :)
	return zeroBS_buildObjArr($arraySource,$startingArray,$fieldPrefix,$outputPrefix,$removeEmpties,ZBS_TYPE_CONTACT,$autoGenAutonumbers);
	
	/*
	#} def
	$zbsCustomerMeta = array();

	#} if passed...
	if (isset($startingArray) && is_array($startingArray)) $zbsCustomerMeta = $startingArray;

	#} go
        global $zbsCustomerFields,$zbs;

        $i=0;

        foreach ($zbsCustomerFields as $fK => $fV){
        	$i++;

            if (!isset($zbsCustomerMeta[$outputPrefix.$fK])) $zbsCustomerMeta[$outputPrefix.$fK] = '';

            if (isset($arraySource[$fieldPrefix.$fK])) {

                switch ($fV[0]){


                    case 'tel':

                        // validate tel?
                        $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
                        preg_replace("/[^0-9 ]/", '', $zbsCustomerMeta[$outputPrefix.$fK]);
                        break;

                    case 'price':
                    case 'numberfloat':

                        $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
                        $zbsCustomerMeta[$outputPrefix.$fK] = preg_replace('@[^0-9\.]+@i', '-', $zbsCustomerMeta[$outputPrefix.$fK]);
                        $zbsCustomerMeta[$outputPrefix.$fK] = floatval($zbsCustomerMeta[$outputPrefix.$fK]);
                        break;

                    case 'numberint':

                        $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
                        $zbsCustomerMeta[$outputPrefix.$fK] = preg_replace('@[^0-9]+@i', '-', $zbsCustomerMeta[$outputPrefix.$fK]);
                        $zbsCustomerMeta[$outputPrefix.$fK] = floatval($zbsCustomerMeta[$outputPrefix.$fK]);
                        break;


                    case 'textarea':

                        $zbsCustomerMeta[$outputPrefix.$fK] = zeroBSCRM_textProcess($arraySource[$fieldPrefix.$fK]);

                        break;

                    case 'date':

                        $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

                        break;


                    default:

                        $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

                        break;


                }


            }


        }

        // if DAL2, second addresses get passed differently? ¯\_(ツ)_/¯
        if ($zbs->isDAL2()){

        	$replaceMap = array(
					'secaddr1' => 'secaddr_addr1',
					'secaddr2' => 'secaddr_addr2',
					'seccity' => 'secaddr_city',
					'seccounty' => 'secaddr_county',
					'seccountry' => 'secaddr_country',
					'secpostcode' => 'secaddr_postcode'
					);

        	foreach ($replaceMap as $d2key => $d1key)
	        if (isset($zbsCustomerMeta[$outputPrefix.$d1key])){
	        	$zbsCustomerMeta[$outputPrefix.$d2key] = $zbsCustomerMeta[$outputPrefix.$d1key];
	        	unset($zbsCustomerMeta[$outputPrefix.$d1key]);
	        }

		}

        // can also pass some extras :) /social
        $extras = array('tw','fb','li');
        foreach ($extras as $fK){

            if (!isset($zbsCustomerMeta[$outputPrefix.$fK])) $zbsCustomerMeta[$outputPrefix.$fK] = '';

            if (isset($arraySource[$fieldPrefix.$fK])) {

                $zbsCustomerMeta[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

            }

        }

        // $removeEmpties
        if ($removeEmpties){

        	$ret = array();
        	foreach ($zbsCustomerMeta as $k => $v){
				
				$intV = (int)$v;

				if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){
					$ret[$k] = $v;
				}

        	}

        	$zbsCustomerMeta = $ret;

        }

    return $zbsCustomerMeta;

   */
}

/* ======================================================
  	/ Unchanged DAL2->3 (Mostly customer/contact + log relatead)
   ====================================================== */

// ====================================================================================================================================
// ====================================================================================================================================
// ==================== / DAL 2.0 FUNCS ===============================================================================================
// ====================================================================================================================================
// ====================================================================================================================================
   


// ====================================================================================================================================
// ====================================================================================================================================
// ==================== DAL 3.0 FUNCS ===============================================================================================
// ====================================================================================================================================
// ====================================================================================================================================
function zeroBS___________DAL30Helpers(){return;}








/* ======================================================
  	GENERIC helpers
   ====================================================== */
   function zeroBS___________GenericHelpers(){return;}

   	#} This is a fill-in until we deprecate addUpdateTransaction etc. (3.5 or so)
    #} it'll take a DAL1 obj (e.g. transaction with 'orderid') and produce a v3 translated field variant (e.g. orderid => ref (via 'dal1key' attr on obj model))
   	#} param $objType = ZBS_TYPE_TRANSACTION 
   	#} param $fieldPrefix = zbst_ if fields are prefixed with 
    function zeroBS_translateDAL1toDAL3Obj($arraySource=array(),$objType=-1,$fieldPrefix=''){

    	if ($objType > 0){

    		global $zbs;

    		//$objectModel = $zbs->DAL->objModel($objType);
    		$objectLayer = $zbs->DAL->getObjectLayerByType($objType);

    		if (isset($objectLayer)){

    			$ret = array();
    			$objTranslationMatrix = $objectLayer->getDAL1toDAL3ConversionMatrix();
    			if (!is_array($objTranslationMatrix)) $objTranslationMatrix = array();

    			foreach ($arraySource as $k => $v){

    				$kClean = $k; if (!empty($fieldPrefix)) $kClean = str_replace($fieldPrefix,'',$k);

    				if (isset($objTranslationMatrix[$kClean])){

    					// is translatable
    					$ret[$fieldPrefix.$objTranslationMatrix[$kClean]] = $v;

    				} else {

    					// isn't translatable
    					$ret[$k] = $v;

    				}


    			}

    		} // / has object layer

    	} // / has objtype

    	return $ret;

    }

	#} This takes an array source (can be $_POST) and builds out a meta field array for it..
	#} ... this is a generalised postarray->objarray creator, built from zeroBS_buildContactMeta, 
	#} ... now produces all "meta" (objarrays) for all objs. Centralised to keep DRY 
   	#} 13/03/19: Added $autoGenAutonumbers - if TRUE, empty/non-passed autonumber custom fields will assume fresh + autogen (useful for PORTAL/SYNC generated)
	function zeroBS_buildObjArr($arraySource=array(),$startingArray=array(),$fieldPrefix='zbsc_',$outputPrefix='',$removeEmpties=false,$objType=ZBS_TYPE_CONTACT,$autoGenAutonumbers=false){

		#} def
		$retArray = array();

		#} if passed...
		if (isset($startingArray) && is_array($startingArray)) $retArray = $startingArray;

		#} go

		// req.
		global $zbs;

			// DAL3 notes: (See #globalfieldobjsdal3 in fields.php)
			// .. ultimately we default to using the $fields globals, then fallback to the objmodels 
			// introduced in DAL3 objs. This allows coverage of both, for now
			// v3.0 RC+ this can be refactored :)
				// Note: To make RC1 I also added in translation, which is perhaps a step toward refactoring this:

				// Some RC1 field translations (requires dal1key against changed obj model fields)
				$arraySource = zeroBS_translateDAL1toDAL3Obj($arraySource,$objType,$fieldPrefix);

			// retrieve global var name
			$globFieldVarName = $zbs->DAL->objFieldVarName($objType);
	    
			// should be $zbsCustomerFields etc.
			// from 3.0 this is kind of redundant, esp when dealing with events, which have none, so we skip if this case
			if (
				!$zbs->isDAL3() && (empty($globFieldVarName) || $globFieldVarName == false || !isset($GLOBALS[ $globFieldVarName ]))
				) return $retArray;

			// nope. (for events in DAL3)
			// ... potentially can turn this off for all non DAL3? may be redundant inside next {}
			if ($objType !== ZBS_TYPE_TASK && $objType !== ZBS_TYPE_QUOTETEMPLATE && isset($GLOBALS[$globFieldVarName])){

		        $i=0;

		        foreach ($GLOBALS[$globFieldVarName] as $fK => $fV){

		        	$i++;

		        	// if it's not an autonumber (which generates new on blank passes), set it to empty
		        	// ... or if it has $autoGenAutonumbers = true, 
		            if (
		            	($fV[0] !== 'autonumber' && !isset($retArray[$outputPrefix.$fK]))
		            	||
		            	$autoGenAutonumbers
		            	)
		            	$retArray[$outputPrefix.$fK] = '';

		            // two EXCEPTIONS:
		            	// 1) custom field type checkbox, because it adds -0 -1 etc. to options, so this wont fire, 
		            	// 2) Autonumbers which are blank to start with get caught beneath
		            // ... see below for checkbox catch            
		            if (isset($arraySource[$fieldPrefix.$fK])) {

		                switch ($fV[0]){


		                    case 'tel':

		                        // validate tel? Should be an user option, allow validation.
		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
		                        //$retArray[$outputPrefix.$fK] = preg_replace("/[^0-9 .+\-()]/", '', $retArray[$outputPrefix.$fK]);
		                        break;

		                    case 'price':
		                    case 'numberfloat':

		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
		                        $retArray[$outputPrefix.$fK] = preg_replace('@[^0-9\.]+@i', '-', $retArray[$outputPrefix.$fK]);
		                        $retArray[$outputPrefix.$fK] = floatval($retArray[$outputPrefix.$fK]);
		                        break;

		                    case 'numberint':

		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);
		                        $retArray[$outputPrefix.$fK] = preg_replace('@[^0-9]+@i', '-', $retArray[$outputPrefix.$fK]);
		                        $retArray[$outputPrefix.$fK] = intval($retArray[$outputPrefix.$fK]);
		                        break;

						case 'textarea':
							// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							$retArray[ $outputPrefix . $fK ] = sanitize_textarea_field( $arraySource[ $fieldPrefix . $fK ] );
							break;

						case 'date':
							$safe_text = sanitize_text_field( $arraySource[ $fieldPrefix . $fK ] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

							$retArray[ $outputPrefix . $fK ] = jpcrm_date_str_to_uts( $safe_text, '!Y-m-d', true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							break;

		                    case 'datetime':

		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

	                    		// translate datetime to UTS (without time)
	                    		// ... by default from DAL3.0
	                    		$retArray[$outputPrefix.$fK] = zeroBSCRM_locale_dateToUTS($retArray[$outputPrefix.$fK],true);

		                        break;

		                    case 'radio':
		                    case 'select':

		                    	// just get value, easy.
		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

		                        break;

		                    // autonumber dealt with below this if {}
		                    case 'autonumber':

		                    	// pass it along :)
		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

		                        break;

		                    // checkbox dealt with below this if {}

		                    default:

		                        $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

		                        break;



		                } // / switch type


		            } // / if isset (simple) $arraySource[$fieldPrefix.$fK]


		            // catch checkboxes
		            if ($fV[0] == 'checkbox'){

		            	// there are several ways that checkbox (multiselect) inputs may be passed, depending on source
		            	// because this function catches from:
		            	//	- edit page post
		            	//	- client portal profile page
		            	// 	- Gravity forms/extension calls
		            	// 	- API
		            	// ... to name a few, it's sensible that we try and catch the variants (low risk/cost here)
						$checkboxArr = array();                   	

			            	// Checkbox input: Iterative
			            	// This cycles through `checkboxkey-$i` (up to 64 options) and includes if they're set
			            	// This is used by our edit pages, client portal profile page etc.
				            for ($checkboxI = 0; $checkboxI < 64; $checkboxI++){

				            	if (isset($arraySource[$fieldPrefix.$fK.'-'.$checkboxI])) {

				            		// retrieve
				            		$checkboxArr[] = $arraySource[$fieldPrefix.$fK.'-'.$checkboxI];

				            	}

				            }

			            	// Checkbox input: CSV
			            	// This can be exploded
			            	// This is used by gravity forms, when multiple 1 word options are checked (and probably elsewhere)							
				            if (isset($arraySource[$fieldPrefix.$fK]) && is_string($arraySource[$fieldPrefix.$fK])) {

			            		// one option or multi?
			            		if (strpos($arraySource[$fieldPrefix.$fK], ','))
			            			$checkboxArr = explode(',', $arraySource[$fieldPrefix.$fK]);
			            		else
			            			$checkboxArr = array($arraySource[$fieldPrefix.$fK]);

				            }

			            	// Checkbox input: Array
			            	// This can be straight passed
			            	// This is used by gravity forms, when at least one option with multiple words are checked (and probably elsewhere, is good to support pass through)
							if (isset($arraySource[$fieldPrefix.$fK]) && is_array($arraySource[$fieldPrefix.$fK])) {
								$checkboxArr = $arraySource[$fieldPrefix.$fK];
							}


		            	if (is_array($checkboxArr)){

		            		// sanitize
		            		$checkboxArr = array_map( 'sanitize_text_field', $checkboxArr );

			            	// csv em
			                $retArray[$outputPrefix.$fK] = implode(',',$checkboxArr);

			            } else {

			            	// none selected, set blank
		                    $retArray[$outputPrefix.$fK] = '';

			            }



			        } // / if checkbox

			        // if autonumber
		            if ($fV[0] == 'autonumber'){

		                // this is a generated field.
		            	// if was previously set, sticks with that, if not set, will generate new, based on custom field rule
		            	// NOTE!!!! if this is NOT SET in customerMeta, it WILL NOT be updated
		            	// ... this is because when passing incomplete update records (e.g. not passing autonumber)
		            	// ... it doesn't need a new AUTONUMBER
		            	// ... so if you want a fresh autonumber, you need to pass with $startingArray[] EMPTY value set
		            	
		            	// if not yet set
		            	if (isset($retArray[$outputPrefix.$fK]) && empty($retArray[$outputPrefix.$fK])){

		            		// retrieve based on custom field rule
		            		$autono = '';

		            			// retrieve rule
		            			$formatExample = '';
		            			if (isset($fV[2])) {
		            			    $formatExample = $fV[2];
                                }
						if ( ! empty( $formatExample ) && str_contains( $formatExample, '#' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		            				// has a rule at least
		            				$formatParts = explode('#', $formatExample);

		            				// build                    				

		            					// prefix
		            					if (!empty($formatParts[0])) $autono .= zeroBSCRM_customFields_parseAutoNumberStr($formatParts[0]);

		            					// number
		            					$no = zeroBSCRM_customFields_getAutoNumber($objType,$fK);
		            					if ($no > 0 && $no !== false) $autono .= $no;                    			
		            				
		            					// suffix
		            					if (!empty($formatParts[2])) $autono .= zeroBSCRM_customFields_parseAutoNumberStr($formatParts[2]);

		            				// if legit, add
		                			if ($no > 0 && $no !== false) $retArray[$outputPrefix.$fK] = $autono;


						}
		            	}

			        } // / if autonumber


		        } // / foreach field

		    } // / if global-based-fill-out

	        // if DAL2, second addresses get passed differently? ¯\_(ツ)_/¯
	        // ... guess there's no harm in this, if not set wont enact...
	        if ($zbs->isDAL2()){

	        	$replaceMap = array(
						'secaddr1' => 'secaddr_addr1',
						'secaddr2' => 'secaddr_addr2',
						'seccity' => 'secaddr_city',
						'seccounty' => 'secaddr_county',
						'seccountry' => 'secaddr_country',
						'secpostcode' => 'secaddr_postcode'
						);

	        	foreach ($replaceMap as $d2key => $d1key)
		        if (isset($retArray[$outputPrefix.$d1key])){
		        	$retArray[$outputPrefix.$d2key] = $retArray[$outputPrefix.$d1key];
		        	unset($retArray[$outputPrefix.$d1key]);
		        }

			}

	        // if DAL3, we had a number of translations, where old fields were being passed differently ¯\_(ツ)_/¯
	        // ... these shouldn't be passed v3.0 onwards (fixed in metaboxes etc.) but this catches them if passed by accident/somewhere?
	        // ... guess there's no harm in this, if not set wont enact...
	        /* WH removed 30/04/2019 - seems redundant now.
	        if ($zbs->isDAL3()){

	        	// #DAL2ToDAL3FIELDCONVERSION
	        	$replaceMap = array(

	        		// QUOTES

	        			ZBS_TYPE_QUOTE => array(

	        				// dal2 => dal3
	        				'name' => 'title',
	        				'val' => 'value',

	        			)

				);

	        	// only use this obj type replace map
	        	$objReplaceMap = array(); if (isset($replaceMap[$objType])) $objReplaceMap = $replaceMap[$objType];

	        	// any replaces?
        		foreach ($objReplaceMap as $d2key => $d3key){
			        if (isset($retArray[$outputPrefix.$d2key])){
			        	$retArray[$outputPrefix.$d3key] = $retArray[$outputPrefix.$d2key];
			        	unset($retArray[$outputPrefix.$d2key]);
			        }

			    }
				

			} */

	        // can also pass some extras :) /social
	        // for co + contact
	        if ($objType == ZBS_TYPE_CONTACT || $objType == ZBS_TYPE_COMPANY){

		        $extras = array('tw','fb','li');
		        foreach ($extras as $fK){

		            if (!isset($retArray[$outputPrefix.$fK])) $retArray[$outputPrefix.$fK] = '';

		            if (isset($arraySource[$fieldPrefix.$fK])) {

		                $retArray[$outputPrefix.$fK] = sanitize_text_field($arraySource[$fieldPrefix.$fK]);

		            }

		        }

		    }

		    // ... Further, from DAL3+ we now have proper object models, which probably should replace "fields"
		    // above, but for now, churning through both, as sensitively as possible.

		    	// get an obj model, if set
		    	$potentialModel = $zbs->DAL->objModel($objType);

		    	// will be objlayer model if set
		    	if (is_array($potentialModel)){

		    		// cycle through each field + set, if not already set by the above.
		    		foreach ($potentialModel as $fieldKey => $fieldDetail){

		    			// there's a few we ignore :)
		    			if (in_array($fieldKey, array('ID','zbs_site','zbs_team'))) continue;

		    			// if not already set
		    			if (!isset($retArray[$outputPrefix.$fieldKey])){

		    				// retrieve based on type
		    				switch ($fieldDetail['format']){
							
		    					case 'str':
		    					case 'curr': // for now, process curr as str. (probs needs to just validate IS CURR)
	                        		if (isset($arraySource[$fieldPrefix.$fieldKey])) $retArray[$outputPrefix.$fieldKey] = zeroBSCRM_textProcess($arraySource[$fieldPrefix.$fieldKey]);
	                        		break;

		    					case 'int':
			                        if (isset($arraySource[$fieldPrefix.$fieldKey])) {

			                        	$retArray[$outputPrefix.$fieldKey] = sanitize_text_field($arraySource[$fieldPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = preg_replace('@[^0-9]+@i', '-', $retArray[$outputPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = intval($retArray[$outputPrefix.$fieldKey]);

				                    }
			                        break;
		    					case 'uts':
			                        if (isset($arraySource[$fieldPrefix.$fieldKey])) {
				
										$retArray[$outputPrefix.$fieldKey] = sanitize_text_field($arraySource[$fieldPrefix.$fieldKey]);
				                        
			                        	// in case of UTS dates, the $_POST likely passed may be in date format
			                        	// ... if so, take the model default + translate (if set)
			                        	if (isset($fieldDetail['autoconvert']) && $fieldDetail['autoconvert'] == 'date'){

			                        		// translate "01/12/2018" to UTS (without time)
			                        		$retArray[$outputPrefix.$fieldKey] = zeroBSCRM_locale_dateToUTS($retArray[$outputPrefix.$fieldKey],false);

			                        	}
			                        	if (isset($fieldDetail['autoconvert']) && $fieldDetail['autoconvert'] == 'datetime'){

			                        		// translate datetime to UTS (with time)
			                        		$retArray[$outputPrefix.$fieldKey] = zeroBSCRM_locale_dateToUTS($retArray[$outputPrefix.$fieldKey],true);

			                        	}

			                        	$retArray[$outputPrefix.$fieldKey] = preg_replace('@[^0-9]+@i', '-', $retArray[$outputPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = intval($retArray[$outputPrefix.$fieldKey]);

				                    }
			                        break;

		    					case 'bool':
			                        if (isset($arraySource[$fieldPrefix.$fieldKey])) {
			                        	$retArray[$outputPrefix.$fieldKey] = sanitize_text_field($arraySource[$fieldPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = preg_replace('@[^0-9]+@i', '-', $retArray[$outputPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = boolval($retArray[$outputPrefix.$fieldKey]);
				                    }
			                        break;

		    					case 'decimal':
			                        if (isset($arraySource[$fieldPrefix.$fieldKey])){
			                        	$retArray[$outputPrefix.$fieldKey] = sanitize_text_field($arraySource[$fieldPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = preg_replace('@[^0-9]+@i', '-', $retArray[$outputPrefix.$fieldKey]);
				                        $retArray[$outputPrefix.$fieldKey] = floatval($retArray[$outputPrefix.$fieldKey]);
				                    }
			                        break;

		    					default: // basically str.
	                        		if (isset($arraySource[$fieldPrefix.$fieldKey])) $retArray[$outputPrefix.$fieldKey] = zeroBSCRM_textProcess($arraySource[$fieldPrefix.$fieldKey]);
	                        		break;


		    				} // / format switch

		    			} // / not isset

		    		} // / foreach

		    	} // / if has model

	        // $removeEmpties
	        if ($removeEmpties){

	        	$ret = array();
	        	foreach ($retArray as $k => $v){
					
					$intV = (int)$v;

					if (!is_array($v) && !empty($v) && $v != '' && $v !== 0 && $v !== -1 && $intV !== -1){
						$ret[$k] = $v;
					}

	        	}

	        	$retArray = $ret;

	        }

	    return $retArray;
	}

	// generally used for list view reformatting - cleans a contact array into simple format
	// here it takes an array of contacts, and (currently) returns 1 contact simplified
	// This may make more sense in the contact DAL obj layer?
	// >> this has a company variant too, in this file.
	function zeroBSCRM_getSimplyFormattedContact($contacts=array(),$requireOwner=false){

		$return = false;

        // DAL3 + has potential for multi-links, so here we just grab first if there
        if (isset($contacts) && is_array($contacts) && count($contacts) > 0){

                // first only for now...
                $contact = $contacts[0];

                // w adapted so same func can be used (generic) js side
                // works with zeroBSCRMJS_listView_generic_customer
                // provides a simplified ver of customer obj (4 data transit efficiency/exposure)
                $email = ''; 
                if (isset($contact['email']) && !empty($contact['email'])) $email = $contact['email'];
                $return = array(

                    'id'        => $contact['id'],
                    'avatar'    => zeroBS_customerAvatar($contact['id']),
                    'fullname'  => zeroBS_customerName('',$contact,false,false),
                    'email'     => $email

                );
                if ($requireOwner) $return['owner'] = zeroBS_getOwner($contact['id'],true,'zerobs_customer');

        }

        return $return;

    }

/* ======================================================
  	/ GENERIC helpers
   ====================================================== */

/* ======================================================
  	Company helpers
   ====================================================== */
   function zeroBS___________CompanyHelpers(){return;}

	#} Get the COUNT of companies.
	function zeroBS_companyCount($status=false){
		
		global $zbs; return $zbs->DAL->companies->getCompanyCount(array(
			'withStatus'=> $status,
			'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)));

	}

   	// another func which should be skipped 3.0+, just do direct call :)
	function zeroBS_getCompany($coID=-1,$withObjs=false){

		if ($coID !== -1){

			global $zbs;

			#} Super rough. Not sure where we use this, but shouldn't.
			return $zbs->DAL->companies->getCompany($coID,array(
				'withQuotes' => $withObjs,
				'withInvoices' => $withObjs,
				'withTransactions' => $withObjs,
				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY))
			);

		} 

		return false;

	}

	#} Wrapper func for "company" type customers
	// note: $inCountry returns with address 1 or 2 in country (added for logReporter for Miguel (custom extension WH))
	// note: $withStatus returns with specific status  (added for logReporter for Miguel (custom extension WH))
	#} Adapted for 3.0+, note deprecated really, should be using DAL->companies->getCompanies directly
	function zeroBS_getCompanies(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$searchPhrase='',
		$argsOverride=false,
		$withInvoices=false,
		$withQuotes=false,
		$withTransactions=false,
		$inCountry=false,
		$ownedByID=false,
		$withStatus=false,
		$inArr=false


		){


		// $withFullDetails = irrelevant with new DB2 (always returns)
		// $argsOverride CAN NO LONGER WORK :)
		if ($argsOverride !== false) zeroBSCRM_DEPRECATEDMSG('Use of $argsOverride in zeroBS_getCompanies is no longer relevant (DAL3.0)');

		global $zbs;			

			// legacy from dal1
			$actualPage = $page;
			if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
			if ($actualPage < 0) $actualPage = 0;

			// make ARGS
			$args = array(				

				// Search/Filtering (leave as false to ignore)
				'searchPhrase' 	=> $searchPhrase,
				'inArr'			=> $inArr,
				'inCountry'		=> $inCountry,
				'hasStatus'		=> $withStatus,
				'ownedBy' 		=> $ownedByID,

				'withCustomFields'	=> true,
				'withQuotes' 		=> $withQuotes,
				'withInvoices' 		=> $withInvoices,
				'withTransactions' 	=> $withTransactions,
				'withLogs' 			=> false,
				'withLastLog'		=> false,
				'withTags' 			=> false,//$withTags,
				'withOwner' 		=> false,

				//'sortByField' 	=> $sortByField,
				//'sortOrder' 	=> $sortOrder,
				'page'			=> $actualPage,
				'perPage'		=> $perPage,

				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)


			);

			// here ignore owners = true the default, because we're not really forcing ownership anywhere overall,
			// when we do, we should change this/make it check
			if ($ownedByID !== false && is_int($ownedByID) && $ownedByID > 0) {

				$args['ignoreowner'] = false;

			}

			return $zbs->DAL->companies->getCompanies($args);


	}

	// returns email for a company
	function zeroBS_companyEmail($companyID='',$companyArr=false){
		
		global $zbs; return $zbs->DAL->companies->getCompanyEmail($companyID);

	}

/**
 * Retrieves the company ID based on its name.
 *
 * @param  string $company_name  The name of the company for which the ID is required.
 * @return int|bool              Returns the ID of the company if found, false otherwise.
 */
function zeroBS_getCompanyIDWithName( $company_name = '' ) {
	if ( ! empty( $company_name ) ) {
		global $zbs;
		return $zbs->DAL->companies->get_company_id_by_name( $company_name ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
	return false;
}

	#} ExternalID is name in this case :)
	function zeroBS_getCompanyIDWithExternalSource($externalSource='',$externalID=''){

		global $zbs;

		#} No empties, no random externalSources :)
		if (!empty($externalSource) && !empty($externalID) && array_key_exists($externalSource,$zbs->external_sources)){

			#} If here, is legit.
			$approvedExternalSource = $externalSource;

			global $zbs;

			return $zbs->DAL->companies->getCompany(-1,array(
					'externalSource' 	=> $approvedExternalSource,
					'externalSourceUID' => $externalID,
					'onlyID'			=> true,
					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)
				));

		}


		return false;

	}



	// This should probably be deprecated and just called directly.
	// for now just translating
	function zeroBS_getCompaniesForTypeahead($searchQueryStr=''){

		/*
		//gets them all, from a brutal SQL
		global $wpdb;

			if (!empty($searchQueryStr)){

				// param query
				$sql = "SELECT ID as id, post_title as name, post_date as created FROM $wpdb->posts WHERE post_type = 'zerobs_company' AND post_status = 'publish' AND post_title LIKE %s";
				$q = $wpdb->prepare($sql,'%'.$searchQueryStr.'%');
				$results = $wpdb->get_results($q, ARRAY_A);

			} else {

				// straight query
				$sql = "SELECT ID as id, post_title as name, post_date as created FROM $wpdb->posts WHERE post_type = 'zerobs_company' AND post_status = 'publish'";
				$results = $wpdb->get_results($sql, ARRAY_A);
			}

		return $results;
		*/
		global $zbs;

		return $zbs->DAL->companies->getCompanies(array(
				'searchPhrase' 	=> $searchQueryStr,
				'simplified' 	=> true,
				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)
			));

	}


	function zeroBS_getCompanyIDWithEmail($custEmail=''){

		if (!empty($custEmail)){

			global $zbs;
			return $zbs->DAL->companies->getCompany(-1,array(
						'email'         => $custEmail,
						'onlyID'        => true,
						'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_COMPANY)
					));

		} 

		return false;

	}




   #} Add or Update a Company - ideally use $zbs->DAL->companies->addUpdateCompany() rather than this wrapper, in proper code now :)
   function zeroBS_addUpdateCompany(

		$coID = -1,

		$coFields = array(),
		$externalSource='',
		$externalID='',
		$companyDate='',

		$fallBackLog = false,
		$extraMeta = false,
		$automatorPassthrough = false,

		$owner = -1,
		$metaBuilderPrefix = 'zbsc_'

		){


		#} Basics - /--needs status
		#} 27/09/16 - WH - Removed need for zeroBS_addUpdateCustomer to have a "status" passed with customer (defaults to lead for now if not present)
		if (isset($coFields) && count($coFields) > 0){ #} && isset($coFields['zbsc_status'])

			global $zbs;

			#} New flag
			$newCompany = false; $existingMeta = array();


				if ($coID > 0){

					#} Build "existing meta" to pass, (so we only update fields pushed here)
					$existingMeta = $zbs->DAL->companies->getCompany($coID,array());

					#} need to check the dates here. If a date is passed which is BEFORE the current "created" date then overwrite the date with the new date. If a date is passed which is AFTER the current "created" date, then do not update the date..
					#} date changed - created is only in the wp_posts table in DB v1.0
					$originalDate = time();
					if (isset($existingMeta) && is_array($existingMeta) && isset($existingMeta['created']) && !empty($existingMeta['created'])) $originalDate = $existingMeta['created'];

					if (!empty($companyDate) && $companyDate != ''){

						#} DATE PASSED TO THE FUNCTION
						$companyDateTimeStamp = strtotime($companyDate);
						#} ORIGINAL POST CREATION DATE 
						// no need, db2 = UTS $originalDateTimeStamp = strtotime($originalDate);
						$originalDateTimeStamp = $originalDate;

						#} Compare, if $companyDateTimeStamp < then update with passed date
						if($companyDateTimeStamp < $originalDateTimeStamp){

							// straight in there :)
							  $zbs->DAL->companies->addUpdateCompany(array(
									'id'			=>	$coID,
									'limitedFields'	=>array(
										array('key'=>'zbsco_created','val'=>$companyDateTimeStamp,'type'=>'%d')
										)));
						}
					}

					// WH changed 20/05/18 
					// 20/05/18 - Previously this would reload the EXISTING database data 
					// THEN 'override' any passed fields
					// THEN save that down
					// ... this was required when we used old meta objs. (pre db2)
					// ... so if we're now DAL2, we can do away with that and simply pass what's to be updated and mode do_not_update_blanks
					$existingMeta = array();

				} else {

					#} Set flag
					$newCompany = true;

					if (!empty($companyDate)){

						#} DATE PASSED TO THE FUNCTION
						$companyDateTimeStamp = strtotime($companyDate);
						if ($companyDateTimeStamp > 0) $existingMeta = array('created' => $companyDateTimeStamp);

					}

				}

				#} Build using centralised func below, passing any existing meta (updates not overwrites)
				$zbsCompanyMeta = zeroBS_buildCompanyMeta($coFields,$existingMeta,$metaBuilderPrefix,'',true);

	            $we_have_tags = false; //set to false.. duh..

	            # TAG company (if exists) - clean etc here too 
	            if (!empty($coFields['tags'])){

					$tags 		= $coFields['tags'];

					#} Santize tags
					if(is_array($tags) && count($tags) > 0){
						$company_tags = filter_var_array($tags,FILTER_UNSAFE_RAW); 
						// Formerly this used FILTER_SANITIZE_STRING, which is now deprecated as it was fairly broken. This is basically equivalent.
						// @todo Replace this with something more correct.
						foreach ( $company_tags as $k => $v ) {
							$company_tags[$k] = strtr(
								strip_tags( $v ),
								array(
									"\0" => '',
									'"' => '&#34;',
									"'" => '&#39;',
									"<" => '',
								)
							);
						}
						$we_have_tags = true;
					}

	                if ($we_have_tags){

	                	$zbsCompanyMeta['tags'] = array();
						foreach($company_tags as $cTag){

							// find/add tag
							$tagID = $zbs->DAL->addUpdateTag(array(
								'data'=>array(
									'objtype' 		=> ZBS_TYPE_COMPANY,
									'name' 			=> $cTag
									)));

							if (!empty($tagID)) $zbsCompanyMeta['tags'][] = $tagID;

						}

					}
				}


				#} Add external source/externalid
				#} No empties, no random externalSources :)
				$extSourceArr = -1; $approvedExternalSource = ''; #} As this is passed to automator :)
				if (!empty($externalSource) && !empty($externalID) && array_key_exists($externalSource,$zbs->external_sources)){

					#} If here, is legit.
					$approvedExternalSource = $externalSource;

					#} Add/Update record flag
	                // 2.4+ Migrated away from this method to new update_post_meta($postID, 'zbs_customer_ext_'.$approvedExternalSource, $externalID);
	                // 2.52+ Moved to new DAL method :)
	                
	                $extSourceArr = array(
	                    'source' => $approvedExternalSource,
	                    'uid' => $externalID
	                    );

	               	// add/update
	                // DB2, this is just used below :)zeroBS_updateExternalSource($postID,$extSourceArr);
	                $zbsCompanyMeta['externalSources'] = array($extSourceArr);

				} #} Otherwise will just be a random customer no ext source

				#} Got owner?
				if ($owner !== -1) $zbsCompanyMeta['owner'] = $owner;

				#} Update record (All IA is now fired intrinsicly )
				return $zbs->DAL->companies->addUpdateCompany(array(
						'id'	=>	$coID,
						'data' 	=> $zbsCompanyMeta,
						'extraMeta' => $extraMeta,
						'automatorPassthrough' => $automatorPassthrough,
						'fallBackLog' => $fallBackLog
						));


		} // if fields

		return false;

	}

	// v3.0+ this uses the generic zeroBS_buildObjArr, and accepts full args as per contact meta DAL2:
	function zeroBS_buildCompanyMeta($arraySource=array(),$startingArray=array(),$fieldPrefix='zbsco_',$outputPrefix='',$removeEmpties=false,$autoGenAutonumbers=false){

		return zeroBS_buildObjArr($arraySource,$startingArray,$fieldPrefix,$outputPrefix,$removeEmpties,ZBS_TYPE_COMPANY,$autoGenAutonumbers);

	}

	/* Centralised delete company func, including sub-element removal */
	function zeroBS_deleteCompany($id=-1,$saveOrphans=true){

		if (!empty($id)){

			global $zbs;

			return $zbs->DAL->companies->deleteCompany(array('id'=>$id,'saveOrphans'=>$saveOrphans));

		}

		return false;
	}

	// adapted company name builder to use proper DAL3 func
	function zeroBS_companyName($companyID='',$companyArr=array(),$incFirstLineAddr=true,$incID=true){
		
		global $zbs; return $zbs->DAL->companies->getCompanyNameEtc($companyID,$companyArr,array(
				'incFirstLineAddr' 	=> $incFirstLineAddr,
				'incID'				=> $incID
				));
		
	}

	// adapted company name builder to use proper DAL3 func
	function zeroBS_companyAddr($companyID='',$companyArr=array(),$addrFormat = 'short',$delimiter= ', '){
		
		global $zbs; return $zbs->DAL->companies->getCompanyAddress($companyID,$companyArr,array(
				'addrFormat'		=> $addrFormat,
				'delimiter'			=> $delimiter
				));

	}

	// adapted company name builder to use proper DAL3 func
	function zeroBS_companySecondAddr($companyID='',$companyArr=array(),$addrFormat = 'short',$delimiter= ', '){
		
		global $zbs; return $zbs->DAL->companies->getCompany2ndAddress($companyID,$companyArr,array(
				'addrFormat'		=> $addrFormat,
				'delimiter'			=> $delimiter
				));

	}

	// get owner of co - use proper DAL ver plz, not this forwards.
	function zeroBS_getCompanyOwner($companyID=-1){

		if ($companyID !== -1){

			global $zbs;
			return $zbs->DAL->companies->getCompanyOwner($companyID);

		} 

		return false;
	}

	// sets tags, in future just use direct DAL func plz
	function zeroBSCRM_setCompanyTags($coID=-1,$tags=array(),$tagIDs=array(),$mode='replace'){

			if ($coID > 0){

				$args = array(

		            'id'            => $coID,

		            // EITHER of the following:
		            //'tagIDs'        => -1,
		            //'tags'          => -1,

		            'mode'          => $mode
					);

					// got tags?
					if (is_array($tags) && count($tags) > 0) 
						$args['tags'] = $tags;
					else if (is_array($tagIDs) && count($tagIDs) > 0)
						$args['tagIDs'] = $tagIDs;
					else
						return false;

				global $zbs;
				return $zbs->DAL->companies->addUpdateCompanyTags($args);


			}

			return false;
			
	}
	
	// gets tags, in future just use direct DAL func plz
	function zeroBSCRM_getCompanyTagsByID($coID=-1,$justIDs=false){

		global $zbs;
		$tags = $zbs->DAL->companies->getCompanyTags($coID);

		// lazy here, but shouldn't use these old funcs anyhow!
		if ($justIDs){

			$ret = array();
			if (is_array($tags)) foreach ($tags as $t) $ret[] = $t['id'];
			return $ret;

		}

		return $tags;

	}

	// generally used for list view reformatting - cleans a company array into simple format
	// here it takes an array of contacts, and (currently) returns 1 company simplified
	// This may make more sense in the company DAL obj layer?
	// >> this has a contact variant too, in this file.
	function zeroBSCRM_getSimplyFormattedCompany($companies=array(),$requireOwner=false){

		$return = false;

        // DAL3 + has potential for multi-links, so here we just grab first if there
        if (isset($companies) && is_array($companies) && count($companies) > 0){

                // first only for now...
                $company = $companies[0];

                // w adapted so same func can be used (generic) js side
                // works with zeroBSCRMJS_listView_generic_customer
                // provides a simplified ver of customer obj (4 data transit efficiency/exposure)
                $email = ''; 
                if (isset($company['email']) && !empty($company['email'])) $email = $company['email'];
                $return = array(

                	// company only has name, id, email currently
                    'id'        => $company['id'],
                    //'avatar'    => zeroBS_customerAvatar($company['id']),
                    'fullname'  => $company['name'],
                    'email'     => $email

                );
                if ($requireOwner) $return['owner'] = zeroBS_getOwner($company['id'],true,'zerobs_company');

        }

        return $return;

    }
/* ======================================================
  	/ Company helpers
   ====================================================== */

/* ======================================================
  	Quote helpers
   ====================================================== */
   function zeroBS___________QuoteHelpers(){return;}

   	// returns count, inc status optionally
	function zeroBS_quoCount($status=false){
		
		global $zbs; return $zbs->DAL->quotes->getQuoteCount(array(
			'withStatus'=> $status,
			'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)));
	}

   # Quote Status (from list view)
   // WH note - not sure why we're building HTML here, allowing for now.
   // if returnAsInt - will return -1 for not published, -2 for not accepted, or 14int timestamp for accepted
    function zeroBS_getQuoteStatus( $item=false, $returnAsInt=false ) {

        #} marked accepted?
        $accepted = false;
        if (is_array($item) && isset($item['accepted'])) $accepted = $item['accepted'];

        # HERE TODO:
        # if acceptedArr = output "accepted xyz"
        # else if !templated outut "not yet published"
        # else if templated output "not yet accepted"

        if ($accepted > 0){

            if ($returnAsInt) return $accepted;

            $td = '<strong>'.__('Accepted',"zero-bs-crm").' ' . date(zeroBSCRM_getDateFormat(),$accepted) . '</strong>';

        } else {
                
            #} get extra deets
            $zbsTemplated = $item['template'];
            if (!empty($zbsTemplated)) {
                
                if ($returnAsInt) return -2;

                #} is published
                $td = '<strong>'.__('Created, not yet accepted',"zero-bs-crm").'</strong>';

            } else {

                if ($returnAsInt) return -1;

                #} not yet published
                $td = '<strong>'.__('Not yet published',"zero-bs-crm").'</strong>';

            }


        }


        return $td;
    }

    // Get next available sequential quote ID
	function zeroBSCRM_getNextQuoteID(){

		#} Retrieves option, and returns, is dumb for now.
		// DAL1+2: return (int)get_option('quoteindx',$defaultStartingQuoteID)+1;

		// DAL3:
		$potential = (int)zeroBSCRM_getSetting('quoteindx',true);
		if ($potential > 0) 
			return $potential+1;
		else
			return zeroBSCRM_getQuoteOffset()+1;

	}

	// set the current max used quoteid
	function zeroBSCRM_setMaxQuoteID($newMax=0){

		$existingMax = zeroBSCRM_getNextQuoteID();

		if ($newMax >= $existingMax){

			// DAL3:
			global $zbs;
			return $zbs->settings->update('quoteindx',$newMax);

		}

		return false;
	}


	#} Minified get offset func
	function zeroBSCRM_getQuoteOffset(){

		global $zbs;
		$offset = (int)$zbs->settings->get('quoteoffset');

		if (empty($offset) || $offset < 0) $offset = 0;

		return $offset;

	}

	#} Get the content of a quote:
	function zeroBS_getQuoteBuilderContent($qID=-1){

		global $zbs; 

		//return $zbs->DAL->quotes->getQuoteContent($qID);
		// kept in old format for continued support
		return array(
			'content' => $zbs->DAL->quotes->getQuoteContent($qID),
			'template_id' => -1
		);
		/* replaced by this really: getQuoteContent()
		if ($qID !== -1){

	            $content = get_post_meta($qID, 'zbs_quote_content' , true ) ;
	            $content = htmlspecialchars_decode($content, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401);
			
				return array(
					'content'=>$content,
					'template_id' => get_post_meta($qID, 'zbs_quote_template_id' , true ) 
					);

		} else return false; */
	}

	#} Old get func, use proper form if writing fresh code
	// used to return array('id','meta','customerid','quotebuilder')
	// ... so any existing use may be broken (have mass replaced in core at this point)
	// ... use direct ->getQuotes in future anyhow.
	// (which is diff format! any use of zeroBS_getQuote is now borked. - couldn't find any though + did proper search.)
	function zeroBS_getQuote($qID=-1,$withQuoteBuilderData=false){

		if ($qID !== -1){

			global $zbs;

			#} Super rough. Not sure where we use this, but shouldn't.
			return $zbs->DAL->quotes->getQuote($qID,array(
				'withLineItems' => $withQuoteBuilderData,
				'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE))
			);

		} 

		return false;
	}

	#} Marks a quote as "accepted" and saves as much related data as poss on accepter
	// again, use DAL to do this in future (zbs->DAL->quotes->addUpdateQuoteStatus directly)
	function zeroBS_markQuoteAccepted($qID=-1,$quoteSignedBy=''){

		if ($qID !== -1){

			global $zbs;

			return $zbs->DAL->quotes->addUpdateQuoteAccepted(array(
				'id' => $qID,
				'accepted' => time(),
				'signedby' => $quoteSignedBy,
				'ip' => zeroBSCRM_getRealIpAddr()
				));

		} 

		return false;

	}

	#} UNMarks a quote as "accepted" and saves as much related data as poss on accepter
	// again, use DAL to do this in future (zbs->DAL->quotes->addUpdateQuoteStatus directly)
	function zeroBS_markQuoteUnAccepted($qID=-1){

		if ($qID !== -1){

			global $zbs;

			return $zbs->DAL->quotes->addUpdateQuoteAccepted(array(
				'id' => $qID,
				'accepted' => ''
				));

		} 

		return false;

	}

	// Please use direct dal calls in future work.
	function zeroBS_getQuotes(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()
		
		){

				// $withFullDetails = irrelevant with new DB2 (always returns)
				global $zbs;			

					// legacy from dal1
					$actualPage = $page;
					if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
					if ($actualPage < 0) $actualPage = 0;

					// make ARGS
					$args = array(				

						// Search/Filtering (leave as false to ignore)
						'searchPhrase' 	=> $searchPhrase,
						'inArr'			=> $inArray,
						'quickFilters'  => $quickFilters,
						'isTagged'  	=> $hasTagIDs,

						'withAssigned'	=> $withCustomerDeets,

						'sortByField' 	=> $sortByField,
						'sortOrder' 	=> $sortOrder,
						'page'			=> $actualPage,
						'perPage'		=> $perPage,

						'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)


					);

					return $zbs->DAL->quotes->getQuotes($args);
	}


	// Please use direct dal calls in future work.
	function zeroBS_getQuotesCountIncParams(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'quickFilters'  => $quickFilters,
					'isTagged'  	=> $hasTagIDs,

					// just count thx
					'count'			=> true,
					'withAssigned'	=> false,

					//'sortByField' 	=> $sortByField,
					//'sortOrder' 	=> $sortOrder,
					'page'			=> -1,
					'perPage'		=> -1,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)


				);

				return $zbs->DAL->quotes->getQuotes($args);
	}

	// Please use direct dal calls in future work.
	function zeroBS_getQuotesForCustomer(

		$customerID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$withQuoteBuilderData=true

		){

			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedContact' 	=> $customerID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					'sortByField' 	=> 'ID',
					'sortOrder' 	=> 'DESC'	,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)


				);

				return $zbs->DAL->quotes->getQuotes($args);
	}

	// Please use direct dal calls in future work.
	function zeroBS_getQuotesForCompany(

		$companyID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$withQuoteBuilderData=true

		){

			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedCompany' 	=> $companyID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					'sortByField' 	=> $orderBy,
					'sortOrder' 	=> $order,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_QUOTE)


				);

				return $zbs->DAL->quotes->getQuotes($args);
	}


	// Please use direct dal calls in future work.
	function zeroBS_getQuoteTemplate($quoteTemplateID=-1){

		if ($quoteTemplateID > 0){
			
			/*
			return array(
			'id'=>$tID,
			'meta'=>get_post_meta($tID, 'zbs_quotemplate_meta', true),
			'zbsdefault'=>get_post_meta($tID, 'zbsdefault', true),
			'content'=> get_post_field('post_content', $tID) #http://wordpress.stackexchange.com/questions/9667/get-wordpress-post-content-by-post-id
			);
			*/

			global $zbs;

			return $zbs->DAL->quotetemplates->getQuotetemplate($quoteTemplateID);

		}
		
		return false; 

	} 

	// Please use direct dal calls in future work.
	function zeroBS_getQuoteTemplates($withFullDetails=false,$perPage=10,$page=0,$searchPhrase=''){

				global $zbs;
				return $zbs->DAL->quotetemplates->getQuotetemplates(array(
						'searchPhrase' => $searchPhrase,
			            'page'          => $page,
			            'perPage'       => $perPage,
			            'checkDefaults'	=> true
					));

			/* was returning

				core post + 
					$retObj['meta'] 			= get_post_meta($ele->ID, 'zbs_quotemplate_meta', true);
					$retObj['zbsdefault'] 		= get_post_meta($ele->ID, 'zbsdefault', true);

			*/
	}

	// retrieves a count for listview retrievedata, really
	function zeroBS_getQuoteTemplatesCountIncParams($withFullDetails=false,$perPage=10,$page=0,$searchPhrase=''){

				global $zbs;

				return $zbs->DAL->quotetemplates->getQuotetemplates(array(
						'searchPhrase'	=> $searchPhrase,
			            'count'        	=> 1,
			            'page'        	=> -1,
			            'perPage'       => -1,
					));
	}

	// moves a quote from being assigned to one cust, to another
	// this is a fill-in to match old DAL2 func, however DAL3+ can accept customer/company,
	// ... so use the proper $DAL->addUpdateObjectLinks for fresh code
	function zeroBSCRM_changeQuoteCustomer($id=-1,$contactID=0){

		if (!empty($id) && $contactID > 0){

            global $zbs;
            return $zbs->DAL->quotes->addUpdateObjectLinks($id,array($contactID),ZBS_TYPE_CONTACT);

	    }

	    return false;

	}

/* ======================================================
  	/ Quote helpers
   ====================================================== */

/* ======================================================
  	Invoice helpers
   ====================================================== */
   function zeroBS___________InvoiceHelpers(){return;}


   	// returns count, inc status optionally
	function zeroBS_invCount($status=false){
		
		global $zbs; return $zbs->DAL->invoices->getInvoiceCount(array(
			'withStatus'=> $status,
			'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)));
	}

    // Get next available sequential invoice ID
	function zeroBSCRM_getNextInvoiceID(){

		// DAL3:
		$potential = (int)zeroBSCRM_getSetting('invoiceindx',true);
		if ($potential > 0) {
			return $potential+1;
		}
		else {
			return zeroBSCRM_getInvoiceOffset()+1;
		}

	}

	// set the current max used invid
	function zeroBSCRM_setMaxInvoiceID($newMax=0){

		$existingMax = zeroBSCRM_getNextInvoiceID();

		if ($newMax >= $existingMax){

			// DAL3:
			global $zbs;
			return $zbs->settings->update('invoiceindx',$newMax);

		}

		return false;
	}

	// Minified get offset func
	function zeroBSCRM_getInvoiceOffset(){

		global $zbs;
		// this only exists on legacy sites
		$offset = (int)$zbs->settings->get( 'invoffset' );

		if ( empty($offset) || $offset < 0 ) {
			$offset = 0;
		}

		return $offset;

	}

	// outdated, outmoded, use proper ->DAL calls not this in fresh code
	function zeroBS_getInvoices(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'quickFilters'  => $quickFilters,
					'isTagged'  	=> $hasTagIDs,

					'withAssigned'	=> $withCustomerDeets,

					'sortByField' 	=> $sortByField,
					'sortOrder' 	=> $sortOrder,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)


				);

				return $zbs->DAL->invoices->getInvoices($args);

	}

	// outdated, outmoded, use proper ->DAL calls not this in fresh code
	function zeroBS_getInvoicesCountIncParams(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'quickFilters'  => $quickFilters,
					'isTagged'  	=> $hasTagIDs,

					// just count thx
					'count'			=> true,
					'withAssigned'	=> false,

					//'sortByField' 	=> $sortByField,
					//'sortOrder' 	=> $sortOrder,
					'page'			=> -1,
					'perPage'		=> -1,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)


				);

				return $zbs->DAL->invoices->getInvoices($args);
	}


	// DAL3 translated.
	// invs model now looks diff so adapt everywhere with getInvoice
	function zeroBS_getInvoice($invoiceID=-1){

		if ($invoiceID > 0){
			
			/*
			return array(
				'id'=>(int)$wpPostID,
				'meta'=>get_post_meta($wpPostID, 'zbs_customer_invoice_meta', true),
				'customerid'=>get_post_meta($wpPostID, 'zbs_customer_invoice_customer', true),
				'zbsid'=>get_post_meta($wpPostID, 'zbsid', true)
				);
			*/

			global $zbs;

			return $zbs->DAL->invoices->getInvoice($invoiceID);

		}
		
		return false; 
	}

	// wh quick shim - checks if (Contact) has any invoices efficiently
	function zeroBS_contactHasInvoice($contactID=-1){
		
		if ($contactID > 0){

			global $zbs;

			return $zbs->DAL->contacts->contactHasInvoice($contactID);

		}
		
		return false;

	}
	

	// just do direct call in future, plz
	function zeroBS_getInvoicesForCustomer(

		$customerID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$orderBy='ID',
		$order='DESC'

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedContact' 	=> $customerID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					'sortByField' 	=> $orderBy,
					'sortOrder' 	=> $order,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)


				);

				return $zbs->DAL->invoices->getInvoices($args);
	}

	// just do direct call in future, plz
	function zeroBS_getInvoicesForCompany(

		$companyID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$orderBy='post_date',
		$order='DESC'

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedCompany' 	=> $companyID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					'sortByField' 	=> $orderBy,
					'sortOrder' 	=> $order,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_INVOICE)


				);

				return $zbs->DAL->invoices->getInvoices($args);
	}


	// WH adapted to DAL3
	function zeroBS_getTransactionsForInvoice($invID=-1){

		global $zbs;
		return $zbs->DAL->transactions->getTransactions(array('assignedInvoice'=>$invID,'perPage'=>1000,'ignoreowner'=>zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)));

		/* think this was probably faulty, as it seems to always return 1 id? 
		... presume want array of transactions, so returning that :)

		global $wpdb;
		$ret = false;
		#} No empties, no validation, either.
		if (!empty($invID)){
			#} Will find the post, if exists, no dealing with dupes here, yet?
			$sql = $wpdb->prepare("select post_id from $wpdb->postmeta where meta_value = '%d' And meta_key='zbs_invoice_partials'", $invID);
			$potentialTransactionList = $wpdb->get_results($sql);
			if (count($potentialTransactionList) > 0){
				if (isset($potentialTransactionList[0]) && isset($potentialTransactionList[0]->post_id)){
					$ret = $potentialTransactionList[0]->post_id;
				}
			}		
		}
		return $ret;
		*/
	}


	// moves a inv from being assigned to one cust, to another
	// this is a fill-in to match old DAL2 func, however DAL3+ can accept customer/company,
	// ... so use the proper $DAL->addUpdateObjectLinks for fresh code
	function zeroBSCRM_changeInvoiceCustomer($id=-1,$contactID=0){

		if (!empty($id) && $contactID > 0){

            global $zbs;
            return $zbs->DAL->invoices->addUpdateObjectLinks($id,array($contactID),ZBS_TYPE_CONTACT);

	    }

	    return false;

	}


	// grabs invoice customer
	function zeroBSCRM_getInvoiceCustomer($invID=-1){


		if (!empty($invWPID)){

			global $zbs;
			return $zbs->DAL->invoices->getInvoiceContact($invID);

	    }

	    return false;

	}

	// updates a stauts, if inv exists.
	// use $zbs->DAL->invoices->setInvoiceStatus($invoiceID,$statusStr); for new code
	function zeroBS_updateInvoiceStatus($invoiceID=-1,$statusStr='Draft'){

		if ( in_array( $statusStr, zeroBSCRM_getInvoicesStatuses() ) ){

			$potentialInvoice = zeroBS_getInvoice($invoiceID);
			if (isset($potentialInvoice) && is_array($potentialInvoice)){

				// dal3 
				global $zbs;
				return $zbs->DAL->invoices->setInvoiceStatus($invoiceID,$statusStr);

			}

		}

		return false;

	}


/* ======================================================
		Invoice 3.0 helpers
	====================================================== */
function zeroBS___________InvoiceV3Helpers(){return;}


// this function probably becomes defunct when DAL ready. Is cos right now, if invoice_meta = '' then it's a new invoice, so should return defaults.
function zeroBSCRM_get_invoice_defaults( $obj_id = -1 ) {

	// Settings
	$settings = zeroBSCRM_get_invoice_settings();

	$now = time();
	$default_date = jpcrm_uts_to_date_str( $now, 'Y-m-d' );

	// If it has reference as autonumber, determine next number.
	if ( $settings['reftype'] === 'autonumber' ) {
		$next_number = $settings['refnextnum'];
		$prefix = $settings['refprefix'];
		$suffix = $settings['refsuffix'];
		$id_override = $prefix . $next_number . $suffix;
	} else {
		$id_override = $settings['defaultref'];
	}

	$defaults = array(
		'status'                    => 'Draft',
		'status_label'              => __( 'Draft', 'zero-bs-crm' ),
		'new_invoice'               => true,
		'id'                        => $obj_id,
		'invoice_items'             => array(),
		'invoice_hours_or_quantity' => 'quantity',
		'invoice_contact'           => -1,
		'invoice_company'           => -1,
		'id_override'               => $id_override,
		'date_date'                 => $default_date, // need to sort this out on the way out (in TS to outputtable date for Date Picker)
		'date'                      => $now,
		'due'                       => 0,
		'hash'                      => zeroBSCRM_hashes_GetHashForObj( $obj_id, ZBS_TYPE_INVOICE ),
		'logo_url'                  => $settings['logo'],
		'bill'                      => '',
		'bill_name'                 => '',
		'settings'                  => $settings,
		'product_index'             => zeroBSCRM_getProductIndex(),
		'preview_link'              => '/invoices/hash',
		'pdf_installed'             => zeroBSCRM_isExtensionInstalled( 'pdfinv' ),
		'portal_installed'          => zeroBSCRM_isExtensionInstalled( 'portal' ),
		'totals'                    => array(
			'invoice_discount_total' => 0,
			'invoice_discount_type'  => '%',
			'invoice_postage_total'  => 0,
		),
	);
	return $defaults;

}


	#} wrapper as right now it was loading the full settings into the page. Tidy up page to have the translations here. 
	#} WH - is it possible that some languages here will mess with the output? character encoding wise?
	function zeroBSCRM_get_invoice_settings(){

	    global $zbs;
	    
	    $all_settings = $zbs->settings->getAll();

        $reference_label = zbs_ifAV( $all_settings,'reflabel','' );
        if( empty( $reference_label ) ) {
            $reference_label = __('Reference', 'zero-bs-crm');
        }

        // Check if it is the first invoice
        $first_invoice = ! $zbs->DAL->invoices->getFullCount();
	    
	    $invoice_settings = array(
	        'b2bmode'           => zbs_ifAV($all_settings,'companylevelcustomers',false),
	        'invtax'            => zbs_ifAV($all_settings,'invtax',''),
	        'invpandp'          => zbs_ifAV($all_settings,'invpandp',''),
	        'invdis'            => zbs_ifAV($all_settings,'invdis',''),
	        'logo'              => zbs_ifAV($all_settings,'invoicelogourl',''),
	        'bizname'           => zbs_ifAV($all_settings,'businessname',''),
	        'yourname'          => zbs_ifAV($all_settings,'businessyourname',''),
	        'defaultref'        => zbs_ifAV($all_settings,'defaultref',''),
            'reftype'           => zbs_ifAV($all_settings,'reftype',''),
            'refprefix'         => zbs_ifAV($all_settings,'refprefix',''),
            'refnextnum'        => zbs_ifAV($all_settings,'refnextnum',''),
            'refsuffix'         => zbs_ifAV($all_settings,'refsuffix',''),
	        'isfirstinv'          => $first_invoice,
	        'invhash'           => zbs_ifAV($all_settings,'easyaccesslinks',''),
	        'hideid'            => zbs_ifAV($all_settings,'invid',false),
	        'businessextra'     => nl2br(zeroBSCRM_textExpose(zbs_ifAV($all_settings,'businessextra',''))),
	        'businessyouremail' => zbs_ifAV($all_settings,'businessyouremail',''),
	        'businessyoururl'   => zbs_ifAV($all_settings,'businessyoururl',''),
	        'settings_slug'     => admin_url("admin.php?page=" . $zbs->slugs['settings']) . "&tab=invbuilder",
	        'biz_settings_slug'     => admin_url("admin.php?page=" . $zbs->slugs['settings']) . "&tab=bizinfo",
	        'addnewcontacturl' => jpcrm_esc_link('create',-1,'zerobs_customer'),
	        'addnewcompanyurl' => jpcrm_esc_link('create',-1,'zerobs_company'),
	        'contacturlprefix' => jpcrm_esc_link('edit',-1,'zerobs_customer',true),
	        'companyurlprefix' => jpcrm_esc_link('edit',-1,'zerobs_company',true),
	        'lang'                  => array(
	                'invoice_number'    => zeroBSCRM_slashOut(__('ID', 'zero-bs-crm'),true),
	                'invoice_date'      => zeroBSCRM_slashOut(__('Invoice date', 'zero-bs-crm'),true),
				'invoice_status'          => zeroBSCRM_slashOut( __( 'Status', 'zero-bs-crm' ), true ),
				'status_unpaid'           => zeroBSCRM_slashOut( __( 'Unpaid', 'zero-bs-crm' ), true ),
				'status_paid'             => zeroBSCRM_slashOut( __( 'Paid', 'zero-bs-crm' ), true ),
				'status_overdue'          => zeroBSCRM_slashOut( __( 'Overdue', 'zero-bs-crm' ), true ),
				'status_draft'            => zeroBSCRM_slashOut( __( 'Draft', 'zero-bs-crm' ), true ),
				'status_deleted'          => zeroBSCRM_slashOut( __( 'Deleted', 'zero-bs-crm' ), true ),
	                'reference'         => zeroBSCRM_slashOut( $reference_label,true),
	                'autogenerated'     => zeroBSCRM_slashOut( __('Generated on save', 'zero-bs-crm'),true),
	                'refsettings'       => zeroBSCRM_slashOut( __('Set up your reference type here', 'zero-bs-crm'),true),
                    'nextref'           => zeroBSCRM_slashOut( __('Next reference expected', 'zero-bs-crm'),true),
	                'due_date'          => zeroBSCRM_slashOut(__('Due date', 'zero-bs-crm'),true),
	                'frequency'         => zeroBSCRM_slashOut(__('Frequency', 'zero-bs-crm'),true),
	                'update'            => zeroBSCRM_slashOut(__('Update', 'zero-bs-crm'),true),
	                'remove'            => zeroBSCRM_slashOut(__('Remove', 'zero-bs-crm'),true),
	                'biz_info'          => zeroBSCRM_slashOut(__('Your business information', 'zero-bs-crm'),true),
	                'add_edit'          => zeroBSCRM_slashOut(__('Edit '.jpcrm_label_company().' Details', 'zero-bs-crm'),true),
	                'add_logo'          => zeroBSCRM_slashOut(__('Add your logo', 'zero-bs-crm'),true),
	                'send_to'           => zeroBSCRM_slashOut(__('Assign invoice to', 'zero-bs-crm'),true),
	                'customise'         => zeroBSCRM_slashOut(__('Customise', 'zero-bs-crm'),true),
	                'hours'             => zeroBSCRM_slashOut(__('Hours', 'zero-bs-crm'),true),
	                'quantity'          => zeroBSCRM_slashOut(__('Quantity', 'zero-bs-crm'),true),
	                'description'       => zeroBSCRM_slashOut(__('Description', 'zero-bs-crm'),true),
	                'price'             => zeroBSCRM_slashOut(__('Price', 'zero-bs-crm'),true),
	                'rate'              => zeroBSCRM_slashOut(__('Rate', 'zero-bs-crm'),true),
	                'tax'               => zeroBSCRM_slashOut(__('Tax', 'zero-bs-crm'),true),
	                'add_row'           => zeroBSCRM_slashOut(__('Add row', 'zero-bs-crm'),true),
	                'remove_row'        => zeroBSCRM_slashOut(__('Remove row', 'zero-bs-crm'),true),
	                'amount'            => zeroBSCRM_slashOut(__('Amount', 'zero-bs-crm'),true),
	                'discount'          => zeroBSCRM_slashOut(__('Discount', 'zero-bs-crm'),true),
	                'shipping'          => zeroBSCRM_slashOut(__('Shipping', 'zero-bs-crm'),true),
	                'tax_on_shipping'   => zeroBSCRM_slashOut(__('Tax on shipping', 'zero-bs-crm'),true),
	                'due'               => array(
	                                        'none'      => zeroBSCRM_slashOut(__('No due date', 'zero-bs-crm'),true),
	                                        'on'        => zeroBSCRM_slashOut(__('Due on receipt', 'zero-bs-crm'),true),
	                                        'ten'       => zeroBSCRM_slashOut(__('Due in 10 days', 'zero-bs-crm'),true),
	                                        'fifteen'   => zeroBSCRM_slashOut(__('Due in 15 days', 'zero-bs-crm'),true),
	                                        'thirty'    => zeroBSCRM_slashOut(__('Due in 30 days', 'zero-bs-crm'),true),
	                                        'fortyfive' => zeroBSCRM_slashOut(__('Due in 45 days', 'zero-bs-crm'),true),
	                                        'sixty'     => zeroBSCRM_slashOut(__('Due in 60 days', 'zero-bs-crm'),true),
	                                        'ninety'    => zeroBSCRM_slashOut(__('Due in 90 days', 'zero-bs-crm'),true)
	                ),
	                'preview'           => zeroBSCRM_slashOut(__('Preview', 'zero-bs-crm'),true),
	                'dl_pdf'            => zeroBSCRM_slashOut(__('Download PDF', 'zero-bs-crm'),true),
	                'bill_to'           => zeroBSCRM_slashOut(__('Enter email address or name', 'zero-bs-crm'),true),
	                'edit_record'       => zeroBSCRM_slashOut(__('Edit record', 'zero-bs-crm'),true),
	                'no_tax'            => zeroBSCRM_slashOut(__('None', 'zero-bs-crm'),true),
	                'taxgrouplabel'		=> zeroBSCRM_slashOut(__('Rates', 'zero-bs-crm'),true),
	                'subtotal'         => zeroBSCRM_slashOut(__('Subtotal', 'zero-bs-crm'),true),
	                'total'             => zeroBSCRM_slashOut(__('Total', 'zero-bs-crm'),true),
	                'amount_due'        => zeroBSCRM_slashOut(__('Amount due', 'zero-bs-crm'),true),
	                'partial_table'     => zeroBSCRM_slashOut(__('Payments', 'zero-bs-crm'),true),
	                'incomplete'     => zeroBSCRM_slashOut(__('Incomplete', 'zero-bs-crm'),true),
	                'rowtitleplaceholder' => zeroBSCRM_slashOut(__('Item title', 'zero-bs-crm'),true),
	                'rowdescplaceholder' => zeroBSCRM_slashOut(__('Item description', 'zero-bs-crm'),true),
	                'noname' => zeroBSCRM_slashOut(__('Unnamed', 'zero-bs-crm'),true), // no name on typeahead,
	                'noemail' => zeroBSCRM_slashOut(__('No email', 'zero-bs-crm'),true), // no email on typeahead,
	                'contact' => zeroBSCRM_slashOut(__('Contact', 'zero-bs-crm'),true), // contact view button (if assigned)
	                'company' => zeroBSCRM_slashOut(jpcrm_label_company(),true), // contact view button (if assigned)
	                'view' => zeroBSCRM_slashOut(__('View', 'zero-bs-crm'),true),
	                'addnewcontact' => zeroBSCRM_slashOut(__('Add new contact', 'zero-bs-crm'),true),
	                'newcompany' => zeroBSCRM_slashOut(__('new '.jpcrm_label_company(), 'zero-bs-crm'),true),
	                'or' => zeroBSCRM_slashOut(__('or', 'zero-bs-crm'),true),

	                // send email modal
	                'send_email'        => zeroBSCRM_slashOut(__('Email invoice', 'zero-bs-crm'),true),
	                'sendthisemail'        => zeroBSCRM_slashOut(__('Send this invoice via email:', 'zero-bs-crm'),true),
	                'toemail'        => zeroBSCRM_slashOut(__('To email:', 'zero-bs-crm'),true),
	                'toemailplaceholder'        => zeroBSCRM_slashOut(__('e.g. mike@gmail.com', 'zero-bs-crm'),true),
	                'attachassoc'        => zeroBSCRM_slashOut(__('Attach associated files', 'zero-bs-crm'),true),
	                'attachpdf'        => zeroBSCRM_slashOut(__('Attach as PDF', 'zero-bs-crm'),true),
	                'sendthemail'        => zeroBSCRM_slashOut(__('Send', 'zero-bs-crm'),true),
	                'sendneedsassignment'        => zeroBSCRM_slashOut(__('To send an email, this invoice needs to be assigned to a contact or company with a valid email address.', 'zero-bs-crm'),true),
	                'sendingemail'        => zeroBSCRM_slashOut(__('Sending email...', 'zero-bs-crm'),true),
	                'senttitle'        => zeroBSCRM_slashOut(__('Invoice sent', 'zero-bs-crm'),true),
	                'sent'        => zeroBSCRM_slashOut(__('Your invoice has been sent by email', 'zero-bs-crm'),true),
	                'senderrortitle'        => zeroBSCRM_slashOut(__('Error sending', 'zero-bs-crm'),true),
	                'senderror'        => zeroBSCRM_slashOut(__('There was an error sending this invoice via email.', 'zero-bs-crm'),true),



	        )
	    );
	    return $invoice_settings;

	}

	#} Invoicing Pro - needs product index 
	// WH: Don't like the lazy naming
	function zeroBSCRM_getProductIndex(){
	    $product_index = array();
	    apply_filters('zbs_product_index_array', $product_index);
	    return $product_index;
	}


	// wrapper now for zeroBSCRM_hashes_GetObjFromHash
	function zeroBSCRM_invoicing_getFromHash($hash = '', $pay = -1){

		return zeroBSCRM_hashes_GetObjFromHash($hash,$pay,ZBS_TYPE_INVOICE);


	}

	// wrapper now for zeroBSCRM_hashes_GetObjFromHash
	function zeroBSCRM_quotes_getFromHash($hash = ''){

		return zeroBSCRM_hashes_GetObjFromHash($hash,-1,ZBS_TYPE_QUOTE);


	}


	// NOTE ON FOLLOWING:
	// ... this is MS's centralised func which centralises Inv data req. but it's still clunky.
	// ... here I've shimmed in DAL3 data -> this clunky centralised model.
	// ... could do with a complete rewrite to use proper DAL3 models tbh.
	// for now doing what can without taking months over it.

	/**
	 *  This file has the various functions used to control the invoice metaboxes
	 *  Wrappers so can be used throughout and switched over when it comes to it
	 *   
	 *  The current metabox output, has also been changed to draw with JS now given
	 *  the added complexity of the tax table and discount per line
	 * 
	 *  The calculation routine has also been reviewed to calculate the tax due
	 *  AFTER the line items discount has been applied
	 * 
	 *  Drawing a new line was already available in JS, but the initial load (new) and edit
	 *  were messily drawn in PHP
	 * 
	 *  Now it simply stores the invoice meta as one big data JSON structure outlined below
	 *  data format described below
	 * 
	 *  JSON object for invoice
	 * 
	 *  invoiceObj = {
	 *!                 invoice_id: 5,        // ID in the database - usually the invoice ID.
	 *!                 invoice_custom_id: -1 // the ID if over-written by settings (WH REMOVED, use id_override)
	 *                      
	 *!                 status:  paid,        // not defined in settings - should be? (draft, unpaid, paid, overdue)
	 * 
	 *                  preview_link:         // generated from hash
	 *                  pdf_dl_link:          // downloaded on fly
	 * 
	 *!                  hash:                 // the invoice hash (for front end accessible pages)
	 * 
	 *                  pdf_template:         // the template to use 
	 *                  portal_template:      // allow the choice of portal template (0 = default)
	 *                  email_template:       // allow the choice of email template (0 = default) 
	 * 
	 *                  invoice_frequency:    // invoicing pro only (0 = once only, 1 = week, 2 = month, 3 = year)
	 * 
	 *                  invoice_number:       // this is over-ridable in settings
	 *                  invoice_date:         // date of the invoice    
	 *                  invoice_due:          // when due -1 (no due date), 0 (on receipt), 10, 15, 30, 45, 60, 90 (days in advance of invoice date)
	 *                  
	 *!                  invoice_ref:          // internal reference number      
	 * 
	 *                  invoice_parent:       // invoice pro only (0 for parent), id of parent if child
	 *                        
	 *                  invoice_pay_via:      // 0 online, 1 bank transfer, 2 (both) - Zak addition to show online payment only for some
	 * 
	 * 
	 *!                  invoice_logo_url:    // url of the invoice logo (default, or custom per invoice)
	 *                  invoice_business_details:   // the details from settings to go on the invoice (also in settings obj)
	 * 
	 * 
	 *                  invoice_send_to:       // email to send the invoice to
	 *!                 invoice_contact:       // 0 or contact ID
	 *!                 invoice_company:       // 0 or company ID
	 *                  invoice_address_to:    // 0 contact or 1 company. So if assigned to Mike, can be address to a company (i.e. Mike Stott: Jetpack CRM, Mike Stott: Epic Plugins) etc
	 * 
	 * 
	 *                  invoice_hours_or_quantity:    0 for hours, 1 for quantity
	 *                  
	 *                  invoice_items:   {
	 *                                      item_id: (line_item ID)
	 *                                      order:   (order in list, i.e. 0,1,2,3,4,5) 
	 *                                      title:  
	 *                                      description: 
	 *                                      unit: 
	 *                                      price: 
	 *                                      tax_ids: {
	 *                                              id: 1, rate: 20,
	 *                                              id: 2, rate: 19
	 *                                      },
	 *                                      
	 *                                    },{
	 *                                    
	 *                                    }
	 * 
	 *                  invoice_discount:   0,
	 *                  invoice_shipping:   0,
	 *                  invoice_shipping_tax: {
	 *                                      tax_ids:{
	 *                                             id: 1, rate: 20,
	 *                                             id: 2, rate: 19
	 *                                      }
	 *                  },
	 * 
	 *                  invoice_tip:        0, 1 (allow tip) - not in UI yet
	 *                  invoice_partial:    0, 1 (allow partial payment) - in UI already (i.e. can assign multiple transactions) need to handle it via checkout (i.e. pay full amount, or pay instalments)
	 * 
	 *                  transactions: {                             //the transactions against the invoice (array to allow for partial payments)
	 *                                      transaction_id: 5,
	 *                                      amount: 200,
	 *                                      status: paid, 
	 *                                  },
	 *                  invoice_attachments: {
	 *                              id: 1,
	 *                              url:  uploaded_url
	 *                              send: 0,1     
	 *                  },
	 *                  invoice_custom_fields: {
	 *                          id: 1, 
	 *                          label: "vesting period",
	 *                          type:  "date",
	 *                          value: "20/10/2019"
	 *                  },
	 *                  //what the invoice settings are (biz info, tax etc)
	 *                  settings: {
	 *                      
	 *                  }
	 * 
	 *                }
	 * 
	 * 
	 *   tax_linesObj = {
	 *                      id:       
	 *                      name:    (e.g. VAT, GST)
	 *                      rate:    (%)
	 *                  } 
	 */


	 // this gets the data (from the current DAL and outputs it to the UI) - can get via jQuery 
	 // once happy it works and fills the current databse. This will need switching over come 
	 // the new DAL database structure but allows me to work with the UI now ahead of time.



// wh Centralised, is ultimately output via ajax zeroBSCRM_AJAX_getInvoice function in Control.Invoices
// was called zeroBSCRM_getInvoiceData -> zeroBSCRM_invoicing_getInvoiceData
function zeroBSCRM_invoicing_getInvoiceData( $invID = -1 ) {

	global $zbs;

	$data = array();

	// viable id?
	if ( $invID > 0 ) {

		// build response
		$data['invoiceObj'] = array();

		$invoice = $zbs->DAL->invoices->getInvoice( $invID, array(

			// if these two passed, will search based on these
			'idOverride'        => false, // direcetly checks 1:1 match id_override
			'searchPhrase'      => false, // more generic, searches id_override (reference) (and not lineitems (toadd?))

			'externalSource'    => false,
			'externalSourceUID' => false,

			// with what?
			'withLineItems'     => true,
			'withCustomFields'  => true,
			'withTransactions'  => true, // gets trans associated with inv as well
			'withAssigned'      => true, // return ['contact'] & ['company'] objs if has link
			'withTags'          => true,
			'withOwner'         => true,

			// returns scalar ID of line
			'onlyID'            => false,

			'fields'            => false // false = *, array = fieldnames

		));


		if ( !is_array( $invoice ) ) {

			// get blank defaults - this is for a de-headed serpent? (don't think should ever exist)
			$data['invoiceObj'] = zeroBSCRM_get_invoice_defaults( $invID );

		} else {

			// process the loaded data
			// ... this made a lot of sense Pre DAL3, but much should be dealt with by DAL now
			// ... wh done best to leave only necessary here:
			$now = time();

			$invoice_date_uts = isset( $invoice['date_date'] ) ? $invoice['date'] : $now;
			$invoice['date_date'] = jpcrm_uts_to_date_str( $invoice_date_uts, 'Y-m-d' );

			$invoice_due_date_uts = isset( $invoice['due_date'] ) ? $invoice['due_date'] : $now;
			$invoice['due_date_date'] = jpcrm_uts_to_date_str( $invoice_due_date_uts, 'Y-m-d' );

			// this should load it all anyhow :) (DAL3+)
			$data['invoiceObj'] = $invoice;

			// Settings
			$settings = zeroBSCRM_get_invoice_settings();

			// catch any empty shiz? seems to be what was happening.
			if ( !isset( $data['invoiceObj']['invoice_logo_url'] ) ) {
				$data['invoiceObj']['invoice_logo_url'] = $settings['logo'];
			}

			// these two are kind of just aliases? Use straight $invoiceObj[contact] etc.
			$data['invoiceObj']['invoice_contact'] = false;
			if ( isset( $invoice['contact'] ) && is_array( $invoice['contact'] ) && count( $invoice['contact'] ) > 0 ) {
				$data['invoiceObj']['invoice_contact'] = $invoice['contact'][0];
			}
			$data['invoiceObj']['invoice_company'] = false;
			if ( isset( $invoice['company'] ) && is_array( $invoice['company'] ) && count( $invoice['company'] ) > 0 ) {
				$data['invoiceObj']['invoice_company'] = $invoice['company'][0];
			}
			$data['invoiceObj']['new_invoice'] = false;

			// these should probs use $invoice['contact'] etc. leaving for now for time.
			$billing_email = '';
			$billing_name = '';
			if ( isset( $data['invoiceObj']['invoice_contact'] ) && is_array( $data['invoiceObj']['invoice_contact'] ) && isset( $data['invoiceObj']['invoice_contact']['id'] ) ) {

				if ( isset( $data['invoiceObj']['invoice_contact']['email'] ) ) {
					$billing_email = $data['invoiceObj']['invoice_contact']['email'];
				}
				if ( isset( $data['invoiceObj']['invoice_contact']['name'] ) ) {
					$billing_name = $data['invoiceObj']['invoice_contact']['name'];
				}
				if ( empty( $billing_name ) ) {
					$billing_name = $zbs->DAL->contacts->getContactNameWithFallback( $data['invoiceObj']['invoice_contact']['id'] );
				}

			} elseif ( isset( $data['invoiceObj']['invoice_company'] ) && is_array( $data['invoiceObj']['invoice_company'] ) && isset( $data['invoiceObj']['invoice_company']['id'] ) ) {

				if ( isset( $data['invoiceObj']['invoice_company']['email'] ) ) {
					$billing_email = $data['invoiceObj']['invoice_company']['email'];
				}
				if ( isset( $data['invoiceObj']['invoice_company']['name'] ) ) {
					$billing_name = $data['invoiceObj']['invoice_company']['name'];
				}

			}
			$data['invoiceObj']['bill'] = $billing_email;
			//add billing name here
			$data['invoiceObj']['bill_name'] = $billing_name;

			//handle if due is not set
			$data['invoiceObj']['due'] = -1; // default
			if ( isset( $invoice['due'] ) ) {
				$data['invoiceObj']['due'] = $invoice['due'];
			}

			$data['invoiceObj']['invoice_items'] = $invoice['lineitems'];

			// needs translating
			$hoursOrQuantity = (int) $invoice['hours_or_quantity']; // 0 = hours, 1 = quantity
			$hoursOrQuantityStr = 'hours';
			if ( $hoursOrQuantity > 0 ) {
				$hoursOrQuantityStr = 'quantity';
			}
			$data['invoiceObj']['invoice_hours_or_quantity'] = $hoursOrQuantityStr;

			// are PDF engine and Client Portal installed?
			$data['invoiceObj']['pdf_installed'] = zeroBSCRM_isExtensionInstalled( 'pdfinv' );
			$data['invoiceObj']['portal_installed'] = zeroBSCRM_isExtensionInstalled( 'portal' );

			// if we have Client Portal installed, build URLS
			$preview_link = null;

			if ( $data['invoiceObj']['portal_installed'] ) {

				// Retrieve invoice endpoint & portal root URL
				$invoice_endpoint = $zbs->modules->portal->get_endpoint( ZBS_TYPE_INVOICE );
				$portalLink = zeroBS_portal_link();
				if ( ! str_ends_with( $portalLink, '/' ) ) {  // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					$portalLink .= '/';
				}

				// if invoice has a hash this will be a hash URL, otherwise it uses the invoice ID
				if ( $settings['invhash'] ) {
					$preview_link = esc_url( $portalLink . $invoice_endpoint . '/zh-' . $invoice['hash'] );
				} else {
					$preview_link = esc_url( $portalLink . $invoice_endpoint . '/' . $invID );
				}

			}

			// if a hash is set (or admin) load the invoice for logged out users, if agreed
			// will still need to load the contactID and info in the Stripe call too even if logged out
			$data['invoiceObj']['preview_link'] = $preview_link;

			// urgh. this was how we got the settings object.
			// refine this too.

			// SETTINGS array (process from main ZBS settings object)
			$data['invoiceObj']['settings'] = $settings;

			// WH shim - converts DAL3 single record attrs into an array as MS expects?
			$data['invoiceObj']['totals'] = array();
			$data['invoiceObj']['totals']['invoice_discount_total'] = $invoice['discount'];
			$data['invoiceObj']['totals']['invoice_discount_type'] = $invoice['discount_type'];
			$data['invoiceObj']['totals']['invoice_postage_total'] = $invoice['shipping'];
			$data['invoiceObj']['totals']['tax'] = $invoice['tax'];

			// shipping total needs to return 0 in some cases if not set it is empty. GRR @ mike DB1.0 data.
			if ( !array_key_exists( 'invoice_postage_total', $data['invoiceObj']['totals'] ) ) {
				$data['invoiceObj']['totals']['invoice_postage_total'] = 0;
			}

			// Invoice PARTIALS
			$data['invoiceObj']['partials'] = $invoice['transactions'];

		}

		// update to get from tax table UI. Below is dummy data for UI work (UI tax table TO DO)
		$data['tax_linesObj'] = zeroBSCRM_getTaxTableArr();

		return $data;

	}

	return false;
}


	/* ======================================================
	  	/ Invoice 3.0 helpers
	   ====================================================== */


	#} General function to check the amount due on an invoice, if <= mark as paid.
	// Adapted to work V3.0+
	// ... ultimately just uses zeroBSCRM_invoicing_invOutstandingBalance to check for balance + marks if paid off
	function zeroBSCRM_check_amount_due_mark_paid($invoice_id=-1){

		if ($invoice_id > 0){

			global $zbs;

			$outstandingBalance = $zbs->DAL->invoices->getOutstandingBalance($invoice_id);

			// got balance?
			if ($outstandingBalance <= 0 && $outstandingBalance !== false){

				// mark invoice as paid
				$status_str     = 'Paid';
				$invoice_update = $zbs->DAL->invoices->setInvoiceStatus( $invoice_id, $status_str ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				return $invoice_update;

			}

		} 

		return false;
	}

/**
 * Helper function to calculate the number of deleted invoices for any particular contact / company.
 *
 * @param array $all_invoices An array of all invoice or transaction data for a contact / company.
 *
 * @returns int An int with the deleted invoices count.
 */
function jpcrm_deleted_invoice_counts( $all_invoices = null ) {
	if ( empty( $all_invoices ) ) {
		return 0;
	}
	$count_deleted = 0;
	foreach ( $all_invoices as $invoice ) {
		if ( $invoice['status'] === 'Deleted' ) {
			++$count_deleted;
		}
	}
	return $count_deleted;
}

/* ======================================================
  	/ Invoice helpers
   ====================================================== */





/* ======================================================
  	Transactions helpers
   ====================================================== */
   function zeroBS___________TransactionHelpers(){return;}


   	// returns count, inc status optionally
	function zeroBS_tranCount($status=false){
		
		global $zbs; return $zbs->DAL->transactions->getTransactionCount(array(
			'withStatus'=> $status,
			'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)));
	}

	  /*
		This function is only used in one place (the CRM Dashboard). 
	  */
	function zeroBS_getTransactionsRange($ago=-1, $period='days'){

		global $zbs;

		$utsFrom = strtotime($ago.' '.$period.' ago');

		if ($utsFrom > 0){

			
      //this has been replaced with better SQL support now since 4.0.2
			return $zbs->DAL->transactions->getTransactions(array(
				      'newerThan' => $utsFrom,
	            'sortByField'   => 'zbst_date',
            	'sortOrder'     => 'DESC',
				      'page' => -1, 
				      'perPage'  => -1, 
				));


		}

		// nope?
		return array();

	}


	// Please use direct dal calls in future work.
	function zeroBS_getTransaction($tID=-1){

		if ($tID !== -1){
			
			/*
			return array(
				'id'=>$tID,
				'meta'=>get_post_meta($tID, 'zbs_transaction_meta', true),
				'customerid'=>get_post_meta($tID, 'zbs_parent_cust', true),
				'companyid'=>get_post_meta($tID, 'zbs_parent_co', true)
				);
			*/

			global $zbs;

			return $zbs->DAL->transactions->getTransaction($tID);

		} else return false;

	} 



	// Please use direct dal calls in future work.
	function zeroBS_getTransactions(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false, 
		$searchPhrase='',
		$hasTagIDs=array(),
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$withTags=false,
		$quickFilters=array(),
		$external_source_uid = false
		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'isTagged'  	=> $hasTagIDs,
					'quickFilters'  => $quickFilters,

					'withAssigned'	=> $withCustomerDeets,
					'withTags'		=> $withTags,

					'sortByField' 	=> $sortByField,
					'sortOrder' 	=> $sortOrder,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'   => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION),

					'external_source_uid' => $external_source_uid


				);

				return $zbs->DAL->transactions->getTransactions($args);

	}
	
	// Please use direct dal calls in future work.
	function zeroBS_getTransactionsCountIncParams(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false,
		$searchPhrase='',
		$hasTagIDs=array(),
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$withTags=false,
		$quickFilters=array()

		){

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'isTagged'  	=> $hasTagIDs,
					'quickFilters'  => $quickFilters,

					// just count thx
					'count'			=> true,
					'withAssigned'	=> false,

					//'sortByField' 	=> $sortByField,
					//'sortOrder' 	=> $sortOrder,
					'page'			=> -1,
					'perPage'		=> -1,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)


				);

				return $zbs->DAL->transactions->getTransactions($args);

	}

	// Please use direct dal calls in future work.
	function zeroBS_getTransactionsForCustomer(

		$customerID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false

		){
			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedContact' 	=> $customerID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					//'sortByField' 	=> $orderBy,
					//'sortOrder' 	=> $order,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)


				);

				return $zbs->DAL->transactions->getTransactions($args);

	}


	// Please use direct dal calls in future work.
	function zeroBS_getTransactionsForCompany(

		$companyID=-1,
		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$withCustomerDeets=false

		){
			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'assignedCompany' 	=> $companyID,

					// with contact?
					'withAssigned'	=> $withCustomerDeets,

					//'sortByField' 	=> $orderBy,
					//'sortOrder' 	=> $order,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)


				);

				return $zbs->DAL->transactions->getTransactions($args);

	}


	// Please use direct dal calls in future work.
	function zeroBS_getTransactionIDWithExternalSource($transactionExternalSource='',$transactionExternalID=''){

		// retrieve external sources from $zbs now
		global $zbs;

		#} No empties, no random externalSources :)
		if (!empty($transactionExternalSource) && !empty($transactionExternalID) && array_key_exists($transactionExternalSource,$zbs->external_sources)){

			// return id if exists
			return $zbs->DAL->transactions->getTransaction(-1,array(
			            'externalSource'    => $transactionExternalSource,
			            'externalSourceUID' => $transactionExternalID,
			            'onlyID'	=> true,
						'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TRANSACTION)
			            ));


		}

		return false;

	}


	// v3.0 + avoid using these centralised funcs (this + zeroBS_integrations_addOrUpdateTransaction)
	// ... direct calls all the way :D
	function zeroBS_addUpdateTransaction(

			$tID = -1,

			/* 

			example:
				$tFields = array(
					
					REQUIRED:
					'orderid' => 'UNIQUEID',
					'customer' => CustomerID,
					'status' => 'Completed', 'Refunded' similar.
					'total' => 123.99,

					RECOMMENDED:
					'date' => 12345TIME,
					'currency' => 'USD',
					'item' => 'TITLE',
					'net' => 0,
					'tax' => 0,
					'fee' => 0,
					'discount' => 0,
					'tax_rate' => 0,


				);

			*/

			$tFields = array(),

			$transactionExternalSource='',
			$transactionExternalID='',
			$transactionDate='',
			$transactionTags=array(), /* extra */

			$fallBackLog = false,
			$extraMeta = false,
			$automatorPassthrough = false,

			$arrBuilderPrefix = 'zbst_'

			){

				
				// zeroBSCRM_DEPRECATEDMSG('ZBS Function Deprecated in v3.0+. zeroBS_addUpdateTransaction should now be replaced with proper zbs->DAL->calls');

				global $zbs;

				#} Basics - /--needs unique ID, total MINIMUM
				if (isset($tFields) && count($tFields) > 0){

					#} New flag
					$newTrans = false;

						if ($tID > 0){

								#} Build "existing meta" to pass, (so we only update fields pushed here)
								$existingMeta = $zbs->DAL->transactions->getTransaction($tID,array());

								// Do date comparison + update that where relevant
								$originalDate = time();
								if (isset($existingMeta) && is_array($existingMeta) && isset($existingMeta['created']) && !empty($existingMeta['created'])) $originalDate = $existingMeta['created'];
								if (!empty($transactionDate) && $transactionDate != ''){

									#} DATE PASSED TO THE FUNCTION
									$transactionDateTimestamp = strtotime($transactionDate);
									#} ORIGINAL POST CREATION DATE 
									// no need, db2 = UTS $originalDateTimeStamp = strtotime($originalDate);
									$originalDateTimeStamp = $originalDate;

									#} Compare, if $transactionDateTimestamp < then update with passed date
									if($transactionDateTimestamp < $originalDateTimeStamp){

										// straight in there :)
										  $zbs->DAL->transactions->addUpdateTransaction(array(
												'id'			=>	$tID,
												'limitedFields'	=>array(
													array('key'=>'zbst_created','val'=>$transactionDateTimestamp,'type'=>'%d')
													)));
									}
								}

						} else {

							#} Set flag
							$newTrans = true;

							#} DATE PASSED TO THE FUNCTION
							$transactionDateTimestamp = strtotime($transactionDate);
							$tFields['created'] = $transactionDateTimestamp;

						}

						// this is a DAL2 legacy:
						$existingMeta = array();

						#} Build using centralised func below, passing any existing meta (updates not overwrites)
						$transactionMeta = zeroBS_buildTransactionMeta($tFields,$existingMeta,$arrBuilderPrefix);

						// format it for DAL3 addition
						$args = array(

							'id'	=>	$tID,
							'data' => $transactionMeta,
							'extraMeta' => $extraMeta,
							'automatorPassthrough' => $automatorPassthrough,
							'fallBackLog' => $fallBackLog

						);
						// few DAL2 -> DAL3 translations:

							// owner?
							if (isset($tFields['owner']) > 0) $args['owner'] = $tFields['owner'];

							// contact/companies?
							if (isset($tFields['customer']) && $tFields['customer'] > 0) $args['data']['contacts'] = array((int)$tFields['customer']);
							if (isset($tFields['company']) && $tFields['company'] > 0) $args['data']['companies'] = array((int)$tFields['company']);

							#} Add external source/externalid
							#} No empties, no random externalSources :)
							$approvedExternalSource = ''; #} As this is passed to automator :)

							if (!empty($transactionExternalSource) && !empty($transactionExternalID) && array_key_exists($transactionExternalSource,$zbs->external_sources)){

								#} If here, is legit.
								$approvedExternalSource = $transactionExternalSource;
				                
				                $extSourceArr = array(
				                    'source' => $approvedExternalSource,
				                    'uid' => $transactionExternalID
				                    );


	                			$args['data']['externalSources'] = array($extSourceArr);

							} #} Otherwise will just be a random obj no ext source

							#} For now a brutal pass through:
							// wh: not sure why this was here? if (isset($tFields['trans_time']) && !empty($tFields['trans_time'])) $zbsTransactionMeta['trans_time'] = (int)$tFields['trans_time'];

				            # TAG obj (if exists) - clean etc here too 
				            if (isset($transactionTags) && is_array($transactionTags)){

									$transactionTags = filter_var_array($transactionTags,FILTER_UNSAFE_RAW); 
									// Formerly this used FILTER_SANITIZE_STRING, which is now deprecated as it was fairly broken. This is basically equivalent.
									// @todo Replace this with something more correct.
									foreach ( $transactionTags as $k => $v ) {
										$transactionTags[$k] = strtr(
											strip_tags( $v ),
											array(
												"\0" => '',
												'"' => '&#34;',
												"'" => '&#39;',
												"<" => '',
											)
										);
									}

				                	$args['data']['tags'] = array();
									foreach($transactionTags as $tTag){

										// find/add tag
										//wp_set_object_terms($postID , $cTag, 'zerobscrm_customertag', true );
										$tagID = $zbs->DAL->addUpdateTag(array(
											'data'=>array(
												'objtype' 		=> ZBS_TYPE_TRANSACTION,
												'name' 			=> $tTag
												)));

										if (!empty($tagID)) $args['data']['tags'][] = $tagID;

									}
							}

				#} Update record (All IA is now fired intrinsicaly)
				return $zbs->DAL->transactions->addUpdateTransaction($args);

			}


		return false;
	}


	// Please use direct dal calls in future work, not this.
	#} Quick wrapper to future-proof.
	#} Should later replace all get_post_meta's with this
	function zeroBS_getTransactionMeta($tID=-1){

		global $zbs;

		// in DAL3 it's just a normal get
		if (!empty($tID)) return $zbs->DAL->transactions->getTransaction($tID);

		return false;

	}

	// filters array for fields currently used in fields.php
	// v3.0+ this uses the generic zeroBS_buildObjArr, and accepts full args as per contact meta DAL2:
	function zeroBS_buildTransactionMeta($arraySource=array(),$startingArray=array(),$fieldPrefix='zbst_',$outputPrefix='',$removeEmpties=false,$autoGenAutonumbers=false){

		return zeroBS_buildObjArr($arraySource,$startingArray,$fieldPrefix,$outputPrefix,$removeEmpties,ZBS_TYPE_TRANSACTION,$autoGenAutonumbers);

	}


   function zeroBSCRM_getTransactionTagsByID($transactionID=-1,$justIDs=false){

		global $zbs;
		$tags = $zbs->DAL->transactions->getTransactionTags($transactionID);

		// lazy here, but shouldn't use these old funcs anyhow!
		if ($justIDs){

			$ret = array();
			if (is_array($tags)) foreach ($tags as $t) $ret[] = $t['id'];
			return $ret;

		}

		return $tags;


   }


	// moves a tran from being assigned to one cust, to another
	// this is a fill-in to match old DAL2 func, however DAL3+ can accept customer/company,
	// ... so use the proper $DAL->addUpdateObjectLinks for fresh code
	function zeroBSCRM_changeTransactionCustomer($id=-1,$contactID=0){

		if (!empty($id) && $contactID > 0){

            global $zbs;
            return $zbs->DAL->transactions->addUpdateObjectLinks($id,array($contactID),ZBS_TYPE_CONTACT);

	    }

	    return false;

	}

	// moves a tran from being assigned to one company, to another
	// this is a fill-in to match old DAL2 func, however DAL3+ can accept customer/company,
	// ... so use the proper $DAL->addUpdateObjectLinks for fresh code
	function zeroBSCRM_changeTransactionCompany($id=-1,$companyID=0){

		if (!empty($id) && $companyID > 0){

            global $zbs;
            return $zbs->DAL->transactions->addUpdateObjectLinks($id,array($companyID),ZBS_TYPE_COMPANY);

	    }

	    return false;

	}


/* ======================================================
  	/ Transactions helpers
   ====================================================== */

/* ======================================================
  	Event helpers
   ====================================================== */
   function zeroBS___________EventHelpers(){return;}

	// old way of doing - also should really be "get list of events/tasks for a contact"
	function zeroBSCRM_getTaskList($cID=-1){
		
		$ret = array();
		
		if ($cID > 0){

			global $zbs;

			return $zbs->DAL->events->getEvents(array(
				'assignedContact'=>$cID,
				'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)
				));

				/* these translated for DAL3

			$i = 0;
			foreach($tasks as $task){
				$ret[$i]['title'] = $task->post_title;
				$ret[$i]['ID'] = $task->ID;
				$ret[$i]['meta'] = get_post_meta($task->ID,'zbs_event_meta',true);
				$ret[$i]['actions'] = get_post_meta($task->ID,'zbs_event_actions',true);

				// titles moved into meta with MS new task ui, wh bringing them out here:
				if (empty($task->post_title) && is_array($ret[$i]['meta']) && isset($ret[$i]['meta']['title']) && !empty($ret[$i]['meta']['title'])){
					$ret[$i]['title'] = $ret[$i]['meta']['title'];
				} 

				$i++;
			}*/

			return $ret;
	    }

	    return array();
	}

	// adapted to DAL3
	// NOTE: $withFullDetails is redundant here
	// NOTE: as with all dal3 translations, objs no longer have ['meta'] etc.
	// USE direct DAL calls in code, not this, for future proofing
	function zeroBS_getEvents(
		$withFullDetails=false,
		$perPage=10,
		$page=0, 
		$ownedByID=false, 
		$search_term='',
		$sortByField='',
		$sortOrder='DESC',
		$hasTagIDs=array()
	){

			global $zbs;

				$actualPage = $page;
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(

					'withAssigned'  => true,
					'withOwner'		=> true,

					'isTagged'  	=> $hasTagIDs,

					'sortByField' 	=> $sortByField,
					'sortOrder' 	=> $sortOrder,

					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)

				);
				if ($ownedByID > 0) $args['ownedBy'] = $ownedByID;
				if ( !empty( $search_term ) ) $args['searchPhrase'] = $search_term;

				return $zbs->DAL->events->getEvents($args);
	}

	// for use in list view
	// NOTE: $withFullDetails is redundant here
	// NOTE: as with all dal3 translations, objs no longer have ['meta'] etc.
	// USE direct DAL calls in code, not this, for future proofing
	function zeroBS_getEventsCountIncParams(
		$withFullDetails=false,
		$perPage=10,
		$page=0, 
		$ownedByID=false,
		$search_term='',
		$sortByField='',
		$sortOrder='DESC',
		$hasTagIDs=array()){

			global $zbs;

				// make ARGS
				$args = array(

					// just count
					'count'			=> true,

					'page'			=> -1,
					'perPage'		=> -1,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)


				);
				if ($ownedByID > 0) $args['ownedBy'] = $ownedByID;
				if ( !empty( $search_term ) ) $args['searchPhrase'] = $search_term;
				if ( count( $hasTagIDs ) > 0 ) $args['isTagged'] = $hasTagIDs;

				return $zbs->DAL->events->getEvents($args);
	}
	
	// adapted to DAL3
	// NOTE: $withFullDetails is redundant here
	// NOTE: as with all dal3 translations, objs no longer have ['meta'] etc.
	// USE direct DAL calls in code, not this, for future proofing
	function zeroBS_getEventsByCustomerID($cID=-1,$withFullDetails=false,$perPage=10,$page=0){


			global $zbs;

				// legacy from dal1
				$actualPage = $page;
				if (!$zbs->isDAL2()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(

					'assignedContact' => $cID,

					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_TASK)


				);

				return $zbs->DAL->events->getEvents($args);
	}



	// moves an event from being assigned to one cust, to another
	// this is a fill-in to match old DAL2 func, however DAL3+ can accept customer/company,
	// ... so use the proper $DAL->addUpdateObjectLinks for fresh code
	function zeroBSCRM_changeEventCustomer($id=-1,$contactID=0){

		if (!empty($id) && $contactID > 0){

            global $zbs;
            return $zbs->DAL->events->addUpdateObjectLinks($id,array($contactID),ZBS_TYPE_CONTACT);

	    }

	    return false;

	}


   // Add an event
   function zeroBS_addUpdateEvent($eventID = -1, $eventFields = array(), $reminders=array()){

		/*
		
			-EVENT FIELDS ARE

			v2....
			$event_fields = array(

				'title' => event title
				'customer' => ID of the customer the event is for (if any)
				'notes' => customer notes string
				'to' => to date, format date('m/d/Y H') . ":00:00";
				'from' => from date, format date('m/d/Y H') . ":00:00";
				'notify' => 0 or 24 (never or 24 hours before)
				'complete' => 0 or 1 (boolean),
				'owner' => who owns the event (-1 for no one),
				'event_id' => the event ID


			);


			v3....
			$event_fields = array(


                'title' => '',
                'desc' => '',
                'start' => '',
                'end' => '',
                'complete' => '',
                'show_on_portal' => '',
                'show_on_cal' => '',

                // obj links:
                'contacts' => false, // array of id's
                'companies' => false, // array of id's

                // reminders:
                'reminders'     => false, 
                // will be an array of eventreminder lines (as per matching eventreminder database model)
                // note:    if no change desired, pass "false"
                //          if removal of all/change, pass array

                // Note Custom fields may be passed here, but will not have defaults so check isset()

                'tags' => -1, // if this is an array of ID's, they'll REPLACE existing tags against contact

                'externalSources' => -1, // if this is an array(array('source'=>src,'uid'=>uid),multiple()) it'll add :)

                // allow this to be set for MS sync etc.
                'created' => -1,
                'lastupdated' => '',


			);

		*/
		/*
		
			-Reminder fields are (WH added in MS style for DAL3, and modified in events save )
			$event_fields = array(

	        'remind_at' => +- event time (e.g. -86400 for 1 day before)
	        'sent' => has reminder been sent?

			);

		*/

		// if using 'from' and 'to', probably using v1 dal, so translate dates:
		if (isset($eventFields['from'])) $eventFields['from'] = strtotime($eventFields['from']);
		if (isset($eventFields['to'])) $eventFields['to'] = strtotime($eventFields['to']);


		#} Build using centralised func below, passing any existing meta (updates not overwrites)
		$removeEmpties = false;
		$zbsEventMeta = zeroBS_buildObjArr($eventFields,array(),'','',$removeEmpties,ZBS_TYPE_TASK);		

		// Some sanitation MS has added. Really, DAL isn't place to sanitize,
		// ... by time it gets here it should be sanitized (e.g. a level up)
		// ... leaving as I translate this to DAL3
		//$zbsEventMeta = filter_var_array($eventFields,FILTER_SANITIZE_STRING); 


		// format it for DAL3 addition
		$args = array(

			'data' => $zbsEventMeta

		);

		global $zbs;

		// few DAL2 -> DAL3 translations:

			// owner?
			if (isset($eventFields['owner']) > 0) $args['owner'] = $eventFields['owner'];

			// contact/companies?
			if (isset($eventFields['customer']) && $eventFields['customer'] > 0) $args['data']['contacts'] = array($eventFields['customer']);
			if (isset($eventFields['company']) && $eventFields['company'] > 0) $args['data']['companies'] = array($eventFields['company']);

			$args['data']['reminders'] = array();

		// reminders into new DAL2 eventreminder format:
		if (is_array($reminders) && count($reminders) > 0) foreach ($reminders as $reminder){

			// this just adds with correct fields
			$args['data']['reminders'][] = array(

				'event' => (int)$eventID,
				'remind_at' => (int)$reminder['remind_at'], // just assume is int - garbage in, garbage out ($reminder['remind_at']) ? $reminder['remind_at'] : false; // if int, this
				'sent' => (isset($reminder['sent']) && $reminder['sent'] > 0) ? $reminder['sent'] : -1

			);

		}

		// updating....
		if ($eventID > 0) $args['id']  = (int)$eventID;

		// simples
		return $zbs->DAL->events->addUpdateEvent($args);

	}

/* ======================================================
  	/ Event helpers
   ====================================================== */

/* ======================================================
  	Form helpers
   ====================================================== */
   function zeroBS___________FormHelpers(){return;}


	// Please use direct dal calls in future work.
	// simple wrapper for Form 
	function zeroBS_getForm($formID=-1){

		if ($formID > 0){
			
			/*
			return array(
				'id'=>$fID,
				
				// mikes init fields
				'meta'=>get_post_meta($fID,'zbs_form_field_meta',true),
				'style'=>get_post_meta($fID, 'zbs_form_style', true),
				'views'=>get_post_meta($fID, 'zbs_form_views', true),
				'conversions'=>get_post_meta($fID, 'zbs_form_conversions', true)

				);
			*/

			global $zbs;

			return $zbs->DAL->forms->getForm($formID);

		}
		
		return false; 
	}


	// Please use direct dal calls in future work.
	function zeroBS_getForms(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()

		){

		// quickFilters not used for forms :) *yet

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'isTagged'  	=> $hasTagIDs,

					'sortByField' 	=> $sortByField,
					'sortOrder' 	=> $sortOrder,
					'page'			=> $actualPage,
					'perPage'		=> $perPage,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_FORM)


				);

				return $zbs->DAL->forms->getForms($args);

	}

	// Please use direct dal calls in future work.
	function zeroBS_getFormsCountIncParams(

		$withFullDetails=false,
		$perPage=10,
		$page=0,
		$searchPhrase='',
		$inArray=array(),
		$sortByField='',
		$sortOrder='DESC',
		$quickFilters=array(),
		$hasTagIDs=array()
		
		){

		// quickFilters not used for forms :) *yet

			// $withFullDetails = irrelevant with new DB2 (always returns)
			global $zbs;			

				// legacy from dal1
				$actualPage = $page;
				if ($zbs->isDAL1()) $actualPage = $page-1;  // only DAL1 needed this
				if ($actualPage < 0) $actualPage = 0;

				// make ARGS
				$args = array(				

					// Search/Filtering (leave as false to ignore)
					'searchPhrase' 	=> $searchPhrase,
					'inArr'			=> $inArray,
					'isTagged'  	=> $hasTagIDs,

					// just count thx
					'count'			=> true,

					'page'			=> -1,
					'perPage'		=> -1,

					'ignoreowner'		=> zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_FORM)


				);

				return $zbs->DAL->forms->getForms($args);

	}




/* ======================================================
  	/ Form helpers
   ====================================================== */

/* ======================================================
  	Settings helpers
   ====================================================== */
   function zeroBS___________SettingsHelpers(){return;}
   
    #} Minified get all settings

    // retrieve all settings
    function zeroBSCRM_getAllSettings(){

		global $zbs;
		$zbs->checkSettingsSetup();
    	return $zbs->settings->getAll();
    	
    }

	#} Minified get setting func
	function zeroBSCRM_getSetting($key,$freshFromDB=false){

		global $zbs;
		$zbs->checkSettingsSetup();
		return $zbs->settings->get($key,$freshFromDB);

	}

	// checks if a setting is set to 1
	function zeroBSCRM_isSettingTrue($key){

		global $zbs;
		$setting = $zbs->settings->get($key);
		if ($setting == "1") return true;
		return false;

	}


/* ======================================================
  	/ Settings helpers
   ====================================================== */



/* ======================================================
   Alias / AKA helpers
   ====================================================== */
	// Aliases - direct SQL here, could do with moving to DAL3


	#} (Generic) See if already in use/exists
	function zeroBS_canUseAlias($objType=ZBS_TYPE_CONTACT,$alias=''){

		if (!empty($alias)) {

		// verify email?

			if (!zeroBSCRM_validateEmail($alias)) return false;

		// is in use?

			// is customer with this email?
			$existing = zeroBS_getCustomerIDWithEmail($alias);

			if (!empty($existing)) return false; 

			global $wpdb,$ZBSCRM_t;

			$query = $wpdb->prepare( "SELECT ID FROM ".$ZBSCRM_t['aka']." WHERE aka_type = %d AND aka_alias = %s", $objType, $alias);

			$aliasID = $wpdb->get_var($query);

			// has alias in there already?
			if (!empty($aliasID)) return false;

			// usable
			return true;

		}

		return false;
	}

	#} Get specific alias if exists
	function zeroBS_getObjAlias($objType=ZBS_TYPE_CONTACT,$objID=-1,$alias=''){

		if (!empty($objID) && !empty($alias)) {

			global $wpdb,$ZBSCRM_t;

			$query = $wpdb->prepare( "SELECT ID,aka_alias,aka_created,aka_lastupdated FROM ".$ZBSCRM_t['aka']." WHERE aka_type = %d AND aka_id = %d AND aka_alias = %s", $objType, $objID, $alias);

			$alias = $wpdb->get_row($query, ARRAY_A);

			// check it + return
			if (is_array($alias)) return $alias;

		}

		return false;
	}

	#} Get specific alias if exists
	function zeroBS_getAliasByID($objType=ZBS_TYPE_CONTACT,$objID=-1,$aliasID=-1){

		if (!empty($objID) && !empty($aliasID)) {

			global $wpdb,$ZBSCRM_t;

			$query = $wpdb->prepare( "SELECT ID,aka_alias,aka_created,aka_lastupdated FROM ".$ZBSCRM_t['aka']." WHERE aka_type = %d AND aka_id = %d AND ID = %d", $objType, $objID, $aliasID);

			$alias = $wpdb->get_row($query, ARRAY_A);

			// check it + return
			if (is_array($alias)) return $alias;

		}

		return false;
	}

	#} Get All Aliases against an obj.
	function zeroBS_getObjAliases($objType=ZBS_TYPE_CONTACT,$objID=-1){

		if (!empty($objID)) {

			global $wpdb,$ZBSCRM_t;

			$query = $wpdb->prepare( "SELECT ID,aka_alias,aka_created,aka_lastupdated FROM ".$ZBSCRM_t['aka']." WHERE aka_type = %d AND aka_id = %d", $objType, $objID );
			
			$aliases = $wpdb->get_results($query, ARRAY_A);

			// check it + return
			if (is_array($aliases) && count($aliases) > 0) return $aliases;

		}

		return false;
	}

	#} add Aliases to an obj.
	function zeroBS_addObjAlias($objType=ZBS_TYPE_CONTACT,$objID=-1,$alias=''){

		if (!empty($objID) && !empty($alias)) {

			// check not already there
			$existing = zeroBS_getObjAlias($objType,$objID,$alias);
			if (!is_array($existing)){

				// insert

				global $wpdb,$ZBSCRM_t;

				if ($wpdb->insert( 
					$ZBSCRM_t['aka'], 
					array( 
						'aka_type' => $objType, 
						'aka_id' => $objID , 
						'aka_alias' => $alias , 
						'aka_created' => time() , 
						'aka_lastupdated' => time()
					), 
					array( 
						'%d', 
						'%d' , 
						'%s' , 
						'%d' , 
						'%d' 
					) 
				)){

					// success
					return $wpdb->insert_id;

				} else {
					return false;
				}

			} else {

				// return true, already exists
				return true;

			}

		}

		return false;
	}

	#} remove Alias from an obj.
	function zeroBS_removeObjAlias($objType=ZBS_TYPE_CONTACT,$objID=-1,$alias=''){

		if (!empty($objID) && !empty($alias)) {

			// check there/find ID
			$existing = zeroBS_getObjAlias($objType,$objID,$alias);

			if (is_array($existing)){

				// just brutal :)

				global $wpdb,$ZBSCRM_t;
			
				return $wpdb->delete($ZBSCRM_t['aka'], array( 'ID' => $existing['ID'] ), array( '%d' ) );

			}	

		}

		return false;
	}

	#} remove Alias from an obj.
	function zeroBS_removeObjAliasByID($objType=ZBS_TYPE_CONTACT,$objID=-1,$aliasID=-1){

		if (!empty($objID) && !empty($aliasID)) {

			// check there/find ID
			$existing = zeroBS_getAliasByID($objType,$objID,$aliasID);

			if (is_array($existing)){

				// just brutal :)

				global $wpdb,$ZBSCRM_t;
			
				return $wpdb->delete($ZBSCRM_t['aka'], array( 'ID' => $existing['ID'] ), array( '%d' ) );

			}	

		}

		return false;
	}

/* ======================================================
  	/ Alias / AKA helpers
   ====================================================== */


/* ======================================================
  	Value Calculator / helpers
   ====================================================== */

   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// THIS STAYS THE SAME FOR DB2 until trans+invoices MOVED OVER #DB2ROUND2
	#} Main function to return a customers "total value" 
	#} At MVP that means Invoices + Transactions
	function zeroBS_customerTotalValue($contactID='',$customerInvoices=array(),$customerTransactions=array()){

		global $zbs;

		$contactWithVals = $zbs->DAL->contacts->getContact($contactID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($contactWithVals['total_value'])) return $contactWithVals['total_value'];

		return 0;

	}

   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	#} Adds up value of quotes for a customer...
	function zeroBS_customerQuotesValue($contactID='',$customerQuotes=array()){

		global $zbs;

		$contactWithVals = $zbs->DAL->contacts->getContact($contactID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($contactWithVals['quotes_value'])) return $contactWithVals['quotes_value'];

		return 0;

	}

   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	#} Adds up value of invoices for a customer...
	function zeroBS_customerInvoicesValue($contactID='',$customerInvoices=array()){

		global $zbs;

		$contactWithVals = $zbs->DAL->contacts->getContact($contactID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($contactWithVals['invoices_value'])) return $contactWithVals['invoices_value'];

		return 0;		
	}

   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// same as above, but only for PAID invoices
	#} Adds up value of invoices for a customer...
	function zeroBS_customerInvoicesValuePaid($contactID='',$customerInvoices=array()){

		// FOR NOW I've just forwarded whole amount. 
		// ... will need to add this functionality to contact DAL, if req.
		// ... but on a search, this func IS NOT USED in any core code
		// ... so deferring
		return zeroBS_customerInvoicesValue($contactID);
	}

   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// same as above, but only for NOT PAID invoices
	#} Adds up value of invoices for a customer...
	function zeroBS_customerInvoicesValueNotPaid($contactID='',$customerInvoices=array()){

		// FOR NOW I've just forwarded whole amount. 
		// ... will need to add this functionality to contact DAL, if req.
		// ... but on a search, this func IS NOT USED in any core code
		// ... so deferring
		return zeroBS_customerInvoicesValue($contactID);
	}


   // evolved for dal3.0
   // left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// THIS STAYS THE SAME FOR DB2 until trans MOVED OVER #DB2ROUND2
	#} Adds up value of transactions for a customer...
	function zeroBS_customerTransactionsValue($contactID='',$customerTransactions=array()){

		global $zbs;

		$contactWithVals = $zbs->DAL->contacts->getContact($contactID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($contactWithVals['transactions_value'])) return $contactWithVals['transactions_value'];

		return 0;		
	}



	// evolved for dal3.0
	// left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// This can, for now, ultimately be a wrapper for zeroBS_customerInvoicesValue
	// used in company single view
	function zeroBS_companyInvoicesValue($companyID='',$companyInvoices=array()){

		global $zbs;

		$companyWithValues = $zbs->DAL->companies->getCompany($companyID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($companyWithValues['invoices_value'])) return $companyWithValues['invoices_value'];

		return 0;		
	}


	// evolved for dal3.0
	function zeroBS_companyQuotesValue($companyID=''){

		global $zbs;

		$companyWithValues = $zbs->DAL->companies->getCompany($companyID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($companyWithValues['quotes_value'])) return $companyWithValues['quotes_value'];

		return 0;		
	}


	// evolved for dal3.0
	// left in place + translated, but FAR better to just use 'withValues' => true on a getContact call directly.
	// This can, for now, ultimately be a wrapper for zeroBS_customerTransactionsValue
	// used in company single view
	function zeroBS_companyTransactionsValue($companyID='',$companyTransactions=array()){

		global $zbs;

		$companyWithValues = $zbs->DAL->companies->getCompany($companyID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($companyWithValues['transactions_value'])) return $companyWithValues['transactions_value'];

		return 0;		
	}


	// evolved for dal3.0
	function zeroBS_companyTotalValue($companyID=''){

		global $zbs;

		$companyWithValues = $zbs->DAL->companies->getCompany($companyID,array(
			'withCustomFields' => false,
			'withValues' => true));

		// throwaway obj apart from totals
		// later could optimise, but better to optimise 1 level up and not even use this func
		if (isset($companyWithValues['total_value'])) return $companyWithValues['total_value'];

		return 0;		
	}
	
/* ======================================================
  	/ Value Calculator / helpers
   ====================================================== */


// ===============================================================================
// ========  Security Logs (used for Quote + Trans hashlink access) ==============
   function zeroBS___________SecurityLogHelpers(){return;}

	// this is fired on all req (expects a "fini" followup fire of next func to mark "success")
	// (defaults to failed req.)
	function zeroBSCRM_security_logRequest($reqType='unknown',$reqHash='',$reqID=-1){

	    // don't log requests for admins, who by nature, can see all
	    // needs to match zeroBSCRM_security_finiRequest precheck
	    if (zeroBSCRM_isZBSAdminOrAdmin()) return false;

	    global $wpdb,$ZBSCRM_t;

	    // if user logged in, also log id
	    $userID = -1; $current_user = wp_get_current_user();
	    if (isset($current_user->ID)) $userID = (int)$current_user->ID;
	    $userIP = zeroBSCRM_getRealIpAddr(); 

	    // validate these a bit
	    $validTypes = array('quoteeasy','inveasy');
	    if (!in_array($reqType, $validTypes)) $reqType = 'na';
	    $reqHash = sanitize_text_field( $reqHash ); if (strlen($reqHash) > 128) $reqHash = '';
	    $reqID = (int)sanitize_text_field( $reqID );

	    if ($wpdb->insert( 
	        $ZBSCRM_t['security_log'], 
	        array( 

	            //'zbs_site' => zeroBSCRM_installSite(),
	            //'zbs_team' => zeroBSCRM_installTeam(),
	            'zbs_owner' => -1, //zeroBSCRM_currentUserID(),

	            'zbssl_reqtype' => $reqType, 
	            'zbssl_ip' => $userIP, 
	            'zbssl_reqhash' => $reqHash, 

	            'zbssl_reqid' => $reqID, 
	            'zbssl_loggedin_id' => $userID, 
	            'zbssl_reqstatus' => -1, // guilty until proven...
	            'zbssl_reqtime' => time()
	        ), 
	        array( 
	            '%d', 

	            '%s' , 
	            '%s' , 
	            '%s' , 

	            '%d' , 
	            '%d' , 
	            '%d' , 
	            '%d' 
	        ) 
	    )){

	        // success
	        return $wpdb->insert_id;

	    } 

	    return false;

	}

	// after security validated, 
	function zeroBSCRM_security_finiRequest($requestID=-1){

	    // don't log requests for admins, who by nature, can see all
	    // needs to match zeroBSCRM_security_logRequest precheck
	    if (zeroBSCRM_isZBSAdminOrAdmin()) return false;

	    // basic check
	    $requestID = (int)$requestID;

	    if ($requestID > 0){

	        global $wpdb,$ZBSCRM_t;

	        // for now just brutal update, not even comparing IP
	        if ($wpdb->update( 
	                    $ZBSCRM_t['security_log'], 
	                    array( 
	                        'zbssl_reqstatus' => 1
	                    ), 
	                    array( // where
	                        'ID' => $requestID
	                        ),
	                    array( 
	                        '%d',
	                    ),
	                    array(
	                        '%d'
	                    )
	                ) !== false){

	                    // return id
	                    return $requestID;

	                }

	    }

	    return false;
	}

	// checks if blocked 
	function zeroBSCRM_security_blockRequest($reqType='unknown'){ 

	    // don't log requests for admins, who by nature, can see all
	    // needs to match zeroBSCRM_security_logRequest etc. above
	    if (zeroBSCRM_isZBSAdminOrAdmin()) return false;

	    global $zbs,$wpdb,$ZBSCRM_t;

	    // see if more than X (5?) failed request accessed by this ip within last Y (48h?)
	    $userIP = zeroBSCRM_getRealIpAddr(); 
	    $sinceTime = time()-172800; // 48h = 172800
	    $maxFails = 5;
	    $query = $wpdb->prepare( "SELECT COUNT(ID) FROM ".$ZBSCRM_t['security_log']." WHERE zbssl_ip = %s AND zbssl_reqstatus <> %d AND zbssl_reqtime > %d", array($userIP,1,$sinceTime));
	    $countFailed = (int)$wpdb->get_var($query);

	    // less than ..
	    if ($countFailed < $maxFails) return false;

	    return true;
	}


	// removes all security logs older than setting (72h at addition)
	// this is run DAILY by a cron job in ZeroBSCRM.CRON.php
	function zeroBSCRM_clearSecurityLogs(){

	    global $zbs,$wpdb,$ZBSCRM_t;

	    // older than
	    $deleteOlderThanTime = time()-259200; // 72h = 259200

	    // delete
	    $wpdb->query($wpdb->prepare("DELETE FROM ".$ZBSCRM_t['security_log']." WHERE zbssl_reqtime < %d",$deleteOlderThanTime));

	}


	function zeroBSCRM_hashes_GetHashForObj($objID = -1,$objTypeID=-1){

		if ($objID > 0 && $objTypeID > 0){

			global $zbs;
			$hash = $zbs->DAL->meta($objTypeID,$objID,'zbshash','');
	
			// Return with PREFIX (makes it interpretable later on as this is shared between invID + invHash (for example) at endpoint /invoices/*hashorid)
			if (!empty($hash)) return 'zh-'.$hash;

		}

		return false;
	}


	// NOTE: This is now GENERIC, for quotes/invs whatever has meta :) (DAL3+ pass objTypeID)
	//function is this a hash of an INVOICE. Could be refined when DB2.0
	//function for checking if a hash is valid
	// ... THIS WAS refactored for v3.0, now uses hash cols on objs :)
	function zeroBSCRM_hashes_GetObjFromHash($hash = '', $pay = -1, $objTypeID=-1){

		// def
		$ret = array(
			'success'=> false,
			'data'=>array()
			);

		//SANITIZE
		$hash = sanitize_text_field($hash); //sanitize it here

	// if prefix still present, chunk off
	if ( str_starts_with( $hash, 'zh-' ) ) {
		$hash = substr( $hash, 3 );
	}

        // get if poss
        if (!empty($hash) && $objTypeID > 0){

        	global $zbs;

        	switch ($objTypeID){

        		case ZBS_TYPE_INVOICE:

    				// retrieve, if any
    				$invoice = $zbs->DAL->invoices->getInvoice(-1,array('hash'=>$hash,'withAssigned'=>true));

    				// got inv?
    				if (is_array($invoice) && isset($invoice['id'])){

    					$contactID = -1; 
						//return the customer information that the invoice will need (i.e. Stripe customerID) same function will be used
						//in invoice checkout process (invoice pro) when being paid for using a HASH URL.

						if ($pay > 0){
							
							//paying so need the customerID from settings otherwise just viewing so dont need to expose data
							// WH: I've added this for future ease:
							if (is_array($invoice) && isset($invoice['contact']) && is_array($invoice['contact']) && count($invoice['contact']) > 0) $contactID = $invoice['contact'][0]['id'];
			    			//$companyID = -1;  if (is_array($invoice) && isset($invoice['company']) && is_array($invoice['company']) && count($invoice['company']) > 0) $companyID = $invoice['company'][0]['id'];                
		    	
						}
						$ret['success'] = true;
						$ret['data'] = array(
							'ID'	=> $invoice['id'],
							'cID'	=> $contactID
						);

    				}

        			break;
        		case ZBS_TYPE_QUOTE:

    				// retrieve, if any
    				$quote = $zbs->DAL->quotes->getQuote(-1,array('hash'=>$hash,'withAssigned'=>true));

    				// got quote?
    				if (is_array($quote) && isset($quote['id'])){

						$ret['success'] = true;
						$ret['data'] = array(
							'ID'	=> $quote['id'],
							'cID'	=> -1 // not req for quotes?
						);

    				}
    				
        			break;

        	} // / switch

        } // / if hash + objtypeid

        return $ret;
	
	}

// ======== / Security Logs (used for Quote + Trans hashlink access) =============
// ===============================================================================



// ===============================================================================
// =======================  Tax Table Helpers ====================================

// takes a subtotal and a (potential csv) of ID's of taxtable lines
// returns a £0 net value of the tax to be applied
function zeroBSCRM_taxRates_getTaxValue( $subtotal = 0.0, $taxRateIDCSV = '' ) {

	$tax = 0.0;

	// retrieve tax rate(s)
	if ( !empty( $taxRateIDCSV ) ) {

		$taxRateTable = zeroBSCRM_taxRates_getTaxTableArr( true );

		// get (multiple) id's
		$taxRatesToApply = array();
		if ( strpos( $taxRateIDCSV, ',' ) ) {

			$taxRateIDs = explode( ',', $taxRateIDCSV );
			if ( !is_array( $taxRateIDs ) ) {
				$taxRatesToApply = array();
			} else {
				$taxRatesToApply = $taxRateIDs;
			}

		} else {
			$taxRatesToApply[] = (int)$taxRateIDCSV;
		}

		if ( is_array( $taxRatesToApply ) ) {
			foreach ( $taxRatesToApply as $taxRateID ) {

				$rateID = (int)$taxRateID;
				if ( isset( $taxRateTable[$rateID] ) ) {

					// get rate
					$rate = 0.0;
					if ( isset( $taxRateTable[$rateID]['rate'] ) ) {
						$rate = (float)$taxRateTable[$rateID]['rate'];
					}

					// calc + add
					$tax += round( $subtotal * ( $rate / 100 ), 2 );

				} // else not set?

			} // / foreach tax rate to apply
		}

		return $tax;

	}

	return 0.0;

}

   // gets single tax rate by id
   function zeroBSCRM_taxRates_getTaxRate($taxRateID=''){

		// retrieve tax rate(s)
		if (!empty($taxRateID)){

			$taxRateID = (int)$taxRateID;

	        global $ZBSCRM_t,$wpdb;

		    // for v3.0, brutal direct sql
		    $query = 'SELECT * FROM '.$ZBSCRM_t['tax'].' WHERE ID = %d ORDER BY ID ASC';
	        try {

	            #} Prep & run query
	            $queryObj = $wpdb->prepare($query,array($taxRateID));
	            $potentialRes = $wpdb->get_row($queryObj, OBJECT);

	        } catch (Exception $e){

	           
	        }

	        #} Interpret results (Result Set - multi-row)
	        if (isset($potentialRes) && isset($potentialRes->ID)) {
	        	
	            return zeroBSCRM_taxRates_tidy_taxRate($potentialRes);

	        }

	    }

        return array();

   }

    // old alias
   	function zeroBSCRM_getTaxTableArr(){
   		return zeroBSCRM_taxRates_getTaxTableArr();
   	}

   	// retrieve tax table as array
	function zeroBSCRM_taxRates_getTaxTableArr($indexByID=false){

	    /* // demo/dummy data
	    return array(

	            //these will be populated based on the array
	            1  => array(
	                'id'    => 1,
	                'tax'   => 20,
	                'name'  => 'VAT'
	            ),

	            2 => array(
	                'id'    => 2,
	                'tax'   => 19,
	                'name'  => 'GST'
	            )

	        ); */

        global $ZBSCRM_t,$wpdb;

	    // for v3.0, brutal direct sql
	    $query = 'SELECT * FROM '.$ZBSCRM_t['tax'].' ORDER BY ID ASC';
        $potentialTaxRates = $wpdb->get_results($query, OBJECT);

        #} Interpret results (Result Set - multi-row)
        if (isset($potentialTaxRates) && is_array($potentialTaxRates) && count($potentialTaxRates) > 0) {

        	$res = array();

            #} Has results, tidy + return 
            foreach ($potentialTaxRates as $resDataLine) {
                        
                if ($indexByID){
	                
	                $lineID = (int)$resDataLine->ID;
	                $res[$lineID] = zeroBSCRM_taxRates_tidy_taxRate($resDataLine);

	            } else {
	                
	                $res[] = zeroBSCRM_taxRates_tidy_taxRate($resDataLine);

	            }

            }

            return $res;
        }

        return array();

	}

     /**
     * adds or updates a taxrate object
     *
     * @param array $args Associative array of arguments
     *              id (not req.), owner (not req.) data -> key/val
     *
     * @return int line ID
     */
    function zeroBSCRM_taxRates_addUpdateTaxRate($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1,
            'owner'         => -1,

            // fields (directly)
            'data'          => array(

                'name'   => '',
                'rate'     => 0.0,
                'created'   => -1 // override date? :(
                
            )

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============


        #} ========== CHECK FIELDS ============

            $id = (int)$id;

            // if owner = -1, add current
            if (!isset($owner) || $owner === -1) $owner = zeroBSCRM_user();

            // check if exists already (where no id passed)
            if ( $id < 1 && isset( $data['name'] ) && isset( $data['rate'] ) ){

            		// simple query
		    				$query = 'SELECT ID FROM '.$ZBSCRM_t['tax'].' WHERE zbsc_tax_name = %s AND zbsc_rate = %d ORDER BY ID DESC LIMIT 0,1';
            		$existing_rate_id = (int)$wpdb->get_var( $wpdb->prepare( $query, $data['name'], $data['rate'] ) );

            		if ( $existing_rate_id > 0 ){
            				$id = $existing_rate_id;
            		}

            }

        #} ========= / CHECK FIELDS ===========

        $dataArr = array( 

                            // ownership
                            // no need to update these (as of yet) - can't move teams etc.
                            //'zbs_site' => zeroBSCRM_installSite(),
                            //'zbs_team' => zeroBSCRM_installTeam(),
                            'zbs_owner' => $owner,

                            // fields
                            'zbsc_tax_name' => $data['name'],
                            'zbsc_rate' => $data['rate'],
                            'zbsc_lastupdated' => time()
                        );

        $dataTypes = array( // field data types
                            '%d',

                            '%s',
                            '%s',
                            '%d'
                        );

            if (isset($data['created']) && !empty($data['created']) && $data['created'] !== -1){
                $dataArr['zbsc_created'] = $data['created']; $dataTypes[] = '%d';
            }


        if (isset($id) && !empty($id) && $id > 0){

                #} Check if obj exists (here) - for now just brutal update (will error when doesn't exist)

                #} Attempt update
                if ($wpdb->update( 
                        $ZBSCRM_t['tax'], 
                        $dataArr, 
                        array( // where
                            'ID' => $id
                            ),
                        $dataTypes,
                        array( // where data types
                            '%d'
                            )) !== false){

                            // Successfully updated - Return id
                            return $id;

                        } else {

                            // FAILED update
                            return false;

                        }

        } else {

            // set created if not set
            if (!isset($dataArr['zbsc_created'])) {
                $dataArr['zbsc_created'] = time(); $dataTypes[] = '%d';
            }

            // add team etc
            $dataArr['zbs_site'] = zeroBSCRM_site(); $dataTypes[] = '%d';
            $dataArr['zbs_team'] = zeroBSCRM_team(); $dataTypes[] = '%d';
            
            #} No ID - must be an INSERT
            if ($wpdb->insert( 
                        $ZBSCRM_t['tax'], 
                        $dataArr, 
                        $dataTypes ) > 0){

                    #} Successfully inserted, lets return new ID
                    $newID = $wpdb->insert_id;

                    return $newID;

                } else {

                    #} Failed to Insert
                    return false;

                }

        }

        return false;

    }

     /**
     * deletes a Taxrate object
     *
     * @param array $args Associative array of arguments
     *              id
     *
     * @return int success;
     */
    function zeroBSCRM_taxRates_deleteTaxRate($args=array()){

        global $ZBSCRM_t,$wpdb;

        #} ============ LOAD ARGS =============
        $defaultArgs = array(

            'id'            => -1

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS ============

        #} Check ID & Delete :)
        $id = (int)$id;
        if (!empty($id) && $id > 0) return zeroBSCRM_db2_deleteGeneric($id,'tax');

        return false;

    }

    /**
     * tidy's the object from wp db into clean array
     *
     * @param array $obj (DB obj)
     *
     * @return array (clean obj)
     */
    function zeroBSCRM_taxRates_tidy_taxRate($obj=false){

            $res = false;

            if (isset($obj->ID)){
            $res = array();
            $res['id'] = $obj->ID;
            $res['owner'] = $obj->zbs_owner;
            
            $res['name'] = $obj->zbsc_tax_name;
            $res['rate'] = $obj->zbsc_rate;

            // to maintain old obj more easily, here we refine created into datestamp
            $res['created'] = zeroBSCRM_locale_utsToDatetime($obj->zbsc_created);
            $res['createduts'] = $obj->zbsc_created; // this is the UTS (int14)

            $res['lastupdated'] = $obj->zbsc_lastupdated;

        } 

        return $res;


    }


// ======================= / Tax Table Helpers ===================================
// ===============================================================================


// ===============================================================================
// =======================  File Upload Related Funcs ============================
   function zeroBS___________FileHelpers(){return;}

	// retrieve all files for a (customer)whatever
	function zeroBSCRM_files_getFiles($fileType = '',$objID=-1){

		global $zbs;

		$filesArrayKey = zeroBSCRM_files_key($fileType);
		
		if (!empty($filesArrayKey) && $objID > 0){

			// DAL2+
			// bit gross hard-typed, could be genericified as all is using is >DAL()->getMeta
			switch ($fileType){

				case 'customer':
				case 'contact':
					return $zbs->DAL->contacts->getContactMeta($objID,'files');
					break;

				case 'quotes':
				case 'quote':
					return $zbs->DAL->quotes->getQuoteMeta($objID,'files');
					break;

				case 'invoices':
				case 'invoice':
					return $zbs->DAL->invoices->getInvoiceMeta($objID,'files');
					break;

				case 'companies':
				case 'company':
					return $zbs->DAL->companies->getCompanyMeta($objID,'files');
					break;

				// no default

			}

		}

		return array();
	}

	// updates files array for a (whatever)
	function zeroBSCRM_files_updateFiles($fileType = '',$objID=-1,$filesArray=-1){

		global $zbs;

		$filesArrayKey = zeroBSCRM_files_key($fileType);
		
		if (!empty($filesArrayKey) && $objID > 0){


			// DAL2+
			// bit gross hard-typed, could be genericified as all is using is >DAL()->getMeta
			switch ($fileType){

				case 'customer':
				case 'contact':
					$zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$objID,'files',$filesArray);
					break;

				case 'quotes':
				case 'quote':
					$zbs->DAL->updateMeta(ZBS_TYPE_QUOTE,$objID,'files',$filesArray);
					break;

				case 'invoices':
				case 'invoice':
					$zbs->DAL->updateMeta(ZBS_TYPE_INVOICE,$objID,'files',$filesArray);
					break;

				case 'companies':
				case 'company':
					$zbs->DAL->updateMeta(ZBS_TYPE_COMPANY,$objID,'files',$filesArray);
					break;

				// no default

			}


			return $filesArray;			

		}

		return false;
	}

	// moves all files from one objid to another objid
	// v3.0+
	function zeroBSCRM_files_moveFilesToNewObject($fileType='',$oldObjID=-1,$objID=-1){

		global $zbs;

		$filesArrayKey = zeroBSCRM_files_key($fileType);
		$filesObjTypeInt = $zbs->DAL->objTypeID($fileType);

		if ($filesObjTypeInt > 0 && !empty($filesArrayKey) && $oldObjID > 0 && $objID > 0){

			// retrieve existing
			$existingFileArray = zeroBSCRM_files_getFiles($fileType,$oldObjID);

			// if has files
			if (is_array($existingFileArray)){

				// put the files into new obj:
				$x = zeroBSCRM_files_updateFiles($fileType,$objID,$existingFileArray);

				// delete old reference
				$zbs->DAL->deleteMeta(array(

		            'objtype'           => $filesObjTypeInt,
		            'objid'             => $oldObjID,
		            'key'               => $filesArrayKey

		        ));

		        return true;

			}

		}

		return false;
	}

	// gets meta key for file type arr
	function zeroBSCRM_files_key($fileType=''){


		switch ($fileType){

			case 'customer':
			case 'contact':

				return 'zbs_customer_files';

				break;
			case 'quotes':
			case 'quote':

				return 'zbs_customer_quotes';

				break;
			case 'invoices':
			case 'invoice':

				return 'zbs_customer_invoices';

				break;

			case 'companies':
			case 'company':

				return 'zbs_company_files';

				break;

		}

		return '';
	}

// ======================= / File Upload Related Funcs ===========================
// ===============================================================================



// ===============================================================================
// ===========   TEMPHASH (remains same for DAL2->3) =============================


 /**
 * checks validity of a temporary hash object
 *
 * @return int success;
 */
 function zeroBSCRM_checkValidTempHash($objid=-1,$type='',$hash=''){

 	// get a valid hash
 	$hash = zeroBSCRM_getTempHash(-1,$type,$hash,1);
 	
 	// check id
 	if (isset($hash) && is_array($hash) && isset($hash['objid'])) if ($objid == $hash['objid']) return true;

 	return false;

 }

 /**
 * retrieves a temporary hash object
 *
 * @return int success;
 */
 function zeroBSCRM_getTempHash($id=-1,$type='',$hash='',$status=-99){

	$id = (int)$id;
		if (!empty($id) && $id > 0){

		global $ZBSCRM_t,$wpdb;

		$whereStr = ''; $additionalWHERE = ''; $queryVars = array();

		if (!empty($id)){

			$queryVars[] = $id;
			$whereStr = 'ID = %d';

		} else {

			if (!empty($hash)){

				$queryVars[] = $hash;
				$whereStr = 'zbstemphash_objhash = %s';

			}

		}

		if (!empty($type)){

			$queryVars[] = $type;
			$additionalWHERE = 'AND zbstemphash_objtype = %s ';

		} // else will be from ANY type


		if ($status != -99){

			$queryVars[] = $status;
			$additionalWHERE = 'AND zbstemphash_status = %d ';

		}

		/* -- prep started, see: #OWNERSHIP */
		
		if (!empty($whereStr)){

			$sql = "SELECT * FROM ".$ZBSCRM_t['temphash']." WHERE ".$whereStr." ".$additionalWHERE."ORDER BY ID ASC LIMIT 0,1";

				$potentialReponse = $wpdb->get_row( $wpdb->prepare($sql,$queryVars), OBJECT );

		}

			if (isset($potentialReponse) && isset($potentialReponse->ID)){

				#} Retrieved :) fill + return
				
				// tidy
				$res = zeroBS_tidy_temphash($potentialReponse);

				return $res;
			}

		}

		return false;


	}

 /**
 * adds or updates a temporary hash object
 *
 * @return int success;
 */
	function zeroBSCRM_addUpdateTempHash($id=-1,$objstatus=-1,$objtype='',$objid=-1,$objhash='',$returnHashArr=false){

	// globals
	global $ZBSCRM_t,$wpdb;

	// got id?
	$id = (int)$id;
		if (!empty($id) && $id > 0){

			// check exists?

			// for now just brutal update.
   			if ($wpdb->update( 
					$ZBSCRM_t['temphash'], 
					array( 
						//'zbs_site' => zeroBSCRM_installSite(),
						//'zbs_team' => zeroBSCRM_installTeam(),
						//'zbs_owner' => zeroBSCRM_currentUserID(),

						'zbstemphash_status' => (int)$objstatus,
						'zbstemphash_objtype' => $objtype,
						'zbstemphash_objid' => (int)$objid,
						'zbstemphash_objhash' => $objhash,

						//'zbsmaillink_created' => time(),
						'zbstemphash_lastupdated' => time()
					), 
					array( // where
						'ID' => $id
						),
					array( 
						'%d', 
						'%s',
						'%d',
						'%s',
						'%d'
					),
					array(
						'%d'
						)
					) !== false){

						// if "return hash"
						if ($returnHashArr) return array('id'=>$id,'hash'=>$objhash);

   						// return id
		   				return $id;

		   			}



	} else {
		
		// insert

		// create hash if not created :)
		if (empty($objhash)) $objhash = zeroBSCRM_GenerateTempHash();

		// go
		if ($wpdb->insert( 
					$ZBSCRM_t['temphash'], 
					array( 
						//'zbs_site' => zeroBSCRM_installSite(),
						//'zbs_team' => zeroBSCRM_installTeam(),
						//'zbs_owner' => zeroBSCRM_currentUserID(),

						'zbstemphash_status' => (int)$objstatus,
						'zbstemphash_objtype' => $objtype,
						'zbstemphash_objid' => (int)$objid,
						'zbstemphash_objhash' => $objhash,

						'zbstemphash_created' => time(),
						'zbstemphash_lastupdated' => time()
					), 
					array( 
						//'%d',  // site
						//'%d',  // team
						//'%d',  // owner

						'%d', 
						'%s',
						'%d',
						'%s',
						'%d',
						'%d'
					) 
				) > 0){

				// inserted, let's move on
				$newID = $wpdb->insert_id;

				// if "return hash"
				if ($returnHashArr) return array('id'=>$id,'hash'=>$objhash);

				return $newID;
			}

	}

	return false;

}
 /**
 * deletes a temporary hash object
 *
 * @param array $args Associative array of arguments
 * 				id
 *
 * @return int success;
 */
function zeroBSCRM_deleteTempHash($args=array()){

	// Load Args
	$defaultArgs = array(

		'id' 			=> -1

	); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) $$argK = $args[$argK]; }

	// globals
	global $ZBSCRM_t,$wpdb;

	$id = (int)$id;
		if (!empty($id) && $id > 0) return zeroBSCRM_db2_deleteGeneric($id,'temphash');

   	return false;

}

function zeroBS_tidy_temphash($obj=false){

		$res = false;

		if (isset($obj->ID)){
		$res = array();
		$res['id'] = $obj->ID;
		$res['created'] = $obj->zbstemphash_created;
		$res['lastupdated'] = $obj->zbstemphash_lastupdated;

		$res['status'] = $obj->zbstemphash_status;
		$res['objtype'] = $obj->zbstemphash_objtype;
		$res['objid'] = $obj->zbstemphash_objid;
		$res['objhash'] = $obj->zbstemphash_objhash;
	} 

	return $res;

}
// generates generic HASH (used for links etc.)
function zeroBSCRM_GenerateTempHash($str=-1,$length=20){

	#} Brutal hash generator, for now
	if (!empty($str)){

		#} Semi-nonsense, not "secure"
		//$newMD5 = md5($postID.time().'fj30948hjfaosindf');

		$newMD5 = wp_generate_password(64, false);

		return substr($newMD5,0,$length-1);

	}

	return '';

}

// =========== / TEMPHASH   ======================================================
// ===============================================================================





/* ======================================================
  	General/WP helpers
   ====================================================== */

	// in effect this is: get owner (WP USER)'s email
	// currently only used on Automations extension
	// use jpcrm_get_obj_owner_wordpress_email() in future...
	function zeroBS_getAssigneeEmail( $cID=-1 ) {
		return jpcrm_get_obj_owner_wordpress_email( $cID, ZBS_TYPE_CONTACT );
	}


	// returns an obj owner's email as set against their WordPress account
	function jpcrm_get_obj_owner_wordpress_email( $objID, $objTypeID ) {

		global $zbs;
		if ( $objID > 0 && $zbs->DAL->isValidObjTypeID( $objTypeID ) ) {

			$ownerID = zeroBS_getOwner( $objID, false, $objTypeID );

			if ( $ownerID > 0 ) {
				return get_the_author_meta( 'user_email', $ownerID );
			}

		}

		return false;

	}


	// in effect this is: get owner (WP USER)'s mobile
    // use zeroBS_getObjOwnerWPMobile in future... (renamed, bad naming)
	function zeroBS_getAssigneeMobile($wpUID=-1){
		return zeroBS_getObjOwnerWPMobile($wpUID);
	}

	// returns owner of obj's mobile (from WP USER)
	function zeroBS_getObjOwnerWPMobile($objID =-1,$objType='zerobs_customer'){

		if ($objID > 0){

		    $ownerID = zeroBS_getOwner($objID,false,$objType);

			if ($ownerID > 0) return zeroBS_getWPUsersMobile($ownerID);
	
		}

		return false;

	}

	// in effect this is: get (WP USER)'s mobile
	// use zeroBS_getWPUsersMobile in future... (renamed)
	function zeroBS_getUserMobile($wpUID=-1){
		return zeroBS_getWPUsersMobile($wpUID);
	}

    // returns an obj owner's mobile number as per their wp account
	function zeroBS_getWPUsersMobile($uID =-1){
		if ($uID !== -1){
			if (!empty($uID)){
				$mobile_number = get_user_meta( 'mobile_number', $uID );
				$mobile_number = apply_filters( 'zbs_filter_mobile', $mobile_number); 
				return $mobile_number;
			}
			return false;
		}
	}

	/*
	* Gets formatted display name for user (tries to retrieve fname lname)
	*/
	function jpcrm_wp_user_name( $wordpress_user_id=-1 ){

		$user_info = get_userdata( $wordpress_user_id );
		if ( !$user_info ) return false;

		// start with display name
	    $user_name = $user_info->display_name;
	    
		// else try and use fname lname
	    if ( empty( $user_name ) ){
		    $user_name = $user_info->user_firstname;
		    if ( !empty( $user_info->user_lastname ) ){

		        if ( !empty( $user_name ) ){
		        	$user_name .= ' ';
		        }

		        $user_name .= $user_info->user_lastname;

		    }
		}

	    // else fall back to nice name
	    if ( empty( $user_name ) ){
	    	$user_name = $user_info->user_nicename;
	    }

	    // else email?
	    if ( empty( $user_name ) ){
	    	$user_name = $user_info->user_email;
	    }

		return $user_name;

	}


	function zeroBS_getCompanyCount(){

		global $zbs; return $zbs->DAL->companies->getCompanyCount(array('ignoreowner'=>true));
	}

	function zeroBS_getQuoteCount(){

		global $zbs; return $zbs->DAL->quotes->getQuoteCount(array('ignoreowner'=>true));

	}

	function zeroBS_getQuoteTemplateCount(){

		global $zbs; return $zbs->DAL->quotetemplates->getQuotetemplateCount(array('ignoreowner'=>true));

	}

	function zeroBS_getInvoiceCount(){

		global $zbs; return $zbs->DAL->invoices->getInvoiceCount(array('ignoreowner'=>true));
	}

	function zeroBS_getTransactionCount(){

		global $zbs; return $zbs->DAL->transactions->getTransactionCount(array('ignoreowner'=>true));
	}

	/// ======= Statuses wrappers - bit antiquated  now... 

		// outdated wrapper
		function zeroBS_getTransactionsStatuses(){ return zeroBSCRM_getTransactionsStatuses(); }


		function zeroBSCRM_getCustomerStatuses($asArray=false){

		    global $zbs;

		    $setting = $zbs->DAL->setting('customisedfields',false);

		    $zbsStatusStr = '';

		    #} stored here: $settings['customisedfields']
		    if (is_array($setting) && isset($setting['customers']['status']) && is_array($setting['customers']['status'])) $zbsStatusStr = $setting['customers']['status'][1];                                        
		    if (empty($zbsStatusStr)) {
		      #} Defaults:
		      global $zbsCustomerFields; if (is_array($zbsCustomerFields)) $zbsStatusStr = implode(',',$zbsCustomerFields['status'][3]);
		    }	    

		    if ($asArray){

		if ( str_contains( '#' . $zbsStatusStr, ',' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		    		$arr = explode(',',$zbsStatusStr);
		    		$ret = array();
		    		foreach ($arr as $x) { $z = trim($x); if (!empty($z)) $ret[] = $z; }

		    		return $ret;

		    	}

		    }

		    return $zbsStatusStr;
		}

/**
 * Retrieve valid transaction statuses
 *
 * @param bool $return_array Return an array instead of a CSV.
 */
function zeroBSCRM_getTransactionsStatuses( $return_array = false ) {
	global $zbs;

	$setting = $zbs->DAL->setting( 'customisedfields', false ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

	$zbs_status_str = '';

	if ( is_array( $setting ) && isset( $setting['transactions']['status'] ) && is_array( $setting['transactions']['status'] ) ) {
		$zbs_status_str = $setting['transactions']['status'][1];
	}
	if ( empty( $zbs_status_str ) ) {
		global $zbsTransactionFields; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		if ( is_array( $zbsTransactionFields ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$zbs_status_str = implode( ',', $zbsTransactionFields['status'][3] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
	}

	if ( $return_array ) {

		if ( str_contains( $zbs_status_str, ',' ) ) {
			return explode( ',', $zbs_status_str );
		} else {
			return array();
		}
	}

	return $zbs_status_str;
}

/**
 * Retrieve an array of valid invoice statuses
 */
function zeroBSCRM_getInvoicesStatuses() {
	// for DAL3+ these are hard typed, probably need to sit in the obj:
	return array(
		'Draft',
		'Unpaid',
		'Paid',
		'Overdue',
		'Deleted',
	);
}


		function zeroBSCRM_getCompanyStatusesCSV(){
		    
		    global $zbs;

		    $setting = $zbs->DAL->setting('customisedfields',false);

		    $zbsStatusStr = '';

		    #} stored here: $settings['customisedfields']
		    if (is_array($setting) && isset($setting['companies']['status']) && is_array($setting['companies']['status'])) $zbsStatusStr = $setting['companies']['status'][1];                                        
		    if (empty($zbsStatusStr)) {
		      #} Defaults:
		      global $zbsCompanyFields; if (is_array($zbsCompanyFields)) $zbsStatusStr = implode(',',$zbsCompanyFields['status'][3]);
		    }  

		    return $zbsStatusStr;
		}

/**
 * Retrieve an array of valid company statuses
 */
function zeroBSCRM_getCompanyStatuses() {
	$statuses_str = zeroBSCRM_getCompanyStatusesCSV();

	if ( str_contains( $statuses_str, ',' ) ) {
		return explode( ',', $statuses_str );
	} else {
		return array();
	}
}

		/// ======= / Statuses wrappers - bit antiquated  now... 

	// use this, or direct call
	function zeroBSCRM_invoice_getContactAssigned($invID=-1){

		global $zbs;
		return $zbs->DAL->invoices->getInvoiceContactID($invID);
	}

	// use this, or direct call
	function zeroBSCRM_quote_getContactAssigned($quoteID=-1){

		global $zbs;
		return $zbs->DAL->quotes->getQuoteContactID($quoteID);
	}

	// DELETES ALL rows from any table, based on ID
	// no limits! be careful.
	function zeroBSCRM_db2_deleteGeneric($id=-1,$tableKey=''){

		// req
		global $ZBSCRM_t,$wpdb;

		// lazy id check
		$id = (int)$id;
		if ( $id > 0 && !empty($tableKey) && array_key_exists( $tableKey, $ZBSCRM_t ) ){

	   		return $wpdb->delete( 
						$ZBSCRM_t[$tableKey], 
						array( // where
							'ID' => $id
							),
						array(
							'%d'
							)
						);

	   	}

	   	return false;
	}

   	// this has a js equivilent in global.js: zeroBSCRMJS_telURLFromNo
    function zeroBSCRM_clickToCallPrefix(){

        $click2CallType = zeroBSCRM_getSetting('clicktocalltype');

        if ($click2CallType == 1) return 'tel:';
        if ($click2CallType == 2) return 'callto:';

    }




    // this'll let you find strings in serialised arrays
    // super dirty :)
    // wh wrote for log reporter miguel
    function zeroBSCRM_makeQueryMetaRegexReturnVal($fieldNameInSerial=''){

    	/* 

			https://regex101.com/

			e.g. from 
						a:3:{s:4:"type";s:4:"Note";s:9:"shortdesc";s:24:"Testing Notes on another";s:8:"longdesc";s:16:"Dude notes what ";}

			thes'll return:

    	 	works, tho returns full str:

    	 		/"'.$fieldNameInSerial.'";s:[0-9]*:"[a-zA-Z0-9_ ]+/


    	 	returns:
		
				`shortdesc";s:24:"Testing Notes on another`


    		this is clean(er):
    		
    			(?<=shortdesc";s:)[0-9]*:"[^"]*

    		returns: 

    			24:"Testing Notes on another

			

			.. could get even cleaner, for now settling here



			// WH WORKS:

				// 
				https://stackoverflow.com/questions/16926847/wildcard-for-single-digit-mysql
				a:3:{s:4:"type";s:4:"Note";s:9:"shortdesc";s:24:"Testing Notes on another";s:8:"longdesc";s:16:"Dude notes what ";}

				SELECT *
				FROM `wp_postmeta`
				WHERE post_id = 150 AND meta_value regexp binary '/shortdesc";s:[0-9]*:"/'
				LIMIT 50
				// https://regex101.com/

		*/

		$regexStr = '/(?<="'.$fieldNameInSerial.'";s:)[0-9]*:"[^"]*/';

    	if (!empty($fieldNameInSerial) && zeroBSCRM_isRegularExpression($regexStr)) return $regexStr;

    	return false;

    }


    // this'll let you CHECK FOR strings in serialised arrays
    // super dirty :)
    // wh wrote for log reporter miguel
    function zeroBSCRM_makeQueryMetaRegexCheck($fieldNameInSerial='',$posval=''){

    	$regexStr = '/(?<="'.$fieldNameInSerial.'";s:)[0-9]*:"[^"]*'.$posval.'[^"]*/';

    	if (!empty($fieldNameInSerial) && !empty($posval) && zeroBSCRM_isRegularExpression($regexStr)) return $regexStr;

    	return false;

    }

    // this'll let you CHECK FOR strings (multiple starting fieldnames) in serialised arrays
    // super dirty :)
    // wh wrote for log reporter miguel
    // e.g. is X in shortdesc or longdesc in serialised wp options obj
    function zeroBSCRM_makeQueryMetaRegexCheckMulti($fieldNameInSerialArr=array(),$posval=''){

    	// multi fieldnames :)
    	// e.g. (?:shortdesc";s:|longdesc";s:)[0-9]*:"[^"]*otes[^"]*
    	// e.g. str: a:3:{s:4:"type";s:4:"Note";s:9:"shortdedsc";s:24:"Testing Notes on another";s:8:"longdesc";s:16:"Dude notes what ";}

    	$fieldNameInSerialStr = ''; if (count($fieldNameInSerialArr) > 0){

	    	foreach ($fieldNameInSerialArr as $s){

	    		if (!empty($fieldNameInSerialStr)) $fieldNameInSerialStr .= '|';
	    		$fieldNameInSerialStr .= '"'.$s.'";s:';
	    	}

	   	}

    	// FOR THESE REASONS: https://stackoverflow.com/questions/18317183/1139-got-error-repetition-operator-operand-invalid-from-regexp
    	// .. cant use this:
    	//$regexStr = '/(?:'.$fieldNameInSerialStr.')[0-9]*:"[^"]*'.$posval.'[^"]*/';
    	// bt this works:
    	$regexStr = '/('.$fieldNameInSerialStr.')[0-9]*:"[^"]*'.$posval.'[^"]*/';

    	if (!empty($fieldNameInSerialStr) && !empty($posval) && zeroBSCRM_isRegularExpression($regexStr)) return $regexStr;

    	return false;

    }

    // test regex roughly 
    // https://stackoverflow.com/questions/8825025/test-if-a-regular-expression-is-a-valid-one-in-php
    /*function zeroBSCRM_checkRegexWorks($pattern,$subject=''){
		if (@preg_match($pattern, $subject) !== false) return true;

		return false;
	} */
	function zeroBSCRM_isRegularExpression($string) {
	  set_error_handler(function() {}, E_WARNING);
	  $isRegularExpression = preg_match($string, "") !== FALSE;
	  restore_error_handler();
	  return $isRegularExpression;
	}

	function zeroBS_getCurrentUserUsername(){

		// https://codex.wordpress.org/Function_Reference/wp_get_current_user

	    $current_user = wp_get_current_user();
	    if ( !($current_user instanceof WP_User) ) return;
	    return $current_user->user_login;
	}


	function zeroBSCRM_getAddressCustomFields(){

		/* v3.0 changes the methodology here, in reality, this func is now defunct, just a wrapper... */
		global $zbs;
		return $zbs->DAL->getActiveCustomFields(array('objtypeid'=>ZBS_TYPE_ADDRESS));
	    
	}

	#} ZBS users page - returns list of WP user IDs, which have a ZBS role and includes name / email, etc
	function zeroBSCRM_crm_users_list(){  
	      //from Permissions
	      /*
	      remove_role('zerobs_admin');
	      remove_role('zerobs_customermgr');
	      remove_role('zerobs_quotemgr');
	      remove_role('zerobs_invoicemgr');
	      remove_role('zerobs_transactionmgr');
	      remove_role('zerobs_customer');
	      remove_role('zerobs_mailmgr');

	        */
	        //NOT zerbs_customer - this is people who have purchased (i.e. WooCommerce folk)
	        $role = array('zerobs_customermgr','zerobs_admin','administrator','zerobs_quotemgr', 'zerobs_invoicemgr', 'zerobs_transactionmgr',  'zerobs_mailmgr'); 
	        $crm_users = get_users(array('role__in' => $role, 'orderby' => 'ID'));

	        //this will return what WP holds (and can interpret on the outside.)
	        return $crm_users;

	}

		
	// returns a system setting for ignore ownership
	// ... ownership ignored, unless the setting is on + not admin
	function zeroBSCRM_DAL2_ignoreOwnership($objType=1){

		global $zbs;

		// FOR NOW EVERYONE CAN SEE EVERYTHING
		// Later add - strict ownership? isn't this a platform UPSELL?
		// if ($zbs->settings->get('perusercustomers') && !current_user_can('administrator')) return false;

		return true;

	}

	function zeroBSCRM_DEPRECATEDMSG($msg=''){

		echo '<div class="zbs info msg">'.$msg.'</div>';
		error_log(strip_tags($msg));

	}

	/**
	 * This takes a passed object type (old or new) and returns the new type.
	 * 
	 * @param string|int - an object type in old or new format, e.g.:
	 *   old: 'zerobs_customer'
	 *   new: 1, ZBS_TYPE_CONTACT
	 * 
	 * @return int|bool false - the object type ID if it exists, false if not
	 */
	function jpcrm_upconvert_obj_type( $obj_type=-1 ) {
		global $zbs;

		if ( $zbs->DAL->isValidObjTypeID( $obj_type ) ) {
			// already a valid new obj?
			return (int)$obj_type;
		}
		else {
			// upconvert old type into new
			return $zbs->DAL->objTypeID( $obj_type );
		}
	}

	/**
	 * Backward compat - `zbsLink` got renamed to `jpcrm_esc_link` in 5.5
	 **/
	function zbsLink( $key = '', $id = -1, $type = 'zerobs_customer', $prefixOnly = false, $taxonomy = false ){

		return jpcrm_esc_link( $key, $id, $type, $prefixOnly, $taxonomy );

	}

	/**
	 * Core Link building function
	 * Produces escaped raw URLs for links within wp-admin based CRM areas
	 * 
		Examples:
		echo '<a href="'.jpcrm_esc_link('edit',-1,'contact',false,false).'">New Contact</a>';
		echo '<a href="'.jpcrm_esc_link('edit',$id,'contact',false,false).'">Edit Contact</a>';

	 * Notes:
	 * - accepts new (contact,ZBS_TYPE_CONTACT) or old (zerobs_customer) references (but use NEW going forward)
	 * - previously called `zbsLink`
	 **/
	function jpcrm_esc_link( $key = '', $id = -1, $type = 'zerobs_customer', $prefixOnly = false, $taxonomy = false ){
		
		global $zbs;

		// infer objTypeID (turns contact|zerobs_contact -> ZBS_TYPE_CONTACT)
		$objTypeID = jpcrm_upconvert_obj_type( $type );

		// switch through potentials
		switch ($key){

			case 'list':

				$url = admin_url('admin.php?page='.$zbs->slugs['dash']);

				// switch based on type.
				switch ($objTypeID){

					case ZBS_TYPE_CONTACT: $url = admin_url( 'admin.php?page='.$zbs->slugs['managecontacts'] ); break;
					case ZBS_TYPE_COMPANY: $url = admin_url( 'admin.php?page='.$zbs->slugs['managecompanies'] ); break;
					case ZBS_TYPE_QUOTE: $url = admin_url( 'admin.php?page='.$zbs->slugs['managequotes'] ); break;
					case ZBS_TYPE_INVOICE: $url = admin_url( 'admin.php?page='.$zbs->slugs['manageinvoices'] ); break;
					case ZBS_TYPE_TRANSACTION: $url = admin_url( 'admin.php?page='.$zbs->slugs['managetransactions'] ); break;
					case ZBS_TYPE_FORM: $url = admin_url( 'admin.php?page='.$zbs->slugs['manageformscrm'] ); break;
					case ZBS_TYPE_TASK: $url = admin_url( 'admin.php?page='.$zbs->slugs['manage-tasks'] ); break;
					case ZBS_TYPE_SEGMENT: $url = admin_url( 'admin.php?page='.$zbs->slugs['segments'] ); break;
					case ZBS_TYPE_QUOTETEMPLATE: $url = admin_url( 'admin.php?page='.$zbs->slugs['quote-templates'] ); break;

				}

				// rather than return admin.php?page=list, send to dash if not these ^ 
				return esc_url_raw( $url );

				break;

			case 'view':

				// view page (theoretically returns for all obj types, even tho contact + company only ones using view pages atm)
				if ($objTypeID > 0){

					if ($id > 0) {

						// view with actual ID
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=view&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) . '&zbsid=' . $id ) );

					} else if ($prefixOnly){

						// prefix only
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=view&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) . '&zbsid=' ) );

					}

				} // / got objType
				break;

			case 'edit':

				// edit page (returns for all obj types)
				if ($objTypeID > 0){

					if ($id > 0) {

						// view with actual ID
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=edit&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) . '&zbsid=' . $id ) );

					} else if ( $prefixOnly ){

						// prefix only
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=edit&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) . '&zbsid=' ) ) ;

					}

				} // / got objType
				break;
			case 'create':

				// create page (returns for all obj types)
				if ( $objTypeID > 0 ){

					return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=edit&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) ) );

				} // / got objType

				// mail campaigns specific catch
				if ($type == 'mailcampaign' || $type == 'mailsequence'){
					global $zeroBSCRM_MailCampaignsslugs; if (isset($zeroBSCRM_MailCampaignsslugs)){
						return esc_url_raw( admin_url( 'admin.php?page=' . $zeroBSCRM_MailCampaignsslugs['editcamp'] ) );
					}
				}

				break;

			case 'delete':

				// delete page
				if ( $objTypeID > 0 ){

					if ( $id > 0 ) {

						// view with actual ID
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=delete&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID ) . '&zbsid=' . $id ) );

					} else if ($prefixOnly){

						// prefix only
						return esc_url_raw( admin_url( 'admin.php?page=zbs-add-edit&action=delete&zbstype=' . $zbs->DAL->objTypeKey( $objTypeID).'&zbsid=' ) );

					}

				} // / got objType
				break;
			case 'tags':

				// Tag manager page (returns for all obj types)
				if ( $objTypeID > 0 ){

					return esc_url_raw( admin_url( 'admin.php?page=' . $zbs->slugs['tagmanager'] . '&tagtype=' . $zbs->DAL->objTypeKey( $objTypeID ) ) );

				} // / got objType

				break;

			case 'listtagged':

				// List view -> tagged (returns for all obj types)
				if ( $objTypeID > 0 ){

					// exception: event tags
					if ( $objTypeID == ZBS_TYPE_TASK ) {

						return esc_url_raw( admin_url( 'admin.php?page=' . $zbs->slugs['manage-tasks-list'] . '&zbs_tag=' . $taxonomy ) );

					}

					return esc_url_raw( admin_url( 'admin.php?page=' . $zbs->DAL->listViewSlugFromObjID( $objTypeID ) . '&zbs_tag=' . $taxonomy ) );

				} // / got objType
				break;

			case 'email':

				switch ( $objTypeID ){

					case ZBS_TYPE_CONTACT:

						if ($id > 0) {

							// email with actual ID
							return esc_url_raw( zeroBSCRM_getAdminURL( $zbs->slugs['emails'] ) . '&zbsprefill=' . $id );

						} else if ( $prefixOnly ){

							// page only
							return esc_url_raw( zeroBSCRM_getAdminURL( $zbs->slugs['emails'] ) . '&zbsprefill=' );

						}
						
						break;

				}

				break;

		}
		

		// if $key isn't in switch, assume it's a slug :)
		return esc_url_raw( admin_url( 'admin.php?page=' . $key ) );

		// none? DASH then!
		// return esc_url_raw( admin_url('admin.php?page=zerobscrm-dash') );
	}

	#} This is run by main init :) (Installs Quote Templates etc.)
	function zeroBSCRM_installDefaultContent() {

		global $zbs;

		#} Quote Builder, defaults
		$quoteBuilderDefaultsInstalled = zeroBSCRM_getSetting('quotes_default_templates');

		if (!is_array($quoteBuilderDefaultsInstalled)){

			#} Need installing!
			$installedQuoteTemplates = array();

			#} Load content
			$quoteBuilderDefaultTemplates = array();

				#} Web Design: Example				
                $templatedHTML = file_get_contents(ZEROBSCRM_PATH.'html/quotes/quote-template-web-design.html');
                if (!empty($templatedHTML)) $quoteBuilderDefaultTemplates['webdesignexample'] = array(
                	'title' => __('Web Design: Example','zero-bs-crm'),
                	'html' => $templatedHTML,
                	'value' => 500.00
                );
			

			#} Install..
			if (count($quoteBuilderDefaultTemplates) > 0) foreach ($quoteBuilderDefaultTemplates as $template){

				// Insert via DAL3
				$newTemplateID = $zbs->DAL->quotetemplates->addUpdateQuotetemplate(array(
				            // fields (directly)
				            'data'          => array(

				                'title' => $template['title'],
				                'value' => $template['value'],
				                'date_str' => '',
				                'date' => '',
				                'content' => $template['html'],
				                'notes' => '',
				                'currency' => '',
				                'created' => time(),
				                'lastupdated' => time(),


				            ),

				            'extraMeta' => array('zbsdefault'=>1)
					));

				if ($newTemplateID > 0) $installedQuoteTemplates[] = $newTemplateID;

			}

			#} Log installed
	  		$zbs->settings->update('quotes_default_templates',$installedQuoteTemplates);

		}



	}

/* ======================================================
  	/ General/WP helpers
   ====================================================== */
