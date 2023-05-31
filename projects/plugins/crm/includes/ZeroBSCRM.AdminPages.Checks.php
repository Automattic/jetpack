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

	// =========  GENERIC ============================================

	// Centralised func which does a lot of the lifting used throughout these check funcs
function zeroBS_isPage( $pageArr = array(), $postTypes = false, $adminPages = false, $includeFrontEnd = false ) {

	global $pagenow;
	// make sure we are on the backend
	if ( ! $includeFrontEnd ) {
		if ( ! is_admin() ) {
			return false;
		}
	}

	// check in array (like  array( 'post.php', 'post-new.php' ))
	if ( in_array( $pagenow, $pageArr ) ) {

		if ( is_array( $postTypes ) ) {

			$postID = -1;

			// catches get
			if ( isset( $_GET['post'] ) ) {
				$postID = (int) sanitize_text_field( $_GET['post'] );
			}

			// catches post saving / update
			if ( isset( $_POST['post_ID'] ) ) {
				$postID = (int) sanitize_text_field( $_POST['post_ID'] );
			}

			// check post type?
			if ( $postID !== -1 && in_array( get_post_type( $postID ), $postTypes ) ) {
				return true;
			}

			// WH added: needed for post-new.php etc.
			if ( isset( $_GET['post_type'] ) && in_array( sanitize_text_field( $_GET['post_type'] ), $postTypes ) ) {
				return true;
			}
		} elseif ( is_array( $adminPages ) ) {

			// check page slug
			if ( isset( $_GET['page'] ) && in_array( sanitize_text_field( $_GET['page'] ), $adminPages ) ) {
				return true;
			}
		} else {

			// no post types given, but page = $pageArr, so return true
			return true;

		}
	}

	return false;
}
	// checks for presence of url params
function zeroBS_hasGETParams( $pageArr = array(), $params = array() ) {

	global $pagenow;
	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	// check in array (like  array( 'post.php', 'post-new.php' ))
	if ( in_array( $pagenow, $pageArr ) ) {

		if ( is_array( $params ) && count( $params ) > 0 ) {

			// check params - return false if any not present
			foreach ( $params as $p ) {
				if ( ! isset( $_GET[ $p ] ) ) {
					return false;
				}
			}

			// has all params
			return true;

		}
	}

	return false;
}
	// checks for presence of url params
function zeroBS_hasGETParamsWithValues( $pageArr = array(), $params = array(), $noneOfTheseParams = array() ) {

	global $pagenow;
	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	// check in array (like  array( 'post.php', 'post-new.php' ))
	if ( in_array( $pagenow, $pageArr ) ) {

		if ( is_array( $params ) && count( $params ) > 0 ) {

			// check params against vals
			foreach ( $params as $p => $v ) {
				if ( ! isset( $_GET[ $p ] ) || $_GET[ $p ] != $v ) {
					return false;
				}
			}

			// check for $noneOfTheseParams
			foreach ( $noneOfTheseParams as $p ) {
				if ( isset( $_GET[ $p ] ) ) {
					return false;
				}
			}

			// has all params
			return true;

		}
	}

	return false;
}

function zeroBSCRM_isLoginPage() {
	// http://wordpress.stackexchange.com/questions/12863/check-if-were-on-the-wp-login-page
	// if ( in_array( $GLOBALS['pagenow'], array( 'wp-login.php', 'wp-register.php' ) ) ) return true;
	// return false;
	return zeroBS_isPage( array( 'wp-login.php', 'wp-register.php' ), false, false, true );
}

function zeroBSCRM_isWelcomeWizPage() {

	global $zeroBSCRM_killDenied;
	if ( isset( $zeroBSCRM_killDenied ) && $zeroBSCRM_killDenied === true ) {
		return true;
	}
	return false;
}

