<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.19
 *
 * Copyright 2020 Automattic
 *
 * Date: 18/10/16
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

/*
14 October 1922

This file was removed in v5.0.1, but was added back for the sole purpose of capturing some missing translation strings.
See gh-2494 for details; at some point we should handle this better and remove this file again.

*/

/*
======================================================
	Hard Coded Fields + Sorts
	(Defaults which can be overriden by custom fields + field sorts)
	====================================================== */

	// } Below are HARD CODED fields :)

	// } NOTE:
	// } Added an additional field to each field 'area'
	// } adding this (any text) will group these into a "subset" with title of 'area'
	// } they MUST (currently) be in sequential order!!!

	/*
	DAL3 Notes:

		#globalfieldobjsdal3

		This ultimately becomes #legacy. This global $fields var collection was
		written way back at the beginning when we were doing all kinds of rough dev.
		Now, these are kind of derelict technical debt, really replaced by DAL obj models.
		To defer the work in this cycle, I've left these here (as doing DAL3 translation)
		because to remove them at this point is like peeling off a symbiote.
		... so, for near future, let's see how they play out.

		DAL3 Obj models + legacy $fields globals. I suppose the field globals are kind of
		"UI visible" variants of obj models... that's how they operate, for now, at least.

		// interesting use: DAL2 core, func: ->objModel($type=1)

		WH 12/2/19
	*/

	// } ALSO added 'opt' field
	// } if this is set it'll be checked whether $zbsFieldsEnabled['optname'] global is true/false
	global $zbsFieldsEnabled;

	// } NOTE: 1.1.19 added field sorting, stored here:
	global $zbsFieldSorts;
