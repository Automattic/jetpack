<?php
/*
 * Jetpack CRM
 * https://jetpackcrm.com
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
================================================================================

	Define the key the config model will use to store the config in wp options

================================================================================*/

global $zeroBSCRM_Conf_Setup,$zbs;

$zeroBSCRM_Conf_Setup = array(

	// Define the key the config model will use to store the config in wp options
	'conf_key'         => 'zerobscrmsettings',

	// Define the version of config (update as this file updated - any string)
	'conf_ver'         => 'v2.2//29.06.2017',

	// Define the plugin name, ver and db ver (meta data stored in option)
	'conf_plugin'      => 'zeroBSCRM',
	'conf_pluginver'   => false, // catch ver for now, and set up automatically in core
	'conf_plugindbver' => false, // catch ver for now, and set up automatically in core

	// Added DMZ Config (this stores all dmz config settings)
	'conf_dmzkey'      => 'zbscrm_dmz',

	// Protected conf settings, these don't get flushed when restoring defaults
	// NOTE: They can still be edited via usual edit funcs
	'conf_protected'   => array(
		'whlang',
		'customfields',
		'customisedfields',
	),

);

/*
================================================================================

	Define default config model that will be loaded on every new init of settings
	... or when a user resets their settings

================================================================================*/

// Only declared here, then gets shuttled into $zeroBSCRM_Conf_Setup
// ... left seperate for ease of reading
// global $zeroBSCRM_Conf_Def;
$zeroBSCRM_Conf_Def = array(

	'settingsinstalled'                  => 1, // check, DO NOT REMOVE (WH)
	'migrations'                         => array(), // store a list of migrations that have run

	/* === General === */

	/* WordPress Menu Layout */
	'menulayout'                         => 2, // slimline

	/* General Settings */
	'showprefix'                         => 1,
	'showaddress'                        => 1,
	'secondaddress'                      => 1,
	'secondaddresslabel'                 => __( 'Second Address', 'zero-bs-crm' ),
	'countries'                          => 1,
	'perusercustomers'                   => 0,
	'usercangiveownership'               => 0,
	'taskownership'                      => 0,
	'clicktocall'                        => 0,
	'clicktocalltype'                    => 1, // 1 = tel: , 2 = callto:
	'objnav'                             => -1,
	'usesocial'                          => 1,
	'useaka'                             => 1,
	'avatarmode'                         => 1, // 1 = gravatar only, 2 = custom imgs, 3 = none

	/* WordPress Override Mode */
	'wptakeovermode'                     => 0,
	'wptakeovermodeforall'               => 0,
	'loginlogourl'                       => '',
	'customheadertext'                   => '',
	'killfrontend'                       => 0,
	'shareessentials'                    => 1,
	'showpoweredby_public'               => 0,
	'showpoweredby_admin'                => 1,

	/* File Attachment Settings */
	'filetypesupload'                    => array(
		'pdf'  => 1,
		'doc'  => 0,
		'docx' => 0,
		'ppt'  => 0,
		'pptx' => 0,
		'xls'  => 0,
		'xlsx' => 0,
		'csv'  => 0,
		'png'  => 0,
		'jpg'  => 0,
		'jpeg' => 0,
		'gif'  => 0,
		'mp3'  => 0,
		'txt'  => 0,
		'zip'  => 0,
		'all'  => 0,
	),

	/* Auto-logging Settings */
	'autolog_customer_new'               => 1,
	'autolog_company_new'                => 1,
	'autolog_quote_new'                  => 1,
	'autolog_quote_accepted'             => 1,
	'autolog_invoice_new'                => 1,
	'autolog_transaction_new'            => 1,
	'autolog_event_new'                  => 1,
	'autolog_clientportal_new'           => 1,
	'autolog_customer_statuschange'      => 0,
	'autolog_mailcampaigns_send'         => 1,
	'autolog_mailcampaigns_open'         => 1,
	'autolog_mailcampaigns_click'        => 1,
	'autolog_mailcampaigns_unsubscribe'  => 1,

	/* === Business Info === */
	'businessname'                       => '',
	'invoicelogourl'                     => '',
	'businessyourname'                   => '',
	'businessyouremail'                  => '',
	'businessyoururl'                    => '',
	'businesstel'                        => '',
	'twitter'                            => '',
	'facebook'                           => '',
	'linkedin'                           => '',

	/* === Custom Fields === */
	'customfields'                       => array(
		'customers'      => array(
			array( 'select', 'Source', 'Google,Word of mouth,Local Newspaper' ),
		),
		'companies'      => array(),
		'quotes'         => array(),
		'invoices'       => array(),
		'transactions'   => array(),
		'addresses'      => array(),
		'customersfiles' => array(),
	),

	/* === Field Sorts === */
	'fieldsorts'                         => array(
		'address'  => array(),
		'customer' => array(),
		'company'  => array(),
	),
	'fieldhides'                         => array(
		'address'  => array(),
		'customer' => array(),
		'company'  => array(),
	),

	/*
	=== Field Options === */
	// 'customisedfields' contains additional settings spread across multiple tabs
	'showid'                             => 1,
	'fieldoverride'                      => -1, // allow fields with data to be overriden to blank (api/forms)
	'customfieldsearch'                  => -1,
	'filtersfromstatus'                  => 1, // show quickfilters for all statuses
	'filtersfromsegments'                => 1, // show quickfilters for all segments
	'defaultstatus'                      => 'Lead',
	'zbsfunnel'                          => 'Lead,Customer',

	/* === Locale === */
	'currency'                           => array(
		'chr'    => '$',
		'strval' => 'USD',
	),
	'currency_position'                  => 0, // left
	'currency_format_thousand_separator' => ',',
	'currency_format_decimal_separator'  => '.',
	'currency_format_number_of_decimals' => 2,

	/* === List View === */
	'quickfiltersettings'                => array(
		'notcontactedinx' => 30,
		'olderthanx'      => 30,
	),
	'allowinlineedits'                   => -1,
	'show_totals_table'                  => 1,
	/*
	=== Tax === */
	// nothing here by default

	/* === CRM License === */
	'licensingcount'                     => 0,     // stores how many api_requests made
	'licensingerror'                     => false, // stores any api_request errors hit
	'license_key'                        => array(
		'key' => '',
	),

	/*
	=== Companies === */
	// 'customisedfields' contains additional settings spread across multiple tabs
	'coororg'                            => 'co',

	/* === Quotes === */
	'usequotebuilder'                    => 1,
	'quote_pdf_template'                 => '',

	/* === Invoicing === */
	'reftype'                            => 'autonumber',
	'defaultref'                         => '',
	'refprefix'                          => '',
	'refnextnum'                         => 1,
	'refsuffix'                          => '',
	'invtax'                             => 0,
	'invdis'                             => 0,
	'invpandp'                           => 0,
	'inv_pdf_template'                   => '',
	'inv_portal_template'                => '',
	'reflabel'                           => __( 'Reference:', 'zero-bs-crm' ),
	'businessextra'                      => '',
	'paymentinfo'                        => '',
	'invid'                              => 0,
	'invcustomfields'                    => '',
	'contactcustomfields'                => '',
	'companycustomfields'                => '',
	'statementextra'                     => '',
	'statement_pdf_template'             => '',
	'paythanks'                          => '',
	'invfromemail'                       => '', // not used
	'invfromname'                        => '', // not used

	/*
	=== Transactions === */
	// 'customisedfields' contains additional settings spread across multiple tabs
	'shippingfortransactions'            => -1,
	'paiddatestransaction'               => -1,
	'transinclude_status'                => array( 'Succeeded', 'Completed', 'Failed', 'Refunded', 'Processing', 'Pending', 'Hold', 'Draft' ),
	'transaction_fee'                    => -1,
	'transaction_tax'                    => -1,
	'transaction_discount'               => -1,
	'transaction_net'                    => -1,

	/* === Forms === */
	'usegcaptcha'                        => 0,
	'gcaptchasitekey'                    => '',
	'gcaptchasitesecret'                 => '',

	/* === Client Portal === */
	'portalpage'                         => 0,
	'easyaccesslinks'                    => 0,
	'portalusers'                        => 0,
	'portalusers_status'                 => 'all',
	'portalusers_extrarole'              => '',
	'portal_hidefields'                  => 'status,email', // csv of fieldkeys to hide from edits on portal 'Your details'
	'fileview'                           => 'table', // I don't think this one is used
	'cpp_fileview'                       => 'listview', // This should be fully moved to Client Portal Pro
	'zbs_portal_email_content'           => '', // not used

	/*
	=== API Settings === */
	// nothing here by default

	/* === Mail Settings === */
	'emailtracking'                      => 1,
	'directmsgfrom'                      => 1, // fname lname @ crm_name (e.g. John Doe @ MyWebsite)
	'mailignoresslmismatch'              => -1, // makes phpmailer ignore ssl mismatches :)
	'unsub'                              => 'Click to unsubscribe: ##UNSUB-LINK##',
	'unsubpage'                          => -1, // this is the id of wp page where our unsub shortcode should be
	'unsubmsg'                           => 'You have been successfully unsubscribed.',

	/* === Mail Delivery === */
	'smtpaccs'                           => array(),
	'smtpkey'                            => '', // enc key

	/* === OAuth Connections === */
	'oauth_tokens'                       => array(),

	// } ======= Customise Fields
	'customisedfields'                   => array(

		// NOTE: Any changes here need to be reflected in admin pages (For now)
		// search #UPDATECUSTOMFIELDDEFAULTS

		'customers'    => array(
			// Allow people to order base fields + also modified some... via this
			// Can remove this and will revert to default
			// Currently: showhide, value (for now)
			// Remember, this'll effect other areas of the CRM
			'status' => array(
				1,
				'Lead,Customer,Refused,Cancelled by Customer,Cancelled by Us (Pre-Quote),Cancelled by Us (Post-Quote)',
			),
			'prefix' => array(
				1,
				'Mr,Mrs,Ms,Miss,Mx,Dr,Prof,Mr & Mrs',
			),
		),

		// transaction statuses..
		'transactions' => array(
			// Allow people to order base fields + also modified some... via this
			// Can remove this and will revert to default
			// Currently: showhide, value (for now)
			// Remember, this'll effect other areas of the CRM

			// Note: Changes here should be reflected in `transinclude_status` as well
			'status' => array(
				1,
				'Succeeded,Completed,Failed,Refunded,Processing,Pending,Hold,Cancelled,Deleted,Draft',
			),
		),

		'companies'    => array(
			// Allow people to order base fields + also modified some... via this
			// Can remove this and will revert to default
			// Currently: showhide, value (for now)
			// Remember, this'll effect other areas of the CRM
			'status' => array(
				1,
				'Lead,Customer,Refused',
			),
		),
		'quotes'       => array(),
		'invoices'     => array(),

	),
	// } ======= / Customise Fields

	// } ======= Free Extensions Settings
	'feat_quotes'                        => 1,
	'feat_invs'                          => 1,
	'feat_forms'                         => 1,
	'feat_pdfinv'                        => 1,
	'feat_csvimporterlite'               => 1,
	'feat_portal'                        => 1,
	'feat_custom_fields'                 => 1,
	'feat_api'                           => 0,
	'feat_calendar'                      => 1,
	'feat_transactions'                  => 1,
	'feat_jetpackforms'                  => 1,
	'companylevelcustomers'              => 1, // b2b mode
	// } ======= / Free Extensions Settings

	// } ======  Invoicing Pro
	// these should be in the extension...
	'invpro_pay'                         => 2,   // default to PayPal
	'stripe_sk'                          => '',
	'stripe_pk'                          => '',
	'ppbusinessemail'                    => '',
	// } ====== / Invoicing Pro

	// } ======= PDF Settings
	'pdf_fonts_installed'                => 1,
	'pdf_extra_fonts_installed'          => array(),
	// } ======= / PDF Settings

	// } ======= Customer View Layout v2.0
	'customviews2'                       => array(

		// } These use the zbs default funcs but can be overriden :)
		'customer'    => array(
			'id'         => array( 'ID' ),
			'nameavatar' => array( __( 'Name and Avatar', 'zero-bs-crm' ) ),
			'status'     => array( 'Status' ),
			'totalvalue' => array( 'Total Value' ),
			'added'      => array( 'Added' ),
		),

		'company'     => array(
			'id'       => array( 'ID' ),
			'name'     => array( __( 'Name', 'zero-bs-crm' ) ),
			'status'   => array( __( 'Status', 'zero-bs-crm' ) ),
			'contacts' => array( __( 'Contacts', 'zero-bs-crm' ) ),
			'added'    => array( __( 'Added', 'zero-bs-crm' ) ),
			'editlink' => array( __( 'Edit', 'zero-bs-crm' ) ),
		),

		'quote'       => array(
			'id'       => array( 'ID' ),
			'title'    => array( 'Quote Title' ),
			'customer' => array( 'Contact' ),
			'status'   => array( 'Status' ),
			'value'    => array( __( 'Quote Value', 'zero-bs-crm' ) ),
			'editlink' => array( __( 'Edit', 'zero-bs-crm' ) ),
		),

		'invoice'     => array(
			'id'       => array( 'ID' ),
			'ref'      => array( 'Reference' ),
			'customer' => array( 'Contact' ),
			'status'   => array( 'Status' ),
			'value'    => array( __( 'Value', 'zero-bs-crm' ) ),
			'editlink' => array( __( 'Edit', 'zero-bs-crm' ) ),
		),

		'form'        => array(
			'id'          => array( 'ID' ),
			'title'       => array( 'Title' ),
			'style'       => array( __( 'Style', 'zero-bs-crm' ) ),
			'views'       => array( __( 'Views', 'zero-bs-crm' ) ),
			'conversions' => array( __( 'Conversions', 'zero-bs-crm' ) ),
			'added'       => array( __( 'Added', 'zero-bs-crm' ) ),
			'editlink'    => array( __( 'Edit', 'zero-bs-crm' ) ),
		),

		'event'       => array(
			'id'       => array( 'ID' ),
			'title'    => array( __( 'Name', 'zero-bs-crm' ) ),
			'desc'     => array( __( 'Description', 'zero-bs-crm' ) ),
			'start'    => array( __( 'Starting', 'zero-bs-crm' ) ),
			'end'      => array( __( 'Finishing', 'zero-bs-crm' ) ),
			'status'   => array( __( 'Status', 'zero-bs-crm' ) ),
			'assigned' => array( __( 'Assigned To', 'zero-bs-crm' ) ),
			'action'   => array( __( 'Action', 'zero-bs-crm' ) ),
		),

		'transaction' => array(
			'id'       => array( 'ID' ),
			'customer' => array( __( 'Contact', 'zero-bs-crm' ) ),
			'status'   => array( __( 'Status', 'zero-bs-crm' ) ),
			'total'    => array( __( 'Value', 'zero-bs-crm' ) ),
			'item'     => array( __( 'Item', 'zero-bs-crm' ) ),
			'added'    => array( __( 'Added', 'zero-bs-crm' ) ),
			'editlink' => array( __( 'Edit Link', 'zero-bs-crm' ) ),
		),

		'segment'     => array(
			'id'            => array( 'ID' ),
			'name'          => array( 'Name' ),
			'audiencecount' => array( 'Contact Count' ),
			'action'        => array( 'Action' ),
		),

	),
	// } ======= / Customer View Layout v2.0

	// } ======= Screenoptions (generic)
	// Likely not used?
	'company_view_docs_columns'          => array(
		'transactions' => array( 'date', 'id', 'total', 'status' ),
	),
	// } ======= / Screenoptions (generic)

);

// Move defaults arr into main config
$zeroBSCRM_Conf_Setup['conf_defaults'] = $zeroBSCRM_Conf_Def;