function zeroBSCRM_isAPIRequest() {

	// print_r($_SERVER['QUERY_STRING']);

	// print_r($_SERVER);
	// print_r(array((isset($_SERVER['SCRIPT_URL'])),strpos('#'.$_SERVER['SCRIPT_URL'], '/zbs_api/'))); exit();

	// SCRIPT_URL not present in $_SERVER on mine: https://stackoverflow.com/questions/24428981/serverscript-url-when-is-it-reliably-present
	// below is more reliable as QUERY_STRING will always be set for API requests.

	// lazy, non-wp way of doing this
	if ( isset( $_SERVER['QUERY_STRING'] ) && strpos( '#' . $_SERVER['QUERY_STRING'], 'api_key=zbscrm_' ) > 0 ) {
		return true;
	}

	// Added REST api v2.94ish, so had to add this to skip dashcatch
	// https://wordpress.stackexchange.com/questions/221202/does-something-like-is-rest-exist
	if ( zeroBSCRM_isRestUrl() ) {
		return true;
	}

	return false;
}

	// is a REST url
	// doesn't validate auth or anything, just 'LOOKS LIKE REST  URL'
	// https://wordpress.stackexchange.com/questions/221202/does-something-like-is-rest-exist
function zeroBSCRM_isRestUrl() {
	$bIsRest = false;
	if ( function_exists( 'rest_url' ) && ! empty( $_SERVER['REQUEST_URI'] ) ) {
		$sRestUrlBase = get_rest_url( get_current_blog_id(), '/' );
		$sRestPath    = trim( parse_url( $sRestUrlBase, PHP_URL_PATH ), '/' );
		$sRequestPath = trim( $_SERVER['REQUEST_URI'], '/' );
		$bIsRest      = ( strpos( $sRequestPath, $sRestPath ) === 0 );
	}
	return $bIsRest;
}

function zeroBSCRM_isClientPortalPage() {
	global $zbs;

	if ( property_exists( $zbs->modules, 'portal' ) ) {
		return $zbs->modules->portal->is_portal_page();
	}

	return false;
}

	// } Determines if we are on a ZBS Admin Page (i.e. app page, including the customer edit + other custom post pages)
	// } Have made a more generic check of the zeroBSCRM_is_customer_edit_page to cover all our custom post types
	// } such as zerobs_ticket (for Groove Sync) etc. etc. etc.

function zeroBSCRM_is_ZBS_custom_post_page() {

	return zeroBS_isPage( array( 'post.php', 'post-new.php', 'edit-tags.php', 'edit.php' ), array( 'zerobs_customer', 'zerobs_quote', 'zerobs_invoice', 'zerobs_quo_template', 'zerobs_transaction', 'zerobs_company', 'zerobs_form', 'zerobs_event' ) );
}

function zeroBSCRM_isAdminPage() {

	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	global $zbs;

	// basic slug check
	if ( isset( $_GET['page'] ) ) {
		if ( in_array( $_GET['page'], $zbs->slugs ) ) {
			return true;
		}
	}

	// custom post type pages
	if ( zeroBSCRM_is_ZBS_custom_post_page() ) {
		return true;
	}

	// odd pages?
	if ( ( isset( $_GET['page'] ) ) && ( $_GET['page'] === 'zbs-noaccess' || $_GET['page'] === 'manage-customers' || $_GET['page'] === 'manage-invoices-crm' ) ) {
		return true;
	}

	// custom slug checks?
	if ( isset( $_GET['zbsslug'] ) ) {
		if ( in_array( sanitize_text_field( $_GET['zbsslug'] ), $zbs->slugs ) ) {
			return true;
		}
	}

	// lastly... grasping at straws... check for defined global (defined in global admin script)
	if ( defined( 'ZBS_PAGE' ) ) {
		$isOurPage = true;
	}

	// use a filter to catch return's for ext pages
	$return = false;
	$return = apply_filters( 'zbs-page-check', $return );

	return $return;
}

function zeroBSCRM_is_edit_page( $new_edit = null ) {

	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	global $pagenow;

	if ( $new_edit == 'edit' ) {
		return in_array( $pagenow, array( 'post.php' ) );
	} elseif ( $new_edit == 'new' ) { // check for new post page
		return in_array( $pagenow, array( 'post-new.php' ) );
	} else { // check for either new or edit
		return in_array( $pagenow, array( 'post.php', 'post-new.php' ) );
	}
}

	// returns true if on a zbs edit page
	// (for any obj)