$zbsFieldSorts = array();

	// } Preparing to roll this out...
	global $zbsAddressFields;

		$zbsAddressFields = array(
			'addr1'    => array(
				'text',
				__( 'Address Line 1', 'zero-bs-crm' ),
				'',
				'area' => 'Main Address',
			),
			'addr2'    => array(
				'text',
				__( 'Address Line 2', 'zero-bs-crm' ),
				'',
				'area' => 'Main Address',
			),
			'city'     => array(
				'text',
				__( 'City', 'zero-bs-crm' ),
				'e.g. London',
				'area' => 'Main Address',
			),
			'county'   => array(
				'text',
				__( 'County', 'zero-bs-crm' ),
				'e.g. Greater London',
				'area' => 'Main Address',
			),
			'postcode' => array(
				'text',
				__( 'Postcode', 'zero-bs-crm' ),
				'e.g. E1 9XJ',
				'area' => 'Main Address',
			),
			'country'  => array(
				'text',
				__( 'Country', 'zero-bs-crm' ),
				'e.g. UK',
				'area' => 'Main Address',
			),

		);

		// } Global Default sort for all "addresses" (to be used for all address outputs)
		$zbsFieldSorts['address'] = array(

			// } Default order
			'default' => array(
				'addr1',
				'addr2',
				'city',
				'county',
				'postcode',
				'country',
			),

		);

		global $zbsCustomerFields;

		$zbsCustomerFields = array(

			'status'           => array(
				'select',
				'Status',
				'',
				array(
					'Lead',
					'Customer',
					'Refused',
					'Blacklisted',
				),
				'essential' => true,
			),

			'prefix'           => array(
				'select',
				'Prefix',
				'',
				array(
					'Mr',
					'Mrs',
					'Ms',
					'Miss',
					'Mx',
					'Dr',
					'Prof',
					'Mr & Mrs',
				),
				'essential' => true,
			),
			'fname'            => array(
				'text',
				__( 'First Name', 'zero-bs-crm' ),
				'e.g. John',
				'essential' => true,
			),
			'lname'            => array(
				'text',
				__( 'Last Name', 'zero-bs-crm' ),
				'e.g. Doe',
				'essential' => true,
			),
			// 'src' => array('select','Source','',$srcArray),
			'addr1'            => array(
				'text',
				__( 'Address Line 1', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'addr2'            => array(
				'text',
				__( 'Address Line 2', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'city'             => array(
				'text',
				__( 'City', 'zero-bs-crm' ),
				'e.g. London',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'county'           => array(
				'text',
				__( 'County', 'zero-bs-crm' ),
				'e.g. Greater London',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'postcode'         => array(
				'text',
				__( 'Post Code', 'zero-bs-crm' ),
				'e.g. E1 9XJ',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),

			'country'          => array(
				'selectcountry',
				__( 'Country', 'zero-bs-crm' ),
				'e.g. UK',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),

			'secaddr_country'  => array(
				'selectcountry',
				__( 'Country', 'zero-bs-crm' ),
				'e.g. UK',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),

			'secaddr_addr1'    => array(
				'text',
				__( 'Address Line 1', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_addr2'    => array(
				'text',
				__( 'Address Line 2', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_city'     => array(
				'text',
				__( 'City', 'zero-bs-crm' ),
				'e.g. London',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_county'   => array(
				'text',
				__( 'County', 'zero-bs-crm' ),
				'e.g. Greater London',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_postcode' => array(
				'text',
				__( 'Post Code', 'zero-bs-crm' ),
				'e.g. E1 9XJ',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),

			'hometel'          => array( 'tel', __( 'Home Telephone', 'zero-bs-crm' ), 'e.g. 01234 567 891' ),
			'worktel'          => array( 'tel', __( 'Work Telephone', 'zero-bs-crm' ), 'e.g. 01234 567 891' ),
			'mobtel'           => array( 'tel', __( 'Mobile Telephone', 'zero-bs-crm' ), 'e.g. 07123 580 543' ),
			'email'            => array(
				'email',
				__( 'Email', 'zero-bs-crm' ),
				'e.g. john@yahoo.com',
				'essential' => true,
			),
			// this'll get taken out by unnpack function post DAL2
			'notes'            => array( 'textarea', __( 'Notes', 'zero-bs-crm' ), '' ),

		);

		// } Default sort:
		$zbsFieldSorts['customer'] = array(

			// } Default order
				'default' => array(

					'status',
					'prefix',
					'fname',
					'lname',
					/*
						addresses subordinated to global "address" field sort
							'addr1',
							'addr2',
							'city',
							'county',
							'postcode',
						*/
						'addresses',  // } This indicates addresses
					'hometel',
					'worktel',
					'mobtel',
					'email',
					'notes',
				),

		);

		global $zbsCompanyFields;

		$zbsCompanyFields = array(

			'status'           => array(
				'select',
				'Status',
				'',
				array(
					'Lead',
					'Customer',
					'Refused',
					'Blacklisted',
				),
				'essential' => true,
			),

			'coname'           => array(
				'text',
				__( 'Name', 'zero-bs-crm' ),
				'e.g. Dell',
				'essential' => true,
			),

			'addr1'            => array(
				'text',
				__( 'Address Line 1', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'addr2'            => array(
				'text',
				__( 'Address Line 2', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'city'             => array(
				'text',
				__( 'City', 'zero-bs-crm' ),
				'e.g. London',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'county'           => array(
				'text',
				__( 'County', 'zero-bs-crm' ),
				'e.g. Greater London',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'postcode'         => array(
				'text',
				__( 'Postcode', 'zero-bs-crm' ),
				'e.g. E1 9XJ',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),
			'country'          => array(
				'selectcountry',
				__( 'Country', 'zero-bs-crm' ),
				'e.g. UK',
				'area'    => __( 'Main Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),

			'secaddr_addr1'    => array(
				'text',
				__( 'Address Line 1', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_addr2'    => array(
				'text',
				__( 'Address Line 2', 'zero-bs-crm' ),
				'',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_city'     => array(
				'text',
				__( 'City', 'zero-bs-crm' ),
				'e.g. London',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_county'   => array(
				'text',
				__( 'County', 'zero-bs-crm' ),
				'e.g. Greater London',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_postcode' => array(
				'text',
				__( 'Postcode', 'zero-bs-crm' ),
				'e.g. E1 9XJ',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'opt'     => 'secondaddress',
				'migrate' => 'addresses',
			),
			'secaddr_country'  => array(
				'selectcountry',
				__( 'Country', 'zero-bs-crm' ),
				'e.g. UK',
				'area'    => __( 'Second Address', 'zero-bs-crm' ),
				'migrate' => 'addresses',
			),

			'maintel'          => array( 'tel', __( 'Main Telephone', 'zero-bs-crm' ), 'e.g. 01234 567 891' ),
			'sectel'           => array( 'tel', __( 'Secondary Telephone', 'zero-bs-crm' ), 'e.g. 01234 567 891' ),
			'email'            => array( 'email', __( 'Main Email Address', 'zero-bs-crm' ), 'e.g. helpdesk@dell.com' ),
			'notes'            => array( 'textarea', __( 'Notes', 'zero-bs-crm' ), '' ),

		);

		// } Default sort:
		$zbsFieldSorts['company'] = array(

			// } Default order
				'default' => array(

					'status',
					'coname',
					/*
						addresses subordinated to global "address" field sort
							'addr1',
							'addr2',
							'city',
							'county',
							'postcode',
						*/
						'addresses', // } This indicates addresses
					'maintel',
					'sectel',
					'mobtel',
					'email',
					'notes',
				),

		);

		global $zbsCustomerQuoteFields;

		$zbsCustomerQuoteFields = array(

			'name'  => array(
				'text',
				__( 'Quote Title', 'zero-bs-crm' ),
				'e.g. New Website',
				'essential' => true,
			),
			'val'   => array(
				'price',
				__( 'Quote Value', 'zero-bs-crm' ),
				'e.g. 500.00',
				'essential' => true,
			),
			'date'  => array(
				'date',
				__( 'Quote Date', 'zero-bs-crm' ),
				'',
				'essential' => true,
			),
			'notes' => array( 'textarea', __( 'Notes', 'zero-bs-crm' ), '' ),

		);

		// } Default sort:
		$zbsFieldSorts['quote'] = array(

			// } Default order
			'default' => array(

				'name',
				'val',
				'date',
				'notes',
			),

		);

		global $zbsCustomerInvoiceFields;

		$zbsCustomerInvoiceFields = array(

			'status' => array(
				'select',
				'Status',
				'',
				array(
					'Draft',
					'Unpaid',
					'Paid',
					'Overdue',
					'Deleted',
				),
				'essential' => true,
			),

			// NOTE! 'no' should now be ignored, (deprecated), moved to seperate meta 'zbsid'

			// NOTE WH: when I hit this with column manager, loads didn't need to be shown
			// so plz leave ,'nocolumn'=>true in tact :)

			// 'name' => array('text','Quote Title','e.g. Chimney Rebuild'),
			'no'     => array(
				'text',
				__( 'Invoice number', 'zero-bs-crm' ),
				'e.g. 123456',
				'essential' => true,
			), // } No is ignored by edit routines :)
			'val'    => array(
				'hidden',
				__( 'Invoice value', 'zero-bs-crm' ),
				'e.g. 500.00',
				'essential' => true,
			),
			'date'   => array(
				'date',
				__( 'Invoice date', 'zero-bs-crm' ),
				'',
				'essential' => true,
			),
			'notes'  => array(
				'textarea',
				__( 'Notes', 'zero-bs-crm' ),
				'',
				'nocolumn' => true,
			),
			'ref'    => array( 'text', __( 'Reference number', 'zero-bs-crm' ), 'e.g. Ref-123' ),
			'due'    => array( 'text', __( 'Invoice due', 'zero-bs-crm' ), '' ),
			'logo'   => array(
				'text',
				__( 'logo url', 'zero-bs-crm' ),
				'e.g. URL',
				'nocolumn' => true,
			),

			'bill'   => array(
				'text',
				__( 'invoice to', 'zero-bs-crm' ),
				'e.g. mike@epicplugins.com',
				'nocolumn' => true,
			),
			'ccbill' => array(
				'text',
				__( 'copy invoice to', 'zero-bs-crm' ),
				'e.g. you@you.com',
				'nocolumn' => true,
			),

		);

		// } Default sort:
		$zbsFieldSorts['invoice'] = array(

			// } Default order
			'default' => array(

				'status',
				'no',
				'date',
				'notes',
				'ref',
				'due',
				'logo',
				'bill',
				'ccbill',
			),

		);

		global $zbsFormFields;

		$zbsFormFields = array(

			'header'    => array(
				'text',
				__( 'Header', 'zero-bs-crm' ),
				'Want to find out more',
				'nocolumn' => true,
			),
			'subheader' => array(
				'text',
				__( 'Sub Header', 'zero-bs-crm' ),
				'Drop us a line. We follow up on all contacts',
				'nocolumn' => true,
			),
			'fname'     => array(
				'text',
				__( 'First Name Placeholder', 'zero-bs-crm' ),
				'First Name',
				'nocolumn' => true,
			),
			'lname'     => array(
				'text',
				__( 'Last Name Placeholder', 'zero-bs-crm' ),
				'Last Name',
				'nocolumn' => true,
			),
			'email'     => array(
				'text',
				__( 'Email Placeholder', 'zero-bs-crm' ),
				'Email',
				'nocolumn' => true,
			),
			'notes'     => array(
				'text',
				__( 'Message Placeholder', 'zero-bs-crm' ),
				'Your Message',
				'nocolumn' => true,
			),
			'submit'    => array(
				'text',
				__( 'Submit Button', 'zero-bs-crm' ),
				'Submit',
				'nocolumn' => true,
			),
			'spam'      => array(
				'textarea',
				__( 'Spam Message', 'zero-bs-crm' ),
				'We will not send you spam. Our team will be in touch within 24 to 48 hours Mon-Fri (but often much quicker)',
				'nocolumn' => true,
			),
			'success'   => array(
				'text',
				__( 'Success Message', 'zero-bs-crm' ),
				'Thanks. We will be in touch.',
				'nocolumn' => true,
			),

		);

		// } Default sort:
		$zbsFieldSorts['form'] = array(

			// } Default order
			'default' => array(

				'header',
				'subheader',
				'fname',
				'lname',
				'email',
				'notes',
				'submit',
				'spam',
				'success',
			),

		);

		global $zbsTransactionFields;

		/*
		WH added 1.2.1 -
		first fix of fields... these aren't used the same way as the others are with meta, but they will EVENTUALLY be,
		... so please keep them up to date.

		Also, they ARE used in zeroBS_buildTransactionMeta which is used in zeroBS_integrations_addOrUpdateTransaction
		... so it's integral in transaction SAVING
		*/

		$zbsTransactionFields = array(

			/* REQUIRED: */
			'orderid'       => array(
				'text',
				__( 'Transaction ID', 'zero-bs-crm' ),
				'e.g. 123456',
				'essential' => true,
			),
			'customer'      => array(
				'text',
				__( 'Contact ID', 'zero-bs-crm' ),
				'e.g. 1234',
				'essential' => true,
			),
			'status'        => array(
				'select',
				'Status',
				'',
				array(
					'Succeeded',
					'Completed',
					'Failed',
					'Refunded',
					'Processing',
					'Pending',
					'Hold',
					'Cancelled',
				),
				'essential' => true,
			),
			'total'         => array(
				'price',
				__( 'Total Value', 'zero-bs-crm' ),
				'e.g. 100.99',
				'essential' => true,
			),

			/* RECOMMENDED: */
			'customer_name' => array(
				'text',
				__( 'Contact Name', 'zero-bs-crm' ),
				'e.g. John Doe',
				'nocolumn' => true,
			),
			'date'          => array( 'date', __( 'Transaction Date', 'zero-bs-crm' ), '' ),
			'currency'      => array( 'currency', __( 'Currency', 'zero-bs-crm' ), 'e.g. USD' ),
			'item'          => array( 'text', __( 'Transaction Title', 'zero-bs-crm' ), 'e.g. Product ABC' ),
			'net'           => array( 'price', __( 'Net Value', 'zero-bs-crm' ), 'e.g. 100.99' ),
			'tax'           => array( 'price', __( 'Tax Value', 'zero-bs-crm' ), 'e.g. 100.99' ),
			'fee'           => array( 'price', __( 'Fee Value', 'zero-bs-crm' ), 'e.g. 100.99' ),
			'discount'      => array( 'price', __( 'Discount Value', 'zero-bs-crm' ), 'e.g. 100.99' ),
			'tax_rate'      => array( 'price', __( 'Tax Rate', 'zero-bs-crm' ), 'e.g. 10' ),

				// } This needs adding here!
				// 'trans_time' => array('')
		);

		/*
		- not needed yet

		#} Default sort:
		$zbsFieldSorts['transaction'] = array(

				#} Default order
				'default' => array(

						'status',
						'no',
						'date',
						'notes',
						'ref',
						'due',
						'logo',
						'bill',
						'ccbill'
					)

			);
		*/

		/*
		======================================================
		/ Hard Coded Fields + Sorts
		====================================================== */

		/*
		======================================================
		Field & Sort Functions
		(These build out custom field arrs by working on defaults from above)
		====================================================== */

		// } jammed in here for now, just removes notes field as no longer req (moved to customfield)
		function zeroBSCRM_DAL2FieldMods() {

			global $zbs;

			if ( $zbs->isDAL2() ) {
				global $zbsCustomerFields;
				unset( $zbsCustomerFields['notes'] );
			}
		}

		// } Currently this is just "add countries" or dont
		function zeroBSCRM_internalAddressFieldMods() {

			global $zbs;

			$addCountries = $zbs->settings->get( 'countries' );
			if ( isset( $addCountries ) && $addCountries ) {

				// } add it
				global $zbsAddressFields, $zbsFieldSorts;
				$zbsAddressFields['country'] = array(
					'selectcountry',
					__( 'Country', 'zero-bs-crm' ),
					'e.g. United Kingdom',
					'area' => 'Main Address',
				);

				// } add to sort
				$zbsFieldSorts['address']['default'][] = 'country';

			}
		}

		// } Unpack any custom fields + add
		function zeroBSCRM_unpackCustomFields() {

			// } Jammed for now, adds country if set!
			zeroBSCRM_internalAddressFieldMods();

			// } DAL 2 - remove fields
			zeroBSCRM_DAL2FieldMods();

			global $zbs,$zbsAddressFields,$zbsFieldSorts;

			$customfields = $zbs->settings->get( 'customfields' );

			$keyDrivenCustomFields = array(

				// these get DAL3 Custom fields
				'customers'    => ZBS_TYPE_CONTACT,
				'companies'    => ZBS_TYPE_COMPANY,
				'quotes'       => ZBS_TYPE_QUOTE,
				'transactions' => ZBS_TYPE_TRANSACTION,
				'invoices'     => ZBS_TYPE_INVOICE,

			);

			// Following overloading code is also replicated in AdminPages.php (settings page), search #FIELDOVERLOADINGDAL2+

			// This ALWAYS needs to get overwritten by DAL2 for now :)
			// (DAL3 dealt with generically below)
			if ( $zbs->isDAL2() && ! $zbs->isDAL3() && isset( $customfields ) && is_array( $customfields ) && isset( $customfields['customers'] ) ) {

				$customfields['customers'] = $zbs->DAL->setting( 'customfields_contact', array() );

			}
			// DAL3 ver (all objs in $keyDrivenCustomFields above)
			if ( $zbs->isDAL3() ) {

				foreach ( $keyDrivenCustomFields as $key => $objTypeID ) {

					if ( isset( $customfields ) && isset( $customfields[ $key ] ) ) {

						// turn ZBS_TYPE_CONTACT (1) into "contact"
						$typeStr = $zbs->DAL->typeStr( $objTypeID );
						if ( ! empty( $typeStr ) ) {
							$customfields[ $key ] = $zbs->DAL->setting( 'customfields_' . $typeStr, array() );
						}
					}
				}
			}

			// / field overloading

			if ( isset( $customfields ) && is_array( $customfields ) ) {

				// Following unpacking was genericified DAL3+

				// Addresses are only CF type left post DAL3 which are still running legacy 'cf1' etc. slugs.

				// wh switch for centralised func 2.95.3+
				// used for output (here) and saving (contact metabox++)
				$addrCustomFields = zeroBSCRM_getAddressCustomFields();
				// } Addresses
				if ( is_array( $addrCustomFields ) && count( $addrCustomFields ) > 0 ) {

					$cfIndx = 1;
					foreach ( $addrCustomFields as $fieldKey => $field ) {

						$fieldO = $field;
						// } unpack csv
						if ( $fieldO[0] == 'select' ) {

							// } no checking :/
							// } This gives empty placeholder and exploded original str
							$fieldO[2] = '';
							$fieldO[3] = explode( ',', $field[2] );

						}

						// } Add it to arr
						$zbsAddressFields[ 'cf' . $cfIndx ] = $fieldO;

						// } increment
						++$cfIndx;

						// key
						$correctFieldKey = 'cf' . ( $fieldKey + 1 ); // cf1

						// } Also add it to the list of "default sort" at end
						$zbsFieldSorts['address']['default'][] = $correctFieldKey;

					}
				}

				// } Customers
				$customfields = zeroBSCRM_customFields_applyFieldToGlobal( $customfields, 'customers', 'customer', 'zbsCustomerFields' );

				// } Companies
				$customfields = zeroBSCRM_customFields_applyFieldToGlobal( $customfields, 'companies', 'company', 'zbsCompanyFields' );

				// } Quotes
				$customfields = zeroBSCRM_customFields_applyFieldToGlobal( $customfields, 'quotes', 'quote', 'zbsCustomerQuoteFields' );

				// } Invoices
				$customfields = zeroBSCRM_customFields_applyFieldToGlobal( $customfields, 'invoices', 'invoice', 'zbsCustomerInvoiceFields' );

				// } Transactions
				$customfields = zeroBSCRM_customFields_applyFieldToGlobal( $customfields, 'transactions', 'transaction', 'zbsTransactionFields' );

			} // if isset + is array
		}

		// this takes the custom fields from DB storage (passed) and translate them into the globals (e.g. $zbsCompanyFields)
		// ... a lot of the linkages here are DAL1 legacy stuff, probably need rethinking v3+
		// $customFields = settings['customfields']
		// $key = 'companies' (< DAL2 customFields key)
		// $keyFieldSorts = 'company' (proper DAL2 key used for field sorts)
		// $globalVarName = 'zbsCompanyFields' (the global storing the field obj)
		function zeroBSCRM_customFields_applyFieldToGlobal( $customFields, $key, $keyFieldSorts, $globalVarName ) {

			if ( ! empty( $globalVarName ) && is_array( $customFields ) && ! empty( $key ) && isset( $customFields[ $key ] ) && is_array( $customFields[ $key ] ) && count( $customFields[ $key ] ) > 0 ) {

				// globalise, e.g. global $zbsCompanyFields;
				global $zbs, $zbsFieldSorts;

				$cfIndx = 1;
				foreach ( $customFields[ $key ] as $fieldKey => $field ) {

					// full processing
					$fieldO = $field;
					// } unpack csv
					if ( $fieldO[0] == 'select' ) {

						// } Legacy shiz? needed post dal2?
						// } This gives empty placeholder and exploded original str
						if ( isset( $fieldO[3] ) && ! is_array( $fieldO[3] ) ) {
							$fieldO[2] = '';
							$fieldO[3] = explode( ',', $field[2] );
						}
					}

					// here we set a flag that defines them as custom fields
					$fieldO['custom-field'] = true;

					// at least dal2?
					if ( $zbs->isDAL2() ) {
						$slug = $fieldKey;
					} else {
						$slug = 'cf' . $cfIndx;
					}

					// } Add it to arr
					$GLOBALS[ $globalVarName ][ $slug ] = $fieldO;

					unset( $slug );

					// } increment
					++$cfIndx;

					// } Also add it to the list of "default sort" at end
					$zbsFieldSorts[ $keyFieldSorts ]['default'][] = $fieldKey;

				} // foreach field

			} // if isset

			return $customFields;
		}

		// } Retrieves any potential tweaks from options obj
		function zeroBSCRM_unpackCustomisationsToFields() {

			global $zbs;

			$customisedfields = $zbs->settings->get( 'customisedfields' );

			$allowedCustomisation = array(

				'customers'    => array(
					'status',
					'prefix',
				),
				'companies'    => array(
					'status',
				),
				'quotes'       => array(),
				'invoices'     => array(),
				'transactions' => array(),
				'addresses'    => array(),

			);

			if ( isset( $customisedfields ) && is_array( $customisedfields ) ) {

				foreach ( $allowedCustomisation as $allowKey => $allowFields ) {

					if ( is_array( $allowFields ) && count( $allowFields ) ) {
						foreach ( $allowFields as $field ) {

							// } Corresponding option?
							if ( isset( $customisedfields ) && isset( $customisedfields[ $allowKey ] ) && isset( $customisedfields[ $allowKey ][ $field ] ) ) {

								// } $customisedfields[$allowKey][$field][0] will be (as of yet unused) show/hide flag
								// } $customisedfields[$allowKey][$field][1] will be new optionval

								// } option override present :)
								// } Brutal, needs reworking
								switch ( $allowKey ) {

									case 'customers':
										global $zbsCustomerFields;

										if ( $field == 'status' ) {

											// } Rebuild options ($arr[3])
											$opts                           = explode( ',', $customisedfields[ $allowKey ][ $field ][1] );
											$zbsCustomerFields['status'][3] = $opts;

										}

										if ( $field == 'prefix' ) {

											// } Rebuild options ($arr[3])
											$opts                           = explode( ',', $customisedfields[ $allowKey ][ $field ][1] );
											$zbsCustomerFields['prefix'][3] = $opts;

										}

										break;

									case 'companies':
										global $zbsCompanyFields;

										if ( $field == 'status' ) {

											// } Rebuild options ($arr[3])
											$opts                          = explode( ',', $customisedfields[ $allowKey ][ $field ][1] );
											$zbsCompanyFields['status'][3] = $opts;

										}

										break;
									case 'quotes':
										// Nothing yet
										break;
									case 'invoices':
										// Nothing yet
										break;

								}
							}
						}
					}
				} // / foreach

			} // / isset
		}

		// } field sorts
		function zeroBSCRM_applyFieldSorts() {

			// } localise
			global $zbs, $zbsFieldSorts, $zbsCustomerFields, $zbsFieldsEnabled, $zbsCompanyFields, $zbsCustomerQuoteFields, $zbsCustomerInvoiceFields, $zbsFormFields, $zbsAddressFields;

			// } Work through diff zones + rearrange field arrays
			// } Does so by: 1) using any overrides stored in "fieldsorts" in settings, then 2) defaults where no overrides
			$fieldSortOverrides = $zbs->settings->get( 'fieldsorts' );

			// quick add: Field hides
			// no actually, don't do hide at this level... $fieldHideOverrides = $zbs->settings->get('fieldhides');

			// } Exclusions
			$exclusions = array( 'addresses' );

			// } =================================================================================
			// } Addresses (global)
			// } =================================================================================
			$addressDefaultsPresent = false;
			if ( isset( $zbsFieldSorts['address'] ) && isset( $zbsFieldSorts['address']['default'] ) && is_array( $zbsFieldSorts['address']['default'] ) && count( $zbsFieldSorts['address']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$addressFieldSortSource = $zbsFieldSorts['address']['default']; // NOTE IN THIS INSTANCE THIS IS USED A LOT BELOW!
				if ( isset( $fieldSortOverrides['address'] ) && is_array( $fieldSortOverrides['address'] ) && count( $fieldSortOverrides['address'] ) > 0 ) {
					$addressFieldSortSource = $fieldSortOverrides['address'];
				}

				// } new arr
				$newAddressFieldsArr = array();

				// } Cycle through defaults/overrides first... and pull through in correct order
				foreach ( $addressFieldSortSource as $key ) {

					// } if exists, add to newcustomerfieldsarr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsAddressFields[ $key ] ) ) {

						// } just copy it through
						$newAddressFieldsArr[ $key ] = $zbsAddressFields[ $key ];

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						// nothing here as in addresses (global)

					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsAddressFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newAddressFieldsArr ) ) {

						// } Add it to the end
						$newAddressFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsAddressFields = $newAddressFieldsArr;

				$addressDefaultsPresent = true;

			}

			// } NOTES ON ADDRESSES: #NOTESONADDRESS
			/*
				at this point the addressfields obj is a global "template" for how users want addresses to show up.
				... for now we'll just add the fields from here (x2 with second having prefix secaddr_) in place of "addresses"
				but needs adjustment/refactoring

			*/

			// } =================================================================================
			// } Customers
			// } =================================================================================
			if ( isset( $zbsFieldSorts['customer'] ) && isset( $zbsFieldSorts['customer']['default'] ) && is_array( $zbsFieldSorts['customer']['default'] ) && count( $zbsFieldSorts['customer']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$customerFieldSortSource = $zbsFieldSorts['customer']['default'];
				if ( isset( $fieldSortOverrides['customer'] ) && is_array( $fieldSortOverrides['customer'] ) && count( $fieldSortOverrides['customer'] ) > 0 ) {
					$customerFieldSortSource = $fieldSortOverrides['customer'];
				}

				// } new arr
				$newCustomerFieldsArr = array();

				// } Cycle through defaults first... and pull through in correct order
				foreach ( $customerFieldSortSource as $key ) {

					// } if exists, add to newcustomerfieldsarr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsCustomerFields[ $key ] ) ) {

						// } just copy it through
						// unless it's a hide!
						$newCustomerFieldsArr[ $key ] = $zbsCustomerFields[ $key ];
						/*
						no actually, don't do hide at this level...

						if (isset($fieldHideOverrides['customer']) && is_array($fieldHideOverrides['customer'])){
							if (in_array($key, $fieldHideOverrides['customer'])){

								// hide

							} else {

								// show
								$newCustomerFieldsArr[$key] = $zbsCustomerFields[$key];

							}

						}

						*/

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						if ( $key == 'addresses' ) {

							// } Add all fields here for now... not ideal, but okay.
							// } Uses Address field sort tho :)

							// } Customers have 2 addresses:
							if ( $addressDefaultsPresent ) {

								// } Quick design to use address as template, see #NOTESONADDRESS

								// } Add addr 1 fields
								foreach ( $addressFieldSortSource as $addrFieldKey ) {

									// } If we've left attr on obj (legacy), use that field, otherwise copy a new field in from $zbsAddressFields obj
									// } e.g. addr1 etc. but if user added cf1 to addresses...

									// } adadpt key :/ (to stop conflicts from cf1 - this makes this addr_cf1)
									$adaptedFieldKey = $addrFieldKey;
									if ( substr( $addrFieldKey, 0, 2 ) == 'cf' ) {
										$adaptedFieldKey = 'addr_' . $addrFieldKey;
									}

									if ( isset( $zbsCustomerFields[ $adaptedFieldKey ] ) ) {

										// } copy it through as next in line
										$newCustomerFieldsArr[ $adaptedFieldKey ] = $zbsCustomerFields[ $adaptedFieldKey ];

									} else {

										// } copy field inc features, from address fields (as template)
										// } added 1.1.19: don't copy if not set in zbsaddressfields (modified custom fields)
										if ( isset( $zbsAddressFields[ $addrFieldKey ] ) ) {
											$newCustomerFieldsArr[ $adaptedFieldKey ] = $zbsAddressFields[ $addrFieldKey ];
										}
									}

									// }... and hacky... but ....
									// } main address objs also need these:,'area'=>'Main Address'
									if ( ! isset( $newCustomerFieldsArr[ $adaptedFieldKey ]['area'] ) ) {
										$newCustomerFieldsArr[ $adaptedFieldKey ]['area'] = 'Main Address';
									}
								}

								// } Add addr 2 fields
								foreach ( $addressFieldSortSource as $addrFieldKey ) {

									// } If we've left attr on obj (legacy), use that field, otherwise copy a new field in from $zbsAddressFields obj
									// } e.g. addr1 etc. but if user added cf1 to addresses...

									if ( isset( $zbsCustomerFields[ 'secaddr_' . $addrFieldKey ] ) ) {

										// } copy it through as next in line
										$newCustomerFieldsArr[ 'secaddr_' . $addrFieldKey ] = $zbsCustomerFields[ 'secaddr_' . $addrFieldKey ];

									} else {

										// } added 1.1.19: don't copy if not set in zbsaddressfields (modified custom fields)
										if ( isset( $zbsAddressFields[ $addrFieldKey ] ) ) {

											// } copy field inc features, from address fields (as template)
											$newCustomerFieldsArr[ 'secaddr_' . $addrFieldKey ] = $zbsAddressFields[ $addrFieldKey ];

											// }... and hacky... but ....
											// } second address objs also need these:,'area'=>'Second Address','opt'=>'secondaddress'
											$newCustomerFieldsArr[ 'secaddr_' . $addrFieldKey ]['area'] = 'Second Address';
											$newCustomerFieldsArr[ 'secaddr_' . $addrFieldKey ]['opt']  = 'secondaddress';

										}
									}
								}
							}
						}
					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsCustomerFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newCustomerFieldsArr ) ) {

						// } Add it to the end
						$newCustomerFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsCustomerFields = $newCustomerFieldsArr;

			}

			// } =================================================================================
			// } Company
			// } =================================================================================
			if ( isset( $zbsFieldSorts['company'] ) && isset( $zbsFieldSorts['company']['default'] ) && is_array( $zbsFieldSorts['company']['default'] ) && count( $zbsFieldSorts['company']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$companyFieldSortSource = $zbsFieldSorts['company']['default'];
				if ( isset( $fieldSortOverrides['company'] ) && is_array( $fieldSortOverrides['company'] ) && count( $fieldSortOverrides['company'] ) > 0 ) {
					$companyFieldSortSource = $fieldSortOverrides['company'];
				}

				// } new arr
				$newCompanyFieldsArr = array();

				// } Cycle through defaults first... and pull through in correct order
				foreach ( $companyFieldSortSource as $key ) {

					// } if exists, add to newCompanyFieldsArr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsCompanyFields[ $key ] ) ) {

						// } just copy it through
						$newCompanyFieldsArr[ $key ] = $zbsCompanyFields[ $key ];

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						if ( $key == 'addresses' ) {

							// } Add all fields here for now... not ideal, but okay.
							// } Uses Address field sort tho :)

							// } Companies have 2 addresses:
							if ( $addressDefaultsPresent ) {

								// } Quick design to use address as template, see #NOTESONADDRESS

								// } Add addr 1 fields
								foreach ( $addressFieldSortSource as $addrFieldKey ) {

									// } If we've left attr on obj (legacy), use that field, otherwise copy a new field in from $zbsAddressFields obj
									// } e.g. addr1 etc. but if user added cf1 to addresses...

									// } adadpt key :/ (to stop conflicts from cf1 - this makes this addr_cf1)
									$adaptedFieldKey = $addrFieldKey;
									if ( substr( $addrFieldKey, 0, 2 ) == 'cf' ) {
										$adaptedFieldKey = 'addr_' . $addrFieldKey;
									}

									if ( isset( $zbsCompanyFields[ $adaptedFieldKey ] ) ) {

										// } copy it through as next in line
										$newCompanyFieldsArr[ $adaptedFieldKey ] = $zbsCompanyFields[ $adaptedFieldKey ];

									} else {

										// } copy field inc features, from address fields (as template)
										// } added 1.1.19: don't copy if not set in zbsaddressfields (modified custom fields)
										if ( isset( $zbsAddressFields[ $addrFieldKey ] ) ) {
											$newCompanyFieldsArr[ $adaptedFieldKey ] = $zbsAddressFields[ $addrFieldKey ];
										}
									}

									// }... and hacky... but ....
									// } main address objs also need these:,'area'=>'Main Address'
									if ( ! isset( $newCompanyFieldsArr[ $adaptedFieldKey ]['area'] ) ) {
										$newCompanyFieldsArr[ $adaptedFieldKey ]['area'] = 'Main Address';
									}
								}

								// } Add addr 2 fields
								foreach ( $addressFieldSortSource as $addrFieldKey ) {

									// } If we've left attr on obj (legacy), use that field, otherwise copy a new field in from $zbsAddressFields obj
									// } e.g. addr1 etc. but if user added cf1 to addresses...

									if ( isset( $zbsCompanyFields[ 'secaddr_' . $addrFieldKey ] ) ) {

										// } copy it through as next in line
										$newCompanyFieldsArr[ 'secaddr_' . $addrFieldKey ] = $zbsCompanyFields[ 'secaddr_' . $addrFieldKey ];

									} else {

										// } added 1.1.19: don't copy if not set in zbsaddressfields (modified custom fields)
										if ( isset( $zbsAddressFields[ $addrFieldKey ] ) ) {

											// } copy field inc features, from address fields (as template)
											$newCompanyFieldsArr[ 'secaddr_' . $addrFieldKey ] = $zbsAddressFields[ $addrFieldKey ];

											// }... and hacky... but ....
											// } second address objs also need these:,'area'=>'Second Address','opt'=>'secondaddress'
											$newCompanyFieldsArr[ 'secaddr_' . $addrFieldKey ]['area'] = 'Second Address';
											$newCompanyFieldsArr[ 'secaddr_' . $addrFieldKey ]['opt']  = 'secondaddress';

										}
									}
								}
							}
						}
					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsCompanyFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newCompanyFieldsArr ) ) {

						// } Add it to the end
						$newCompanyFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsCompanyFields = $newCompanyFieldsArr;

			}

			// } =================================================================================
			// } Quote
			// } =================================================================================
			if ( isset( $zbsFieldSorts['quote'] ) && isset( $zbsFieldSorts['quote']['default'] ) && is_array( $zbsFieldSorts['quote']['default'] ) && count( $zbsFieldSorts['quote']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$quoteFieldSortSource = $zbsFieldSorts['quote']['default'];
				if ( isset( $fieldSortOverrides['quote'] ) && is_array( $fieldSortOverrides['quote'] ) && count( $fieldSortOverrides['quote'] ) > 0 ) {
					$quoteFieldSortSource = $fieldSortOverrides['quote'];
				}

				// } new arr
				$newQuoteFieldsArr = array();

				// } Cycle through defaults first... and pull through in correct order
				foreach ( $quoteFieldSortSource as $key ) {

					// } if exists, add to newQuoteFieldsArr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsCustomerQuoteFields[ $key ] ) ) {

						// } just copy it through
						$newQuoteFieldsArr[ $key ] = $zbsCustomerQuoteFields[ $key ];

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						if ( $key == 'addresses' ) {

							// } Quotes have none.

						}
					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsCustomerQuoteFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newQuoteFieldsArr ) ) {

						// } Add it to the end
						$newQuoteFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsCustomerQuoteFields = $newQuoteFieldsArr;

			}

			// } =================================================================================
			// } Invoice
			// } =================================================================================
			if ( isset( $zbsFieldSorts['invoice'] ) && isset( $zbsFieldSorts['invoice']['default'] ) && is_array( $zbsFieldSorts['invoice']['default'] ) && count( $zbsFieldSorts['invoice']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$invoiceFieldSortSource = $zbsFieldSorts['invoice']['default'];
				if ( isset( $fieldSortOverrides['invoice'] ) && is_array( $fieldSortOverrides['invoice'] ) && count( $fieldSortOverrides['invoice'] ) > 0 ) {
					$invoiceFieldSortSource = $fieldSortOverrides['invoice'];
				}

				// } new arr
				$newInvoiceFieldsArr = array();

				// } Cycle through defaults first... and pull through in correct order
				foreach ( $invoiceFieldSortSource as $key ) {

					// } if exists, add to newInvoiceFieldsArr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsCustomerInvoiceFields[ $key ] ) ) {

						// } just copy it through
						$newInvoiceFieldsArr[ $key ] = $zbsCustomerInvoiceFields[ $key ];

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						if ( $key == 'addresses' ) {

							// } Invs have none.

						}
					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsCustomerInvoiceFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newInvoiceFieldsArr ) ) {

						// } Add it to the end
						$newInvoiceFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsCustomerInvoiceFields = $newInvoiceFieldsArr;

			}

			// } =================================================================================
			// } Forms
			// } =================================================================================
			if ( isset( $zbsFieldSorts['form'] ) && isset( $zbsFieldSorts['form']['default'] ) && is_array( $zbsFieldSorts['form']['default'] ) && count( $zbsFieldSorts['form']['default'] ) > 0 ) {

				// } Use defaults or overrides?
				$formFieldSortSource = $zbsFieldSorts['form']['default'];
				if ( isset( $fieldSortOverrides['form'] ) && is_array( $fieldSortOverrides['form'] ) && count( $fieldSortOverrides['form'] ) > 0 ) {
					$formFieldSortSource = $fieldSortOverrides['form'];
				}

				// } new arr
				$newFormFieldsArr = array();

				// } Cycle through defaults first... and pull through in correct order
				foreach ( $formFieldSortSource as $key ) {

					// } if exists, add to newFormFieldsArr
					if ( ! in_array( $key, $exclusions ) && isset( $zbsFormFields[ $key ] ) ) {

						// } just copy it through
						$newFormFieldsArr[ $key ] = $zbsFormFields[ $key ];

					} else {

						// if doesn't exist, that's weird, or it's an exclusion (address fields are clumped together)

						if ( $key == 'addresses' ) {

							// } Invs have none.

						}
					}
				}

				// } Then cycle through original obj and add any that got missed by defaults list...
				foreach ( $zbsFormFields as $key => $field ) {

					if ( ! array_key_exists( $key, $newFormFieldsArr ) ) {

						// } Add it to the end
						$newFormFieldsArr[ $key ] = $field;

					}
				}

				// } Copy over arr :)
				$zbsFormFields = $newFormFieldsArr;

			}
		}
		/*
		======================================================
		/ Field & Sort Functions
		====================================================== */

		/*
		======================================================
		Field Helper funcs
		====================================================== */

		// mikes, WH took from automations v0.1

		// from Export file and customer meta ..  functionised..
		function zeroBSCRM_customerFields_select( $form_id, $form_name ) {
			global $zbsCustomerFields;
			$fields        = $zbsCustomerFields;
			$useSecondAddr = zeroBSCRM_getSetting( 'secondaddress' );
			global $zbsFieldsEnabled;
			if ( $useSecondAddr == '1' ) {
				$zbsFieldsEnabled['secondaddress'] = true;
			}

			$output = "<select id='" . $form_id . "' name='" . $form_name . "'>";
			foreach ( $fields as $fieldK => $fieldV ) {

				$showField = true;

				// } Check if not hard-hidden by opt override (on off for second address, mostly)
				if ( isset( $fieldV['opt'] ) && ( ! isset( $zbsFieldsEnabled[ $fieldV['opt'] ] ) || ! $zbsFieldsEnabled[ $fieldV['opt'] ] ) ) {
					$showField = false;
				}

				// or is hidden by checkbox?
				if ( isset( $fieldHideOverrides['company'] ) && is_array( $fieldHideOverrides['company'] ) ) {
					if ( in_array( $fieldK, $fieldHideOverrides['company'] ) ) {
						$showField = false;
					}
				}

				// } If show...
				if ( $showField ) {
					$output .= '<option value="' . $fieldK . '" /> ' . $fieldV[1] . '<br />';
				} // } / if show
			}
			$output .= '</select>';
			return $output;
		}

		// WH: Made simple "get customer fields array simple" for mc2
		function zeroBSCRM_customerFields_getSimpleArr() {

			// taken mostly from the customer metabox

			global $zeroBSCRM_Settings;

			// Get field Hides...
			$fieldHideOverrides = $zeroBSCRM_Settings->get( 'fieldhides' );

			global $zbsCustomerFields;
			$fields = $zbsCustomerFields;

			// } Using second address?
			$useSecondAddr = zeroBSCRM_getSetting( 'secondaddress' );
			$showCountries = zeroBSCRM_getSetting( 'countries' );

			// } Hiding address inputs?
			$showAddr = zeroBSCRM_getSetting( 'showaddress' );

			// code to build arr
			$retArr = array();

					// } This global holds "enabled/disabled" for specific fields... ignore unless you're WH or ask
					global $zbsFieldsEnabled;
			if ( $useSecondAddr == '1' ) {
				$zbsFieldsEnabled['secondaddress'] = true;
			}

					// } This is the grouping :)
					$zbsFieldGroup = '';
			$zbsOpenGroup          = false;

			foreach ( $fields as $fieldK => $fieldV ) {

				$showField = true;

				// } Check if not hard-hidden by opt override (on off for second address, mostly)
				if ( isset( $fieldV['opt'] ) && ( ! isset( $zbsFieldsEnabled[ $fieldV['opt'] ] ) || ! $zbsFieldsEnabled[ $fieldV['opt'] ] ) ) {
					$showField = false;
				}

				// or is hidden by checkbox?
				if ( isset( $fieldHideOverrides['customer'] ) && is_array( $fieldHideOverrides['customer'] ) ) {
					if ( in_array( $fieldK, $fieldHideOverrides['customer'] ) ) {
						$showField = false;
					}
				}

				// if show field :) add
				if ( $showField ) {
					$retArr[ $fieldK ] = $fieldV;
				}
			}

			return $retArr;
		}

		// builds a detail array from post from form
		// the SAVE end to zeroBSCRM_html_editFields
		// centralisd/genericified 20/7/18 wh 2.91+
		function zeroBSCRM_save_fields( $fieldArr = array(), $postKey = 'zbscq_', $skipFields = array() ) {

			$res = array();

			foreach ( $fieldArr as $fK => $fV ) {

				$res[ $fK ] = '';

				if ( isset( $_POST[ $postKey . $fK ] ) ) {

					switch ( $fV[0] ) {

						case 'tel':
							// validate tel?
							$res[ $fK ] = sanitize_text_field( $_POST[ $postKey . $fK ] );
							preg_replace( '/[^0-9 ]/', '', $res[ $fK ] );
							break;

						case 'price':
						case 'numberfloat':
							// validate price/float?
							$res[ $fK ] = sanitize_text_field( $_POST[ $postKey . $fK ] );
							$res[ $fK ] = preg_replace( '@[^0-9\.]+@i', '-', $res[ $fK ] );
							$res[ $fK ] = floatval( $res[ $fK ] );
							break;

						case 'numberint':
							// validate price?
							$res[ $fK ] = sanitize_text_field( $_POST[ $postKey . $fK ] );
							$res[ $fK ] = preg_replace( '@[^0-9]+@i', '-', $res[ $fK ] );
							$res[ $fK ] = floatval( $res[ $fK ] );
							break;

						case 'textarea':
							$res[ $fK ] = zeroBSCRM_textProcess( $_POST[ $postKey . $fK ] );

							break;

						default:
							$res[ $fK ] = sanitize_text_field( $_POST[ $postKey . $fK ] );

							break;

					}
				}

				// catch checkboxes
				if ( $fV[0] == 'checkbox' ) {

					// if type is checkbox, then $fV[2] is the CSV list of options. Explode, count and then run through that many options
					// more efficient if less than 64. Captures more if they use more.
					$checkbox_options_count = 0;
					$checkbox_options       = explode( ',', $fV[2] );
					if ( is_array( $checkbox_options ) ) {
						$checkbox_options_count = count( $checkbox_options );
					}

					$checkboxArr = array(); // if any
					for ( $checkboxI = 0; $checkboxI < $checkbox_options_count; $checkboxI++ ) {

						if ( isset( $_POST[ $postKey . $fK . '-' . $checkboxI ] ) ) {

							// retrieve
							$checkboxArr[] = sanitize_text_field( $_POST[ $postKey . $fK . '-' . $checkboxI ] );

						}
					} // / foreach checkbox item

					if ( count( $checkboxArr ) ) {

						// csv em
						$res[ $fK ] = implode( ',', $checkboxArr );

					} else {

						// none selected, set blank
						$res[ $fK ] = '';

					}
				} // / if checkbox

			}

			return $res;
		}

		/*
		zeroBSCRM_customFields_getSlugOrCreate

			This function will get the slug for a custom field, based on a label, if it exists
			... if it doesn't exist, it'll add it as a default text field type

		params:
		$objectTypeStr='customers' | customersfiles | quotes | companies etc.
		$fieldLabel='Promotion URL' -

		NOTE: only tested with 'customers' type - debug with others before production use
		NOTE: Not sure how early in the load-stack you can successfully use this.. to be tested
		NOTE: All custom field stuff should be centralised/refactored, this has got messy

		*/
		function zeroBSCRM_customFields_getSlugOrCreate( $fieldLabel = '', $objectTypeStr = 'customers' ) {

			// taken from admin pages custom fields:
			// standard custom fields processing (not files/any that need special treatment)
			// genericified 20/07/19 2.91
			$customFieldsToProcess = array(
				'addresses'    => 'zbsAddressFields',
				'customers'    => 'zbsCustomerFields',
				'companies'    => 'zbsCompanyFields',
				'quotes'       => 'zbsCustomerQuoteFields',
				'transactions' => 'zbsTransactionFields',
			);

			// acceptable types
			$acceptableCFTypes = zeroBSCRM_customfields_acceptableCFTypes();

			// block ID here too
			if ( ! empty( $fieldLabel ) && ! empty( $objectTypeStr ) && $fieldLabel != 'ID' && isset( $customFieldsToProcess[ $objectTypeStr ] ) ) {

				global $wDB,$zbs;

				$customFieldsArr = $zbs->settings->get( 'customfields' );

				if (
					( isset( $customFieldsArr[ $objectTypeStr ] ) && ! is_array( $customFieldsArr[ $objectTypeStr ] ) )
					||
					( ! isset( $customFieldsArr[ $objectTypeStr ] ) )
					) {
					// set it (no real risk here, except for slap-handed-typos in $objectTypeStr)
					$customFieldsArr[ $objectTypeStr ] = array();
				}

				// make slug
				$possSlug = $zbs->DAL->makeSlug( $fieldLabel );

				// block ID here too
				if ( $possSlug !== 'id' ) {

					// ====== TAKEN from adminpages custom fields saving
					// ... and modified a bit
					$globalVarName = $customFieldsToProcess[ $objectTypeStr ];
					// 2.96.7+ CHECK against existing fields + add -1 -2 etc. if already in there

					// if exists, just return it :)
					if ( isset( $GLOBALS[ $globalVarName ][ $possSlug ] ) ) {
						return $possSlug;
					} else {

						// doesn't exist, so add :)

							// make default vars
							$possType        = 'text';
							$possName        = $fieldLabel;
							$possPlaceholder = '';

							// debug echo 'here:<pre>'; print_r(array($possType,$possName,$possPlaceholder,$possSlug)); echo '</pre>';

						if ( in_array( $possType, $acceptableCFTypes ) ) {

							// } Add it
							$customFieldsArr[ $objectTypeStr ][] = array( $possType, $possName, $possPlaceholder, $possSlug );

							// NOW SAVE DOWN

							// update DAL 2 custom fields :)
							if ( $zbs->isDAL2() ) {

								if ( isset( $customFieldsArr['customers'] ) && is_array( $customFieldsArr['customers'] ) ) {

									// slight array reconfig
									$db2CustomFields = array();
									foreach ( $customFieldsArr['customers'] as $cfArr ) {
										$db2CustomFields[ $zbs->DAL->makeSlug( $cfArr[1] ) ] = $cfArr;
									}

									// debug echo 'here:<pre>'; print_r($db2CustomFields); echo '</pre>';

									// simple maintain DAL2 (needs to also)
									$zbs->DAL->updateActiveCustomFields(
										array(
											'objtypeid' => 1,
											'fields'    => $db2CustomFields,
										)
									);

								}
							}

							// } Brutal update
							$zbs->settings->update( 'customfields', $customFieldsArr );

							// update the fields/sorts so is reloaded in
							zeroBSCRM_applyFieldSorts();

							return $possSlug;
						}
					}
				} // / is id

			}

			return false;
		}

		function zeroBSCRM_customfields_acceptableCFTypes() {

			return array(
				// all avail pre 2.98.5
				'text',
				'textarea',
				'date',
				'select',
				'tel',
				'price',
				'numberfloat',
				'numberint',
				'email',
				// 2.98.5
				'radio',
				'checkbox',
				'autonumber',
			// Removed encrypted (for now), see JIRA-ZBS-738
			// 'encrypted'
			);
		}

		// takes Strings from autonumber settings for prefix/suffix and parses some common replacements:
		function zeroBSCRM_customFields_parseAutoNumberStr( $str = '' ) {

			global $zbs;

			// CURRENT DATE (on creation):
			// YYYY = 2019
			// YY = 19
			// MMMM = 01 - 12
			// MM = Jan - Dec
			// MONTH = January - December
			// WW = 01 - 52
			// DD = 01 - 31
			// DOY = 01 - 365
			// AGENT who's editing (on creation):
			// USEREMAIL = woody@gmail.com
			// USERID = 1
			// USERNAME = woodyhayday
			// USERINITIALS = WH
			// USERFULLNAME = Woody Hayday
			// USERFIRSTNAME = Woody
			// USERLASTNAME = Hayday
			$x = str_replace( 'YYYY', date( 'Y' ), $str );
			$x = str_replace( 'YY', date( 'y' ), $x );
			$x = str_replace( 'MMMM', date( 'm' ), $x );
			$x = str_replace( 'MM', date( 'M' ), $x );
			$x = str_replace( 'MONTH', date( 'F' ), $x );
			$x = str_replace( 'WW', date( 'W' ), $x );
			$x = str_replace( 'DD', date( 'd' ), $x );
			$x = str_replace( 'DOY', date( 'z' ), $x );

			// User Prefix
			$userID = $zbs->user();
			if ( $userID > 0 ) {
				$user_info = get_userdata( $zbs->user() );
				$x         = str_replace( 'USEREMAIL', $user_info->user_email, $x );
				$x         = str_replace( 'USERID', $userID, $x );
				$x         = str_replace( 'USERNAME', $user_info->user_login, $x );
				$initials  = '';
				if ( isset( $user_info->first_name ) && ! empty( $user_info->first_name ) ) {
					$initials .= substr( trim( $user_info->first_name ), 0, 1 );
				}
				if ( isset( $user_info->last_name ) && ! empty( $user_info->last_name ) ) {
					$initials .= substr( trim( $user_info->last_name ), 0, 1 );
				}
				$x = str_replace( 'USERINITIALS', strtoupper( $initials ), $x );
				$x = str_replace( 'USERFULLNAME', $user_info->first_name . ' ' . $user_info->last_name, $x );
				$x = str_replace( 'USERFIRSTNAME', $user_info->first_name, $x );
				$x = str_replace( 'USERLASTNAME', $user_info->last_name, $x );
			} else {

				// replace for those where no username etc. (API)
				$x = str_replace( 'USEREMAIL', '', $x );
				$x = str_replace( 'USERID', '', $x );
				$x = str_replace( 'USERNAME', '', $x );
				$x = str_replace( 'USERINITIALS', '', $x );
				$x = str_replace( 'USERFULLNAME', '', $x );
				$x = str_replace( 'USERFIRSTNAME', '', $x );
				$x = str_replace( 'USERLASTNAME', '', $x );
			}

			return $x;
		}

		// retrieves a number from current custom field setting (autonumber)
		// ... returns it + ups the number in the custom field setting
		// this may be called several times if updating many, but tiny unperformant bit should be worth it
		// ... for the safety of double checking
		function zeroBSCRM_customFields_getAutoNumber( $objTypeID = -1, $fK = '' ) {

			global $zbs;

			// needs at least this
			if ( ! $zbs->isDAL2() ) {
				return false;
			}

			// def
			$return = false;

			// see if exists (get custom fields for obj)
			$customFields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => $objTypeID ) );

			// we have to do this in a way which feels very dangerous.
			// we take the custom field setting to bits and rebuild with incremented autonumber.
			// these should be moved to their own safer system/table, I think. v3.1?
			if ( is_array( $customFields ) && count( $customFields ) > 0 ) {

				// this'll be replaced by all array items, with the autonumber upped, all being well
				// legacy pain.
				$newCustomFields = array();
				$changed         = false;

				// eeeeish these aren't even array keyed. legacy pain.
				foreach ( $customFields as $f ) {

					$added = false;

					// f3 = slug
					if ( is_array( $f ) && isset( $f[3] ) && $f[3] == $fK && $f[0] == 'autonumber' ) {

						// this is our autonumber.

						// split it
						$autonumber = explode( '#', $f[2] );
						if ( count( $autonumber ) == 3 ) {

							// all seems well, will be prefix,number,suffix
							$no = (int) trim( $autonumber[1] );

							if ( $no > -1 ) {

								// great, got a number of at least 0

									// set return
									$return = $no;

									// increment
									++$no;

									// add back in, with incremented autonumber
									$newCustomField    = $f;
									$newCustomField[2] = $autonumber[0] . '#' . $no . '#' . $autonumber[2];
									$newCustomFields[] = $newCustomField;
									$added             = true;
									$changed           = true;

							}
						}
					}

					// not added by above?
					if ( ! $added ) {

						// just make sure still in array
						$newCustomFields[] = $f;

					}
				}

				// save down (if changed)
				if ( $changed ) {

					if ( is_array( $newCustomFields ) ) {

						// slight array reconfig
						$db2CustomFields = array();
						foreach ( $newCustomFields as $cfArr ) {
							$db2CustomFields[ $zbs->DAL->makeSlug( $cfArr[1] ) ] = $cfArr;
						}

						// simple maintain DAL2 (needs to also)
						$zbs->DAL->updateActiveCustomFields(
							array(
								'objtypeid' => $objTypeID,
								'fields'    => $db2CustomFields,
							)
						);

					}
				}
			} // / if custom fields

			return $return;
		}
		/*
		example: getActiveCustomFields


		"customers": [
		["text", "filename", "Filename", "filename"],
		["date", "dddd", "", "dddd"],
		["select", "selecter", "a,b,c", "selecter"],
		["radio", "radioz", "rad1,rad2,rad3,rad4,rad5,rad6,rad7,rad89,another option,andmore,and this,oh and don\\'t forget", "radioz"],
		["checkbox", "check boz", "checkbox,afeafhte,another check,last one!", "check-boz"],
		["autonumber", "autonumbz", "zzAAAX#12343#zzXXXX", "autonumbz"],
		["numberint", "forced numeric", "999", "forced-numeric"],
		["radio", "empty radio", "", "empty-radio"],
		["checkbox", "empty check", "", "empty-check"],
		["select", "empty select", "", "empty-select"]
		],

		*/
		/*
		======================================================
		/ Field Helper funcs
		====================================================== */
