<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 04/06/2019
 */

	// V3.0 version of API

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

		$json_params = file_get_contents("php://input");
		$new_trans = json_decode($json_params,true);

		//REQUIRED
		$orderid = -1; if (isset($new_trans['orderid'])) $orderid	= sanitize_text_field($new_trans['orderid']);

		// other
		$email = ''; if (isset($new_trans['email'])) $email 		= sanitize_text_field($new_trans['email']);		
		$customer = zeroBS_getCustomerIDWithEmail($email);
		$fname = ''; if (isset($new_trans['fname'])) $fname 		= sanitize_text_field($new_trans['fname']);

		if (empty($customer)){

			// customer with that email does not exist.. create a customer
			// do we need STATUS? WH: YES

			#} ... added pretty logs... cloned from create_customer + tweaked

				#} Build pretty log msgs :)

					#} DEFAULTS

						#} New User from API
						$newUserAPISourceShort = __('Created from API Action',"zero-bs-crm").' <i class="fa fa-random"></i>';
						$newUserAPISourceLong = __('API Action fired to create customer (New Transaction)',"zero-bs-crm");


						#} Here we catch "HTTP_USER_AGENT": "Zapier" ;)
						if (isset($_SERVER['HTTP_USER_AGENT']) && $_SERVER['HTTP_USER_AGENT'] == 'Zapier'){
							
							#} Just means this was probs fired by ZAP APP
							#} So pretty up msgs :)

							#} New User from trans
							$newUserAPISourceShort = __('Created by Zapier (API)',"zero-bs-crm").' <i class="fa fa-random"></i>';
							$newUserAPISourceLong = __('Zapier fired an API Action to create this customer (New Transaction)',"zero-bs-crm");

						}

						#} Actual log var passed- SHOULD NEVER HAPPEN HERE... this is new cust
						$fallBackLog = array();

						#} Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by form")
						$internalAutomatorOverride = array(

									'note_override' => array(
								
												'type' => 'API Action',
												'shortdesc' => $newUserAPISourceShort,
												'longdesc' => $newUserAPISourceLong				

									)

								);

			$customer = zeroBS_integrations_addOrUpdateCustomer('api',$email,
				array(

			    	'zbsc_email' => $email,
		    		'zbsc_status' => 'Customer',
			    	'zbsc_fname' => $fname,

			    ),

			    '', #) Customer date (auto)
				
				#} Fallback log (for customers who already exist)
				$fallBackLog,

				false, #} Extra meta

				#} Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
				$internalAutomatorOverride
			);

		}

		//RECOMMENDED
		$status = ''; if (isset($new_trans['status'])) $status	    = sanitize_text_field($new_trans['status']);
		$total = ''; if (isset($new_trans['total'])) $total	    = sanitize_text_field($new_trans['total']);
		$item_title = ''; if (isset($new_trans['item_title'])) $item_title = sanitize_text_field($new_trans['item_title']);
		$net = ''; if (isset($new_trans['net'])) $net 		= sanitize_text_field($new_trans['net']);
		$tax = ''; if (isset($new_trans['tax'])) $tax 		= sanitize_text_field($new_trans['tax']);
		$fee = ''; if (isset($new_trans['fee'])) $fee 		= sanitize_text_field($new_trans['fee']);
		$disc = ''; if (isset($new_trans['disc'])) $disc  		= sanitize_text_field($new_trans['discount']);
		$rate = ''; if (isset($new_trans['rate'])) $rate 		= sanitize_text_field($new_trans['tax']);
		$date = isset( $new_trans['date'] ) ? date( 'Y-m-d H:i:s', (int)$new_trans['date'] ) : '';


		$tFields = array(
			'orderid' 	=> $orderid,
			'customer' 	=> $customer,
			'status' 	=> $status,
			'total' 	=> $total,
			'date' 	=> $date,

			'item' 		=> $item_title,
			'net' 		=> $net,
			'tax' 		=> $tax,
			'fee' 		=> $fee,
			'discount' 	=> $disc,
			'tax_rate' 	=> $rate,
		);


		#} We can only add a trans if it has a unique id ($orderid)
		#} This isn't even a check that it's unique, if it exists, it'll update...
		if (!empty($orderid)){

			#} Build pretty log msgs :)

				#} DEFAULTS
					#} Existing user updated by API
					$existingTransactionAPISourceShort = __('Transaction Updated by API Action',"zero-bs-crm").' <i class="fa fa-random"></i>';
					$existingTransactionAPISourceLong = __('API Action fired to update a transaction',"zero-bs-crm").': #'.$orderid.' for '.zeroBSCRM_getCurrencyChr().$total.' (Status: '.$status.')';

					#} New Transaction from API
					$newTransactionAPISourceShort = __('Transaction Created from API Action',"zero-bs-crm").' <i class="fa fa-random"></i>';
					$newTransactionAPISourceLong = __('API Action fired to create a transaction',"zero-bs-crm").': #'.$orderid.' for '.zeroBSCRM_getCurrencyChr().$total.' (Status: '.$status.')';


				#} Here we catch "HTTP_USER_AGENT": "Zapier" ;)
				if (isset($_SERVER['HTTP_USER_AGENT']) && $_SERVER['HTTP_USER_AGENT'] == 'Zapier'){
					
					#} Just means this was probs fired by ZAP APP
					#} So pretty up msgs :)
					$existingTransactionAPISourceShort = __('Transaction Updated by Zapier',"zero-bs-crm").' <i class="fa fa-random"></i>';
					$existingTransactionAPISourceLong = __('Zapier fired an API Action to update a transaction',"zero-bs-crm").': #'.$orderid.' for '.zeroBSCRM_getCurrencyChr().$total.' (Status: '.$status.')';

					#} New Transaction from api
					$newTransactionAPISourceShort = __('Transaction Added by Zapier',"zero-bs-crm").' <i class="fa fa-random"></i>';
					$newTransactionAPISourceLong = __('Zapier fired an API Action to add a transaction',"zero-bs-crm").': #'.$orderid.' for '.zeroBSCRM_getCurrencyChr().$total.' (Status: '.$status.')';

				}

					#} Actual log var passed
					$fallBackLog = array(
								'type' => 'API Action',
								'shortdesc' => $existingTransactionAPISourceShort,
								'longdesc' => $existingTransactionAPISourceLong
							);

					#} Internal automator overrides - here we pass a "transaction.create" note override (so we can pass it a custom str, else we let it fall back to "created by api")
					$internalAutomatorOverride = array(

								'note_override' => array(
							
											'type' => 'API Action',
											'shortdesc' => $newTransactionAPISourceShort,
											'longdesc' => $newTransactionAPISourceLong				

								)

						);

			$trans = zeroBS_integrations_addOrUpdateTransaction('api',$orderid, $tFields,
				array(), #} TAGS
			    '', #) Trans date (auto)
				$fallBackLog, #} Fallback log (for Trans who already exist)
				false, #} Extra meta			
				$internalAutomatorOverride, #} Internal automator overrides - here we pass a "transaction.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
				'' // field prefix, e.g. zbst_
			);
			// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update
		    

			// old way just returned what was sent...
		    //wp_send_json($json_params);

			// thorough much? lol.
			if (!empty($trans) && $trans !== false && $trans !== -1){

				// return what was passed...
				// this is legacy funk.. not ideal at all, should probs reload.
				$return_params = $new_trans;

				// add id (if new)
				if ($trans > 0) 
					$return_params['id'] = $trans;

				// return
				wp_send_json($return_params);  

			} else {

				// fail.
				wp_send_json(array('error'=>100));  			

			}

		}

	exit();

?>