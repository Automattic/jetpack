<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * Copyright 2021 Automattic
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/*
	
	WIP:

		each placeholder record will have an array such as:

	{placeholder_model}:

		array( 

			'description' 	  => 'Contact ID',
			'origin'		  => 'Contact Object model',
			'replace_str'	  => '##CONTACT-ID##',
			'aliases' 		  => array('##CID##'),
			'associated_type' => ZBS_TYPE_CONTACT,
			'expected_format' => 'str' // future proofing
			'available_in'	  => array(
					
					// tooling allowed to use this, from:
					// if specified, otherwise areas may use type to identify which placeholders are available
					'system_email_templates',
					'mail_campaigns',
					'quote' e.g:
						'quote_templates',
						'quote_editor',
					'invoice' e.g:
						'invoice_editor',
					'single_email',

			)

		)

*/

/**
* jpcrm_templating_placeholders is the placeholder layer in Jetpack CRM 4+
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  4.0
* @access   public
* @see      https://kb.jetpackcrm.com
*/
class jpcrm_templating_placeholders {

		// default set of placeholders, to get amended on init (Custom fields etc.)
		private $placeholders = array();

	// stores common links e.g. contact fields in quotes
	// for now these repreresent the 1:1 relational links in the db
	// later, as the DAL is extended, this could take advantage of 
	// a better mapping integral to the DAL, perhaps extending
	// the $linkedToObjectTypes system.
	// for now it's an exception, so hard-typing:
	private $available_in_links = array(

			'contact' => array(
				'quote',
				'invoice',
				'transaction',
				'event'
			),
			'company' => array(
				// 'quote',
				'invoice',
				'transaction',
				'event'
			)

	);

	// ===============================================================================
	// ===========  INIT =============================================================
	function __construct($args=array()) {

		// Build out list of placeholders
		$this->build_placeholders();

	}
	// ===========  / INIT ===========================================================
	// ===============================================================================


