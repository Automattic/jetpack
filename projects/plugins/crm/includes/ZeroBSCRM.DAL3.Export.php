<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 24/05/2019
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

// temp/mvp solution. Some fields need different labels for export!
function zeroBSCRM_export_fieldReplacements() {

	return array(

		// Contacts/co
		'wpid'           => __( 'WordPress ID', 'zero-bs-crm' ),
		'tw'             => __( 'Twitter Handle', 'zero-bs-crm' ),
		'fb'             => __( 'Facebook Page', 'zero-bs-crm' ),
		'li'             => __( 'LinkedIn', 'zero-bs-crm' ),
		'avatar'         => __( 'Avatar', 'zero-bs-crm' ),
		'created'        => __( 'Created Date', 'zero-bs-crm' ),
		'lastupdated'    => __( 'Last Updated Date', 'zero-bs-crm' ),
		'lastcontacted'  => __( 'Last Contacted Date', 'zero-bs-crm' ),

		// Quotes
		'id_override'    => __( 'Reference', 'zero-bs-crm' ),
		'currency'       => __( 'Currency', 'zero-bs-crm' ),
		'hash'           => __( 'Hash', 'zero-bs-crm' ),
		'lastviewed'     => __( 'Last Viewed', 'zero-bs-crm' ),
		'viewed_count'   => __( 'Viewed Count', 'zero-bs-crm' ),
		'accepted'       => __( 'Accepted Date', 'zero-bs-crm' ),
		'acceptedsigned' => __( 'Signed Date', 'zero-bs-crm' ),
		'acceptedip'     => __( 'Signed via IP', 'zero-bs-crm' ),

		// inv
		'status'         => __( 'Status', 'zero-bs-crm' ),

		// trans
		'origin'         => __( 'Origin', 'zero-bs-crm' ),
		'customer_ip'    => __( 'Contact IP', 'zero-bs-crm' ),

	);
}

function zeroBSCRM_export_blockedFields() {

	return array(

		// global
		'zbs_site',
		'zbs_team',

		// quotes
		'template',
		'content',
		'notes',
		'send_attachments',

		// inv
		'pay_via',
		'logo_url',
		'pdf_template',
		'portal_template',
		'email_template',
		'invoice_frequency',
		'address_to_objtype',
		'allow_partial',
		'allow_tip',
		'hours_or_quantity',

		// trans
		'parent',
		'taxes',
		'shipping_taxes',

	);
}

/*
======================================================
Export Tools UI
====================================================== */

// render export page
function zeroBSCRM_page_exportRecords() {

	jpcrm_load_admin_page( 'export/main' );
	jpcrm_render_export_page();
}

/*
======================================================
	/ Export Tools UI
	====================================================== */

/*
======================================================
	Export Tools -> Actual Export File
	====================================================== */

