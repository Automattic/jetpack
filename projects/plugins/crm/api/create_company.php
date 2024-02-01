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

		$json_params = file_get_contents( 'php://input' );
		$new_company = json_decode( $json_params, true );

		// no tags assumption, etc.
		$we_have_tags = false;
$id                   = -1;
$email                = '';
$fieldPrefix          = 'zbsc_';

		// this retrieves all fields (inc CUSTOM FIELDS) into customer_array
		// empty prefix important here
		$removeEmpties = false;
$autoGenAutonumbers    = true;
		// setting $autoGenAutonumbers = true, means if they're not passed, they'll get generated
		// autoGenAutonumbers is duck-tape for now, rethink input + field model v3.0+
		$company_array = zeroBS_buildObjArr( $new_company, array(), '', $fieldPrefix, $removeEmpties, ZBS_TYPE_COMPANY, $autoGenAutonumbers );

		// this is needed for check below:
if ( isset( $new_company['id'] ) ) {
	$id = (int) sanitize_text_field( $new_company['id'] );
}
if ( isset( $company_array[ $fieldPrefix . 'email' ] ) ) {
	$email = $company_array[ $fieldPrefix . 'email' ];
}

		// diff name used below :)
		$update_args = $company_array;

		// } Owner
		$assign = -1;
if ( isset( $new_company['assign'] ) ) {
	$assign = (int) $new_company['assign'];
}

		// } TAGS
		$tags = false;
if ( isset( $new_company['tags'] ) ) {
	$tags = $new_company['tags'];
}
if ( is_array( $tags ) && count( $tags ) > 0 ) {

	// basic filtering
	$company_tags = filter_var_array( $tags, FILTER_UNSAFE_RAW );
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

	// dumb check - not empties :)
	$temptags = array(); foreach ( $company_tags as $t ) {
		$t2 = trim( $t );
		if ( ! empty( $t2 ) ) {
			$temptags[] = $t2;
		}
	}

	// last check + set
	if ( count( $temptags ) > 0 ) {
		$we_have_tags = true;
		$company_tags = $temptags;
		unset( $temptags );
	}
}

		// } Build pretty log msgs :)

			// } DEFAULTS
				// } Existing user updated by API
				$existingUserAPISourceShort = __( 'Updated by API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
				$existingUserAPISourceLong  = __( 'API Action fired to update company', 'zero-bs-crm' );

				// } New User from API
				$newUserAPISourceShort = __( 'Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
				$newUserAPISourceLong  = __( 'API Action fired to create company', 'zero-bs-crm' );

$external_api_name = jpcrm_api_process_external_api_name();
if ( $external_api_name !== false ) {
	$existingUserAPISourceShort = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Updated by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$existingUserAPISourceLong = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to update this company', 'zero-bs-crm' ),
		$external_api_name
	);
	$newUserAPISourceShort = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Created by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$newUserAPISourceLong = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to create this company', 'zero-bs-crm' ),
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

					$verifiedID = $zbs->DAL->companies->getCompany(
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

					// } ID Exists?
					if ( $verifiedID > 0 ) {
						$update_args['id'] = $verifiedID;
					}

					// } Tags
					if ( $we_have_tags ) {
						$update_args['tags'] = $company_tags;
					}

					// } Status default - double-backup for api check
					if ( isset( $update_args ) && is_array( $update_args ) && ( ( $update_args[ $fieldPrefix . 'status' ] ) === null || ! isset( $update_args[ $fieldPrefix . 'status' ] ) || empty( $update_args[ $fieldPrefix . 'status' ] ) ) ) {

						$defaultStatus                          = zeroBSCRM_getSetting( 'defaultstatus' );
						$update_args[ $fieldPrefix . 'status' ] = $defaultStatus; // 'Lead';

					}

					// need to pass via the update_args otherwise the tags are added AFTER the automation fires...      when doing new DB we need to hook and filter up varios steps of these

					// e.g.

					/*
						apply_filters('pre_do_this', $args);

						do_this

						apply_filters('post_do_this', $args);  // etc..

					*/

					$newCompany = zeroBS_integrations_addOrUpdateCompany(
						'api',
						$email,
						$update_args,
						'', // ) Customer date (auto)
						$fallBackLog, // } Fallback log (for customers who already exist)
						false, // } Extra meta
						$internalAutomatorOverride, // } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
						'update',
						$fieldPrefix // field prefix zbsc_
					);
					// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

					// } are we assigning to a user?
					if ( isset( $assign ) && ! empty( $assign ) ) {
						// set owner
						zeroBS_setOwner( $newCompany, $assign, ZBS_TYPE_COMPANY );
					}

					// old way just returned what was sent...
					// wp_send_json($json_params); //sends back to Zapier the customer that's been sent to it.

					// thorough much? lol.
					if ( ! empty( $newCompany ) && $newCompany !== false && $newCompany !== -1 ) {

						// return what was passed...
						// this is legacy funk.. not ideal at all, should probs reload.
						$return_params = $new_company;

						// add id (if new)
						if ( $newCompany > 0 ) {
							$return_params['id'] = $newCompany;
						}

						// return
						wp_send_json( $return_params );

					} else {

						// fail.
						wp_send_json( array( 'error' => 100 ) );

					}
				}

				exit();
