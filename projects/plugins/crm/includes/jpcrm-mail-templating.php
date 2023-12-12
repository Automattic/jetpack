<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2.5
 *
 * Copyright 2020 Automattic
 *
 * Date: 09/01/2017
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */




function zeroBSCRM_mailTemplate_processEmailHTML($content){
	global $zbs;
	//acceptable html here is a bit flawed as it needs to be specifically done otherwise it will strip a <b>
	//inside a <p> if not defined carefully, better to just do wp_kses_post()
	//https://codex.wordpress.org/Function_Reference/wp_kses_post also sanitizes.
	$content = wp_kses_post($content);
	return $content;
}

function zeroBSCRM_mailTemplate_emailPreview($templateID=-1){

	global $zbs;

	$html = ''; $bodyHTML = '';

	if ( $templateID > 0 ){

		// retrieve template
		$html = jpcrm_retrieve_template( 'emails/default-email.html', false );
		$message_content = zeroBSCRM_mailTemplate_get($templateID);
		if (isset($message_content->zbsmail_body)) $bodyHTML = $message_content->zbsmail_body;

		// load templater
        $placeholder_templating = $zbs->get_templating();

		// build replacements array
		// ... start with generic replaces (e.g. loginlink, loginbutton)
    	$replacements = $placeholder_templating->get_generic_replacements();


		if (isset($message_content->zbsmail_body)) $bodyHTML = $message_content->zbsmail_body;	
		
		// preview sublne
		$subLine = __("This is a <b>Jetpack CRM email template preview</b><br/><em>This footer text is not shown in live emails</em>.",'zero-bs-crm');
		$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $html );

		$replacements['unsub-line'] = $subLine;
		$replacements['powered-by'] = zeroBSCRM_mailTemplate_poweredByHTML();
		$replacements['email-from-name'] = zeroBSCRM_mailDelivery_defaultFromname();

		//process the template specific ##PLACEHOLDER## to actual viewable stuff...
		if ( $templateID == 1 ){
			
			// client portal

			// Replace some common ones with generic examples too:
			$replacements['email'] = 'your.user@email.com';
			$replacements['login-url'] = site_url('clients/login');


			//echo 'rep:<pre>'.print_r($replacements,1).'</pre>'; exit();
	        // replace vars
	        $html = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), $html, $replacements );


		}

		if ( $templateID == 2 ){

			// quote accepted
			$replacements['quote-title'] = __('Example Quotation #101','zero-bs-crm');
			$replacements['quote-url'] = site_url('clients/login');
			$replacements['quote-edit-url'] = admin_url();

	        // replace vars
	        $html = $placeholder_templating->replace_placeholders( array( 'global', 'quote', 'contact' ), $html, $replacements );


		}

		if ( $templateID == 3 ){

			//invoice template

			$i=0;

			$logoURL = '';
			##WLREMOVE
			$logoURL = $zbs->urls['crm-logo'];
			##/WLREMOVE


			$tableHeaders = '';

				$zbsInvoiceHorQ = 'quantity';

				if($zbsInvoiceHorQ == 'quantity'){ 
				
					$tableHeaders = '<th class="left">'.__("Description",'zero-bs-crm').'</th><th>'.__("Quantity",'zero-bs-crm').'</th><th>'.__("Price",'zero-bs-crm').'</th><th>'.__("Total",'zero-bs-crm').'</th>';

				}else{ 

					$tableHeaders = '<th class="left">'.__("Description",'zero-bs-crm').'</th><th>'.__("Hours",'zero-bs-crm').'</th><th>'.__("Rate",'zero-bs-crm').'</th><th>'.__("Total",'zero-bs-crm').'</th>';

				}

			$lineItems = "";
			$lineItems .= 
			'<tbody class="zbs-item-block" data-tableid="'.$i.'" id="tblock'.$i.'">
					<tr class="top-row">
						<td style="width:70%">'.__('Your Invoice Item','zero-bs-crm').'</td>
						<td style="width:7.5%;text-align:center;" rowspan="3" class="cen">10</td>
						<td style="width:7.5%;text-align:center;" rowspan="3"class="cen">$20</td>
						<td style="width:7.5%;text-align:right;" rowspan="3" class="row-amount">$200</td>
					</tr>
					<tr class="bottom-row">
						<td colspan="4" class="tapad">'.__('Your invoice item description goes here','zero-bs-crm').'</td>     
					</tr>
					<tr class="add-row"></tr>
			</tbody>';  


			$replacements['title'] = __('Invoice Template','zero-bs-crm');
			$replacements['invoice-title'] = __('Invoice','zero-bs-crm');
			$replacements['logo-url'] = esc_url( $logoURL );

			$invNoStr = "101";
			$invDateStr = "01/01/3001";
			$ref = "ABC";
			$dueDateStr = "01/01/3001";

			$totalsTable = "";

			$bizInfoTable = "";
			##WLREMOVE
			$bizInfoTable = '<div style="text-align:right"><b>John Doe</b><br/>' . __( 'This is replaced<br>with the contacts details<br>from their profile.', 'zero-bs-crm' ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase	
			##/WLREMOVE

			$replacements['invoice-number'] = $invNoStr;
			$replacements['invoice-date'] = $invDateStr;
			$replacements['invoice-ref'] = $ref;
			$replacements['invoice-due-date'] = $dueDateStr;
			$replacements['invoice-table-headers'] = $tableHeaders;
			$replacements['invoice-line-items'] = $lineItems;
			$replacements['invoice-totals-table'] = $totalsTable;
			$replacements['biz-info'] = $bizInfoTable;

			$viewInPortal = '';
			$invoiceID = '';

			// got portal?
			//if (isset($invsettings['feat_portal']) && !empty($invsettings['feat_portal'])){
			if (zeroBSCRM_isExtensionInstalled('portal')){

				// view on portal (hashed?)
				$viewInPortalURL = zeroBSCRM_portal_linkObj($invoiceID,ZBS_TYPE_INVOICE); //zeroBS_portal_link('invoices',$invoiceID);

				// if viewing in portal?
				$viewInPortal = '<div style="text-align:center;margin:1em;margin-top:2em">'.zeroBSCRM_mailTemplate_emailSafeButton($viewInPortalURL,__('View Invoice','zero-bs-crm')).'</div>';

			}

			// view in portal?
			$replacements['portal-view-button'] = $viewInPortal;

			// replace vars
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'invoice', 'contact', 'company' ), $html, $replacements );


		}

		// new proposal
		if ( $templateID == 4 ){

			$replacements['quote-title'] = __('Example Quotation #101','zero-bs-crm');
			$replacements['quote-url'] = site_url('clients/login');

			$viewInPortal = '';
			$quoteID = '';

			// got portal?
			//if (isset($invsettings['feat_portal']) && !empty($invsettings['feat_portal'])){
			if (zeroBSCRM_isExtensionInstalled('portal')){

				// view on portal (hashed?)
				$viewInPortalURL = zeroBSCRM_portal_linkObj($quoteID,ZBS_TYPE_QUOTE);

				// if viewing in portal?
				$viewInPortal = '<div style="text-align:center;margin:1em;margin-top:2em">'.zeroBSCRM_mailTemplate_emailSafeButton($viewInPortalURL,__('View Proposal','zero-bs-crm')).'</div>';

			}

			// view in portal?
			$replacements['portal-view-button'] = $viewInPortal;

			// replace vars
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'quote', 'contact' ), $html, $replacements );
		}


		// task
		if ( $templateID == 5 ){

			$replacements['task-title']       = __( 'Example Task #101', 'zero-bs-crm' );
			$replacements['task-link']        = '<div style="text-align:center;margin:1em;margin-top:2em">' . zeroBSCRM_mailTemplate_emailSafeButton( admin_url(), __( 'View Task', 'zero-bs-crm' ) ) . '</div>';
			$replacements['contact-fname']    = __( 'First-Name', 'zero-bs-crm' );
			$replacements['contact-lname']    = __( 'Last-Name', 'zero-bs-crm' );
			$replacements['contact-fullname'] = __( 'Full-Name', 'zero-bs-crm' );

	        // replace vars
	        $html = $placeholder_templating->replace_placeholders( array( 'global', 'event' ), $html, $replacements );

		}


		// Your Client Portal Password
		if ( $templateID == 6 ){

			$replacements['password'] = '********';
			$replacements['email'] = 'your.user@email.com';

	        // replace vars
	        $html = $placeholder_templating->replace_placeholders( array( 'global' ), $html, $replacements );

		}

		// Your Statement
		if ( $templateID == 7 ){

	        // replace vars
	        $html = $placeholder_templating->replace_placeholders( array( 'global' ), $html, $replacements );

		}


	} 


	return $html;

}


