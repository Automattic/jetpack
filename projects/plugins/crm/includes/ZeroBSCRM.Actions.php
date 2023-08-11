<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
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
======================================================
	Action helper funcs
	====================================================== */

	// returns available actions against a contact
	// this is here to make centralisation easier later
	// long term probs in core or classify?
function zeroBS_contact_actions( $cID = -1, $cObj = false ) {

	global $zbs;

	$actions_array = array();

	if ( ! empty( $cID ) ) {

			// if obj not passed, get
			// not for now, this is only used for sendstatement, so do call there... $cObj = zeroBS_getCustomer($id, true,true,true);

			$useQuotes   = zeroBSCRM_getSetting( 'feat_quotes' );
			$useInvoices = zeroBSCRM_getSetting( 'feat_invs' );
			$useTrans    = zeroBSCRM_getSetting( 'feat_transactions' );

			// later: rights checks here (E.g. can edit?)

				// for v1.0 assume edit rights

				// edit
				$actions_array['edit'] = array(

					'url'   => jpcrm_esc_link( 'edit', $cID, 'zerobs_customer' ), // zeroBSCRM_getEditLink($cID),
					'label' => __( 'Edit Contact', 'zero-bs-crm' ),
					'ico'   => 'address card outline icon',

				);

				// Quotes
				if ( $useQuotes == '1' ) {
					$actions_array['addquote'] = array(

						'url'   => jpcrm_esc_link( 'create', -1, ZBS_TYPE_QUOTE ) . '&zbsprefillcust=' . $cID, // admin_url('post-new.php?post_type=zerobs_quote&zbsprefillcust='.$cID),
						'label' => __( 'Add Quote', 'zero-bs-crm' ),
						'ico'   => 'file text outline icon',

					);
				}

				// Invoices
				if ( $useInvoices == '1' ) {

					// add invoice
					$actions_array['addinvoice'] = array(

						'url'   => jpcrm_esc_link( 'create', -1, ZBS_TYPE_INVOICE ) . '&zbsprefillcust=' . $cID, // admin_url('post-new.php?post_type=zerobs_invoice&zbsprefillcust='.$cID),
						'label' => __( 'Add Invoice', 'zero-bs-crm' ),
						'ico'   => 'file text outline icon',

					);

					// send statement

						// IF has PDF installed, and has invoices

							// check if has invs (low ball test, 1 per page, no deets)
							// wrote into func zeroBS_contactHasInvoice
							// $invoices = zeroBS_getInvoicesForCustomer($cID,false,1,0,false);

							// got pdf?
							$gotPDF = zeroBSCRM_getSetting( 'feat_pdfinv' );

					if ( $gotPDF == '1' && zeroBS_contactHasInvoice( $cID ) ) {

						$sendTo = '';
						if ( isset( $cObj ) && is_array( $cObj ) && isset( $cObj['email'] ) ) {
									$sendTo = $cObj['email'];
						} else {

							// grab from id
							$sendTo = zeroBS_customerEmail( $cID );

						}
						$actions_array['sendstatement'] = array(

							// take out url if JS fired action 'url' => '#sendstatement',
							'label'     => __( 'Send Statement', 'zero-bs-crm' ),
							'ico'       => 'list alternate outline icon',

							// requires this to pre-fill statement email send to :)
							'extraattr' => array(

								'cid'    => $cID,
								'sendto' => $sendTo,
							),

						);

					}
				}

				if ( $useTrans == '1' ) {
					// Transactions
					$actions_array['addtransaction'] = array(

						'url'   => jpcrm_esc_link( 'create', -1, ZBS_TYPE_TRANSACTION ) . '&zbsprefillcust=' . $cID, // admin_url('post-new.php?post_type=zerobs_transaction&zbsprefillcust='.$cID),
						'label' => __( 'Add Transaction', 'zero-bs-crm' ),
						'ico'   => 'money icon',

					);
				}

				// Logs
				$actions_array['addlog'] = array(

					'url'   => jpcrm_esc_link( 'edit', $cID, 'zerobs_customer' ) . '&addlog=1#zerobs-customer-logs',
					'label' => __( 'Add Log', 'zero-bs-crm' ),
					'ico'   => 'heartbeat icon',

				);

				// tasks
				if ( zeroBSCRM_isExtensionInstalled( 'cal' ) ) {

					$actions_array['addtask'] = array(

						'url'   => jpcrm_esc_link( 'create', -1, ZBS_TYPE_EVENT ) . '&zbsprefillcust=' . $cID, // admin_url('post-new.php?post_type=zerobs_event&zbsprefill='.$cID),
						'label' => __( 'Add Task', 'zero-bs-crm' ),
						'ico'   => 'calendar icon',

					);
				}

				// send email
				$actions_array['sendemail'] = array(

					'url'   => jpcrm_esc_link( 'email', $cID, 'zerobs_customer' ), // zeroBSCRM_getAdminURL($zbs->slugs['emails']).'&zbsprefill='.$cID,
					'label' => __( 'Send Email', 'zero-bs-crm' ),
					'ico'   => 'mail outline icon',

				);

				// DAL3 + add delete (requires new pages etc. simpler to split to 3+)
				if ( $zbs->isDAL3() ) {

					// delete
					$actions_array['delete'] = array(

						'url'   => jpcrm_esc_link( 'delete', $cID, 'zerobs_customer' ), // zeroBSCRM_getEditLink($cID),
						'label' => __( 'Delete Contact', 'zero-bs-crm' ),
						'ico'   => 'red trash icon',

					);
				}
	}

	// apply filters
	$actions_array = apply_filters( 'zbs_contact_actions_array', $actions_array, $cID );

	// return
	return $actions_array;
}

	// returns available actions against a company
	// this is here to make centralisation easier later
	// long term probs in core or classify?
function zeroBS_company_actions( $coID = -1 ) {

	global $zbs;

	$actions_array = array();

	if ( ! empty( $coID ) ) {

			// later: rights checks here (E.g. can edit?)

				// for v1.0 assume edit rights

				// edit
				$actions_array['edit'] = array(

					'url'   => jpcrm_esc_link( 'edit', $coID, 'zerobs_company' ), // zeroBSCRM_getEditLink($cID),
					'label' => __( 'Edit ' . jpcrm_label_company(), 'zero-bs-crm' ),
					'ico'   => 'address card outline icon',

				);

	}

	// apply filters
	$actions_array = apply_filters( 'zbs_company_actions_array', $actions_array );

	// return
	return $actions_array;
}

/*
======================================================
	/ Action helper funcs
	====================================================== */
