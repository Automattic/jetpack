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
  Integration specific extension functions (#MIKELOOK)
   ====================================================== */

/*
	|=======================================
	|	zeroBS_integrations_getCustomer
	|=======================================
	| Retrieves a customer record (as usual _getCustomer func) - but one that has been inserted via import from an external source
	| E.g. Woo Imported, Paypal imported, whatever
	| A customer can exist with multiple import IDs, which lets us patch across services.
	| E.g. Customer has a woo id of customer1@gmail.com (woo uses emails), and a paypal id of customer1@gmail.com (or another email, paypal will also use emails)
	| Then that customer could be called with either of these, but would get the same main "customer" record
	| zeroBS_integrations_getCustomer('woo','customer1@gmail.com')
	| zeroBS_integrations_getCustomer('pay','customer1@gmail.com')
	| These "externalSource"s can be flags we agree on, and add here for reference
	| 		23/01/2015:
	|			'woo' = WooCommerce
	| 			'pay' = Paypal
	|		... for these to work they must be added to $zbscrmApprovedExternalSources; at top of ZeroBSCRMExternalSources.php or via extension hook in
	| To be further expanded if  req.
	|=======================================
	| Returns:
	| 	Customer obj (std class)
	| 		or
	| 	False (boolean) (customer does not exist)
	|=======================================
	| Check via: if ($customerobj !== false)
	|=======================================
*/
function zeroBS_integrations_getCustomer($externalSource='',$externalID=''){

	#} Do query for ID
	$potentialCustomerID = zeroBS_getCustomerIDWithExternalSource($externalSource,$externalID);

	if ($potentialCustomerID !== false){

		#} If so, pass full deets via this
		return zeroBS_getCustomer($potentialCustomerID);

	}

	#} If it gets here, it failed
	return false;

}

/*
	|=======================================
	|	zeroBS_integrations_addOrUpdateCustomer
	|=======================================
	| Add's a new customer, or updates an existing customer, where their externalSource + externalID matches an existing customer (if specified)
	| e.g. if it's a woo customer import and woo uses 'usersemail' as their unique id, then you'd specify 'woo' and 'theiremail@whatever.com' as the source + ID
	| This only works with specific external sources, as 'zeroBS_integrations_getCustomer'
	| These "externalSource"s can be flags we agree on, and add here for reference
	| 		01/06/2016:
	|			'woo' = WooCommerce
	| 			'pay' = Paypal
	|		01/08/2016:
	|			'form' = Form Capture
	|		11/12/2016:
	|			'grav' = Gravity Forms
	|
	| Usage:
	
			zeroBS_integrations_addOrUpdateCustomer('woo','woodyhayday2@smt.com',array(

		    	'zbsc_email' => 'woodyhayday2@smt.com',

		    	'zbsc_status' => 'Lead',
		    	'zbsc_prefix' => 'Mr',
		    	'zbsc_fname' => 'Woody',
		    	'zbsc_lname' => 'Hayday',
		    	'zbsc_addr1' => 'First Addr',
		    	'zbsc_addr2' => '2nd Addr',
		    	'zbsc_city' => 'London',
		    	'zbsc_county' => 'G London',
		    	'zbsc_postcode' => 'AL1 111',
		    	'zbsc_hometel' => '0123456789',
		    	'zbsc_worktel' => '999',
		    	'zbsc_mobtel' => '333',
		    	'zbsc_notes' => 'Multi Line 
		    	Notes 
		    	Kick Ass', 

		    	#} custom fields are set as cf(int) and so are per-install dependent, you probs don't ever want to insert these :) :D
		    	#'zbsc_cf1' => 'Google'

		    ), 

				'customer_date as per mike!',

				'none', 

				false, 

				false

		    ); 	
	
	|
	| ... note "woo" external source flag
	| ... note "woodyhayday2@smt.com" - my ID within woo
	| ... note normal customer fields in array, prefixed with 'zbsc_'
	| ... NOTE: Mike added customer_date
	| ... Note: From v1.1.18 we also have fallback logs:
	| --------------------------------------------------
	| Fallback Logs:
	| 	Pass either:
	|		'none' = do nothing if user already exists
	|		'auto' = automatically create log (NOT WORKING YET)
	| 		OR:
	|		array(
	|			'type' => 'Form Filled',#'form_filled',
	|			'shortdesc' => 'Dude filled out the form x on y',
	|			'longdesc' => ''
	|		)
	|				
	|			(Long desc is optional)
	|
	|			#} CURRENT Note Types (use first field/key e.g. "form_filled") (v1.1.18 - 20/09/16)
	|
	|	        'note': { label: 'Note', ico: 'fa-sticky-note-o' },
	|	        'call': { label: 'Call', ico: 'fa-phone-square' },
	|	        'email': { label: 'Email', ico: 'fa-envelope-o' },
	|	        'meeting': { label: 'Meeting', ico: 'fa-users' },
	|	        'quote__sent': { label: 'Quote: Sent', ico: 'fa-share-square-o' },
	|	        'quote__accepted': { label: 'Quote: Accepted', ico: 'fa-thumbs-o-up' },
	|	        'quote__refused': { label: 'Quote: Refused', ico: 'fa-ban' },
	|	        'invoice__sent': { label: 'Invoice: Sent', ico: 'fa-share-square-o' },
	|	        'invoice__part_paid': { label: 'Invoice: Part Paid', ico: 'fa-money' },
	|	        'invoice__paid': { label: 'Invoice: Paid', ico: 'fa-money' },
	|	        'invoice__refunded': { label: 'Invoice: Refunded', ico: 'fa-money' },
	|	        'transaction': { label: 'Transaction', ico: 'fa-credit-card' },
	|	        'tweet': { label: 'Tweet', ico: 'fa-twitter' },
	|	        'facebook_post': { label: 'Facebook Post', ico: 'fa-facebook-official' },
	|	        'created': { label: 'Created', ico: 'fa-plus-circle' },
	|	        'updated': { label: 'Updated', ico: 'fa-pencil-square-o' },
	|	        'quote_created': { label: 'Quote Created', ico: 'fa-plus-circle' },
	|	        'invoice_created': { label: 'Invoice Created', ico: 'fa-plus-circle' },
	|	        'form_filled': { label: 'Form Filled', ico: 'fa-wpforms'}
	|
	| --------------------------------------------------
	|
	|
	|
	|	#} RE: $extraMeta (This isn't used anywhere yet, talk to WH before using)
	|
	|		... this is a key value array passable to add extra values to customers
	|		... should look like:
	|
	|		$extraMeta = array(
	|
	|			array('key_here',12345),
	|			array('another','what')
	|
	|		)
	|
	|		... which will add the following meta to a customer:
	|
	|		zbs_customer_extra_key_here = 12345
	|		zbs_customer_extra_another = what
	|
	|		... BRUTALLY - no checking, just overwrites! (so be careful)
	|
	|	#} Re: $automatorPassthrough
	|
	|		... adding anything here allows it to be passed through to the internal automator (which currently sets notes)
	|		... this means you can pass an array with note str overrides... e.g.
	|
	|		array(
	|
	|			'note_override' => array(
	|		
	|						'type' => 'Form Filled',#'form_filled',
	|						'shortdesc' => 'Dude filled out the form x on y',
	|						'longdesc' => ''					
	|
	|			)
	|
	|		)
	|
	|		... see recipes to see what's useful :)
	|
	|=======================================
	|	27/09/16: $emailAlreadyExistsAction
	|	
	|		This is a flag to say what to do in this circumstance: User obj passed has an email (in $customerFields['zbsc_email']) which matches a customer in DB already
	|		... options:
	|			'update': Update customer record (and add external source) (BRUTAL override)
	|			'skip': Do nothing
	|			'notifyexit': quit + notify
	|		... this func is mostly future proofing, as there may be times we want to avoid overriding existing data from an import e.g.
	|
	|=======================================
	| ... Made this func super easy so you can just fire it when you're not sure if add or update... :) it'll deal.
	|=======================================
	| Returns:
	| 	Customer ID
	| 		or
	| 	False (boolean) (customer create/update failed)
	|=======================================
*/
function zeroBS_integrations_addOrUpdateCustomer($externalSource='',$externalID='',$customerFields=array(), $customerDate = '', $fallbackLog='auto', $extraMeta = false, $automatorPassthroughArray = false, $emailAlreadyExistsAction = 'update',$fieldPrefix = 'zbsc_'){

	#} leave this true and it'll run as normal.
	$usualUpdate = true;
	
	global $zbs;

	$potentialCustomerIDfromEmail = false;

	if (!empty($externalSource) && !empty($externalID) && is_array($customerFields) && count($customerFields) > 0){

		if (isset($customerFields['zbsc_email']) && !empty($customerFields['zbsc_email'])){

			#} First check for email in cust list
			$potentialCustomerIDfromEmail = zeroBS_getCustomerIDWithEmail($customerFields['zbsc_email']);

			#} If so... act based on $emailAlreadyExistsAction param
			if (!empty($potentialCustomerIDfromEmail)){

				#} So we have a customer with this email...
				switch ($emailAlreadyExistsAction){

					/* not built out yet...
					case 'addextsrc':

						#} Just add the external source


						break; */
					case 'update':

						#} Just let it roll on...
						$usualUpdate = true;

						break;
					case 'skip':

						#} don't do nothin :)
						$usualUpdate = false;


						break;
					case 'notifyexit':

						#} Notify + exit
						echo esc_html( 'Contact Add/Update Issue: A contact already exists with the email "' . $customerFields['zbsc_email'] . '" (ID: ' . $potentialCustomerIDfromEmail . '), user could not be processed!' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						exit();

						break;



				}

			}

		}

		#} =========================================================================================
		#} NO existing user! Proceed as before!
		#} =========================================================================================
		if ($usualUpdate){


			// if ID specifically passed, use that :)
			if (isset($customerFields['id']) && !empty($customerFields['id']) && $customerFields['id'] > 0){

				$potentialCustomerID = $customerFields['id'];
			
			} else {

				#} Do query for ID
				$potentialCustomerID = zeroBS_getCustomerIDWithExternalSource($externalSource,$externalID);

			}

			#} If ID empty, but $potentialCustomerIDfromEmail (from above) not, use $potentialCustomerIDfromEmail
			if (($potentialCustomerID === false || $potentialCustomerID == -1) && $potentialCustomerIDfromEmail !== false) $potentialCustomerID = $potentialCustomerIDfromEmail;

			#} Default fallback log creation
			$fallbackLogToPass = false;
			if ( 
				!isset($fallbackLog) ||
				!is_array($fallbackLog)
				) {

				#} create default fallback log, unless $fallbackLog is set to 'none'
				if ($fallbackLog !== 'none'){

					#} Autogen
					#} Left this out for v1.1.18... needs thought.
					#} Do we really want to put "woo source added"? It might get added loads. 
					#} For now leave as manual...

				}

			} elseif (is_array($fallbackLog)){

				#} Fallback log is probably set, just pass it along.
				$fallbackLogToPass = $fallbackLog;

			}

			#} Here we're passing along any automator pass through
			#} ... which will typically be overrides for creation logs or any extra params to give to internal automator. 
			$automatorPassthrough = false; if (isset($automatorPassthroughArray) && is_array($automatorPassthroughArray)) $automatorPassthrough = $automatorPassthroughArray;

			#} Not yet used, ask WH
			// Now passing through 2.24+ $extraMeta = false;

			#} Brutal add/update
			#} MS - 3rd Jan 2019 - this (eventually) just calls the usual _addUpdateCustomer function
			$customerID = zeroBS_addUpdateCustomer($potentialCustomerID,$customerFields,$externalSource,$externalID, $customerDate, $fallbackLogToPass, $extraMeta, $automatorPassthrough, -1, $fieldPrefix);


			#} Update any title
			if (!$zbs->isDAL2() && $customerID !== false) zbsCustomer_updateCustomerNameInPostTitle($customerID,false);


			return $customerID;


		} #} / usual update

	} else{
		return false;
	}

}

/*
	|=======================================
	|	zeroBS_integrations_addOrUpdateCompany
	|=======================================
	| Add's a new Company, or updates an existing Company, where their externalSource + externalID matches an existing Company (if specified)
	| NOTE: This is different from zeroBS_integrations_addOrUpdateCustomer, in that the externalID must be COMPANY NAME
	| This only works with specific external sources, as 'zeroBS_integrations_getCompany'
	| These "externalSource"s can be flags we agree on, and add here for reference
	| 		23/01/2015:
	|			'woo' = WooCommerce
	| 			'pay' = Paypal
	|			'form' = Form Capture
	|
	| Usage:
	
			zeroBS_integrations_addOrUpdateCompany('woo','Dell',array(

		    	'zbsc_coname' => 'Dell',

		    	'zbsc_status' => 'Lead',
		    	'zbsc_addr1' => 'First Addr',
		    	'zbsc_addr2' => '2nd Addr',
		    	'zbsc_city' => 'London',
		    	'zbsc_county' => 'G London',
		    	'zbsc_postcode' => 'AL1 111',
		    	'zbsc_hometel' => '0123456789',
		    	'zbsc_worktel' => '999',
		    	'zbsc_mobtel' => '333',
		    	'zbsc_notes' => 'Multi Line 
		    	Notes 
		    	Kick Ass', 

		    	#} custom fields are set as cf(int) and so are per-install dependent, you probs don't ever want to insert these :) :D
		    	#'zbsc_cf1' => 'Google'

		    ), 

				'customer_date as per mike!',

				'none', 

				false, 

				false

		    ); 	
	
	|
	| ... note "woo" external source flag
	| ... note "woodyhayday2@smt.com" - my ID within woo
	| ... note normal customer fields in array, prefixed with 'zbsc_'
	| ... NOTE: Mike added customer_date
	| ... Note: From v1.1.18 we also have fallback logs:
	| --------------------------------------------------
	| Fallback Logs:
	| 	Pass either:
	|		'none' = do nothing if user already exists
	|		'auto' = automatically create log (NOT WORKING YET)
	| 		OR:
	|		array(
	|			'type' => 'Form Filled',#'form_filled',
	|			'shortdesc' => 'Dude filled out the form x on y',
	|			'longdesc' => ''
	|		)
	|				
	|			(Long desc is optional)
	|
	|			#} CURRENT Note Types (use first field/key e.g. "form_filled") (v1.1.18 - 20/09/16)
	|
	|	        'note': { label: 'Note', ico: 'fa-sticky-note-o' },
	|	        'call': { label: 'Call', ico: 'fa-phone-square' },
	|	        'email': { label: 'Email', ico: 'fa-envelope-o' },
	|	        'meeting': { label: 'Meeting', ico: 'fa-users' },
	|	        'quote__sent': { label: 'Quote: Sent', ico: 'fa-share-square-o' },
	|	        'quote__accepted': { label: 'Quote: Accepted', ico: 'fa-thumbs-o-up' },
	|	        'quote__refused': { label: 'Quote: Refused', ico: 'fa-ban' },
	|	        'invoice__sent': { label: 'Invoice: Sent', ico: 'fa-share-square-o' },
	|	        'invoice__part_paid': { label: 'Invoice: Part Paid', ico: 'fa-money' },
	|	        'invoice__paid': { label: 'Invoice: Paid', ico: 'fa-money' },
	|	        'invoice__refunded': { label: 'Invoice: Refunded', ico: 'fa-money' },
	|	        'transaction': { label: 'Transaction', ico: 'fa-credit-card' },
	|	        'tweet': { label: 'Tweet', ico: 'fa-twitter' },
	|	        'facebook_post': { label: 'Facebook Post', ico: 'fa-facebook-official' },
	|	        'created': { label: 'Created', ico: 'fa-plus-circle' },
	|	        'updated': { label: 'Updated', ico: 'fa-pencil-square-o' },
	|	        'quote_created': { label: 'Quote Created', ico: 'fa-plus-circle' },
	|	        'invoice_created': { label: 'Invoice Created', ico: 'fa-plus-circle' },
	|	        'form_filled': { label: 'Form Filled', ico: 'fa-wpforms'}
	|
	| --------------------------------------------------
	|
	|
	|
	|	#} RE: $extraMeta (This isn't used anywhere yet, talk to WH before using)
	|
	|		... this is a key value array passable to add extra values to customers
	|		... should look like:
	|
	|		$extraMeta = array(
	|
	|			array('key_here',12345),
	|			array('another','what')
	|
	|		)
	|
	|		... which will add the following meta to a customer:
	|
	|		zbs_customer_extra_key_here = 12345
	|		zbs_customer_extra_another = what
	|
	|		... BRUTALLY - no checking, just overwrites! (so be careful)
	|
	|	#} Re: $automatorPassthrough
	|
	|		... adding anything here allows it to be passed through to the intval(var)ternal automator (which currently sets notes)
	|		... this means you can pass an array with note str overrides... e.g.
	|
	|		array(
	|
	|			'note_override' => array(
	|		
	|						'type' => 'Form Filled',#'form_filled',
	|						'shortdesc' => 'Dude filled out the form x on y',
	|						'longdesc' => ''					
	|
	|			)
	|
	|		)
	|
	|		... see recipes to see what's useful :)
	|
	|=======================================
	|	27/09/16: $conameAlreadyExistsAction
	|	
	|		This is a flag to say what to do in this circumstance: User obj passed has an email (in $companyFields['zbsc_coname']) which matches a company in DB already
	|		... options:
	|			'update': Update company record (and add external source) (BRUTAL override)
	|			'skip': Do nothing
	|			'notifyexit': quit + notify
	|		... this func is mostly future proofing, as there may be times we want to avoid overriding existing data from an import e.g.
	|
	|=======================================
	| ... Made this func super easy so you can just fire it when you're not sure if add or update... :) it'll deal.
	|=======================================
	| Returns:
	| 	Company ID
	| 		or
	| 	False (boolean) (Company create/update failed)
	|=======================================
*/

#} External source + (externalID = Co NAME)

function zeroBS_integrations_addOrUpdateCompany(
	$externalSource='',
	$externalID='',
	$companyFields=array(), 
	$companyDate = '', 
	$fallbackLog='auto', 
	$extraMeta = false, 
	$automatorPassthroughArray = false, 
	$conameAlreadyExistsAction = 'update',
	$fieldPrefix = 'zbsc_'){

	global $zbs;

	#} leave this true and it'll run as normal.
	$usualUpdate = true;

	if (!empty($externalSource) && !empty($externalID) && is_array($companyFields) && count($companyFields) > 0){

		$potentialCompanyIDfromName = false;
		$potentialCoName = '';

		// <3.0
		if (isset($companyFields[$fieldPrefix.'coname']) && !empty($companyFields[$fieldPrefix.'coname'])) $potentialCoName = $companyFields[$fieldPrefix.'coname'];
		// 3.0
		if (isset($companyFields[$fieldPrefix.'name']) && !empty($companyFields[$fieldPrefix.'name'])) $potentialCoName = $companyFields[$fieldPrefix.'name'];


		if ($potentialCoName !== ''){

			#} First check for name in company list
			$potentialCompanyIDfromName = zeroBS_getCompanyIDWithName($potentialCoName);

			#} If so... act based on $conameAlreadyExistsAction param
			if (!empty($potentialCompanyIDfromName)){

				#} So we have a customer with this email...
				switch ($conameAlreadyExistsAction){

					/* not built out yet...
					case 'addextsrc':

						#} Just add the external source


						break; */
					case 'update':

						#} Just let it roll on...
						$usualUpdate = true;

						break;
					case 'skip':

						#} don't do nothin :)
						$usualUpdate = false;


						break;
					case 'notifyexit':

						#} Notify + exit
						echo esc_html( __(jpcrm_label_company().' Add/Update Issue: A '.jpcrm_label_company().' already exists with the name "','zero-bs-crm').$potentialCoName.'" (ID: '.$potentialCompanyIDfromName.'), '.__('could not be processed!','zero-bs-crm') );
						exit();

						break;



				}

			}

		}

		#} =========================================================================================
		#} NO existing user! Proceed as before!
		#} =========================================================================================
		if ($usualUpdate){

			#} Do query for ID
			$potentialCompanyID = zeroBS_getCompanyIDWithExternalSource($externalSource,$externalID);

			#} If ID empty, but $potentialCompanyIDfromName (from above) not, use $potentialCompanyIDfromName
			if ($potentialCompanyID === false && $potentialCompanyIDfromName !== false) $potentialCompanyID = $potentialCompanyIDfromName;

			#} Default fallback log creation
			$fallbackLogToPass = false;
			if ( 
				!isset($fallbackLog) ||
				!is_array($fallbackLog)
				) {

				#} create default fallback log, unless $fallbackLog is set to 'none'
				if ($fallbackLog !== 'none'){

					#} Autogen
					#} Left this out for v1.1.18... needs thought.
					#} Do we really want to put "woo source added"? It might get added loads. 
					#} For now leave as manual...

				}

			} elseif (is_array($fallbackLog)){

				#} Fallback log is probably set, just pass it along.
				$fallbackLogToPass = $fallbackLog;

			}

			#} Here we're passing along any automator pass through
			#} ... which will typically be overrides for creation logs or any extra params to give to internal automator. 
			$automatorPassthrough = false; if (isset($automatorPassthroughArray) && is_array($automatorPassthroughArray)) $automatorPassthrough = $automatorPassthroughArray;

			#} Not yet used, ask WH
			$extraMeta = false;

			#} Brutal add/update
			$companyID = zeroBS_addUpdateCompany($potentialCompanyID,$companyFields,$externalSource,$externalID, $companyDate, $fallbackLogToPass, $extraMeta, $automatorPassthrough,-1,$fieldPrefix);

			return $companyID;


		} #} / usual update

	} else return false;


}


/*
	|=======================================
	|	zeroBS_integrations_getCompany
	|=======================================
	| Retrieves a Company record (as usual _getCompany func) - but one that has been inserted via import from an external source
	| E.g. Woo Imported, Paypal imported, whatever
	| A Company can exist with multiple import IDs, which lets us patch across services.
	| E.g. Company has a woo id of 1234, and a paypal Company id of x3da9j3d9jad2
	| Then that Company could be called with either of these, but would get the same main "Company" record
	| zeroBS_integrations_getCompany('woo','1234')
	| zeroBS_integrations_getCompany('pay','x3da9j3d9jad2')
	|=======================================
	| Returns:
	| 	Company obj (std class)
	| 		or
	| 	False (boolean) (Company does not exist)
	|=======================================
	| Check via: if ($coobj !== false)
	|=======================================
*/
function zeroBS_integrations_getCompany($externalSource='',$externalID=''){

	#} Do query for ID
	$potentialCompanyID = zeroBS_getCompanyIDWithExternalSource($externalSource,$externalID);

	if ($potentialCompanyID !== false){

		#} If so, pass full deets via this
		return zeroBS_getCompany($potentialCompanyID);

	}

	#} If it gets here, it failed
	return false;

}









/*
	|=======================================
	|	zeroBS_integrations_addOrUpdateTransaction
	|=======================================
	| Add's a new Transaction, or updates an existing Transaction, where their externalSource + externalID matches an existing Transaction (if specified)
	| NOTE: This is different from zeroBS_integrations_addOrUpdateCustomer, in that the externalID must be Transaction ID
	| This only works with specific external sources, as 'zeroBS_integrations_getTransaction'
	| Usage:
	
			zeroBS_integrations_addOrUpdateTransaction('woo','#123456',array(
				
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


			), array(
				TAGS:
				'sale','bill','chargeback','refund','echeckchargeback','cancel-rebill','uncancel-rebill' etc.

			),

				'date as per mike!',

				'none', 

				false, 

				false

		    ); 	
	
	|
	| ... note "woo" external source flag
	| ... note "woodyhayday2@smt.com" - my ID within woo
	| ... note normal customer fields in array, prefixed with 'zbsc_'
	| ... NOTE: Mike added date
	| ... Note: From v1.1.18 we also have fallback logs:
	| --------------------------------------------------
	| Fallback Logs:
	| 	Pass either:
	|		'none' = do nothing if user already exists
	|		'auto' = automatically create log (NOT WORKING YET)
	| 		OR:
	|		array(
	|			'type' => 'Form Filled',#'form_filled',
	|			'shortdesc' => 'Dude filled out the form x on y',
	|			'longdesc' => ''
	|		)
	|				
	|			(Long desc is optional)
	|
	| --------------------------------------------------
	|
	|
	|	#} RE: $extraMeta 
	|
	|		... this is a key value array passable to add extra values to customers
	|		... should look like:
	|
	|		$extraMeta = array(
	|
	|			array('key_here',12345),
	|			array('another','what')
	|
	|		)
	|
	|		... which will add the following meta to a customer:
	|
	|		zbs_customer_extra_key_here = 12345
	|		zbs_customer_extra_another = what
	|
	|		... BRUTALLY - no checking, just overwrites! (so be careful)
	|
	| --------------------------------------------------
	|
	|	#} Re: $automatorPassthrough
	|
	|		... adding anything here allows it to be passed through to the internal automator (which currently sets notes)
	|		... this means you can pass an array with note str overrides... e.g.
	|
	|		array(
	|
	|			'note_override' => array(
	|		
	|						'type' => 'Form Filled',#'form_filled',
	|						'shortdesc' => 'Dude filled out the form x on y',
	|						'longdesc' => ''					
	|
	|			)
	|
	|		)
	|
	|		... see recipes to see what's useful :)
	|
	|=======================================
	| Returns:
	| 	Transaction ID
	| 		or
	| 	False (boolean) (Transaction create/update failed)
	|=======================================
*/
function zeroBS_integrations_addOrUpdateTransaction(

	$transactionExternalSource='', /* Req, e.g. 'str' */
	$transactionExternalID='',  /* Req, e.g. 'ch_1DqSxpBy0i6Hd9AL4noH4Yhx' */
	$transactionFields=array(),  /* Req: array(orderid,customer,status,total) */
	$transactionTags=array(), /* optional extra tags */
	$transactionDate = '', 
	$fallbackLog='auto', 
	$extraMeta = false, 
	$automatorPassthroughArray = false,
	$fieldPrefix = 'zbst_'

	){

	#} Check req.
	if (
		!empty($transactionExternalSource) && !empty($transactionExternalID) && is_array($transactionFields) && count($transactionFields) > 0 &&
		
			(
				// v2
				(isset($transactionFields['orderid']) && !empty($transactionFields['orderid']))
				||
				// v3
				(isset($transactionFields['ref']) && !empty($transactionFields['ref']))

			) &&
		//isset($transactionFields['customer']) && !empty($transactionFields['customer']) &&
		isset($transactionFields['status']) && !empty($transactionFields['status']) &&
		isset($transactionFields['total']) && !empty($transactionFields['total'])
		){

			#} Do query for ID
			$potentialTransactionID = zeroBS_getTransactionIDWithExternalSource($transactionExternalSource,$transactionExternalID);

			#} Default fallback log creation
			$fallbackLogToPass = false;
			if ( 
				!isset($fallbackLog) ||
				!is_array($fallbackLog)
				) {

				#} create default fallback log, unless $fallbackLog is set to 'none'
				if ($fallbackLog !== 'none'){

					#} Autogen
					#} Left this out for v1.1.18... needs thought.
					#} Do we really want to put "woo source added"? It might get added loads. 
					#} For now leave as manual...

				}

			} elseif (is_array($fallbackLog)){

				#} Fallback log is probably set, just pass it along.
				$fallbackLogToPass = $fallbackLog;

			}

			#} Here we're passing along any automator pass through
			#} ... which will typically be overrides for creation logs or any extra params to give to internal automator. 
			$automatorPassthrough = false; if (isset($automatorPassthroughArray) && is_array($automatorPassthroughArray)) $automatorPassthrough = $automatorPassthroughArray;

			#} Brutal add/update
			$transactionWPID = zeroBS_addUpdateTransaction($potentialTransactionID, $transactionFields, $transactionExternalSource, $transactionExternalID, $transactionDate, $transactionTags, $fallbackLogToPass, $extraMeta, $automatorPassthrough,$fieldPrefix);

			#} Update any title
			#} Not needed for transactions: if ($transactionWPID !== false) zbsCustomer_updateCompanyNameInPostTitle($companyID,false);

			return $transactionWPID;

	} else { // no source/id/fields

		return false;

	}

}

function zeroBS_integrations_addOrUpdateEvent(
	$eventID = -1,  /* Req - the event ID */
	$dataArray =array(),  /* Req: title,to, from */
	$eventReminders = array()  /* Req: remind_at,sent (v3+) */
	){

	#} Check req.
	if (
		is_array($dataArray) && count($dataArray) > 0 &&
		isset($dataArray['title']) && !empty($dataArray['title']) &&

			(
				// v2
				(isset($dataArray['to']) && !empty($dataArray['to']) && isset($dataArray['from']) && !empty($dataArray['from']))
				||
				// v3
				(isset($dataArray['start']) && !empty($dataArray['start']) && isset($dataArray['end']) && !empty($dataArray['end']))

			)
		){

			return zeroBS_addUpdateEvent($eventID, $dataArray, $eventReminders);

	} else { // no source/id/fields

		return false;

	}

}


/*
	|=======================================
	|	zeroBS_integrations_getTransaction
	|=======================================
	| Retrieves a transaction record (as usual _getTransaction func) - but one that has been inserted via import from an external source
	| E.g. Woo Imported, Paypal imported, whatever
	| A transaction can exist with multiple import IDs, which lets us patch across services.
	| E.g. transaction has a woo id of 1234, and a paypal transaction id of x3da9j3d9jad2
	| Then that transaction could be called with either of these, but would get the same main "transaction" record
	| zeroBS_integrations_getTransaction('woo','1234')
	| zeroBS_integrations_getTransaction('pay','x3da9j3d9jad2')
	|=======================================
	| Returns:
	| 	transaction obj (std class)
	| 		or
	| 	False (boolean) (transaction does not exist)
	|=======================================
	| Check via: if ($transobj !== false)
	|=======================================
*/
function zeroBS_integrations_getTransaction($transactionExternalSource='',$transactionExternalID=''){

	#} Do query for ID
	$potentialTransactionID = zeroBS_getTransactionIDWithExternalSource($transactionExternalSource,$transactionExternalID);

	if ($potentialTransactionID !== false){

		#} If so, pass full deets via this
		return zeroBS_getTransaction($potentialTransactionID);

	}

	#} If it gets here, it failed
	return false;

}








/*
	For now a wrapper, later will allow us to seemlessly feed in customer generated cats
*/
function zeroBS_integrations_getAllCategories($incEmpty=false){

	global $zbs;

	if ($zbs->isDAL2()){

		return array('zerobscrm_customertag' => $zbs->DAL->getTagsForObjType(array(

                'objtypeid'=>ZBS_TYPE_CONTACT,
                'excludeEmpty'=>!$incEmpty,
                'withCount'=>true,
                'ignoreowner' => true,
                // sort
                'sortByField'   => 'zbstag_name',
                'sortOrder'   => 'ASC'

                )));

	} else {

		// DAL1

		if (!$incEmpty){

			$cats = array(
				#'zerobscrm_worktag' => get_categories(array('taxonomy'=>'zerobscrm_worktag','orderby' => 'name','order'=> 'ASC'))#,
				#Other Tags? 
				'zerobscrm_customertag' => get_categories(array('taxonomy'=>'zerobscrm_customertag','orderby' => 'name','order'=> 'ASC'))
			);

		} else {

			$cats = array(
				#'zerobscrm_worktag' => get_categories(array('taxonomy'=>'zerobscrm_worktag','orderby' => 'name','order'=> 'ASC'))#,
				#Other Tags? 
				'zerobscrm_customertag' => get_terms(array('taxonomy'=>'zerobscrm_customertag','orderby' => 'name','order'=> 'ASC','hide_empty' => false))
			);

		}

	}

	return $cats;

}


#} For now just a wrapper
function zeroBS_integrations_searchCustomers($args=array()){
	
	if (!empty($args) && isset($args['searchPhrase'])) return zeroBS_searchCustomers($args);

	return array();

}

#} Add log (currently a wrapper)
function zeroBS_integrations_addLog(

		$objID = -1,
		/* - is add, doesn't need this:
			$logID = -1,
		*/
		$logDate = -1,

		/* 

			NOTE!: as of 31/05/17 WOODY started putting 
			'meta_assoc_id' in these - e.g. if it's an 'email sent' log, this meta_assoc_id will be the CAMPAIGN id
			'meta_assoc_src' would then be mailcamp

		*/

		$noteFields = array(),

		/* 
		DB2 requires obj type, 
		for now we use zerobs_customer etc. but later we will make these interchangable with TYPES e.g. ZBS_TYPE_CONTACT
		*/

		$objType = '' 

		){

	if (!empty($objID)){

		#} Add fresh log:
		zeroBS_addUpdateLog($objID,-1,$logDate,$noteFields,$objType);

		return true;

	}

	return false;


}

// WH added, backward compat:
// only works DAL2 + 
function zeroBS_integrations_getCustomFields($objTypeID=-1){

	$objTypeID = (int)$objTypeID;

	if ($objTypeID > 0){

		global $zbs;

		if ($zbs->isDAL2())
			return $zbs->DAL->getActiveCustomFields(array('objtypeid'=>$objTypeID));

	}

	return array();
}

/* ======================================================
  / Integration specific extension functions
   ====================================================== */