// Check if attempting to preview email template
function zeroBSCRM_preview_email_template(){

	global $zbs;

	// if trying to preview
	if (isset($_GET['zbsmail-template-preview']) && $_GET['zbsmail-template-preview'] == 1){
  		
  		// if rights
  		if ( current_user_can( 'admin_zerobs_manage_options' ) ) {  

			$html = '';

			if (isset( $_GET['template_id'] ) && !empty( $_GET['template_id'] ) ){

				$templateID = (int)sanitize_text_field( $_GET['template_id'] );
				echo zeroBSCRM_mailTemplate_emailPreview($templateID);

			} else {

				// load templater
			    $placeholder_templating = $zbs->get_templating();

				// retrieve template
				$html = jpcrm_retrieve_template( 'emails/default-email.html', false );

				$message_content = '';
				$unsub_line = '';

				##WLREMOVE##
				$message_content = "<h3 style='text-align:center;text-transform:uppercase'>Welcome to Jetpack CRM Email Templates</h3>";
				$unsub_line = __("Thanks for using Jetpack CRM",'zero-bs-crm'); 
				##/WLREMOVE##

				$message_content .= "<div style='text-align:center'>" . __("This is example content for the email template preview. <p>This content will be replaced by what you have in your system email templates</p>", 'zero-bs-crm') . "</div>"; 

				// replacements
				echo $placeholder_templating->replace_placeholders( array(  'global', 'invoice' ), $html, array(

						'title' 			=> esc_html__('Template Preview','zero-bs-crm'),
						'msg-content'		=> $message_content,
						'unsub-line'		=> esc_html( $unsub_line ),
						'powered-by'		=> zeroBSCRM_mailTemplate_poweredByHTML(),
						'email-from-name'	=> esc_html( zeroBSCRM_mailDelivery_defaultFromname() )

				));

	    	}

			die();

		}
	}
} add_action('init','zeroBSCRM_preview_email_template');