function jpcrm_export_process_file_export() {

	global $zbs;

	// Check if valid posted export request
	// ++ nonce verifies
	// ++ is admin side
	// ++ is our page
	// ++ has perms
	if ( isset( $_POST ) && isset( $_POST['jpcrm-export-request'] )
		&&
		isset( $_POST['jpcrm-export-request-nonce'] ) && wp_verify_nonce( $_POST['jpcrm-export-request-nonce'], 'zbs_export_request' )
		&&
		is_admin()
		&&
		isset( $_GET['page'] ) && $_GET['page'] == $zbs->slugs['export-tools']
		&&
		zeroBSCRM_permsExport()
		) {

			$obj_type_id = -1;
			$objIDArr    = array();
			$fields      = array();
			$extraParams = array( 'all' => false );

			// == Param Retrieve ================================================

			// check obj type
		if ( isset( $_POST['jpcrm-export-request-objtype'] ) ) {

			$potentialObjTypeID = (int) sanitize_text_field( $_POST['jpcrm-export-request-objtype'] );
			if ( $zbs->DAL->isValidObjTypeID( $potentialObjTypeID ) ) {
				$obj_type_id = $potentialObjTypeID;
			}
		}

			// check id's
		if ( isset( $_POST['jpcrm-export-request-objids'] ) ) {

			$potentialIDStr = sanitize_text_field( $_POST['jpcrm-export-request-objids'] );
			$potentialIDs   = explode( ',', $potentialIDStr );

			foreach ( $potentialIDs as $potentialID ) {

				$i = (int) $potentialID;

				if ( $i > 0 && ! in_array( $i, $objIDArr ) ) {
					$objIDArr[] = $i;
				}
			}
		}

		// catch extra params
		if ( isset( $potentialIDStr ) && $potentialIDStr == 'all' ) {
			$extraParams['all'] = true;
		}

		// get segment id, if exporting segment
		// (only for contacts)
		if ( $obj_type_id == ZBS_TYPE_CONTACT && ! empty( $_POST['jpcrm-export-request-segment-id'] ) ) {

			// segment export
			$potential_segment_id = sanitize_text_field( $_POST['jpcrm-export-request-segment-id'] );
			$potential_segment    = $zbs->DAL->segments->getSegment( $potential_segment_id );
			if ( is_array( $potential_segment ) ) {

				$extraParams['segment'] = $potential_segment;

			}
		}

			// retrieve fields
		if ( is_array( $_POST ) ) {
			foreach ( $_POST as $k => $v ) {

				// retrieve all posted pre-keys
				if ( str_starts_with( $k, 'zbs-export-field-' ) ) {

					// is *probably* one of ours (doesn't guarantee)
					$fieldKey = sanitize_text_field( $v );

					// some generic replacements:
					if ( $fieldKey == 'ID' ) {
						$fieldKey = 'id';
					}
					if ( $fieldKey == 'owner' ) {
						$fieldKey = 'zbs_owner';
					}

					// add
					if ( ! in_array( $fieldKey, $fields ) ) {
						$fields[] = $fieldKey;
					}
				}
			}
		}

			// == / Param Retrieve =============================================

			// == FINAL CHECKS? ================================================
			// Got acceptable objtype
			// Got fields to export
			// Got ID's to export (or all, or segment)
		if (
				$obj_type_id > 0 &&
				is_array( $fields ) && count( $fields ) > 0
				&&
				(
					( is_array( $objIDArr ) && count( $objIDArr ) > 0 )
						|| $extraParams['all']
						|| ( isset( $extraParams['segment'] ) && is_array( $extraParams['segment'] ) ) // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					)
			) {

			$extra_file_name_str = '';

			// == obj type loading =========================================

				// obj layer
				$objDALLayer = $zbs->DAL->getObjectLayerByType( $obj_type_id );

				// what fields do we have to export?
				$fieldsAvailable = zeroBSCRM_export_produceAvailableFields( $obj_type_id );

				// language
				$objTypeSingular = $zbs->DAL->typeStr( $obj_type_id, false );
				$objTypePlural   = $zbs->DAL->typeStr( $obj_type_id, true );

				// basic label 'contact/contacts'
				$exportTypeLabel = $objTypeSingular;
			if ( count( $objIDArr ) > 1 ) {
				$exportTypeLabel = $objTypePlural;
			}

				// == / obj type loading =======================================

				// == segment specific loading =================================

			if ( isset( $extraParams['segment'] ) && is_array( $extraParams['segment'] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

				$extra_file_name_str = '-segment-' . $extraParams['segment']['id'];

			}

				// == / segment specific loading ===============================

				// general
				$filename = 'exported-' . $objTypePlural . $extra_file_name_str . '-' . date( 'd-m-Y_g-i-a' ) . '.csv';

				// == file start ===================================================

				// send header
				header( 'Content-Type: text/csv; charset=utf-8' );
				header( 'Content-Disposition: attachment; filename= ' . $filename );

				// open output
				$output = fopen( 'php://output', 'w' );

				// == / file start =================================================

				// == file gen =====================================================

				// column headers
				$columnHeaders = array(); foreach ( $fields as $fK ) {
					$label = $fK;
				if ( isset( $fieldsAvailable[ $fK ] ) ) {
					$label = $fieldsAvailable[ $fK ];
				}
					$columnHeaders[] = $label;

					// for owners we add two columns, 1 = Owner ID, 2 = Owner username
				if ( $fK == 'zbs_owner' ) {
					$columnHeaders[] = __( 'Owner Username', 'zero-bs-crm' );
				}
				}
				fputcsv( $output, $columnHeaders );

				// actual export lines

					// retrieve objs
				if ( $extraParams['all'] ) {

					$availObjs = $objDALLayer->getAll( $objIDArr );

				} elseif ( isset( $extraParams['segment'] ) && is_array( $extraParams['segment'] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

					// Retrieve segment.
					$availObjs = $zbs->DAL->segments->getSegmentAudience(
						$extraParams['segment']['id'],
						-1, // All, no paging.
						-1 // All, no paging.
					);

				} else {

					$availObjs = $objDALLayer->getIDList( $objIDArr );

				}

				if ( is_array( $availObjs ) ) {
					foreach ( $availObjs as $obj ) {

							// per obj
							$objRow = array();
						foreach ( $fields as $fK ) {

							$v = ''; // default (means always right col count)
							if ( isset( $obj[ $fK ] ) ) {
								$v = zeroBSCRM_textExpose( $obj[ $fK ] );
							}

							// date objs use _date (which are formatted)
							if ( isset( $obj[ $fK . '_date' ] ) ) {
								$v = $obj[ $fK . '_date' ];
							}
							// custom field dates too:
							if ( isset( $obj[ $fK . '_cfdate' ] ) ) {
								$v = $obj[ $fK . '_cfdate' ];
							}

							// ownership - column 1 (ID)
							if ( $fK == 'zbs_owner' && ! empty( $obj['owner']['ID'] ) ) {
								$v = $obj['owner']['ID'];
							}

							// catch legacy secaddr_addr1 issues. (only for contacts)
							// blurgh.
							// secaddr1 => secaddr_addr1
							if ( $obj_type_id == ZBS_TYPE_CONTACT && str_starts_with( $fK, 'sec' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,Universal.Operators.StrictComparisons.LooseEqual
								if ( isset( $obj[ str_replace( 'sec', 'secaddr_', $fK ) ] ) ) {
									$v = $obj[ str_replace( 'sec', 'secaddr_', $fK ) ];
								}
							}

							// here we account for linked objects
								// as of 4.1.1 this is contact/company for quote/invoice/transaction
								// passed in format: linked_obj_{OBJTYPEINT}_{FIELD}
							if ( str_starts_with( $fK, 'linked_obj_' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

								// take objtype from field
								$linked_obj_type_int_and_field = substr( $fK, 11 );

								// split type and field
								$linked_obj_type_parts = explode( '_', $linked_obj_type_int_and_field, 2 );
								$linked_obj_type_int   = (int) $linked_obj_type_parts[0]; // e.g. ZBS_TYPE_CONTACT = 1
								$linked_obj_field      = $linked_obj_type_parts[1]; // e.g. 'ID'
								// retrieve sub object
								$linked_obj = jpcrm_export_retrieve_linked_object( $obj, $linked_obj_type_int );

								// retrieve field value
								if ( isset( $linked_obj[ $linked_obj_field ] ) ) {

									// pass field as value, (provided is set)
									// e.g. id
									// note, other fields are also present here, so could expand to pass name etc.
									$v = $linked_obj[ $linked_obj_field ];

								}
							}

								// if -1 kill
							if ( $v == -1 ) {
								$v = '';
							}

								$objRow[] = $v;

								// ownership - column 2 (Username)
							if ( $fK == 'zbs_owner' ) {

								$v2 = '';

								/*
								With -1 owner it looks like this:

								'owner' =>
									array (
										'ID' => '-1',
										'OBJ' => false,
									),


								With 0 owner it looks like this:

								'owner' => false,

								With actual WP owner looks like this:

								'owner' =>
								array (
									'ID' => '234',
									'OBJ' => (object)WP_User,
								),
								*/

								// if has an owner
								if ( ! empty( $obj['owner']['OBJ'] ) ) {

										$v2 = $obj['owner']['OBJ']->user_login;

								}

								$objRow[] = $v2;

							}
						} // / foreach field in each obj row

							// output row
							fputcsv( $output, $objRow );

					} // / foreach obj
				}

					// == / file gen ===================================================

					// == file fini ====================================================

					// send end
					fclose( $output );
					exit();

					// == / file fini ==================================================

		} // / final checks

	} // / Check if valid posted export request
}
	add_action( 'jpcrm_post_wp_loaded', 'jpcrm_export_process_file_export' );

/**
 * Takes an object being exported, and a linked object type, and returns the subobject
 * e.g. $obj could be a quote, linkedType could be contact, this would return the contact object against the quote
 *
 * @param array $obj (line being exported), int $linkedObjTypeInt CRM Object type
 *
 * @return array $sub object
 */
function jpcrm_export_retrieve_linked_object( $obj = array(), $linkedObjTypeInt = -1 ) {

	global $zbs;

	// turn 1 into `contact`
	$linkedObjTypeKey = $zbs->DAL->objTypeKey( $linkedObjTypeInt );

	// set contact ID
	// objects like quotes will have these as arrays under `contact` and `company`
	if ( is_array( $obj[ $linkedObjTypeKey ] ) && count( $obj[ $linkedObjTypeKey ] ) > 0 ) {

		// noting here that object links can allow 1:many links, we only take the first
		if ( is_array( $obj[ $linkedObjTypeKey ][0] ) ) {

			return $obj[ $linkedObjTypeKey ][0];

		}
	}

	return array();
}

// retrieves a formatted obj field array of what's actually 'allowed' to be exported
// Tested a few ways of achieving this, given the $globalfield limbo that v3 is in (legacy)
// - Using the $globalField method was unreliable, so rolled fresh using db-driven custom fields
// ... this could be rolled back into how we do $globalFields in road to v4
// gh-253
function zeroBSCRM_export_produceAvailableFields( $objTypeToExport = false, $includeAreas = false ) {

	global $zbs;

	// def
	$fieldsAvailable = array();

	// obj layer
	$objDALLayer = $zbs->DAL->getObjectLayerByType( $objTypeToExport );

	// fields avail to export
	// just base fields: $objLayerFields = $objDALLayer->objModel();
	// base fields + custom fields:
	$objLayerFields = $objDALLayer->objModelIncCustomFields();

		// process
	if ( is_array( $objLayerFields ) ) {

		$blockedFields = zeroBSCRM_export_blockedFields(); // ,'zbs_owner'
		$relabel       = zeroBSCRM_export_fieldReplacements();

		foreach ( $objLayerFields as $fieldKey => $field ) {

			// cf's need to alter this, so we var
			$fieldKeyOutput = $fieldKey;

			if ( ! in_array( $fieldKey, $blockedFields ) ) {

				// simplify for output
				if ( ! array_key_exists( $fieldKey, $fieldsAvailable ) ) {

					/*
							e.g. :
						[email] => Array
							(
								[fieldname] => zbsc_email
								[format] => str
								[input_type] => email
								[label] => Email
								[placeholder] => e.g. john@gmail.com
								[essential] => 1
							)

						Note: 3.0.7+ also includes custom fields:

						[test] => Array
							(
								[0] => text
								[1] => test
								[2] => test
								[3] => test
								[custom-field] => 1
							)
					*/

					$label = $fieldKey;
					$area  = '';

					if ( ! isset( $field['custom-field'] ) ) {

						// Non CF stuff:

						// label
						if ( isset( $field['label'] ) ) {
							$label = $field['label'];
						}

						// relabel?
						if ( isset( $relabel[ $fieldKey ] ) ) {
							$label = $relabel[ $fieldKey ];
						}

						// addresses/areas (append)
						if ( isset( $field['area'] ) ) {
							if ( ! $includeAreas ) {
								$label .= ' (' . $field['area'] . ')';
							}
							$area = $field['area'];
						}

						// one exception:
						if ( $label == 'zbs_owner' ) {
							$label = __( 'Owner', 'zero-bs-crm' );
						}
					} else {

						// prefix $fieldKeyOutput
						$fieldKeyOutput = 'cf-' . $fieldKeyOutput;

						// Custom field passing
						if ( isset( $field[1] ) ) {
							$label = $field[1];
						}

						// addresses/areas (append)
						if ( isset( $field['area'] ) ) {
							if ( ! $includeAreas ) {
								$label .= ' (' . $field['area'] . ')';
							}
							$area = $field['area'];
						}

						if ( $area == '' ) {
							$area = __( 'Custom Fields', 'zero-bs-crm' );
						}
					}

					if ( $includeAreas ) {
						// with area
						$fieldsAvailable[ $fieldKey ] = array(
							'label' => $label,
							'area'  => $area,
						);
					} else {                      // simpler
						$fieldsAvailable[ $fieldKey ] = $label;
					}
				}
			}
		}
	}

	// Add additional fields which are stored in the DB via obj links
	// e.g. Invoice Contact
	$linkedTypes = $objDALLayer->linkedToObjectTypes();
	foreach ( $linkedTypes as $objectType ) {

		// for now, hard typed, we only add `ID`, `email`, and `name`, as these are a given for contacts + companies

		// retrieve label (e.g. 'Contact')
		$obj_label = $zbs->DAL->typeStr( $objectType );

		// ID

			$label = $obj_label . ' ID';

		if ( $includeAreas ) {
			// with area
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_id' ] = array(
				'label' => $label,
				'area'  => __( 'Linked Data', 'zero-bs-crm' ),
			);
		} else {
			// simpler
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_id' ] = $label;
		}

		// name

			$label = $obj_label . ' ' . __( 'Name', 'zero-bs-crm' );

		if ( $includeAreas ) {
			// with area
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_name' ] = array(
				'label' => $label,
				'area'  => __( 'Linked Data', 'zero-bs-crm' ),
			);
		} else {
			// simpler
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_name' ] = $label;
		}

		// email

			$label = $obj_label . ' ' . __( 'Email', 'zero-bs-crm' );

		if ( $includeAreas ) {
			// with area
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_email' ] = array(
				'label' => $label,
				'area'  => __( 'Linked Data', 'zero-bs-crm' ),
			);
		} else {
			// simpler
			$fieldsAvailable[ 'linked_obj_' . $objectType . '_email' ] = $label;
		}
	}

	return $fieldsAvailable;
}

/*
======================================================
	/ Export Tools -> Actual Export File
	====================================================== */
