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

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

/*
14 October 1922

This file was removed in v5.0.1, but was added back for the sole purpose of capturing some missing translation strings.
See gh-2494 for details; at some point we should handle this better and remove this file again.

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