/* ===========================================================
	ZBS Templating - Load Default Templates / Restore Default 
   ========================================================== 
	Noting here that although zeroBSCRM_mail_retrieveWrapTemplate has been deprecated (4.5.0), 
	This one is not, the thinking being these are used to load specific email bodies which (as of now)
	are loaded into the DB via zeroBSCRM_populateEmailTemplateList() and then edited via UI
	...so there is probably no need to move these out of UI into templated files.
 */
function zeroBSCRM_mail_retrieveDefaultBodyTemplate($template='maintemplate'){

	$templatedHTML = ''; 

	if (function_exists('file_get_contents')){

		#} templates
		$acceptableTemplates = array( 'maintemplate', 'clientportal', 'invoicesent', 'quoteaccepted', 'quotesent', 'tasknotification', 'clientportalpwreset', 'invoicestatementsent' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		if (in_array($template, $acceptableTemplates)){

				// 2.98.6+ translated. maintemplate was a misnomer
				if ($template == 'maintemplate') $template = 'email-body';

		            try {

		            	#} Build from default template - see the useful - http://www.leemunroe.com/responsive-html-email-template/
		                $templatedHTML = file_get_contents(ZEROBSCRM_PATH.'html/templates/'.$template.'.html');


		            } catch (Exception $e){

		                #} Nada 

		            }

		}

	}

	return $templatedHTML;
}

// v2.98.6 - change default from /html/notifications/email-default/ to /html/templates/_responsivewrap.html
// v4.5.0 - deprecated in favour of core variant
function zeroBSCRM_mail_retrieveWrapTemplate( $template = 'default' ) {

	zeroBSCRM_DEPRECATEDMSG( 'zeroBSCRM_mail_retrieveWrapTemplate was deprecated in v4.5.0, please use the core function retrieve_template' );

	return '';

}



/* ======================================================
	/ ZBS Templating - Load Initial HTML
   ====================================================== */

/* ======================================================
	ZBS Quotes - Generate HTML (notification emails)
   ====================================================== */

function zeroBSCRM_quote_generateNotificationHTML( $quoteID = -1, $return = true ) {

	global $zbs;

	if ( !empty( $quoteID ) ) {
		$quote_contact_id = $zbs->DAL->quotes->getQuoteContactID( $quoteID );
		$quote_contact = $zbs->DAL->contacts->getContact( $quote_contact_id );
		$html = '';
		$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// retrieve template
		$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

		// Act
		if ( !empty( $templatedHTML ) ) {

			// Actual body:
			$bodyHTML = '';

			// load templater
			$placeholder_templating = $zbs->get_templating();

			// get initial replacements arr
			$replacements = $placeholder_templating->get_generic_replacements();

			// Retrieve quote (for title + URL)
			$quote = zeroBS_getQuote( $quoteID, true );

			if ( isset( $quote ) && is_array( $quote ) ) {

				$proposalTitle = '';
				if ( !empty( $quote['title'] ) ) {
					$proposalTitle = $quote['title'];
				}

				// vars
				$zbs_biz_name = zeroBSCRM_getSetting( 'businessname' );
				$zbs_biz_yourname = zeroBSCRM_getSetting( 'businessyourname' );
				$zbs_biz_extra = zeroBSCRM_getSetting( 'businessextra' );
				$zbs_biz_youremail = zeroBSCRM_getSetting( 'businessyouremail' );
				$zbs_biz_yoururl = zeroBSCRM_getSetting( 'businessyoururl' );
				$zbs_settings_slug = admin_url( 'admin.php?page=' . $zbs->slugs['settings'] ) . '&tab=quotes';
				$quote_url = zeroBSCRM_portal_linkObj( $quoteID, ZBS_TYPE_QUOTE );
				$proposalEmailTitle = __( 'Proposal Notification', 'zero-bs-crm' );

				// build content
				$message_content = zeroBSCRM_mailTemplate_get( ZBSEMAIL_NEWQUOTE );
				$bodyHTML = $message_content->zbsmail_body;

				// replacements $bodyHTML
				$replacements['quote-url'] = $quote_url;
				$replacements['quote-title'] = $proposalTitle;
				$replacements['quote-value'] = $quote['value'] ? zeroBSCRM_formatCurrency( $quote['value'] ) : '';

				$viewInPortal = '';
				$quoteID = '';
				// got portal?
				if ( zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
					// view on portal (hashed?)
					$viewInPortalURL = zeroBSCRM_portal_linkObj( $quoteID, ZBS_TYPE_QUOTE );
					// if viewing in portal?
					$viewInPortal = '<div style="text-align:center;margin:1em;margin-top:2em">' . zeroBSCRM_mailTemplate_emailSafeButton( $viewInPortalURL, __( 'View Proposal', 'zero-bs-crm' ) ) . '</div>';
				}
				// view in portal?
				$replacements['portal-view-button'] = $viewInPortal;

				// build msg-content html
				$bodyHTML = $placeholder_templating->replace_placeholders( array( 'global', 'quote', 'contact' ), $bodyHTML, $replacements, array( ZBS_TYPE_QUOTE => $quote, ZBS_TYPE_CONTACT => $quote_contact ) );

				// For now, use this, ripped from invoices:
				// (We need to centralise)
				$bizInfoTable = '<table class="table zbs-table" style="width:100%;">';
				$bizInfoTable .= '<tbody>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;"><strong>' . $zbs_biz_name . '</strong></td></tr>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_yourname . '</td></tr>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_extra . '</td></tr>';
				$bizInfoTable .= '</tbody>';
				$bizInfoTable .= '</table>';

				// phony - needs unsub
				$unsub_line = __( 'You have received this notification because a proposal has been sent to you', 'zero-bs-crm' );
				if ( isset( $zbs_biz_name ) && !empty( $zbs_biz_name ) ) {
					$unsub_line .= ' by ' . $zbs_biz_name;
				}
				$unsub_line .= '. ' . __( 'If you believe this was sent in error, please reply and let us know.', 'zero-bs-crm' );

				// build body html
				$replacements = $placeholder_templating->get_generic_replacements();
				$replacements['title'] = $proposalEmailTitle;
				$replacements['msg-content'] = $bodyHTML;
				$replacements['unsub-line'] = $unsub_line;
				$replacements['biz-info'] = $bizInfoTable;

				$settings = $zbs->settings->getAll();
				if ( $settings['currency'] && $settings['currency']['strval'] ) {
					$replacements['quote-currency'] = $settings['currency']['strval'];
				}
				$html = $placeholder_templating->replace_placeholders( array( 'global', 'quote' ), $templatedHTML, $replacements );

			}

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;

	}
	// FAIL
	return;
}


#} sent to quote creator
function zeroBSCRM_quote_generateAcceptNotifHTML( $quoteID = -1, $quoteSignedBy = '', $return = true ) {

	global $zbs;

	if ( !empty( $quoteID ) ) {
		$quote_contact_id = $zbs->DAL->quotes->getQuoteContactID( $quoteID );
		$quote_contact = $zbs->DAL->contacts->getContact( $quote_contact_id );

		$html = '';
		$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// retrieve template
		$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// get initial replacements arr
		$replacements = $placeholder_templating->get_generic_replacements();

		// Act
		if ( !empty( $templatedHTML ) ) {

			// Actual body:
			$bodyHTML = '';

			// Retrieve quote (for title + URL)
			$quote = zeroBS_getQuote( $quoteID, true );

			if ( isset( $quote ) && is_array( $quote ) ) {

				$proposalTitle = '';
				if ( !empty( $quote['title'] ) ) {
					$proposalTitle = $quote['title'];
				}

				$message_content = zeroBSCRM_mailTemplate_get( ZBSEMAIL_QUOTEACCEPTED );
				$bodyHTML = $message_content->zbsmail_body;
				$proposalEmailTitle = __( 'Proposal Notification', 'zero-bs-crm' );
				$zbs_biz_name = zeroBSCRM_getSetting( 'businessname' );
				$zbs_biz_yourname = zeroBSCRM_getSetting( 'businessyourname' );
				$zbs_biz_extra = zeroBSCRM_getSetting( 'businessextra' );
				$zbs_biz_youremail = zeroBSCRM_getSetting( 'businessyouremail' );
				$zbs_biz_yoururl = zeroBSCRM_getSetting( 'businessyoururl' );

				// build msg-content html
				$bodyHTML = $placeholder_templating->replace_placeholders( array( 'global', 'quote', 'contact' ), $bodyHTML, $replacements, array( ZBS_TYPE_QUOTE => $quote, ZBS_TYPE_CONTACT => $quote_contact ) );

				// For now, use this, ripped from invoices:
				// (We need to centralise)
				$bizInfoTable = '<table class="table zbs-table" style="width:100%;">';
				$bizInfoTable .= '<tbody>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;"><strong>' . $zbs_biz_name . '</strong></td></tr>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_yourname . '</td></tr>';
				$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_extra . '</td></tr>';
				// $bizInfoTable .= '<tr class="top-pad"><td>'.$zbs_biz_youremail.'</td></tr>';
				// $bizInfoTable .= '<tr><td>'.$zbs_biz_yoururl.'</td></tr>';
				$bizInfoTable .= '</tbody>';
				$bizInfoTable .= '</table>';
	
				// unsub line
				$unsub_line = __( 'You have received this notification because your proposal has been accepted in CRM', 'zero-bs-crm' );
				##WLREMOVE
				$unsub_line = __( 'You have received this notification because your proposal has been accepted in Jetpack CRM', 'zero-bs-crm' );
				##/WLREMOVE
				$unsub_line .= __( '. If you believe this was sent in error, please reply and let us know.', 'zero-bs-crm' );

				// build body html
				$replacements = $placeholder_templating->get_generic_replacements();
				$replacements['title'] = $proposalEmailTitle;
				$replacements['msg-content'] = $bodyHTML;
				$replacements['unsub-line'] = $unsub_line;
				$replacements['biz-info'] = $bizInfoTable;
				$replacements['quote-url']      = zeroBSCRM_portal_linkObj( $quoteID, ZBS_TYPE_QUOTE ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$replacements['quote-edit-url'] = jpcrm_esc_link( 'edit', $quoteID, 'zerobs_quote' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$replacements['quote-value']    = $quote['value'] ? zeroBSCRM_formatCurrency( $quote['value'] ) : '';

				$settings = $zbs->settings->getAll();
				if ( $settings['currency'] && $settings['currency']['strval'] ) {
					$replacements['quote-currency'] = $settings['currency']['strval'];
				}
				$html = $placeholder_templating->replace_placeholders( array( 'global', 'quote' ), $templatedHTML, $replacements );

			}

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;

	}

	// FAIL
	return;
}

/* ======================================================
	/ ZBS Quotes - Generate HTML (notification email)
   ====================================================== */



/* ======================================================
	ZBS Invoices - Generate HTML (notification emails)
   ====================================================== */

function zeroBSCRM_invoice_generateNotificationHTML( $invoiceID = -1, $return = true ) {

	if ( !empty( $invoiceID ) && $invoiceID > 0 ) {

		global $zbs;
		$invoice = $zbs->DAL->invoices->getInvoice( $invoiceID );

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// body template
		$mailTemplate = zeroBSCRM_mailTemplate_get( ZBSEMAIL_EMAILINVOICE );
		$bodyHTML = $mailTemplate->zbsmail_body;

		// html template
		$html = jpcrm_retrieve_template( 'emails/default-email.html', false );
		$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $html );

		// Act
		if ( !empty( $html ) ) {

			// this was refactored as was duplicate code.
			// now all wired through zeroBSCRM_invoicing_generateInvoiceHTML
			$html = zeroBSCRM_invoicing_generateInvoiceHTML( $invoiceID, 'notification', $html );

			// get generics
			$replacements = $placeholder_templating->get_generic_replacements();

			// replacements
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'invoice' ), $html, $replacements, array( ZBS_TYPE_INVOICE => $invoice ) );

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;

	}

	// FAIL
	return;
}


// generates statement email html based on template in sys mail
function zeroBSCRM_statement_generateNotificationHTML( $contact_id = -1, $return = true ) {

	global $zbs;

	if ( !empty( $contact_id ) ) {
		$contact = $zbs->DAL->contacts->getContact( $contact_id );

		$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// Get templated notify email

		// body template
		$mailTemplate = zeroBSCRM_mailTemplate_get( ZBSEMAIL_STATEMENT );
		$bodyHTML = $mailTemplate->zbsmail_body;

		// html template
		$html = jpcrm_retrieve_template( 'emails/default-email.html', false );
		$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $html );

		// Act
		if ( !empty( $html ) ) {

			// the business info from the settings
			$zbs_biz_name = zeroBSCRM_getSetting( 'businessname' );
			$zbs_biz_yourname = zeroBSCRM_getSetting( 'businessyourname' );
			$zbs_biz_extra = zeroBSCRM_getSetting( 'businessextra' );

			// For now, use this, ripped from invoices:
			// (We need to centralise)
			$bizInfoTable = '<table class="table zbs-table" style="width:100%;">';
			$bizInfoTable .= '<tbody>';
			$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;"><strong>' . $zbs_biz_name . '</strong></td></tr>';
			$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_yourname . '</td></tr>';
			$bizInfoTable .= '<tr><td style="font-family:sans-serif;font-size:14px;vertical-align:top;padding-bottom:5px;">' . $zbs_biz_extra . '</td></tr>';
			$bizInfoTable .= '</tbody>';
			$bizInfoTable .= '</table>';

					// get generics
			$replacements = $placeholder_templating->get_generic_replacements();

			// view in portal?
			$replacements['title'] = __( 'Statement', 'zero-bs-crm' );
			$replacements['biz-info'] = $bizInfoTable;

			// replacements
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), $html, $replacements, array( ZBS_TYPE_CONTACT => $contact ) );

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;

	}
	// FAIL
	return;
}
/* ======================================================
	/ ZBS Invoices - Generate HTML (notification email)
   ====================================================== */

/* ======================================================
	ZBS Portal - Generate HTML (notification emails)
   ====================================================== */

function zeroBSCRM_Portal_generateNotificationHTML( $pwd = -1, $return = true, $email = null, $contact_id = false ) {

	global $zbs;

	if ( ! empty( $pwd ) ) {

		$html = '';
		$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// Get templated notify email
		$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// Act
		if ( !empty( $templatedHTML ) ) {

			// body
			$message_content = zeroBSCRM_mailTemplate_get( ZBSEMAIL_CLIENTPORTALWELCOME );
			$bodyHTML = $message_content->zbsmail_body;
			$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $templatedHTML );

			// get replacements
			$replacements = $placeholder_templating->get_generic_replacements();

			// replacements
			$replacements['title'] = __( 'Welcome to your Client Portal', 'zero-bs-crm' );
			$replacements['email'] = $email;

			// if got contact_id (DAL3+) pass the contact object (so user can use ##ASSIGNED-TO-NAME##)
			$replacement_objects = array();
			if ( $contact_id > 0 ) {
				$replacement_objects[ ZBS_TYPE_CONTACT ] = zeroBS_getCustomer( $contact_id );
			}

			// replacements
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), $html, $replacements, $replacement_objects );

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;

	}

	// FAIL
	return;
}

 #} adapted from above. pw reset email