function zeroBSCRM_is_zbs_edit_page( $specificType = false, $isNew = false ) {

	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	// then if we have these, it's an edit page
	if ( $specificType !== false ) {

		// check with type
		if (
			zeroBS_hasGETParamsWithValues(
				array( 'admin.php' ),
				array(
					'page'    => 'zbs-add-edit',
					'action'  => 'edit',
					'zbstype' => $specificType,
				)
			)
		) {

			// looking to see if is new page?
			if ( $isNew ) {
				if ( ! isset( $_GET['zbsid'] ) ) {
					return true;
				}
			} else {
				return true;
			}
		}
	} elseif ( zeroBS_hasGETParamsWithValues(
		array( 'admin.php' ),
		array(
			'page'   => 'zbs-add-edit',
			'action' => 'edit',
		)
	) ) {
		return true;
	}

	// if not, then nope.
	return false;
}

	// is a "delete x?" page
function zeroBSCRM_is_delete_page( $new_edit = null ) {

	// make sure we are on the backend
	if ( ! is_admin() ) {
		return false;
	}

	// then if we have these, it's an edit page
	if ( zeroBS_hasGETParamsWithValues(
		array( 'admin.php' ),
		array(
			'page'   => 'zbs-add-edit',
			'action' => 'delete',
		)
	) ) {
		return true;
	}

	// if not, then nope.
	return false;
}

	// ========= / GENERIC ============================================

	// ========= CONTACTS =============================================

	// generic check for any page concerning 'contacts'
function zeroBSCRM_isAnyContactPage() {

	if ( zeroBSCRM_is_contact_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_customer_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_customer_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_customertags_page() ) {
		return true;
	}

	// for now we count co's as here:
	if ( zeroBSCRM_is_company_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_company_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_company_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_companytags_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_contact_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['managecontacts'] ) );
}
function zeroBSCRM_is_existingcustomer_edit_page() {

	$isPage = zeroBS_isPage( array( 'post.php' ), array( 'zerobs_customer' ) ); // 'post-new.php'
	if ( $isPage ) {
		return true;
	} elseif ( zeroBS_hasGETParamsWithValues(
		array( 'admin.php' ),
		array(
			'page'   => 'zbs-add-edit',
			'action' => 'edit',
		)
	) ) {

		if ( isset( $_GET['zbsid'] ) ) {
			return true;
		}
	}
	return false;
}

function zeroBSCRM_is_customer_edit_page() {

	$isPage = zeroBS_isPage( array( 'post.php' ), array( 'zerobs_customer' ) ); // 'post-new.php'
	if ( $isPage ) {
		return true;
	} else {
		// return zeroBS_hasGETParamsWithValues(array( 'admin.php' ),array('page'=>'zbs-add-edit','action'=>'edit'));
		// either has zbstype = contact, or no zbstype (as is default)
		if (
			( zeroBS_hasGETParamsWithValues(
				array( 'admin.php' ),
				array(
					'page'    => 'zbs-add-edit',
					'action'  => 'edit',
					'zbstype' => 'contact',
				)
			) )
			||
			( zeroBS_hasGETParamsWithValues(
				array( 'admin.php' ),
				array(
					'page'   => 'zbs-add-edit',
					'action' => 'edit',
				),
				array( 'zbstype' )
			) )
			) {
			return true;
		}
	}
	return false;
}

function zeroBSCRM_is_customer_view_page() {

	// DAL 2+
	// return zeroBS_hasGETParamsWithValues(array( 'admin.php' ),array('page'=>'zbs-add-edit','action'=>'view'));

	// either has zbstype = contact, or no zbstype (as is default)
	if (
		( zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => 'zbs-add-edit',
				'action'  => 'view',
				'zbstype' => 'contact',
			)
		) )
		||
		( zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'   => 'zbs-add-edit',
				'action' => 'view',
			),
			array( 'zbstype' )
		) )
		) {
		return true;
	}

	return false;
}
function zeroBSCRM_is_customer_new_page() {

	// DAL 2 support
	$isPage = zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_customer' ) ); // 'post-new.php'
	if ( $isPage ) {
		return true;
	} else {
		// either has zbstype = contact, or no zbstype (as is default)
		if (
			( zeroBS_hasGETParamsWithValues(
				array( 'admin.php' ),
				array(
					'page'    => 'zbs-add-edit',
					'action'  => 'edit',
					'zbstype' => 'contact',
				)
			) )
			||
			( zeroBS_hasGETParamsWithValues(
				array( 'admin.php' ),
				array(
					'page'   => 'zbs-add-edit',
					'action' => 'edit',
				),
				array( 'zbstype' )
			) )
			) {

			if ( ! isset( $_GET['zbsid'] ) || $_GET['zbsid'] == -1 ) {
				return true;
			}
		}
	}
	return false;
}

