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

		global $zbs;

		$json_params  = file_get_contents( 'php://input' );
		$new_customer = json_decode( $json_params, true );

		// if this isn't an array, reply NO
if ( ! is_array( $new_customer ) ) {
	wp_send_json(
		array(
			'error'   => true,
			'message' => 'Invalid JSON data',
		)
	);
	exit(); }

		// no tags assumption, etc.
		$we_have_tags = false;
$id                   = -1;
$email                = '';

		// pass sticky status - pass sticky = false to not have a sticky status
		$sticky = true;
if ( isset( $new_customer['sticky'] ) && ! empty( $new_customer['sticky'] ) ) {
	$sticky = false;
}
		$stickystat = 'Customer';
if ( isset( $new_customer['stickystat'] ) ) {
	$stickystat = sanitize_text_field( $new_customer['stickystat'] );
}

		// this retrieves all fields (inc CUSTOM FIELDS) into customer_array
		// empty prefix important here
		$removeEmpties = false;
$autoGenAutonumbers    = true;
		// setting $autoGenAutonumbers = true, means if they're not passed, they'll get generated
		// autoGenAutonumbers is duck-tape for now, rethink input + field model v3.0+
		$customer_array = zeroBS_buildContactMeta( $new_customer, array(), '', 'zbsc_', $removeEmpties, $autoGenAutonumbers );

		// this is needed for check below:
if ( isset( $new_customer['id'] ) ) {
	$id = (int) sanitize_text_field( $new_customer['id'] );
}
if ( isset( $customer_array['zbsc_email'] ) ) {
	$email = $customer_array['zbsc_email'];
}

		// diff name used below :)
		$update_args = $customer_array;

		// } Owner
		$assign = -1;
if ( isset( $new_customer['assign'] ) ) {
	$assign = (int) $new_customer['assign'];
}

		// } TAGS
		$tags = false;
if ( isset( $new_customer['tags'] ) ) {
	$tags = $new_customer['tags'];
}
if ( is_array( $tags ) && count( $tags ) > 0 ) {

	// basic filtering
	$customer_tags = filter_var_array( $tags, FILTER_UNSAFE_RAW );
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

	// dumb check - not empties :)
	$temptags = array(); foreach ( $customer_tags as $t ) {
		$t2 = trim( $t );
		if ( ! empty( $t2 ) ) {
			$temptags[] = $t2;
		}
	}

	// last check + set
	if ( count( $temptags ) > 0 ) {
		$we_have_tags  = true;
		$customer_tags = $temptags;
		unset( $temptags );
	}
}

		// } Build pretty log msgs :)

			// } DEFAULTS
				// } Existing user updated by API
				$existingUserAPISourceShort = __( 'Updated by API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
				$existingUserAPISourceLong  = __( 'API Action fired to update contact', 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

				// } New User from API
				$newUserAPISourceShort = __( 'Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
				$newUserAPISourceLong  = __( 'API Action fired to create contact', 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

$external_api_name = jpcrm_api_process_external_api_name();
if ( $external_api_name !== false ) {
	$existingUserAPISourceShort = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Updated by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$existingUserAPISourceLong = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to update this contact', 'zero-bs-crm' ),
		$external_api_name
	);
	$newUserAPISourceShort = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Created by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$newUserAPISourceLong = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to create this contact', 'zero-bs-crm' ),
		$external_api_name
	);
}

				// } Actual log var passed
				$fallBackLog = array(
					'type'      => 'API Action',
					'shortdesc' => $existingUserAPISourceShort,
					'longdesc'  => $existingUserAPISourceLong,
				);

				// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by api")
				$internalAutomatorOverride = array(

					'note_override' => array(

						'type'      => 'API Action',
						'shortdesc' => $newUserAPISourceShort,
						'longdesc'  => $newUserAPISourceLong,

					),

				);

				// } Validate ID if passed
				$verifiedID = -1; if ( $id > 0 ) {

					$verifiedID = $zbs->DAL->contacts->getContact(
						$id,
						array(
							'withCustomFields' => false,
							'ignoreowner'      => true,
							'onlyID'           => true,
						)
					);

				}

				// } EMAIL or ID :)
				if (
				( ! empty( $email ) && zeroBSCRM_validateEmail( $email ) )
				||
				$verifiedID > 0
				) {

						// } STICKY status addition - dont have the API update our status if it's sticky
						// } added if ID, exists 12/04/18
					if ( $verifiedID < 1 ) {
						$exists = zeroBS_getCustomerIDWithEmail( $email );
					} else {
						$exists            = $verifiedID;
						$update_args['id'] = $verifiedID;
					}

					if ( $exists && $sticky ) {

						// email exists, chechk status
						$existingStatus = $zbs->DAL->contacts->getContactStatus( $exists );

						if ( $existingStatus == $stickystat ) {
								$status = $stickystat;   // don't over-ride customer status..
								// so.... set it to be the stickystat/it's existing
								$update_args['zbsc_status'] = $stickystat; // 'Customer';
						} else {

							// existing status (e.g. lead) is not stickystatus (e.g. customer)
							// so let it override default

						}
					}

					// } Status default - double-backup for api check
					if ( isset( $update_args ) && is_array( $update_args ) && ( $update_args['zbsc_status'] === null || ! isset( $update_args['zbsc_status'] ) || empty( $update_args['zbsc_status'] ) ) ) {

						$defaultStatus              = zeroBSCRM_getSetting( 'defaultstatus' );
						$update_args['zbsc_status'] = $defaultStatus; // 'Lead';

					}

					if ( $we_have_tags ) {
						$update_args['tags'] = $customer_tags;
					}

					// need to pass via the update_args otherwise the tags are added AFTER the automation fires...      when doing new DB we need to hook and filter up varios steps of these

					// e.g.

					/*
					apply_filters('pre_do_this', $args);

					do_this

					apply_filters('post_do_this', $args);  // etc..

					*/

					$newCust = zeroBS_integrations_addOrUpdateCustomer(
						'api',
						$email,
						$update_args,
						'', // ) Customer date (auto)
						// } Fallback log (for customers who already exist)
						$fallBackLog,
						false, // } Extra meta
						// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
						$internalAutomatorOverride
					);
						// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

						// } This makes our new customer trigger fire... without this, it isn't firing now ???
						// dig deeper since zeroBS_integrations_addOrUpdateCustomer should fire this..
						// do_action('zbs_new_customer', $newCust);

						// } are we assigning to a user?
					if ( isset( $assign ) && ! empty( $assign ) && $assign > -1 ) {
						// set owner
						zeroBS_setOwner( $newCust, $assign, ZBS_TYPE_CONTACT );
					}

						// old way just returned what was sent...
						// wp_send_json($json_params); //sends back to Zapier the customer that's been sent to it.

						// thorough much? lol.
					if ( ! empty( $newCust ) && $newCust !== false && $newCust !== -1 ) {

						// return what was passed...
						// this is legacy funk.. not ideal at all, should probs reload.
						$return_params = $new_customer;

						// add id (if new)
						if ( $newCust > 0 ) {
							$return_params['id'] = $newCust;
						}

						// return
						wp_send_json( $return_params );

					} else {

						// fail.
						wp_send_json( array( 'error' => 100 ) );

					}
				}

				wp_send_json( array( 'errors' => 1 ) );
				exit();