function zeroBSCRM_Portal_generatePWresetNotificationHTML( $pwd, $return, $contact ) {

	global $zbs;

	if ( !empty( $pwd ) ) {

		$html = '';
		$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// Get templated notify email
		$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// Act
		if ( !empty( $templatedHTML ) ) {

			$message_content = zeroBSCRM_mailTemplate_get( ZBSEMAIL_CLIENTPORTALPWREST );
			$bodyHTML = $message_content->zbsmail_body;
			$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $templatedHTML );

			// get replacements
			$replacements = $placeholder_templating->get_generic_replacements();

			// replacements
			$replacements['title'] = __( 'Your Client Portal Password has been reset', 'zero-bs-crm' );
			$replacements['email'] = $contact['email'];
			$replacements['password'] = $pwd;

			// replacements
			$html = $placeholder_templating->replace_placeholders( array( 'global', 'contact' ), $html, $replacements, array( ZBS_TYPE_CONTACT => $contact ) );

			// return
			if ( !$return ) {

				echo $html;
				exit();

			}

		}

		return $html;


	}

	// FAIL
	return;
}

function jpcrm_task_generate_notification_html( $return = true, $email = false, $task_id = -1, $task = false ) {

	global $zbs;

	// checks
	if ( !zeroBSCRM_validateEmail( $email ) || $task_id < 1 ) {
		return false;
	}

	// Get templated notify email
	$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

	// prep
	$html = '';
	$pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

	// load templater
	$placeholder_templating = $zbs->get_templating();

	// Act
	if ( !empty( $templatedHTML ) ) {

		// retrieve task notification
		$message_content = zeroBSCRM_mailTemplate_get( ZBSEMAIL_TASK_NOTIFICATION );
		$bodyHTML = $message_content->zbsmail_body;
		$html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $templatedHTML );

		// get replacements
		$replacements = $placeholder_templating->get_generic_replacements();

		// retrieve task (if not passed)
		if ( !is_array( $task ) ) {

			$task = $zbs->DAL->events->getEvent( $task_id );

		}

		// vars / html gen
		$task_url = jpcrm_esc_link( 'edit', $task['id'], ZBS_TYPE_TASK );
		$task_html = '<p>' . nl2br( $task['desc'] ) . '</p>';
		$task_html .= '<hr /><p style="text-align:center">';
		$task_html .= __( 'Your task starts at ', 'zero-bs-crm' ) . '<strong>' . $task['start_date'] . '</strong><br/>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// $task_html .= __( 'to: ', 'zero-bs-crm' ) . $task['end_date'];
		$task_html .= '</p><hr />';

		// replacements
		$replacements['title']            = __( 'Your Task is starting soon', 'zero-bs-crm' );
		$replacements['task-title']       = '<h2>' . $task['title'] . '</h2>';
		$replacements['task-body']        = $task_html; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$replacements['task-link-button'] = '<div style="text-align:center;margin:1em;margin-top:2em">' . __( 'You can view your task at the following URL: ', 'zero-bs-crm' ) . '<br />' . zeroBSCRM_mailTemplate_emailSafeButton( $task_url, __( 'View Task', 'zero-bs-crm' ) ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// replacements
		$html = $placeholder_templating->replace_placeholders(
			array(
				'global',
				'event',
				'contact',
				'company',
			),
			$html,
			$replacements,
			array(
				ZBS_TYPE_TASK   => $task,
				ZBS_TYPE_CONTACT => isset( $task['contact'] ) ? $task['contact'][0] : null,
				ZBS_TYPE_COMPANY => isset( $task['company'] ) ? $task['company'][0] : null,
			)
		);

		// return
		if ( !$return ) {

			echo $html;
			exit();

		}
	}

	return $html;

}