function zeroBSCRM_is_customertags_page() {

	// DAL 2 support
	$isPage = zeroBS_isPage( array( 'edit-tags.php' ), array( 'zerobs_customer' ) );
	if ( $isPage ) {
		return true;
	} else {
		global $zbs;
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'contact',
			)
		);
	}

	return false;
}

	// ========= / CONTACTS =============================================

	// ========= COMPANIES ==============================================

function zeroBSCRM_is_company_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['managecompanies'] ) );
}

function zeroBSCRM_is_company_view_page() {

	// either has zbstype = company, or no go
	if (
		zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => 'zbs-add-edit',
				'action'  => 'view',
				'zbstype' => 'company',
			)
		)
	) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_company_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_company' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'company', true );
	}
}

function zeroBSCRM_is_company_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_company' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'company', false );
	}
}

function zeroBSCRM_is_existingcompany_edit_page() {

	return zeroBSCRM_is_company_edit_page();
}

function zeroBSCRM_is_companytags_page() {

	// DAL 2 support
	$isPage = zeroBS_isPage( array( 'edit-tags.php' ), array( 'zerobs_company' ) );
	if ( $isPage ) {
		return true;
	} else {
		global $zbs;
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'company',
			)
		);
	}

	return false;
}

	// ========= / COMPANIES ===============================================

	// ========= TRANSACTIONS ==============================================

	// generic check for any page concerning 'trans'
function zeroBSCRM_isAnyTransactionPage() {

	if ( zeroBSCRM_is_transaction_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_transaction_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_transaction_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_transactiontags_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_transaction_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['managetransactions'] ) );
}

function zeroBSCRM_is_transaction_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_transaction' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'transaction', true );
	}
}

function zeroBSCRM_is_transaction_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_transaction' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'transaction', false );
	}
}

function zeroBSCRM_is_transactiontags_page() {

	// DAL 2 support
	$isPage = zeroBS_isPage( array( 'edit-tags.php' ), array( 'zerobs_transaction' ) );
	if ( $isPage ) {
		return true;
	} else {
		global $zbs;
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'transaction',
			)
		);
	}

	return false;
}

	// ========= / TRANSACTIONS ===============================================

	// ========= INVOICES =====================================================

	// generic check for any page concerning 'invs'
function zeroBSCRM_isAnyInvoicePage() {

	if ( zeroBSCRM_is_invoice_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_invoice_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_invoice_edit_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_invoice_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['manageinvoices'] ) );
}

function zeroBSCRM_is_invoice_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_invoice' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'invoice', true );
	}
}

function zeroBSCRM_is_invoice_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_invoice' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'invoice', false );
	}
}

function zeroBSCRM_is_invoicetags_page() {

	// v3.0+ only
	global $zbs;
	if ( $zbs->isDAL3() ) {
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'invoice',
			)
		);
	}

	return false;
}

	// ========= / INVOICES =================================================

	// ========= QUOTES =====================================================

	// generic check for any page concerning 'quotes'
function zeroBSCRM_isAnyQuotePage() {

	if ( zeroBSCRM_is_quote_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_quo_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_quo_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_quotetemplate_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_quotetemplate_edit_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_quote_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['managequotes'] ) );
}

function zeroBSCRM_is_quo_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_quote' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'quote', true );
	}
}

function zeroBSCRM_is_quo_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_quote' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'quote', false );
	}
}