	/**
	 * Fills out default placeholders
	 * This is executed on init because we want to include the full translatable strings
	 * ... which we cannot set as constants because we want the __()
	 *
	 * @return array of all placeholders
	 */
	private function default_placeholders(){

		$this->placeholders = array(

			// CRM global placeholders, e.g. business name (from settings)
			'global' => array(

				'biz-name' => array(

					'description' => __( 'Business name', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-NAME##',
					'aliases'			=> array( '###BIZNAME###', '##BIZNAME##' )
				),

				'biz-state' => array(

					'description' => __( 'Business state', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-STATE##',
					'aliases'			=> array( '##BIZSTATE##' )
				),

				'biz-logo' => array(

					'description' => __( 'Business logo', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-LOGO##'
				),

				'biz-info' => array(

					'description' 		=> __( 'Table with your business information (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##BIZ-INFO##',
					'aliases'			=> array( '###BIZINFOTABLE###', '###BIZ-INFO###', '###FOOTERBIZDEETS###', '##INVOICE-BIZ-INFO##' )
				),

				'biz-your-name' => array(

					'description' => __( 'Business: Your Name', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-YOUR-NAME##',
					'aliases'			=> array( )
				),

				'biz-your-email' => array(

					'description' => __( 'Business: Your Email', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-YOUR-EMAIL##',
					'aliases'			=> array( )
				),

				'biz-your-url' => array(

					'description' => __( 'Business: Your URL', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-YOUR-URL##',
					'aliases'			=> array( )
				),

				'biz-extra'          => array(

					'description' => __( 'Business: Extra Info', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##BIZ-EXTRA-INFO##',
					'aliases'			=> array( )
				),

				'social-links' => array(

					'description' => __( 'Social links', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##SOCIAL-LINKS##'
				),

				'unsub-line' => array(

					'description' => __( 'Unsubscribe line', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##UNSUB-LINE##',
					'aliases'	=> array( '###UNSUB-LINE###', '###UNSUB###', '###UNSUBSCRIBE###', '###FOOTERUNSUBDEETS###' )
				),

				'powered-by' => array(

					'description' => __( 'Powered by', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##POWERED-BY##',
					'aliases'	=> array( '###POWEREDBYDEETS###' )
				),

				'login-link' => array(

					'description' => __( 'CRM login link (HTML)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##LOGIN-LINK##',
					'aliases'	=> array( '###LOGINLINK###' )
				),

				'login-button' => array(

					'description' => __( 'CRM login link button (HTML)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##LOGIN-BUTTON##',
					'aliases'	=> array( '###LOGINBUTTON###' )
				),

				'login-url' => array(

					'description' => __( 'CRM login URL', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##LOGIN-URL##',
					'aliases'	=> array( '###LOGINURL###', '###ADMINURL###' )
				),

				'portal-link' => array(

					'description' => __( 'Portal link (HTML)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##PORTAL-LINK##',
					'aliases'	=> array( '###PORTALLINK###' )
				),

				'portal-view-button' => array(

					'description' => __( '"View in Portal" button (HTML)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##PORTAL-VIEW-BUTTON##',
					'aliases'	=> array( '###VIEWINPORTAL###' )
				),

				'portal-button' => array(

					'description' => __( 'Portal link button (HTML)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##PORTAL-BUTTON##',
					'aliases'	=> array( '###PORTALBUTTON###' )
				),

				'portal-url' => array(

					'description' => __( 'Portal URL', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##PORTAL-URL##',
					'aliases'	=> array( '###PORTALURL###' )
				),


				'css' => array(

					'description' => __( 'CSS (restricted to HTML templates)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##CSS##',
					'aliases'	=> array( '###CSS###' )
				),

				'title' => array(

					'description' => __( 'Generally used to fill HTML title tags', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##TITLE##',
					'aliases'	=> array( '###TITLE###' )
				),

				'msg-content' => array(

					'description' => __( 'Message content (restricted to some email templates)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'html',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##MSG-CONTENT##',
					'aliases'	=> array( '###MSGCONTENT###' )
				),

				'email' => array(

					'description' => __( 'Email (generally used to insert user email)', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##EMAIL##',
					'aliases'	=> array( '###EMAIL###' )
				),

				'password' => array(

					'description' => __( 'Inserts a link where one can reset their password', 'zero-bs-crm' ),
					'origin' => __( 'Global', 'zero-bs-crm' ),
					'expected_format' => 'str',
					'available_in' => array(),
					'associated_type' => false,
					'replace_str' => '##PASSWORD##',
					'aliases'	=> array( '##PASSWORD-RESET-LINK##', '###PASSWORD###' )
				),

				'email-from-name' => array(

					'description' 		=> __( '"From" Name when sending email', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'email',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##EMAIL-FROM-NAME##',
					'aliases'			=> array( '###FROMNAME###' )
				),

			), 

			'contact' => array(

				'contact-fullname' => array(

					'description' 		=> __( 'Contact full name', 'zero-bs-crm' ),
					'origin' 			=> __( 'Contact Information', 'zero-bs-crm' ),
					'available_in' 		=> array(),
					'associated_type' 	=> ZBS_TYPE_CONTACT,
					'replace_str' 		=> '##CONTACT-FULLNAME##',
					'expected_format' 	=> 'str',
					'aliases' 			=> array( '##CUSTOMERNAME##', '##CUSTOMER-FULLNAME##' )
				),

			),
			'company' => array(

			),
			'quote' => array(

				'quote-content' => array(

					'description' 		=> __( 'Quote content (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-CONTENT##',
					'aliases'			=> array( '###QUOTECONTENT###' )
				),

				'quote-title' => array(

					'description' 		=> __( 'Quote title', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-TITLE##',
					'aliases'			=> array( '###QUOTETITLE###', '##QUOTETITLE##' )
				),

				'quote-value' => array(

					'description' 		=> __( 'Quote value', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-VALUE##',
					'aliases'			=> array( '###QUOTEVALUE###', '##QUOTEVALUE##' )
				),

				'quote-date' => array(

					'description' 		=> __( 'Quote date', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-DATE##',
					'aliases'			=> array( '###QUOTEDATE###', '##QUOTEDATE##' )
				),

				'quote-url' => array(

					'description' 		=> __( 'Quote URL', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-URL##',
					'aliases'			=> array( '###QUOTEURL###' )
				),

				'quote-edit-url' => array(

					'description' 		=> __( 'Quote edit URL', 'zero-bs-crm' ),
					'origin' 			=> __( 'Quote Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_QUOTE,
					'replace_str'		=> '##QUOTE-EDIT-URL##',
					'aliases'			=> array( '###QUOTEEDITURL###' )
				),

			),
			'invoice' => array(

				'invoice-title' => array(

					'description' 		=> __( 'Invoice title', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-TITLE##',
					'aliases'			=> array( '###INVOICETITLE###' )
				),

				'logo-class' => array(

					'description' 		=> __( 'Invoice logo CSS class', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##LOGO-CLASS##',
					'aliases'			=> array( '###LOGOCLASS###' )
				),

				'logo-url' => array(

					'description' 		=> __( 'Invoice logo URL', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##LOGO-URL##',
					'aliases'			=> array( '###LOGOURL###' )
				),

				'invoice-number' => array(

					'description' 		=> __( 'Invoice number', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-NUMBER##',
					'aliases'			=> array( '###INVNOSTR###' )
				),

				'invoice-date' => array(

					'description' 		=> __( 'Invoice date', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-DATE##',
					'aliases'			=> array( '###INVDATESTR###' )
				),

				'invoice-id-styles' => array(

					'description' 		=> __( 'Invoice ID styles', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-ID-STYLES##',
					'aliases'			=> array( '###INVIDSTYLES###' )
				),

				'invoice-ref' => array(

					'description' 		=> __( 'Invoice reference', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-REF##',
					'aliases'			=> array( '###REF###' )
				),

				'invoice-due-date' => array(

					'description' 		=> __( 'Invoice due date', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-DUE-DATE##',
					'aliases'			=> array( '###DUEDATE###' )
				),

				'invoice-biz-class' => array(

					'description' 		=> __( 'CSS class for table with your business info', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-BIZ-CLASS##',
					'aliases'			=> array( '###BIZCLASS###' )
				),

				'invoice-customer-info' => array(

					'description' 		=> __( 'Table with assigned contact information (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-CUSTOMER-INFO##',
					'aliases'			=> array( '###CUSTINFOTABLE###' )
				),

				'invoice-from-name' => array(

					'description' 		=> __( 'Name of company issuing the invoice', 'zero-bs-crm' ),
					'origin' 			=> __( 'Statement Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-FROM-NAME##',
					'aliases'			=> array()
				),

				'invoice-table-headers' => array(

					'description' 		=> __( 'Table headers for invoice line items (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-TABLE-HEADERS##',
					'aliases'			=> array( '###TABLEHEADERS###' )
				),

				'invoice-line-items' => array(

					'description' 		=> __( 'Invoice line items (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LINE-ITEMS##',
					'aliases'			=> array( '###LINEITEMS###' )
				),

				'invoice-totals-table' => array(

					'description' 		=> __( 'Invoice totals table (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-TOTALS-TABLE##',
					'aliases'			=> array( '###TOTALSTABLE###' )
				),

				'pre-invoice-payment-details' => array(

					'description' 		=> __( 'Text before invoice payment details', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##PRE-INVOICE-PAYMENT-DETAILS##',
					'aliases'			=> array( '###PREPARTIALS###' )
				),

				'invoice-payment-details' => array(

					'description' 		=> __( 'Invoice payment details', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-PAYMENT-DETAILS##',
					'aliases'			=> array( '###PAYMENTDEETS###', '###PAYDETAILS###', )
				),

				'invoice-partials-table' => array(

					'description' 		=> __( 'Invoice partials table (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-PARTIALS-TABLE##',
					'aliases'			=> array( '###PARTIALSTABLE###' )
				),

				'invoice-label-inv-number' => array(

					'description' 		=> __( 'Label for invoice number', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-INV-NUMBER##',
					'aliases'			=> array( '###LANGINVNO###' )
				),

				'invoice-label-inv-date' => array(

					'description' 		=> __( 'Label for invoice date', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-INV-DATE##',
					'aliases'			=> array( '###LANGINVDATE###' )
				),

				'invoice-label-inv-ref' => array(

					'description' 		=> __( 'Label for invoice reference', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-INV-REF##',
					'aliases'			=> array( '###LANGINVREF###' )
				),

				'invoice-label-from' => array(

					'description' 		=> __( 'Label for name of company issuing invoice', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-FROM##',
					'aliases'			=> array( '###LANGFROM###' )
				),

				'invoice-label-to' => array(

					'description'     => __( 'Label for name of contact receiving invoice', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-TO##',
					'aliases'			=> array( '###LANGTO###' )
				),

				'invoice-label-due-date' => array(

					'description' 		=> __( 'Label for invoice due date', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-DUE-DATE##',
					'aliases'			=> array( '###LANGDUEDATE###' )
				),

				'invoice-label-status' => array(

					'description' 		=> __( 'Label for invoice status', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-LABEL-STATUS##',
					'aliases'			=> array()
				),

				'invoice-html-status' => array(

					'description' 		=> __( 'Invoice status (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-HTML-STATUS##',
					'aliases'			=> array( '###TOPSTATUS###' )
				),

				'invoice-pay-button' => array(

					'description' 		=> __( 'Invoice pay button (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-PAY-BUTTON##',
					'aliases'			=> array( '###PAYPALBUTTON###' )
				),

				'invoice-pay-thanks' => array(

					'description' 		=> __( 'Invoice payment thanks message (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-PAY-THANKS##',
					'aliases'			=> array( '###PAYTHANKS###' )
				),

				'invoice-pay-terms' => array(

					'description' 		=> __( 'Invoice payment terms (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-PAY-TERMS##',
					'aliases'			=> array( '###PAYMENTTERMS###' )
				),

				'invoice-statement-html' => array(

					'description' 		=> __( 'Invoice statement (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Statement Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-STATEMENT-HTML##',
					'aliases'			=> array( '###STATEMENTHTML###' )
				),

				'invoice-ref-styles' => array(

					'description' 		=> __( 'CSS attributes applied to invoice reference label', 'zero-bs-crm' ),
					'origin' 			=> __( 'Statement Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INVOICE-REF-STYLES##',
					'aliases'			=> array( '###INVREFSTYLES###' )
				),

				'invoice-custom-fields' => array(

					'description' 		=> __( 'Any custom fields associated with invoice (if enabled in Invoice Settings)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Invoice Builder', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_INVOICE,
					'replace_str'		=> '##INV-CUSTOM-FIELDS##',
					'aliases'			=> array()
				),



			),
			'transaction' => array(

			),
			'event' => array(

				'task-title' => array(

					'description' 		=> __( 'Task title', 'zero-bs-crm' ),
					'origin' 			=> __( 'Task Scheduler', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_TASK,
					'replace_str'		=> '##TASK-TITLE##',
					'aliases'			=> array( '###EVENTTITLE###', '##EVENT-TITLE##' )
				),

				'task-link' => array(

					'description' 		=> __( 'Task link (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Task Scheduler', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_TASK,
					'replace_str'		=> '##TASK-LINK##',
					'aliases'			=> array( '###EVENTLINK###' )
				),

				'task-link-button' => array(

					'description' 		=> __( 'Task link button (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Task Scheduler', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_TASK,
					'replace_str'		=> '##TASK-LINK-BUTTON##',
					'aliases'			=> array( '###EVENTLINKBUTTON###' )
				),

				'task-body' => array(

					'description' 		=> __( 'Task content (HTML)', 'zero-bs-crm' ),
					'origin' 			=> __( 'Task Scheduler', 'zero-bs-crm' ),
					'expected_format' 	=> 'html',
					'available_in'	 	=> array(),
					'associated_type' 	=> ZBS_TYPE_TASK,
					'replace_str'		=> '##TASK-BODY##',
					'aliases'			=> array( '###EVENTBODY###' )
				),


			),

			// probably not req. yet:
			/*
			'address',
			'form',
			'segment',
			'log',
			'lineitem',
			'eventreminder',
			'quotetemplate',
			*/

		);

		return $this->placeholders;

	}


	/**
	 * Builds initial list of placeholders using defaults, object-models, custom fields, and filters
	 *
	 * @return array of all placeholders
	 */
	public function build_placeholders( $include_custom_fields = true ){

		global $zbs;

		// any hard-typed defaults
		$placeholders = $this->default_placeholders();

		// load fields from DAL object models
		$placeholders = $this->load_from_object_models( $placeholders, $include_custom_fields );

		// some backward compat tweaks:
		if ( isset( $placeholders['quote']['title'] ) ) $placeholders['quote']['title']['aliases'] = array( '##QUOTE-TITLE##', '##QUOTETITLE##' );
		if ( isset( $placeholders['quote']['value'] ) ) $placeholders['quote']['value']['aliases'] = array( '##QUOTEVALUE##' );
		if ( isset( $placeholders['quote']['date'] ) ) $placeholders['quote']['date']['aliases'] = array( '##QUOTEDATE##' );

		// add setting dependent placeholders
		$placeholders = $this->add_setting_dependent_placeholders( $placeholders );

		// here we fill in any 'available-in' crossovers
		// e.g. you can reference contacts in quotes.
		$placeholders = $this->add_available_in( $placeholders );

		// filter (to allow extensions to ammend)
		$this->placeholders = apply_filters( 'jpcrm_templating_placeholders', $placeholders );

		// return
		return $this->placeholders;

	}


	/**
	 * Add setting-dependent placeholders
	 *
	 * @return array of all placeholders
	 */
	public function add_setting_dependent_placeholders( $placeholders = array() ){

		// remove tooling where inactive modules
		$placeholders = $this->strip_inactive_tooling( $placeholders );

		// if ownership model enabled, add 'owner' fields
		// this is simplistic for now and appears outwardly to only encompasses contacts
		// ... in fact it works for all object types (provided the object is passed to replace_placeholders())
		// as per #1531 this could later be expanded to encompass all objects, perhaps in sites & teams extension
    	$using_ownership = zeroBSCRM_getSetting( 'perusercustomers' );
		if ( $using_ownership ){

			if ( isset( $placeholders['global'] ) ){

				// note, these are auto-populated using the first `owner` field that our replacement function comes across in $replacement_objects
				$placeholders['global']['assigned-to-name'] = array(

					'description' 		=> __( 'Where available, the display name of the WordPress user who owns the object', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'str',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##ASSIGNED-TO-NAME##',
					'aliases'			=> array( '##ASSIGNED-TO-SIGNATURE##' )
				);

				$placeholders['global']['assigned-to-email'] = array(

					'description' 		=> __( 'Where available, the email of the WordPress user who owns the object', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'email',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##ASSIGNED-TO-EMAIL##',
					'aliases'			=> array()
				);

				$placeholders['global']['assigned-to-username'] = array(

					'description' 		=> __( 'Where available, the username of the WordPress user who owns the object', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'email',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##ASSIGNED-TO-USERNAME##',
					'aliases'			=> array()
				);

				$placeholders['global']['assigned-to-mob'] =  array(

					'description' 		=> __( 'Where available, the mobile phone of the WordPress user who owns the object', 'zero-bs-crm' ),
					'origin' 			=> __( 'Global', 'zero-bs-crm' ),
					'expected_format' 	=> 'tel',
					'available_in'	 	=> array(),
					'associated_type' 	=> false,
					'replace_str'		=> '##ASSIGNED-TO-MOB##',
					'aliases'			=> array()
				);


			}

		}


		return $placeholders;

	}


	/**
	 * Remove object types where that module is not active, e.g. invoices
	 * This needs to fire before this->add_available_in in the build queue
	 *
	 * @return array of all placeholders
	 */
	public function strip_inactive_tooling( $placeholders = array() ){

		$setting_map = array(
			'form'             => 'feat_forms',
			'quote'      		=> 'feat_quotes',
			'invoice'        	=> 'feat_invs',
			'event'             => 'feat_calendar',
			'transaction'      	=> 'feat_transactions',
		);

		// make a quick state list for simplicity
		$tooling_states = array();
		foreach ( $setting_map as $tooling_area => $setting_key ){
			
			$tooling_states[ $tooling_area ] = (zeroBSCRM_getSetting( $setting_key ) == "1") ? true : false;


			// remove from placeholder list
			if ( !$tooling_states[ $tooling_area ] && isset( $placeholders[ $tooling_area ] ) ){

				// remove
				unset( $placeholders[ $tooling_area ] );
			}			

		}


		// remove from $available_in_links too
		$available_in = array();
		foreach ( $this->available_in_links as $object_type_key => $tooling_area_array ){

			if ( !isset( $tooling_states[ $object_type_key ] ) || $tooling_states[ $object_type_key ] ){

				$tooling_available = array();

				foreach ( $tooling_area_array as $tooling_area ){

					// add back if not in the list
					if ( !array_key_exists( $tooling_area, $tooling_states) || $tooling_states[ $tooling_area ] ){

						$tooling_available[] = $tooling_area;

					}

				}

				$available_in[ $object_type_key ] = $tooling_available;

			}


		}
		$this->available_in_links = $available_in;

		// return
		return $placeholders;

	}





	/**
	 * Appends to passed placeholder model based on DAL object models
	 * (optionally) including custom fields where applicable
	 *
	 * @param bool include_custom_fields
	 *
	 * @return int count
	 */
	private function load_from_object_models(
		$placeholders, 
		$include_custom_fields = false,
		$excluded_slugs = array(

			// global
			'zbs_site', 'zbs_team', 'zbs_owner', 'id_override', 'parent', 'send_attachments', 'hash',

			// contact
			'alias',

			// quote 
			'template', 'acceptedsigned', 'acceptedip', 

			// invoice
			'pay_via', 'allow_tip', 'allow_partial', 'hash_viewed', 'hash_viewed_count', 'portal_viewed', 'portal_viewed_count', 'pdf_template', 'portal_template', 'email_template', 'invoice_frequency', 'address_to_objtype',

			// event
			'show_on_cal', 'show_on_portal', 'title',

			) 

	){

		global $zbs;

		// retrieve object types
		$object_types = $zbs->DAL->get_object_types_by_index();
		$second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
		if ( empty( $second_address_label ) ) {
			$second_address_label = __( 'Second Address', 'zero-bs-crm' );
		}

		// cycle through them, adding where they have $include_in_templating
		foreach ( $object_types as $object_type_index => $object_type_key ){

			$object_layer = $zbs->DAL->getObjectLayerByType( $object_type_index );
			$object_label = $zbs->DAL->typeStr( $object_type_index );

			// if there is an object layer available, and it's included in templating:
			if ( is_object( $object_layer ) && $object_layer->is_included_in_templating() ){

				// (optionally) include custom field references
				if ( $include_custom_fields ){

					$object_model = $object_layer->objModelIncCustomFields();

				} else {

					$object_model = $object_layer->objModel();

				}

				// cycle through object model & add fields
				foreach ( $object_model as $field_index => $field_info ) {

					// deal with exclusions
					if ( !in_array( $field_index, $excluded_slugs ) ) {

						// catching legacy secondary address contact field issues
						$secondary_address_array = array( 'secaddr1', 'secaddr2', 'seccity', 'seccounty', 'secpostcode', 'seccountry' );
						if ( 'contact' === $object_type_key && in_array( $field_index, $secondary_address_array, true ) ) {
							$field_index = str_replace( 'sec', 'secaddr_', $field_index );
							$new_key     = $object_type_key . '-' . $field_index;
						} else {
							$new_key = str_replace( '_', '-', $object_type_key . '-' . $field_index );
						}

						$expected_format = '';

						// add if not present
						// e.g. $placeholders['contact']['ID']
						if ( !isset( $placeholders[ $object_type_key ][ $new_key ] ) ) {

							// prettify these
							$description = $object_label . ' ' . $field_index;
							switch ( $field_index ) {

								case 'created':
									$description = sprintf( __( 'Date %s was created', 'zero-bs-crm' ), $object_label );
									break;
								case 'lastupdated':
									$description = sprintf( __( 'Date %s was last updated', 'zero-bs-crm' ), $object_label );
									break;
								case 'lastcontacted':
									$description = sprintf( __( 'Date %s was last contacted', 'zero-bs-crm' ), $object_label );
									break;
								case 'tw':
									$description = sprintf( __( 'Twitter handle for %s', 'zero-bs-crm' ), $object_label );
									break;
								case 'li':
									$description = sprintf( __( 'LinkedIn handle for %s', 'zero-bs-crm' ), $object_label );
									break;
								case 'fb':
									$description = sprintf( __( 'Facebook page ID for %s', 'zero-bs-crm' ), $object_label );
									break;
								case 'wpid':
									$description = sprintf( __( 'WordPress ID for %s', 'zero-bs-crm' ), $object_label );
									break;

							}

							if ( isset( $field_info['label'] ) ) {
								$description = $object_label . ' ' . __( $field_info['label'], 'zero-bs-crm' );
							}

							if ( !empty( $field_info['area'] ) && $field_info['area'] == 'Second Address' ) {
								$description .= ' (' . esc_html( $second_address_label ) . ')';
							}

							// if it's a custom field we can infer format (and label):
							if ( isset( $field_info['custom-field'] ) && $field_info['custom-field'] == 1 ) {
								$field_info['format'] = $field_info[0];
								if ( $field_info['format'] === 'date' ) {
									$field_info['format'] = 'uts';
								}
								$description .= ' (' . __( 'Custom Field', 'zero-bs-crm' ) . ')';

							}

							// add {placeholder_model}
							$placeholders[ $object_type_key ][ $new_key ] = array(

								'description'     => $description,
								'origin'          => sprintf( __( '%s object model', 'zero-bs-crm' ), $object_label ),
								'available_in'    => array(),
								'associated_type' => $object_type_index,
								'replace_str'     => '##' . strtoupper( $object_type_key ) . '-' . strtoupper( $field_index ) . '##',
								'expected_format' => $expected_format,

							);

							// trying to future proof, added a few helper attributes:
							if ( isset( $field_info['format'] ) ) {
								$placeholders[ $object_type_key ][ $new_key ]['expected_format'] = $field_info['format'];
								if ( $field_info['format'] === 'uts' && empty( $field_info['autoconvert'] ) ) {
									$placeholders[ $object_type_key ][ $new_key . '_datetime_str' ] = array(

										'description'     => $description . ' (' . __( 'DateTime string', 'zero-bs-crm' ) . ')',
										'origin'          => sprintf( __( '%s object model', 'zero-bs-crm' ), $object_label ),
										'available_in'    => array(),
										'associated_type' => $object_type_index,
										'replace_str'     => '##' . strtoupper( $object_type_key ) . '-' . strtoupper( $field_index ) . '_DATETIME_STR##',
										'expected_format' => 'str',

									);
									$placeholders[ $object_type_key ][ $new_key . '_date_str' ] = array(

										'description'     => $description . ' (' . __( 'Date string', 'zero-bs-crm' ) . ')',
										'origin'          => sprintf( __( '%s object model', 'zero-bs-crm' ), $object_label ),
										'available_in'    => array(),
										'associated_type' => $object_type_index,
										'replace_str'     => '##' . strtoupper( $object_type_key ) . '-' . strtoupper( $field_index ) . '_DATE_STR##',
										'expected_format' => 'str',

									);
								}
							}

						}

					}

				}

			}
		}

		return $placeholders;

	}


	/**
	 * Adds `available_in` links to allow tooling to get all applicable fields
	 * e.g. Contact fields will be available in Quote builder
	 *
	 * @param array $placeholders placeholder array
	 *
	 * @return array $placeholders placeholder array
	 */
	private function add_available_in( $placeholders ){

		// any to add?
		if ( is_array( $this->available_in_links ) ){

			foreach ( $this->available_in_links as $object_type => $tooling_area_array ){

				// $object_type = 'contact', $tooling_area = where to point to
				if ( isset( $placeholders[ $object_type ] ) ){

					foreach ( $placeholders[ $object_type ] as $object_type_placeholder_key => $object_type_placeholder ){

						// setup if not set
						if ( !is_array( $placeholders[ $object_type ][ $object_type_placeholder_key ]['available_in'] ) ){

							$placeholders[ $object_type ][ $object_type_placeholder_key ]['available_in'] = array();

						}

						// add if not present
						foreach ( $tooling_area_array as $tooling_area){

							if ( !in_array( $tooling_area, $placeholders[ $object_type ][ $object_type_placeholder_key ]['available_in'] )){

								$placeholders[ $object_type ][ $object_type_placeholder_key ]['available_in'][] = $tooling_area;

							}

						}

					}

				}

			}

		}

		return $placeholders;

	}

	/**
	 * Returns full list of viable placeholders
	 * 
	 * @param bool separate_categories - return in multi-dim array split out by categories
	 *
	 * @return array of all placeholders
	 */
	public function get_placeholders( $separate_categories = true ){

		global $zbs;

		// if asked to return without categories, do that
		if ( !$separate_categories ){

			$no_cat_list = array();
			foreach ( $this->placeholders as $placeholder_group_key => $placeholder_group ){

				foreach ( $placeholder_group as $placeholder_key => $placeholder ){

					$no_cat_list[ $placeholder['replace_str'] ] = $placeholder;

					// any aliases too
					if ( isset( $placeholder['aliases'] ) && is_array( $placeholder['aliases'] ) ) {

						foreach ( $placeholder['aliases'] as $alias ){

							$no_cat_list[ $alias ] = $placeholder;

						}

					}

				}

			}

			return $no_cat_list;

		}

		return $this->placeholders;

	}


	/**
	 * Returns flattened list of viable placeholders
	 *
	 * @return array of all placeholders
	 */
	public function get_placeholders_shorthand(){

		global $zbs;

		$shorthand_list = array();
		foreach ( $this->placeholders as $placeholder_group_key => $placeholder_group ){

			$placeholder_group_prefix = '';

			// all objtypes basically
			if ( $zbs->DAL->isValidObjTypeID( $zbs->DAL->objTypeID( $placeholder_group_key ) ) ) {

				$placeholder_group_prefix = $placeholder_group_key . '-';

			}

			foreach ( $placeholder_group as $placeholder_key => $placeholder ){

				$shorthand_list[] = '##' . strtoupper( $placeholder_group_prefix . $placeholder_key ) . '##';

				// any aliases too
				if ( isset( $placeholder['aliases'] ) && is_array( $placeholder['aliases'] ) ) {

					foreach ( $placeholder['aliases'] as $alias ){

						$shorthand_list[] = $alias;

					}

				}

			}

		}

		return $shorthand_list;

	}


	/**
	 * Returns list of viable placeholders for specific tooling/area, or group of areas, or object types, e.g. system emails or contact
	 *
	 * @param array|string tooling area, object type, or group of
	 * @param bool hydrate_aliases - if true Aliases will be included as full records
	 * @param bool split_by_category - if true return will be split by category as per get_placeholders
	 *
	 * @return array placeholders
	 */
	public function get_placeholders_for_tooling( $tooling = array('global'), $hydrate_aliases = false, $split_by_category = false ){

		global $zbs;

		$applicable_placeholders = array();

		// we allow array or string input here, so if a string, wrap for below
		if ( is_string( $tooling ) ) $tooling = array( $tooling );

		// for MVP we let this get the whole lot then filter down, if this proves unperformant we could optimise here
		// .. or cache.
		$placeholders = $this->get_placeholders( );

		// cycle through all looking at the `available_in` attribute.
		// alternatively if an object type is passed, it'll return all fields for that type
		if ( is_array( $placeholders ) ){

			foreach ( $placeholders as $placeholder_group_key => $placeholder_group ){

				$placeholder_group_prefix = '';

				// all objtypes basically
				if ( $zbs->DAL->isValidObjTypeID( $zbs->DAL->objTypeID( $placeholder_group_key ) ) ) {

					$placeholder_group_prefix = $placeholder_group_key . '-';

				}

				foreach ( $placeholder_group as $placeholder_key => $placeholder ){

					// if in object type group:
					if ( 
						in_array( $placeholder_group_key, $tooling ) 
						||
						isset( $placeholder['available_in'] ) && count( array_intersect( $tooling, $placeholder['available_in']) ) > 0
					){

						// here we've flattened the array to actual placeholders (no tooling group)
						// so use the placeholder str as key and add original id to array
						$key = '##' . strtoupper( $placeholder_group_prefix . $placeholder_key ) . '##';
						if ( isset( $placeholder['replace_str'] ) ){

							// this overrides if set (will always be the same?)
							$key = $placeholder['replace_str'];

						}

						// if return in categories
						if ( $split_by_category ){

							if ( !isset( $applicable_placeholders[ $placeholder_group_key ] ) || !is_array( $applicable_placeholders[ $placeholder_group_key ] ) ){

								$applicable_placeholders[ $placeholder_group_key ] = array();

							}

							$applicable_placeholders[ $placeholder_group_key ][ $key ] = $placeholder;

							// add original key to arr
							$applicable_placeholders[ $placeholder_group_key ][ $key ]['key'] =  $placeholder_key;

						} else {

							$applicable_placeholders[ $key ] = $placeholder;

							// add original key to arr
							$applicable_placeholders[ $key ]['key'] =  $placeholder_key;

						}

						// aliases
						if ( $hydrate_aliases && isset( $placeholder['aliases'] ) && is_array( $placeholder['aliases'] ) ) {

							foreach ( $placeholder['aliases'] as $alias ){

								// if return in categories
								if ( $split_by_category ){

									$applicable_placeholders[ $placeholder_group_key ][ $alias ] = $placeholder;

								} else {

									$applicable_placeholders[ $alias ] = $placeholder;

								}

							}

						}

					}

				}

			}


		}

		return $applicable_placeholders;

	}



	/**
	 * Returns a single placeholder info array based on a key
	 *
	 * @param string placeholder key
	 *
	 * @return array placeholder info
	 */
	public function get_single_placeholder_info( $placeholder = '' ){

		// cycle through placeholders and return our match
		foreach ( $this->placeholders as $placeholder_area => $placeholders ){

			foreach ( $placeholders as $key => $placeholder_info ){

				if ( $key == $placeholder ){

					return $placeholder_info;

				}

			}

		}

		return false;

	}

	/*
	* Returns a template-friendly placeholder array of generic replacements
	*/
	public function get_generic_replacements(){

		global $zbs;
		
		// vars
		$login_url      = admin_url( 'admin.php?page=' . $zbs->slugs['dash'] );
		$portal_url     = zeroBS_portal_link();
		$biz_name       = zeroBSCRM_getSetting( 'businessname' );
		$biz_your_name  = zeroBSCRM_getSetting( 'businessyourname' );
		$biz_your_email = zeroBSCRM_getSetting( 'businessyouremail' );
		$biz_your_url   = zeroBSCRM_getSetting( 'businessyoururl' );
		$biz_extra      = zeroBSCRM_getSetting( 'businessextra' );
		$biz_info       = zeroBSCRM_invoicing_generateInvPart_bizTable(
			array(
				'zbs_biz_name'      => $biz_name,
				'zbs_biz_yourname'  => $biz_your_name,
				'zbs_biz_extra'     => $biz_extra,
				'zbs_biz_youremail' => $biz_your_email,
				'zbs_biz_yoururl'   => $biz_your_url,
				'template'          => 'pdf',
			)
		);
		$social_links   = show_social_links();
		
		// return
		return array(

			// login
			'login-link'		=> '<a href="' . $login_url . '">' . __( 'Go to CRM', 'zero-bs-crm' ) . '</a>',
			'login-button'    	=> '<div style="text-align:center;margin:1em;margin-top:2em">'.zeroBSCRM_mailTemplate_emailSafeButton( $login_url, __( 'Go to CRM', 'zero-bs-crm' ) ).'</div>',
			'login-url'         => $login_url,

			// portal
			'portal-link'       => '<a href="' . $portal_url . '">' . $portal_url . '</a>',
			'portal-button'     => '<div style="text-align:center;margin:1em;margin-top:2em">'.zeroBSCRM_mailTemplate_emailSafeButton( $portal_url, __( 'View Portal', 'zero-bs-crm' ) ).'</div>',
			'portal-url'        => $portal_url,

			// biz stuff
			'biz-name'        => $biz_name,
			'biz-your-name'   => $biz_your_name,
			'biz-your-email'  => $biz_your_email,
			'biz-your-url'    => $biz_your_url,
			'biz-info'        => $biz_info,
			'biz-extra'       => $biz_extra,
			'biz-logo'        => jpcrm_business_logo_img( '150px' ),

			// general
			'powered-by'		=> zeroBSCRM_mailTemplate_poweredByHTML(),
			'email-from-name'	=> zeroBSCRM_mailDelivery_defaultFromname(),
			'password'			=> '<a href="' . wp_lostpassword_url() . '" title="' . __( 'Lost Password', 'zero-bs-crm' ) . '">'. __('Set Your Password', 'zero-bs-crm').'</a>',

			// social
			'social-links'    => $social_links,
		);

	}

	/**
	 * Enacts single string replacement on a passed string based on passed tooling/areas
	 * Note: It's recommended to use this function even though str_replace would be approximate
	 * - Using this accounts for multiple aliases, e.g. ###MSG-CONTENT### and ##MSG-CONTENT##, and keeps things centralised
	 *
	 * @param string string of placeholder to replace, e.g. 'msg-content'
	 * @param string string to apply replacements to
	 * @param string string to replace placeholder with
	 *
	 * @return string modified string
	 */
	public function replace_single_placeholder( $placeholder_key = '', $replace_with = '', $string = ''  ){

		// get info
		$placeholder_info = $this->get_single_placeholder_info( $placeholder_key );

		// exists?
		if ( is_array( $placeholder_info ) ) {

			// auto-gen
			$main_placeholder_key = $this->make_placeholder_str( $placeholder_key );
			
			// if replace_str is set, use that
			if ( isset( $placeholder_info['replace_str'] ) ){

				$main_placeholder_key = $placeholder_info['replace_str'];

			}

			// replace any and all variants (e.g. aliases)
			// we do these first, as often in our case the variants are backward-compat
			// and so `###BIZ-INFO###` needs replacing before `##BIZ-INFO##`
			if ( isset( $placeholder_info['aliases'] ) && is_array( $placeholder_info['aliases'] ) ){
			
				$string = str_replace( $placeholder_info['aliases'], $replace_with, $string );
			
			}

			// replace
			$string = str_replace( $main_placeholder_key, $replace_with, $string );


		} else {

			// not in index, replace requested placeholder:
			$string = str_replace( $this->make_placeholder_str( $placeholder_key ), $replace_with, $string );

		}
		
		return $string;

	}


	/**
	 * Enacts replacements on a string based on passed tooling/areas
	 * Note: Using this method allows non-passed values to be emptied,
	 * e.g. if 'global' tooling method, and no 'unsub-line' value passed, 
	 * any mentions of '##UNSUB-LINE##' will be taken out of $string
	 *
	 * @param array|string tooling - tooling area, object type, or group of
	 * @param string string - to apply replacements to
	 * @param array replacements - array of replacement values
	 * @param array|false replacement_objects - an array of objects to replace fields from (e.g. contact) Should be keyed by object type, in the format array[ZBS_TYPE_CONTACT] = contact array
	 * @param bool retain_unset_placeholders - bool whether or not to retain empty-valued placeholders (e.g. true = leaves ##BIZ-LOGO## in string if no value for 'biz-logo')
	 *
	 * @return string modified string
	 */
	public function replace_placeholders( 

		$tooling = array( 'global' ),
		$string = '',
		$replacements = array(),
		$replacement_objects = false,
		$retain_unset_placeholders = false,
		$keys_staying_unrendered = array()

	) {

		// retrieve replacements for this tooling
		$to_replace = $this->get_placeholders_for_tooling( $tooling );

		// cycle through replacements and replace where possible
		if ( is_array( $to_replace ) ) {

			foreach ( $to_replace as $replace_string => $replacement_info ) {

				// ##BIZ-STATE## -> biz-state
				$key = str_replace( '#', '', strtolower( $replace_string ) );
				if ( isset( $replacement_info['key'] ) && !empty( $replacement_info['key'] ) ) {

					$key = $replacement_info['key'];

				}

				// attempt to find value in $replacements
				$replace_with = ''; 
				if ( isset( $replacements[ $key ] ) ) {

					$replace_with = $replacements[ $key ];

				}

				// attempt to find value in $replacement_objects
				// ... if $replacements[value] not already set (that overrides)
				// here $key will be 'contact-prefix'
				// .. which would map to $replacement_objects[ZBS_TYPE_CONTACT]['prefix']
				if ( empty( $replace_with ) ){

					// attempt to pluck relative value
					$potential_value = $this->pick_from_replacement_objects( $key, $replacement_objects );

					if ( !empty( $potential_value ) ) {

						$replace_with = $potential_value;

					}

				}

				// if $key is 'assigned-to-name', 'assigned-to-email', 'assigned-to-mob'  - seek out an owner.
				// ... if $replacements[assigned-to-name] not already set (that overrides)
				if ( empty( $replace_with ) && in_array( $key, array( 'assigned-to-name', 'assigned-to-email', 'assigned-to-username', 'assigned-to-mob' ) ) && is_array( $replacement_objects ) ){

					$owner_value = '';
					$owner_info = $this->owner_from_replacement_objects( $replacement_objects );

					if ( $owner_info ){

						switch ( $key ){

							case 'assigned-to-name':
								$owner_value = $owner_info->display_name;
								break;
							case 'assigned-to-username':
								$owner_value = $owner_info->user_login;
								break;
							case 'assigned-to-email':
								$owner_value = $owner_info->user_email;
								break;
							case 'assigned-to-mob':
								$owner_value = zeroBS_getWPUsersMobile($owner_info->ID);
								break;

						}

						// got value?
						if ( !empty( $owner_value ) ) {

							$replace_with = $owner_value;

						}

					}

				}

				// replace (if not empty + retain_unset_placeholders)
				if ( !$retain_unset_placeholders || ( $retain_unset_placeholders && !empty( $replace_with ) ) ){

					// here we hit a problem, we've been wild with our ### use, so now we
					// have a mixture of ## and ### references.
					// ... wherever we have ### we must replace them first,
					// ... to avoid ###A### being pre-replaced by ##A##
					// for now, replacing aliases first solves this.

					// aliases
					if ( isset( $replacement_info['aliases'] ) && is_array( $replacement_info['aliases'] ) ){
					
						$string = str_replace( $replacement_info['aliases'], $replace_with, $string );
					
					}

					// If this is a Quote date key and is not set (Quote accepted or last viewed), let's print out a message saying the quote isn't accepted or viewed.
					if (
						in_array( $key, array( 'quote-accepted', 'quote-lastviewed' ), true ) &&
						! in_array( $replacement_info['key'], $keys_staying_unrendered, true ) &&
						( empty( $replace_with ) || jpcrm_date_str_to_uts( $replace_with ) === 0 )
						) {

						if ( $key === 'quote-accepted' ) {
							$replace_with = __( 'Quote not yet accepted', 'zero-bs-crm' );
							$string       = str_replace( '##QUOTE-ACCEPTED_DATETIME_STR##', $replace_with, $string );
							$string       = str_replace( '##QUOTE-ACCEPTED_DATE_STR##', $replace_with, $string );
						} else {
							$replace_with = __( 'Quote not yet viewed', 'zero-bs-crm' );
							$string       = str_replace( '##QUOTE-LASTVIEWED_DATETIME_STR##', $replace_with, $string );
							$string       = str_replace( '##QUOTE-LASTVIEWED_DATE_STR##', $replace_with, $string );
						}
					}

					// Replace main key.
					if ( empty( $keys_staying_unrendered ) || ! in_array( $replacement_info['key'], $keys_staying_unrendered, true ) ) {

						$string = str_replace( $replace_string, $replace_with, $string );

					}
				}

			}

		}

		return $string;

	}



	/**
	 * Takes an array of replacement_objects and a target string
	 * ... and returns a value if it can pick one from replacement_objects
	 * ... e.g. target_string = 'contact-fname'
	 * ... 		=
	 * ... 		replacement_objects[ZBS_TYPE_CONTACT]['fname']
	 *
	 * @param string target string e.g. `contact-fname`
	 * @param array|bool replacement objects, keyed to object type - (e.g. contact) Should be in the format array[ZBS_TYPE_CONTACT] = contact array
	 *
	 * @return string valid placeholder string
	 */
	private function pick_from_replacement_objects( $target_string = '', $replacement_objects = array() ) {

		global $zbs;

		// got string and replacement objects?
		if ( !empty( $target_string ) && is_array( $replacement_objects ) && count( $replacement_objects ) > 0 ) {

			// retrieve object-type from $target_string (where possible)
			$target_exploded = explode( '-', $target_string, 2 );
			if ( is_array( $target_exploded ) && count( $target_exploded ) > 1 ) {

				// convert `contact` to ZBS_TYPE_CONTACT (1)
				$object_type_id = $zbs->DAL->objTypeID( $target_exploded[0] );

				// validate obj type id and check if it's passed in replacement_objects
				if ( $zbs->DAL->isValidObjTypeID( $object_type_id ) && isset( $replacement_objects[ $object_type_id ] ) ) {

					// at this point we turn `contact-fname` into `fname` and we pluck it from `$replacement_objects[ ZBS_TYPE_CONTACT ]['fname']` if it's set
					array_shift( $target_exploded );
					$field_name = strtolower( $target_exploded[0] );

					if ( isset( $replacement_objects[ $object_type_id ][ $field_name ] ) && !empty( $replacement_objects[ $object_type_id ][ $field_name ] ) ) {

						// successful find
						return $replacement_objects[ $object_type_id ][ $field_name ];

					}

					// check for potential fallback fields

					if ( preg_match( '/_datetime_str$/', $field_name ) ) {

						$potential_uts_field = str_replace( '_datetime_str', '', $field_name );
						if ( isset( $replacement_objects[ $object_type_id ][ $potential_uts_field ] ) ) {
							$potential_uts_value = $replacement_objects[ $object_type_id ][ $potential_uts_field ];
							if ( jpcrm_is_int( $potential_uts_value ) ) {
								return jpcrm_uts_to_datetime_str( $potential_uts_value );
							} else {
								// use original value as fallback
								return $potential_uts_value;
							}
						}

					} elseif ( preg_match( '/_date_str$/', $field_name ) ) {

						$potential_uts_field = str_replace( '_date_str', '', $field_name );
						if ( isset( $replacement_objects[ $object_type_id ][ $potential_uts_field ] ) ) {
							$potential_uts_value = $replacement_objects[ $object_type_id ][ $potential_uts_field ];
							if ( jpcrm_is_int( $potential_uts_value ) ) {
								return jpcrm_uts_to_date_str( $potential_uts_value );
							} else {
								// use original value as fallback
								return $potential_uts_value;
							}
						}

					}

				}

			}

		}

		return false;

	}


	/**
	 * Takes an array of replacement_objects and returns WordPress user info 
	 * for the first owner it finds in $replacement_objects
	 *
	 * @param array|bool replacement objects, keyed to object type - (e.g. contact) Should be in the format array[ZBS_TYPE_CONTACT] = contact array
	 *
	 * @return string WordPress user info (get_userdata)
	 */
	private function owner_from_replacement_objects( $replacement_objects = array() ){

		// got string and replacement objects?
		if ( is_array( $replacement_objects ) && count( $replacement_objects ) > 0 ) { 

			foreach ( $replacement_objects as $replacement_obj_type => $replacement_object){

				// is `owner` set?
				if ( isset( $replacement_object['owner'] ) && !empty( $replacement_object['owner'] ) ){

					// one of the passed replacement objects has an owner... first passed first served						
					$user_info = get_userdata($replacement_object['owner']);

					if ( $user_info !== false){

						return $user_info;

					}

				}

			}

		}

		return false;

	}

					


	/**
	 * Takes a key (e.g. msg-content) and returns in valid placeholder
	 * format. (e.g. ##MSG-CONTENT##)
	 *
	 * @param string placeholder key
	 *
	 * @return string valid placeholder string
	 */
	public function make_placeholder_str( $placeholder_key = '' ){

		return '##' . str_replace( '_', '-', trim( strtoupper( $placeholder_key ) ) ) . '##';

	}
		


	/**
	 * Draws WYSIWYG Typeahead (Bloodhound JS)
	 *
	 * @param string select - HTML ID to give to the placeholder select
	 * @param string insert_target_id - HTML ID which the placeholder should insert into when a placeholder is selected
	 * @param array|string tooling - placeholder array of tooling areas to include, if 'all' string passed, all placeholders will be shown
	 * @param array return - return or echo?
	 *
	 * @return string valid placeholder string
	 */
	public function placeholder_selector( $id = '', $insert_target_id = '', $tooling = array('global'), $return = false, $extra_classes = '' ){

		$placeholder_list = array();

		// Simpler <select>
		if ( is_array( $tooling ) ){

			// retrieve placeholder list (divided by category)
			$placeholder_list = $this->get_placeholders_for_tooling( $tooling, false, true );

		} else {

			// retrieve placeholder list (divided by category)
			$placeholder_list = $this->get_placeholders( true );

		}

		$html = '<div class="jpcrm-placeholder-select-wrap '.$extra_classes.'">';
		$html .= '<select id="' . $id .'" data-target="' . $insert_target_id . '" class="jpcrm-placeholder-select ui compact selection dropdown">';

			// blank option
			$html .= '<option value="-1">' . __( 'Insert Placeholder', 'zero-bs-crm' ) . '</option>';
			$html .= '<option value="-1" disabled="disabled">====================</option>';

			// cycle through categories of placeholders:
			if ( is_array( $placeholder_list ) && count( $placeholder_list ) > 0 ){

				foreach ( $placeholder_list as $placeholder_group_key => $placeholder_group ){

					$html .= '<optgroup label="' . ucwords( $placeholder_group_key ) . '">';
   
					foreach ( $placeholder_group as $placeholder_key => $placeholder_info ){

						// value
						// if no replace_str attr...
						$placeholder_str = $this->make_placeholder_str( $placeholder_group_key . '-' . $placeholder_key );
						if ( isset( $placeholder_info['replace_str'] ) ){

							$placeholder_str = $placeholder_info['replace_str'];

						}

						// label
						$placeholder_label = ( isset( $placeholder_info['description'] ) && !empty( $placeholder_info['description'] ) ) ? $placeholder_info['description'] . ' (' . $placeholder_str .')' : $placeholder_str;

						$html .= '<option value="' . $placeholder_str . '">' . $placeholder_label . '</option>';


					}

   					$html .= '</optgroup>';

				}


			} else {

				$html .= '<option value="-1">' . __( 'No Placeholders Available', 'zero-bs-crm' ) . '</option>';

			}


		$html .= '</select><i class="code icon"></i></div>';


		if ( !$return ){

			echo $html;

		}

		return $html;

	}


	/**
	 * Collates and tidies the full output of placeholders into a simpler array (for placeholder selector typeahead primarily)
	 * 
	 * @param array placeholders - array of placeholders, probably from $this->get_placeholders or $this->get_placeholders_for_tooling (Note this requires non-categorised array)
	 *
	 * @return array placeholders - simplified array
	 */
	public function simplify_placeholders( $placeholders = array() ){

		$return = array();

		// cycle through and simplify
		foreach ( $placeholders as $key => $info ){

			$placeholder = $info;

			// unset non-key
			unset( $placeholder['available_in'], $placeholder['associated_type'] );

			// if return_str not set and key is, add it
			if ( !isset( $placeholder['replace_str'] ) ){

				$placeholder['replace_str'] = $key;

			}

			$return[] = $placeholder;


		}

		return $return;

	}


	/**
	 * Collates and tidies the full output of placeholders into a simpler array (designed for wysiwyg select insert - e.g. quotebuilder)
	 *
	 * @param array placeholders - array of placeholders, probably from $this->get_placeholders or $this->get_placeholders_for_tooling (Note this requires non-categorised array)
	 *
	 * @return array placeholders - simplified array (array[{text:desc,value:placeholder}])
	 */
	public function simplify_placeholders_for_wysiwyg( $placeholders = array() ){

		$return = array();

		// cycle through and simplify
		foreach ( $placeholders as $placeholder_key => $placeholder_info ){

			// label
			$placeholder_label = ( isset( $placeholder_info['description'] ) && !empty( $placeholder_info['description'] ) ) ? $placeholder_info['description'] . ' (' . $placeholder_key .')' : $placeholder_key;


			$return[] = array( 'text' => $placeholder_label, 'value' => $placeholder_key);


		}

		return $return;

	}
}