/* ======================================================
	/ ZBS Invoices - Generate HTML (notification emails)
   ====================================================== */


/* ======================================================
	ZBS Single Send Emails - Generate HTML
   ====================================================== */

/*
* Deprecated, included to avoid Error 500's in outdated extensions
*/
function zeroBSCRM_mailTemplates_directMsg( $return = true, $content = '', $title = '' ) {

	zeroBSCRM_DEPRECATEDMSG( 'zeroBSCRM_mailTemplates_directMsg was deprecated in 4.4.0, Please use jpcrm_mailTemplates_single_send_templated()' );

	return jpcrm_mailTemplates_single_send_templated( $return, $content, $title );

}

/**
 * Creates the html of a single send email based on passed details
 * Note this diverges from jpcrm_mailTemplates_generic_msg because it takes in $contact_object
 * ... and makes sense to have it's own abstraction in any case (as later we can apply specific theming etc.)  
 * Replaces zeroBSCRM_mailTemplates_directMsg
 */
function jpcrm_mailTemplates_single_send_templated( $return=true, $content='', $title = '', $contact_object = false ){

	global $zbs;

    $html = ''; $pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

	// load templater
	$placeholder_templating = $zbs->get_templating();

    // Get templated notify email
	$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

    // Act
    if (!empty($templatedHTML)){

        // replacements (initial templating)
        $html = $placeholder_templating->replace_single_placeholder( 'msg-content', $content, $templatedHTML );

	    // get replacements
	    $replacements = $placeholder_templating->get_generic_replacements();
    	$replacements['title'] = $title; 

        // enact replacements
        $html = $placeholder_templating->replace_placeholders( array(  'global', 'contact', 'company' ), $html, $replacements, array( ZBS_TYPE_CONTACT => $contact_object ) );
						
        // return
        if ( !$return ) {
        
        	echo $html;
        	exit();

        }

    }  

    return $html;


} 
/* ======================================================
	/ ZBS Single Send Emails - Generate HTML
   ====================================================== */