function zeroBSCRM_is_quotetags_page() {

	// v3.0+ only
	global $zbs;
	if ( $zbs->isDAL3() ) {
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'quote',
			)
		);
	}

	return false;
}

	// ========= / QUOTES =================================================

	// ========= QUOTE TEMPLATES ==========================================

	// backward compat
function zeroBSCRM_is_quotem_new_page() {

	zeroBSCRM_DEPRECATEDMSG( 'zeroBSCRM_is_quotem_new_page was deprecated in v4.10, please use zeroBSCRM_is_quotetemplate_new_page()' );
	return zeroBSCRM_is_quotetemplate_new_page();
}
function zeroBSCRM_is_quotem_edit_page() {

	zeroBSCRM_DEPRECATEDMSG( 'zeroBSCRM_is_quotem_edit_page was deprecated in v4.10, please use zeroBSCRM_is_quotetemplate_edit_page()' );
	return zeroBSCRM_is_quotetemplate_edit_page();
}

function zeroBSCRM_is_quotetemplate_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_quo_template' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'quotetemplate', true );
	}
}

function zeroBSCRM_is_quotetemplate_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_quo_template' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'quotetemplate', false );
	}
}

	// ========= / QUOTE TEMPLATES =========================================

	// ========= EVENTS ====================================================

	// generic check for any page concerning 'events'
function zeroBSCRM_isAnyEventPage() {

	if ( zeroBSCRM_is_event_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_task_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_task_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_task_calendar_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_task_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_eventtags_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_event_list_page() {

	return zeroBS_isPage( array( 'edit.php' ), array( 'zerobs_event' ) );
}

function zeroBSCRM_is_task_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_event' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'event', true );
	}
}

function zeroBSCRM_is_task_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_event' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'event', false );
	}
}

function zeroBSCRM_is_task_calendar_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['manage-events'] ) );
}

function zeroBSCRM_is_task_list_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['manage-events-list'] ) );
}

function zeroBSCRM_is_eventtags_page() {

	// v3.0+ only
	global $zbs;
	if ( $zbs->isDAL3() ) {
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'event',
			)
		);
	}

	return false;
}

	// ========= / EVENTS =================================================

	// ========= FORMS ====================================================

	// generic check for any page concerning 'forms'
function zeroBSCRM_isAnyFormPage() {

	if ( zeroBSCRM_is_form_new_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_form_edit_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_form_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_formtags_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_task_list_page() ) {
		return true;
	}
	if ( zeroBSCRM_is_eventtags_page() ) {
		return true;
	}

	return false;
}

function zeroBSCRM_is_form_new_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post-new.php' ), array( 'zerobs_form' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'form', true );
	}
}

function zeroBSCRM_is_form_edit_page() {

	// <v3.0
	if ( zeroBS_isPage( array( 'post.php' ), array( 'zerobs_form' ) ) ) {
		return true;
	} else { // v3.0
		return zeroBSCRM_is_zbs_edit_page( 'form', false );
	}
}

function zeroBSCRM_is_form_list_page() {

	return zeroBS_isPage( array( 'edit.php' ), array( 'zerobs_form' ) );
}

function zeroBSCRM_is_formtags_page() {

	// v3.0+ only
	global $zbs;
	if ( $zbs->isDAL3() ) {
		return zeroBS_hasGETParamsWithValues(
			array( 'admin.php' ),
			array(
				'page'    => $zbs->slugs['tagmanager'],
				'tagtype' => 'form',
			)
		);
	}

	return false;
}

	// ========= / FORMS =================================================

	// ========= SEGMENTS =================================================

function zeroBSCRM_is_segment_edit_page() {

	// v3.0
	return zeroBSCRM_is_zbs_edit_page( 'segment', true );
}

function zeroBSCRM_is_segment_new_page() {

	// v3.0
	return zeroBSCRM_is_zbs_edit_page( 'segment', false );
}

	// ========= / SEGMENTS =================================================

function zeroBSCRM_is_profile_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['your-profile'] ) );
}

function jpcrm_is_settings_page() {

	global $zbs;
	return zeroBS_isPage( array( 'admin.php' ), false, array( $zbs->slugs['settings'] ) );
}