/* ======================================================
	ZBS Generic Emails - Generate HTML
   ====================================================== */
function jpcrm_mailTemplates_generic_msg($return=true, $content='', $title = ''){

	global $zbs;

    $html = ''; $pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

	// load templater
	$placeholder_templating = $zbs->get_templating();

    // Get templated notify email
	$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

    // Act
    if (!empty($templatedHTML)){

        // replacements (initial templating)
        $html = $placeholder_templating->replace_single_placeholder( 'msg-content', $content, $templatedHTML );

	    // get replacements
	    $replacements = $placeholder_templating->get_generic_replacements();
    	$replacements['title'] = $title;     

        // replacements
        $html = $placeholder_templating->replace_placeholders( array(  'global', 'contact', 'company' ), $html, $replacements );
						
        // return
        if ( !$return ) {
        
        	echo $html;
        	exit();

        }

    }  
    return $html;


} 
/* ======================================================
	/ ZBS Generic Emails - Generate HTML
   ====================================================== */



/* ======================================================
	ZBS Mail Delivery Tests
   ====================================================== */


	function zeroBSCRM_mailDelivery_generateTestHTML($return=true){

		global $zbs;
			
        $html = ''; $pWrap = '<p style="font-family:sans-serif;font-size:14px;font-weight:normal;margin:0;Margin-bottom:15px;">';

		// load templater
		$placeholder_templating = $zbs->get_templating();

	    // Get templated notify email
		$templatedHTML = jpcrm_retrieve_template( 'emails/default-email.html', false );

        #} Act
        if (!empty($templatedHTML)){
			
	        	#} Actual body:
	        	$bodyHTML = '';

	        	$bodyHTML = "<div style='text-align:center'><h1>".__('Testing Mail Delivery Option',"zero-bs-crm")."</h1>";
	        	$bodyHTML .= '<p>'.__("This is a test email, sent to you by Jetpack CRM. If you're receiving this loud and clear, it means your mail delivery setup has been successful, congratulations!","zero-bs-crm").'</p>';
				
				##WLREMOVE
				$bodyHTML .= '<p>'.__("Why not follow us on twitter to celebrate?","zero-bs-crm").'</p>';
				$bodyHTML .= '<p><a href="https://twitter.com/jetpackcrm">@jetpackcrm</a></p>';
				##/WLREMOVE

				$bodyHTML .= "</div>";

		        // replacements (initial templating)
		        $html = $placeholder_templating->replace_single_placeholder( 'msg-content', $bodyHTML, $templatedHTML );

			    // get replacements
			    $replacements = $placeholder_templating->get_generic_replacements();
		    	$replacements['title'] = __( 'Testing Mail Delivery Option', 'zero-bs-crm' ); 
		    	$replacements['biz-info'] = '<p>'.__( "Sent from your friendly neighbourhood CRM.", "zero-bs-crm" ).'</p>';  
		    	$replacements['unsub-line'] = '<p>'.__( "Have a great day.", "zero-bs-crm" ).'</p>';

		        // replacements
		        $html = $placeholder_templating->replace_placeholders( array(  'global', 'contact', 'company' ), $html, $replacements );	     

            // return
            if ( !$return ) {
            
            	echo $html;
            	exit();

            }

        }  

        return $html;


	} 


/* ======================================================
	/ ZBS Mail Delivery Tests
   ====================================================== */




/* ======================================================
	ZBS Mail Templating General
   ====================================================== */

function zeroBSCRM_mailTemplate_poweredByHTML( $type='html' ) {

	##WLREMOVE
	global $zbs;
	$showpoweredby_public = $zbs->settings->get( 'showpoweredby_public' ) === 1 ? true : false;

	if ( $showpoweredby_public ) {

		if ( $type == 'html' ) {
			global $zbs;
			return sprintf( __( 'Powered by <a href="%s">Jetpack CRM</a>', 'zero-bs-crm' ), $zbs->urls['home'] );

		} elseif ( $type == 'text' ) {

			return __( 'Powered by Jetpack CRM', 'zero-bs-crm' );

		}

	}

	##/WLREMOVE
	return '';
}


function zeroBSCRM_mailTemplate_getHeaders($templateID = -1){

	if($templateID > 0){

		$mailTemplate = zeroBSCRM_mailTemplate_get($templateID);

        //headers being set...
		$headers = array('Content-Type: text/html; charset=UTF-8'); 

		//extra header settings..
		// We don't use these now, as mail is sent out properly via Mail Delivery
		//$headers[]  = 'From: '. esc_html($mailTemplate->zbsmail_fromname).' <'.sanitize_email($mailTemplate->zbsmail_fromaddress).'>';
		//$headers[]  = 'Reply-To: ' . sanitize_email($mailTemplate->zbsmail_replyto);
		// but we use this :) 
		if (isset($mailTemplate->zbsmail_bccto) && !empty($mailTemplate->zbsmail_bccto)) $headers[]  = 'Bcc: ' . sanitize_email($mailTemplate->zbsmail_bccto); 


	}else{
		$headers = array('Content-Type: text/html; charset=UTF-8'); 
	}

	return $headers;
}

// adapted from https://buttons.cm/
function zeroBSCRM_mailTemplate_emailSafeButton($url='',$str=''){

	return '<div><!--[if mso]>
	<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="'.$url.'" style="height:53px;v-text-anchor:middle;width:200px;" arcsize="8%" stroke="f" fillcolor="#49a9ce">
		<w:anchorlock/>
		<center>
	<![endif]-->
		<a href="'.$url.'"
	style="background-color:#49a9ce;border-radius:4px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:700;line-height:53px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">'.$str.'</a>
	<!--[if mso]>
		</center>
	</v:roundrect>
	<![endif]--></div>';

}


// replaces generic attrs in one place, e.g. loginlink, loginurl
// note as placeholder templates hard-override empty placeholders not passed, 
// here we pass true as the forth variable to leave existing ##PLACEHOLDERS## intact
// (if leave_existing_placeholders = true)
//
// TL;DR; Phase out using this function, instead get the replacements for use with 'replace_placeholders'
// ... from ->get_generic_replacements()
function zeroBSCRM_mailTemplate_genericReplaces( $html='', $leave_existing_placeholders = true ){

	global $zbs;

	// load templater
    $placeholder_templating = $zbs->get_templating();

    // get replacements
    $replacements = $placeholder_templating->get_generic_replacements();

    // replace
    return $placeholder_templating->replace_placeholders( array(  'global' ), $html, $replacements, $leave_existing_placeholders );

}


/* ======================================================
	/ ZBS Mail Templating General
   ====================================================== */
