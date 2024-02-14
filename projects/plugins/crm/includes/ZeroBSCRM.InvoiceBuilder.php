<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

// takes inv meta and works out if due
// now v3.0 friendly!
function zeroBSCRM_invoiceBuilder_isInvoiceDue($zbsInvoice=array()){

    global $zbs;

    if (is_array($zbsInvoice)){

        // first get due
        $due = 0; if (isset($zbsInvoice['due_date']) && $zbsInvoice['due_date'] > 0) $due = (int)$zbsInvoice['due_date'];

        // compare (could give days difference here, but not req yet.)
        if ($due > time()){
            // not due
            return false;
        } else {
            // due
            return true;
        }

    }

    return false;

}


/* ======================================================
    ZBS Invoicing - REMOVE previous submit meta box + replace with custom
   ====================================================== */

#} This adds our own save box
function zeroBSCRM_replace_invoice_submit_meta_box() 
{

        #} remove typical submit box:
        remove_meta_box('submitdiv', 'zerobs_invoice', 'core'); // $item represents post_type
 
        #} Include/initialise custom submitbox
        require_once( ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.MetaBoxes.SubmitBoxes.php');
  
}

add_action( 'admin_init', 'zeroBSCRM_replace_invoice_submit_meta_box' );

#} This specifies 1 column pre-save, 2 columns post-save :)
function zeroBSCRM_invoiceBuilderColumnCount(){

        global $post;
        if (isset($post->post_status) && $post->post_status != "auto-draft") return 2;

        return 2;

}
add_filter('get_user_option_screen_layout_zerobs_invoice', 'zeroBSCRM_invoiceBuilderColumnCount' );


/* ======================================================
    ZBS Invoicing - HTML GENERATOR
   ====================================================== */

#} Generates the HTML of an invoice based on the template in templates/invoices/invoice-pdf.html
#} if $return, it'll return, otherwise it'll echo + exit
#} --------- Notes:
#} ... there's several ways we COULD do this, 
#} ... suggest we explore this way first, then re-discuss, 
#} ... Benefits of this inc. easy to theme ;) just create variations of invoice.html
// Note: This is primarily used to generate PDF invoice html. (dig down and see use if "zeroBSCRM_invoicing_generateInvoiceHTML($invoiceID,'pdf'")
function zeroBSCRM_invoice_generateInvoiceHTML($invoicePostID=-1,$return=true){

    if (!empty($invoicePostID)){

        global $zbs;
        return zeroBSCRM_invoice_generateInvoiceHTML_v3( $invoicePostID, $return );

    } 

    #} Empty inv id
    return false;
}

// invoice html generation 3.0+
function zeroBSCRM_invoice_generateInvoiceHTML_v3( $invoiceID=-1, $return=true ){

    global $zbs;

    if (!empty($invoiceID)){

        // Discern template and retrieve    
        $global_invoice_pdf_template = zeroBSCRM_getSetting('inv_pdf_template');
        if ( !empty( $global_invoice_pdf_template ) ){
            $templatedHTML = jpcrm_retrieve_template( $global_invoice_pdf_template, false );
        }

        // fallback to default template
        if ( !isset( $templatedHTML ) || empty( $templatedHTML ) ){

            // template failed as setting potentially holds out of date (removed) template
            // so use the default
            $templatedHTML = jpcrm_retrieve_template( 'invoices/invoice-pdf.html', false );

        }

        #} Act
        if (!empty($templatedHTML)){

            // Over-ride the #MSGCONTENT# part
            $placeholder_templating = $zbs->get_templating();

            // replace the content with our new ID ... (gets our content template info and replaces ###MSG CONTENT)
            $message_content = zeroBSCRM_mailTemplate_get(ZBSEMAIL_EMAILINVOICE);
            $message_content = $message_content->zbsmail_body;
            $templatedHTML   = $placeholder_templating->replace_single_placeholder( 'msg-content', $message_content, $templatedHTML );

            // for v3.0 WH split out the data-retrieval from scattering amongst this func, unified here:
            // translated the below cpt way into dal / v3.0:

            // this was refactored as was duplicate code.
            // now all wired through zeroBSCRM_invoicing_generateInvoiceHTML
            $html = zeroBSCRM_invoicing_generateInvoiceHTML($invoiceID,'pdf',$templatedHTML);

            // return
            if ( !$return ){
            
                echo $html; 
                exit(); 
                
            }

        }

        return $html;

    } 

    #} Empty inv id
    return false;
}

// this was clunky, so split into 3.0 and <3.0 versions.
// ultimately this is much like zeroBSCRM_invoice_generateInvoiceHTML
// ... should refactor the bits that are the same
function zeroBSCRM_invoice_generatePortalInvoiceHTML($invoicePostID=-1,$return=true){
    global $zbs;

    if (!empty($invoicePostID)){
        return zeroBSCRM_invoice_generatePortalInvoiceHTML_v3( $invoicePostID, $return );
    } 

    #} Empty inv id
    return false;
}


// 3.0+
function zeroBSCRM_invoice_generatePortalInvoiceHTML_v3($invoiceID=-1,$return=true){

    global $zbs;

    if (!empty($invoiceID)){        

        // Discern template and retrieve    
        $global_invoice_portal_template = zeroBSCRM_getSetting('inv_portal_template');
        if ( !empty( $global_invoice_portal_template ) ){
            $html = jpcrm_retrieve_template( $global_invoice_portal_template, false );
        }

        // fallback to default template
        if ( !isset( $html ) || empty( $html ) ){

            // template failed as setting potentially holds out of date (removed) template
            // so use the default
            $html = jpcrm_retrieve_template( 'invoices/portal-invoice.html', false );

        }

        #} Act
        if (!empty($html)){

            // load templating
            $placeholder_templating = $zbs->get_templating();

            // replace the content with our new ID ... (gets our content template info and replaces ###MSG CONTENT)
            $message_content = zeroBSCRM_mailTemplate_get(ZBSEMAIL_EMAILINVOICE);
            $message_content = $message_content->zbsmail_body;
            $html   = $placeholder_templating->replace_single_placeholder( 'msg-content', $message_content, $html );

            // this was refactored as was duplicate code.
            // now all wired through zeroBSCRM_invoicing_generateInvoiceHTML
            $html = zeroBSCRM_invoicing_generateInvoiceHTML($invoiceID,'portal',$html);

            // return
            if ( !$return ){
            
                echo $html; 
                exit(); 
                
            }

        }

        return $html;

    } 

    #} Empty inv id
    return false;

}

function zbs_invoice_generate_pdf(){

	// download flag
	if ( isset( $_POST['zbs_invoicing_download_pdf'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

		// THIS REALLLY needs nonces! For now (1.1.19) added this for you...
		if ( ! zeroBSCRM_permsInvoices() ) {
			exit();
		}

		// Check ID
		$invoice_id = -1;
		if ( ! empty( $_POST['zbs_invoice_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$invoice_id = (int) $_POST['zbs_invoice_id']; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}
		if ( $invoice_id <= 0 ) {
			exit();
		}

		// generate the PDF
		$pdf_path = jpcrm_invoice_generate_pdf( $invoice_id );

		if ( $pdf_path !== false ) {

			$pdf_filename = basename( $pdf_path );

			// print the pdf file to the screen for saving
			header( 'Content-type: application/pdf' );
			header( 'Content-Disposition: attachment; filename="' . $pdf_filename . '"' );
			header( 'Content-Transfer-Encoding: binary' );
			header( 'Content-Length: ' . filesize( $pdf_path ) );
			header( 'Accept-Ranges: bytes' );
			readfile( $pdf_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile

			// delete the PDF file once it's been read (i.e. downloaded)
			wp_delete_file( $pdf_path );

		}

		exit();
	}
}
// This fires post ZBS init
add_action( 'zerobscrm_post_init', 'zbs_invoice_generate_pdf' );

/**
 * Generate PDF file for an invoice
 *
 * @param int $invoice_id Invoice ID.
 * @return str path to PDF file
 */
function jpcrm_invoice_generate_pdf( $invoice_id = -1 ) {

	// brutal.
	if ( ! zeroBSCRM_permsInvoices() ) {
		return false;
	}

	// If user has no perms, or id not present, die
	if ( $invoice_id <= 0 ) {
		return false;
	}

	// Generate html
	$html = zeroBSCRM_invoice_generateInvoiceHTML( $invoice_id );

	global $zbs;
	$invoice = $zbs->DAL->invoices->getInvoice( $invoice_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

	// if invoice has reference number, use instead of ID
	if ( ! empty( $invoice['id_override'] ) ) {
		$invoice_id = $invoice['id_override'];
	}

	// normalise translated text to alphanumeric, resulting in a filename like `invoice-321.pdf`
	$pdf_filename = sanitize_title( __( 'Invoice', 'zero-bs-crm' ) . '-' . $invoice_id ) . '.pdf';

	// return PDF filename if successful, false if not
	return jpcrm_generate_pdf( $html, $pdf_filename );
}

// LEGACY, should now be using zeroBSCRM_invoice_generateInvoiceHTML
// still used in Client Portal Pro
function zbs_invoice_html($invoicePostID){

    $html = zeroBSCRM_invoice_generateInvoiceHTML($invoicePostID);

    return $html;
}

#} this generates a PDF statement for a contact, either returning the filepath or a PDF download prompt
function zeroBSCRM_invoicing_generateStatementPDF( $contactID = -1, $returnPDF = false ){

    if (!zeroBSCRM_permsInvoices()) exit();

    global $zbs;

    #} Check ID
    $contactID = (int)$contactID;
    #} If user has no perms, or id not present, die
    if (!zeroBSCRM_permsInvoices() || empty($contactID) || $contactID <= 0){
        die();
    }

    $html = zeroBSCRM_invoicing_generateStatementHTML($contactID);

    // build PDF
    $dompdf = $zbs->pdf_engine();
    $dompdf->loadHtml($html,'UTF-8');
    $dompdf->render();

    // target dir
    $upload_dir = wp_upload_dir();
    $zbsInvoicingDir = $upload_dir['basedir'].'/invoices/';

    if ( ! file_exists( $zbsInvoicingDir ) ) {
        wp_mkdir_p( $zbsInvoicingDir );
    }
    // got it?
    if ( ! file_exists( $zbsInvoicingDir ) ) {
        return false;
    }

    // make a hash
    // here we've tried to protect against someone overriding the security,
    // but if they're inside... it's too late anyhow.
    $hash = wp_generate_password(14, false);
    if (empty($hash) || strlen($hash) < 14) $hash = md5(time().'xcsac'); // backup 
    
    $statementFilename = $zbsInvoicingDir.$hash.'-'.__('statement','zero-bs-crm').'-'.$contactID.'.pdf';

    //save the pdf file on the server
    file_put_contents($statementFilename, $dompdf->output());  

    if (file_exists( $statementFilename )) {

        // if return pdf, return, otherwise return filepath
        if ($returnPDF){

            //print the pdf file to the screen for saving
            header('Content-type: application/pdf');
            header('Content-Disposition: attachment; filename="invoice-'.$invoiceID.'.pdf"');
            header('Content-Transfer-Encoding: binary');
            header('Content-Length: ' . filesize($statementFilename));
            header('Accept-Ranges: bytes');
            readfile($statementFilename);

            //delete the PDF file once it's been read (i.e. downloaded)
            unlink($statementFilename); 

        } else {

            return $statementFilename;

        }


    } // if file

    return false;
}

/* ======================================================
    ZBS Invoicing - STATEMENT HTML GENERATOR
   ====================================================== */

// phpcs:ignore Squiz.Commenting.FunctionComment.MissingParamTag
/**
 * Generates the HTML of an invoice based on the template in templates/invoices/statement-pdf.html
 * if $return, it'll return, otherwise it'll echo + exit
 **/
function zeroBSCRM_invoicing_generateStatementHTML( $contact_id = -1, $return = true ) {

	if ( ! empty( $contact_id ) && $contact_id > 0 ) {

		// Discern template and retrieve
		$global_statement_pdf_template = zeroBSCRM_getSetting( 'statement_pdf_template' );
		if ( ! empty( $global_statement_pdf_template ) ) {
			$templated_html = jpcrm_retrieve_template( $global_statement_pdf_template, false );
		}

		// fallback to default template
		if ( ! isset( $templated_html ) || empty( $templated_html ) ) {
			// template failed as setting potentially holds out of date (removed) template
			// so use the default
			$templated_html = jpcrm_retrieve_template( 'invoices/statement-pdf.html', false );
		}

		// Act
		if ( ! empty( $templated_html ) ) {
			return zeroBSCRM_invoicing_generateStatementHTML_v3( $contact_id, $return, $templated_html );
		}
	}

	// Empty inv id
	return false;
}

// 3.0+ (could now run off contact or company, but that's not written in yet)
// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
function zeroBSCRM_invoicing_generateStatementHTML_v3( $contact_id = -1, $return = true, $templated_html = '' ) {

	if ( $contact_id > 0 && $templated_html !== '' ) {

		global $zbs;

		// Globals
		$biz_name          = zeroBSCRM_getSetting( 'businessname' );
		$biz_contact_name  = zeroBSCRM_getSetting( 'businessyourname' );
		$biz_contact_email = zeroBSCRM_getSetting( 'businessyouremail' );
		$biz_url           = zeroBSCRM_getSetting( 'businessyoururl' );
		$biz_extra         = zeroBSCRM_getSetting( 'businessextra' );
		$biz_tel           = zeroBSCRM_getSetting( 'businesstel' );
		$statement_extra   = zeroBSCRM_getSetting( 'statementextra' );
		$logo_url          = zeroBSCRM_getSetting( 'invoicelogourl' );

		// invoices
		$invoices = $zbs->DAL->invoices->getInvoices( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(

				'assignedContact'  => $contact_id, // assigned to contact id (int)
				'assignedCompany'  => false, // assigned to company id (int)

				// returns
				'withLineItems'    => true,
				'withCustomFields' => true,
				'withTransactions' => true, // partials
				'withTags'         => false,

				// sort
				'sortByField'      => 'ID',
				'sortOrder'        => 'ASC',

			)
		);

		// statement table wrapper
		$statement_table = '<table id="zbs-statement-table" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#FFF;width:100%;">';

		// logo header
		if ( ! empty( $logo_url ) ) {
			$statement_table .= '<tr><td colspan="3" style="text-align:right"><img src="' . esc_url( $logo_url ) . '" alt="' . esc_attr( $biz_name ) . '" style="max-width:200px;max-height:140px" /></td></tr>';
		}

		// title
		$statement_table .= '<tr><td colspan="3"><h2 class="zbs-statement">' . esc_html__( 'STATEMENT', 'zero-bs-crm' ) . '</h2></td></tr>';

		// address | dates | biz deets line
		$statement_table .= '<tr>';

		// contact address

		// v3.0
		$contact_details = $zbs->DAL->contacts->getContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$contact_id,
			array(
				'withCustomFields' => true,
				'withQuotes'       => false,
				'withInvoices'     => false,
				'withTransactions' => false,
				'withLogs'         => false,
				'withLastLog'      => false,
				'withTags'         => false,
				'withCompanies'    => false,
				'withOwner'        => false,
				'withValues'       => false,
			)
		);
		if ( is_array( $contact_details ) && isset( $contact_details['fname'] ) ) {
			$invoice_customer_info_table_html = '<div class="zbs-line-info zbs-line-info-title">' . esc_html( $contact_details['fname'] ) . ' ' . esc_html( $contact_details['lname'] ) . '</div>';
			if ( isset( $contact_details['addr1'] ) && ! empty( $contact_details['addr1'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $contact_details['addr1'] ) . '</div>';
			}
			if ( isset( $contact_details['addr2'] ) && ! empty( $contact_details['addr2'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $contact_details['addr2'] ) . '</div>';
			}
			if ( isset( $contact_details['city'] ) && ! empty( $contact_details['city'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $contact_details['city'] ) . '</div>';
			}
			if ( isset( $contact_details['county'] ) && ! empty( $contact_details['county'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $contact_details['county'] ) . '</div>';
			}
			if ( isset( $contact_details['postcode'] ) && ! empty( $contact_details['postcode'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $contact_details['postcode'] ) . '</div>';
			}
		}

		// add
		$statement_table .= '<td><div style="text-align:left">' . $invoice_customer_info_table_html . '</div></td>';

		// Dates
		$statement_table .= '<td>';
		$statement_table .= '<div class="zbs-statement-date"><strong>' . esc_html__( 'Statement Date', 'zero-bs-crm' ) . '</strong><br />' . esc_html( zeroBSCRM_locale_utsToDate( time() ) ) . '</div>';
		$statement_table .= '</td>';

		// Biz deets

		// get biz deets
		$biz_info_table = '<div class="zbs-line-info zbs-line-info-title">' . esc_html( $biz_name ) . '</div>';
		if ( ! empty( $biz_contact_name ) ) {
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $biz_contact_name ) . '</div>';
		}
		if ( ! empty( $biz_extra ) ) {
			$biz_info_table .= '<div class="zbs-line-info">' . nl2br( esc_html( $biz_extra ) ) . '</div>';
		}
		if ( ! empty( $biz_contact_email ) ) {
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $biz_contact_email ) . '</div>';
		}
		if ( ! empty( $biz_url ) ) {
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $biz_url ) . '</div>';
		}
		if ( ! empty( $biz_tel ) ) {
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $biz_tel ) . '</div>';
		}

		// add
		$statement_table .= '<td><div class="zbs-biz-info">' . $biz_info_table . '</div></td>';

		$statement_table .= '</tr>';

		// STATEMENT table

		// start
		$s_table = '<table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#FFF;width:100%">';

		// header
		$s_table .= '<tr><th cellpadding="0" cellspacing="0" >' . esc_html__( 'Date', 'zero-bs-crm' ) . '</th>';
		$s_table .= '<th cellpadding="0" cellspacing="0" >' . esc_html( $zbs->settings->get( 'reflabel' ) ) . '</th>';
		$s_table .= '<th cellpadding="0" cellspacing="0" >' . esc_html__( 'Due date', 'zero-bs-crm' ) . '</th>';
		$s_table .= '<th class="zbs-accountant-td" style="text-align:right">' . esc_html__( 'Amount', 'zero-bs-crm' ) . '</th>';
		$s_table .= '<th class="zbs-accountant-td" style="text-align:right">' . esc_html__( 'Payments', 'zero-bs-crm' ) . '</th>';
		$s_table .= '<th class="zbs-accountant-td" style="text-align:right">' . esc_html__( 'Balance', 'zero-bs-crm' ) . '</th></tr>';

		// should be all of em so can do 'outstanding balance' from this
		$balance_due = 0.00;

		// rows. (all invs for this contact)
		if ( is_array( $invoices ) && count( $invoices ) > 0 ) {

			foreach ( $invoices as $invoice ) {

				// number
				$invoice_reference = $invoice['id'];
				if ( isset( $invoice['id_override'] ) && ! empty( $invoice['id_override'] ) ) {
					$invoice_reference = $invoice['id_override'];
				}

				// date
				$invoice_date = $invoice['date_date'];

				// due
				if ( $invoice['due_date'] <= 0 ) {

					//no due date;
					$due_date_str = __( 'No due date', 'zero-bs-crm' );

				} else {

					$due_date_str = $invoice['due_date_date'];

					// is it due?
					if ( zeroBSCRM_invoiceBuilder_isInvoiceDue( $invoice ) ) {
						$due_date_str .= ' [' . esc_html__( 'Due', 'zero-bs-crm' ) . ']';
					}
				}

				// partials = transactions associated in v3.0 model
				$partials = $invoice['transactions'];

				// ================= / DATA RETRIEVAL ===================================

				// total etc.
				$total    = 0.00;
				$payments = 0.00;
				$balance  = 0.00;
				if ( isset( $invoice['total'] ) && $invoice['total'] > 0 ) {
					$total   = $invoice['total'];
					$balance = $total;
				}

				// 2 ways here - if marked 'paid', then assume balance
				// ... if not, then trans allocation check
				if ( isset( $invoice['status'] ) && $invoice['status'] === 'Paid' ) {

					// assume fully paid
					$balance  = 0.00;
					$payments = $total;

				} elseif ( is_array( $partials ) ) {

					foreach ( $partials as $partial ) {

						// ignore if status_bool (non-completed status)
						$partial['status_bool'] = (int) $partial['status_bool'];
						if ( isset( $partial ) && $partial['status_bool'] == 1 && isset( $partial['total'] ) && $partial['total'] > 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual

							// v3.0+ has + or - partials. Account for that:
							if ( $partial['type_accounting'] === 'credit' ) {

								// credit note, or refund
								$balance = $balance + $partial['total'];
								// add to payments
								$payments += $partial['total'];

							} else {

								// assume debit
								$balance = $balance - $partial['total'];

								// add to payments
								$payments += $partial['total'];
							}
						}
					} // /foreach

				} // if is array

				// now we add any outstanding bal to the total bal for table
				if ( $balance > 0 ) {
					$balance_due += $balance;
				}

				// output
				$s_table .= '<tr><td>' . esc_html( $invoice_date ) . '</td>';
				$s_table .= '<td>' . esc_html( $invoice_reference ) . '</td>';
				$s_table .= '<td>' . esc_html( $due_date_str ) . '</td>';
				$s_table .= '<td class="zbs-accountant-td">' . esc_html( zeroBSCRM_formatCurrency( $total ) ) . '</td>';
				$s_table .= '<td class="zbs-accountant-td">' . esc_html( zeroBSCRM_formatCurrency( $payments ) ) . '</td>';
				$s_table .= '<td class="zbs-accountant-td">' . esc_html( zeroBSCRM_formatCurrency( $balance ) ) . '</td></tr>';
			}
		} else {

			// No invoices?
			$s_table .= '<tr><td colspan="6" style="text-align:center;font-size:14px;font-weight:bold;padding:2em">' . esc_html__( 'No Activity', 'zero-bs-crm' ) . '</td></tr>';
		}

		// footer
		$s_table .= '<tr class="zbs-statement-footer"><td colspan="6">' . esc_html__( 'BALANCE DUE', 'zero-bs-crm' ) . ' ' . esc_html( zeroBSCRM_formatCurrency( $balance_due ) ) . '</td></tr>';

		// close table
		$s_table .= '</table>';

		// add
		$statement_table .= '<tr><td colspan="3">' . $s_table . '</td></tr>';

		// Extra Info
		$statement_table .= '<tr><td colspan="3" style="text-align:left;padding: 30px;">' . nl2br( esc_html( $statement_extra ) ) . '</td></tr>';

		// close table
		$statement_table .= '</table>';

		// load templating
		$placeholder_templating = $zbs->get_templating();

		// main content build
		$html = $placeholder_templating->replace_single_placeholder( 'invoice-statement-html', $statement_table, $templated_html );

		// return
		if ( ! $return ) {

			echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			exit();

		}

		return $html;

	} // /if anything

	return false;
}

// phpcs:ignore Squiz.Commenting.FunctionComment.MissingParamTag,Generic.Commenting.DocComment.MissingShort
/**
 *
 * Generate an invoice as html (where the actual holder-html is passed)
 * ... this is a refactor of what was being replicated 3 places
 * ... 1) Invoice PDF Gen (zeroBSCRM_invoice_generateInvoiceHTML)
 * ... 2) Invoice Portal Gen (zeroBSCRM_invoice_generatePortalInvoiceHTML)
 * ... 3) Invoice email notification Gen (zeroBSCRM_invoice_generateNotificationHTML in mail-templating.php)
 * ... now the generic element of the above are all wired through here :)
 * Note:
 * $template is crucial. pdf | portal | notification *currently v3.0
 **/
function zeroBSCRM_invoicing_generateInvoiceHTML( $invoice_id = -1, $template = 'pdf', $html = '' ) {

	global $zbs;

	// load templating
	$placeholder_templating = $zbs->get_templating();

	// need this.
	if ( $invoice_id <= 0 || $html == '' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		return '';
	}

	// for v3.0 WH split out the data-retrieval from scattering amongst this func, unified here:
	// translated the below cpt way into dal / v3.0:

	// ================== DATA RETRIEVAL ===================================

	$invoice = $zbs->DAL->invoices->getInvoice( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$invoice_id,
		array(

			// we want all this:
			'withLineItems'    => true,
			'withCustomFields' => true,
			'withTransactions' => true, // gets trans associated with inv as well
			'withAssigned'     => true, // return arrays of assigned contact and companies objects
			'withTags'         => true,
			'withOwner'        => true,
			'withTotals'       => true,

		)
	);

	// retrieve
	$zbs_customer_id = -1;
	if ( is_array( $invoice ) && isset( $invoice['contact'] ) && is_array( $invoice['contact'] ) && count( $invoice['contact'] ) > 0 ) {
		$zbs_customer_id = $invoice['contact'][0]['id'];
	}
	$zbs_company_id = -1;
	if ( is_array( $invoice ) && isset( $invoice['company'] ) && is_array( $invoice['company'] ) && count( $invoice['company'] ) > 0 ) {
		$zbs_company_id = $invoice['company'][0]['id'];
	}

	// date
	$inv_date_str = jpcrm_uts_to_date_str( $invoice['date'] );

	// due
	if ( $invoice['due_date'] <= 0 ) {

		//no due date
		$due_date_str = __( 'No due date', 'zero-bs-crm' );

	} else {

		$due_date_str = jpcrm_uts_to_date_str( $invoice['due_date'] );
	}

	// Custom fields
	$invoice_custom_fields_html = jpcrm_invoicing_generate_invoice_custom_fields_lines( $invoice, $template );

	// default status and status label
	if ( ! isset( $invoice['status'] ) ) {
		$invoice['status'] = 'Draft';
	}
	if ( ! isset( $invoice['status_label'] ) ) {
		$invoice['status_label'] = __( 'Draft', 'zero-bs-crm' );
	}

	// status html:
	if ( $template === 'portal' ) {

		// portal version: Includes status label and amount (shown at top of portal invoice)
		$top_status  = '<div class="zbs-portal-label">';
		$top_status .= esc_html( $invoice['status_label'] );
		$top_status .= '</div>';
		// WH added quickly to get around fact this is sometimes empty, please tidy when you address currency formatting :)
		$inv_g_total = '';
		if ( isset( $invoice['total'] ) ) {
			$inv_g_total = zeroBSCRM_formatCurrency( $invoice['total'] );
		}
		$top_status .= '<h1 class="zbs-portal-value">' . esc_html( $inv_g_total ) . '</h1>';
		if ( $invoice['status'] === 'Paid' ) {
			$top_status .= '<div class="zbs-invoice-paid"><i class="fa fa-check"></i>' . esc_html( $invoice['status_label'] ) . '</div>';
		}
	} elseif ( $template === 'pdf' ) {

		// pdf status
		if ( $invoice['status'] === 'Paid' ) {

			$top_status = '<div class="jpcrm-invoice-status jpcrm-invoice-paid">' . esc_html( $invoice['status_label'] ) . '</div>';

		} else {

			$top_status = '<div class="jpcrm-invoice-status">' . esc_html( $invoice['status_label'] ) . '</div>';

		}
	} elseif ( $template === 'notification' ) {
		// sent to contact via email
		$top_status = esc_html( $invoice['status_label'] );
	}

	// inv lines
	$invlines = $invoice['lineitems'];

	// switch for Company if set...
	if ( $zbs_company_id > 0 ) {

		$inv_to = zeroBS_getCompany( $zbs_company_id );
		if ( is_array( $inv_to ) && ( isset( $inv_to['name'] ) || isset( $inv_to['coname'] ) ) ) {

			if ( isset( $inv_to['name'] ) ) {
				$inv_to['fname'] = $inv_to['name']; // DAL3
			}
			if ( isset( $inv_to['coname'] ) ) {
				$inv_to['fname'] = $inv_to['coname']; // DAL2
			}
			$inv_to['lname'] = '';

		} else {

			$inv_to = array(
				'fname' => '',
				'lname' => '',
			);
		}

		// object type flag used downstream, I wonder if we should put these in at the DAL level..
		$inv_to['objtype'] = ZBS_TYPE_COMPANY;
	} else {

		$inv_to = $zbs->DAL->contacts->getContact( $zbs_customer_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( ! $inv_to ) {
			$inv_to = array();
		}

		// object type flag used downstream, I wonder if we should put these in at the DAL level..
		$inv_to['objtype'] = ZBS_TYPE_CONTACT;
	}

	// is this stored same format?
	$zbs_invoice_hours_or_quantity = $invoice['hours_or_quantity'];

	// partials = transactions associated in v3.0 model
	$partials = $invoice['transactions'];

	// ================= / DATA RETRIEVAL ===================================

	// ================= CONTENT BUILDING ===================================

	// Globals
	$invsettings = $zbs->settings->getAll();
	$css_url     = ZEROBSCRM_URL . 'css/ZeroBSCRM.admin.invoicepreview' . wp_scripts_get_suffix() . '.css';
	$ref_label   = $zbs->settings->get( 'reflabel' );

	$logo_url = '';
	if ( isset( $invoice['logo_url'] ) ) {

		if ( isset( $invoice['logo_url'] ) ) {
			$logo_url = $invoice['logo_url'];
		}
	} elseif ( isset( $invsettings['invoicelogourl'] ) && $invsettings['invoicelogourl'] != '' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		$logo_url = $invsettings['invoicelogourl'];
	}

	if ( $logo_url != '' && isset( $invoice['logo_url'] ) ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		$logo_class     = 'show';
		$logo_url       = $invoice['logo_url'];
		$biz_info_class = '';
	} else {
		$logo_class     = '';
		$logo_url       = '';
		$biz_info_class = 'biz-up';
	}

	// Invoice Number or Reference
	// Reference, falling back to ID
	$inv_id_styles  = '';
	$inv_ref_styles = 'display:none;'; // none initially

	// ID
	$this_inv_reference = $invoice['id'];

	// ID - Portal
	if ( $template === 'portal' ) {
		$this_inv_reference = __( 'Invoice #', 'zero-bs-crm' ) . ' ' . $this_inv_reference;
	}

	// Reference
	if ( isset( $invoice['id_override'] ) && ! empty( $invoice['id_override'] ) ) {

		// Ref
		$this_inv_reference = $invoice['id_override'];

		// Ref - Portal
		if ( $template === 'portal' ) {
			$this_inv_reference = $ref_label . ' ' . $this_inv_reference;
		}

		// and we don't show ID, do show ref label:
		$inv_id_styles  = 'display:none;';
		$inv_ref_styles = '';

	}

	// replacement str
	$inv_no_str = $this_inv_reference;

	// Portal
	if ( $template === 'portal' ) {
		$inv_no_str = '<div class="zbs-normal">' . esc_html( $this_inv_reference ) . '</div>';
	}

	// == Build biz info table.

	//the business info from the settings
	$zbs_biz_name      = zeroBSCRM_getSetting( 'businessname' );
	$zbs_biz_yourname  = zeroBSCRM_getSetting( 'businessyourname' );
	$zbs_biz_extra     = zeroBSCRM_getSetting( 'businessextra' );
	$zbs_biz_youremail = zeroBSCRM_getSetting( 'businessyouremail' );
	$zbs_biz_yoururl   = zeroBSCRM_getSetting( 'businessyoururl' );

	// generate a templated biz info table
	$biz_info_table = zeroBSCRM_invoicing_generateInvPart_bizTable(
		array(
			'zbs_biz_name'      => $zbs_biz_name,
			'zbs_biz_yourname'  => $zbs_biz_yourname,
			'zbs_biz_extra'     => $zbs_biz_extra,
			'zbs_biz_youremail' => $zbs_biz_youremail,
			'zbs_biz_yoururl'   => $zbs_biz_yoururl,
			'template'          => $template,
		)
	);

	// generate a templated customer info table
	$invoice_customer_info_table_html = zeroBSCRM_invoicing_generateInvPart_custTable( $inv_to, $template );

	// == Lineitem table > Column headers
	// generate a templated customer info table
	$table_headers = zeroBSCRM_invoicing_generateInvPart_tableHeaders( $zbs_invoice_hours_or_quantity, $template );

	// == Lineitem table > Line items
	// generate a templated lineitems
	$line_items = zeroBSCRM_invoicing_generateInvPart_lineitems( $invlines, $template );

	// == Lineitem table > Totals
	// due to withTotals parameter on get above, we now don't need ot calc anything here, just expose
	$totals_table = '';

	$totals_table .= '<table id="invoice_totals" class="table-totals zebra" style="width: 100%;"><tbody>';
	if ( $invsettings['invtax'] != 0 || $invsettings['invpandp'] != 0 || $invsettings['invdis'] != 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		$totals_table .= '<tr class="total-top">';
		$totals_table .= '<td  class="bord bord-l" style="text-align:right; width: 80%; text-transform: uppercase;">' . esc_html__( 'Subtotal', 'zero-bs-crm' ) . '</td>';
		$totals_table .= '<td class="bord row-amount" class="bord" style="text-align:right; "><span class="zbs-totals">';
		if ( isset( $invoice['net'] ) && ! empty( $invoice['net'] ) ) {
			$totals_table .= esc_html( zeroBSCRM_formatCurrency( $invoice['net'] ) );
		} else {
			$totals_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
		}
		$totals_table .= '</span></td>';
		$totals_table .= '</tr>';
	}

	// discount
	if ( isset( $invoice['discount'] ) && ! empty( $invoice['discount'] ) ) {

		if ( $invsettings['invdis'] == 1 && isset( $invoice['totals'] ) && is_array( $invoice['totals'] ) && isset( $invoice['totals']['discount'] ) ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			$invoice_percent = '';
			if ( $invoice['discount_type'] == '%' && $invoice['discount'] != 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual,Universal.Operators.StrictComparisons.LooseNotEqual
				$invoice_percent = (float) $invoice['discount'] . '% ';
			}
			$totals_table .= '<tr class="discount">
				<td class="bord bord-l" style="text-align:right; text-transform: uppercase;">' . esc_html( $invoice_percent . __( 'Discount', 'zero-bs-crm' ) ) . '</td>
				<td class="bord row-amount" id="zbs_discount_combi" style="text-align:right"><span class="zbs-totals">';

			$totals_table .= '-' . esc_html( zeroBSCRM_formatCurrency( $invoice['totals']['discount'] ) );

			$totals_table .= '</td>';
			$totals_table .= '</tr>';
		}
	}

	// shipping
	if ( $invsettings['invpandp'] == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$totals_table .= '<tr class="postage_and_pack">
			<td class="bord bord-l" style="text-align:right; text-transform: uppercase;">' . esc_html__( 'Postage and packaging', 'zero-bs-crm' ) . '</td>
			<td class="bord row-amount" id="pandptotal" style="text-align:right;"><span class="zbs-totals">';
		if ( isset( $invoice['shipping'] ) && ! empty( $invoice['shipping'] ) ) {
			$totals_table .= esc_html( zeroBSCRM_formatCurrency( $invoice['shipping'] ) );
		} else {
			$totals_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
		}
		$totals_table .= '</td>';
		$totals_table .= '</tr>';
	}

	// tax
	if ( $invsettings['invtax'] == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual

		$tax_lines = false;
		if ( isset( $invoice['totals'] ) && is_array( $invoice['totals'] ) && isset( $invoice['totals']['taxes'] ) ) {
			// now calc'd in DAL
			$tax_lines = $invoice['totals']['taxes'];
		}

		if ( isset( $tax_lines ) && is_array( $tax_lines ) && count( $tax_lines ) > 0 ) {

			foreach ( $tax_lines as $tax ) {

				$tax_name = __( 'Tax', 'zero-bs-crm' );
				if ( isset( $tax['name'] ) ) {
					$tax_name = $tax['name'];
				}

				$totals_table .= '<tr class="ttclass">
					<td class="bord bord-l" style="text-align:right">' . esc_html( $tax_name ) . '</td>
					<td class="bord bord-l row-amount zbs-tax-total-span" style="text-align:right"><span class="zbs-totals">';
				if ( isset( $tax['value'] ) && ! empty( $tax['value'] ) ) {
					$totals_table .= esc_html( zeroBSCRM_formatCurrency( $tax['value'] ) );
				} else {
					$totals_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
				}
				$totals_table .= '</td>';
				$totals_table .= '</tr>';
			}
		} else {

			// simple fallback
			$totals_table .= '<tr class="ttclass">
				<td class="bord bord-l" style="text-align:right">' . esc_html__( 'Tax', 'zero-bs-crm' ) . '</td>
				<td class="bord bord-l row-amount zbs-tax-total-span" style="text-align:right"><span class="zbs-totals">';
			if ( isset( $invoice['tax'] ) && ! empty( $invoice['tax'] ) ) {
				$totals_table .= esc_html( zeroBSCRM_formatCurrency( $invoice['tax'] ) );
			} else {
				$totals_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
			}
			$totals_table .= '</td>';
			$totals_table .= '</tr>';
		}
	}

	$totals_table .= '<tr class="zbs_grand_total" style="line-height:30px;">
		<td class="bord-l"  style="text-align:right; font-weight:bold;  border-radius: 0px;"><span class="zbs-total">' . __( 'Total', 'zero-bs-crm' ) . '</span></td>
		<td class="row-amount" style="text-align:right; font-weight:bold; border: 3px double #111!important; "><span class="zbs-total">';
	if ( isset( $invoice['total'] ) && ! empty( $invoice['total'] ) ) {
		$totals_table .= esc_html( zeroBSCRM_formatCurrency( $invoice['total'] ) );
	} else {
		$totals_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
	}
	$totals_table .= '</span></td>';
	$totals_table .= '</tr>';

	$totals_table .= '</table>';

	// == Partials (Transactions against Invs)
	$partials_table = '';

	if ( $invoice['total'] == 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$partials_table .= '<table id="partials" class="hide table-totals zebra">';
	} else {
		$partials_table .= '<table id="partials" class="table-totals zebra">';
	}

	$balance = $invoice['total'];

	if ( is_array( $partials ) && count( $partials ) > 0 ) {

		// header
		$partials_table .= '<tr><td colspan="2" style="text-align:center;font-weight:bold;  border-radius: 0px;"><span class="zbs-total">' . esc_html__( 'Payments', 'zero-bs-crm' ) . '</span></td></tr>';

		foreach ( $partials as $partial ) {

			// ignore if status_bool (non-completed status)
			$partial['status_bool'] = (int) $partial['status_bool'];
			if ( isset( $partial ) && $partial['status_bool'] == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual

				// v3.0+ has + or - partials. Account for that:
				if ( $partial['type_accounting'] === 'credit' ) {
					// credit note, or refund
					$balance = $balance + $partial['total'];
				} else {
					// assume debit
					$balance = $balance - $partial['total'];
				}

				$partials_table .= '<tr class="total-top">';
				$partials_table .= '<td class="bord bord-l" style="text-align:right">' . esc_html__( 'Payment', 'zero-bs-crm' ) . '<br/>(' . esc_html( $partial['ref'] ) . ')</td>';
				$partials_table .= '<td class="bord row-amount"><span class="zbs-partial-value">';
				if ( ! empty( $partial['total'] ) ) {
					$partials_table .= esc_html( zeroBSCRM_formatCurrency( $partial['total'] ) );
				} else {
					$partials_table .= esc_html( zeroBSCRM_formatCurrency( 0 ) );
				}
				$partials_table .= '</span></td>';
				$partials_table .= '</tr>';
			}
		}
	}

	if ( $balance == $invoice['total'] ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$balance_hide = 'hide';
	} else {
		$balance_hide = '';
	}

	$partials_table .= '<tr class="zbs_grand_total' . $balance_hide . '">';
	$partials_table .= '<td class="bord bord-l" style="text-align:right; font-weight:bold;  border-radius: 0px;"><span class="zbs-minitotal">' . esc_html__( 'Amount due', 'zero-bs-crm' ) . '</td>';
	$partials_table .= '<td class="bord row-amount"><span class="zbs-subtotal-value">' . esc_html( zeroBSCRM_formatCurrency( $balance ) ) . '</span></td>';
	$partials_table .= '</tr>';
	$partials_table .= '</table>';

	// generate a templated paybutton (depends on template :))
	$potential_pay_button = zeroBSCRM_invoicing_generateInvPart_payButton( $invoice_id, $invoice['status'], $template );

	// == Payment terms, thanks etc. will only replace when present in template, so safe to generically check
	$pay_thanks = '';
	if ( $invoice['status'] === 'Paid' ) {
		$pay_thanks  = '<div class="deets"><h3>' . esc_html__( 'Thank You', 'zero-bs-crm' ) . '</h3>';
		$pay_thanks .= '<div>' . nl2br( esc_html( zeroBSCRM_getSetting( 'paythanks' ) ) ) . '</div>';
		$pay_thanks .= '</div>';
	}
	$payment_info_text = zeroBSCRM_getSetting( 'paymentinfo' );

	$pay_details  = '<div class="deets"><h2>' . esc_html__( 'Payment Details', 'zero-bs-crm' ) . '</h2>';
	$pay_details .= '<div class="deets-line"><span class="deets-content">' . nl2br( esc_html( $payment_info_text ) ) . '</span></div>';
	$pay_details .= '<div class="deets-line"><span class="deets-title">' . esc_html__( 'Payment Reference:', 'zero-bs-crm' ) . '</span> <span>' . $inv_no_str . '</span></div>';
	$pay_details .= '</div>';

	// == Template -> HTML build

	// powered by
	$powered_by = zeroBSCRM_mailTemplate_poweredByHTML();

	$view_in_portal_link   = '';
	$view_in_portal_button = '';

	// got portal?
	if ( zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
		$view_in_portal_link   = zeroBSCRM_portal_linkObj( $invoice_id, ZBS_TYPE_INVOICE );
		$view_in_portal_button = '<div style="text-align:center;margin:1em;margin-top:2em">' . zeroBSCRM_mailTemplate_emailSafeButton( $view_in_portal_link, esc_html__( 'View Invoice', 'zero-bs-crm' ) ) . '</div>';
	}

	// build replacements array
	$replacements = array(

		// invoice specific
		'invoice-title'               => __( 'Invoice', 'zero-bs-crm' ),
		'css'                         => $css_url,
		'logo-class'                  => $logo_class,
		'logo-url'                    => esc_url( $logo_url ),
		'invoice-number'              => $inv_no_str,
		'invoice-date'                => $inv_date_str,
		'invoice-id-styles'           => $inv_id_styles,
		'invoice-ref'                 => $inv_no_str,
		'invoice-ref-styles'          => $inv_ref_styles,
		'invoice-due-date'            => $due_date_str,
		'invoice-custom-fields'       => $invoice_custom_fields_html,
		'invoice-biz-class'           => $biz_info_class,
		'invoice-customer-info'       => $invoice_customer_info_table_html,
		'invoice-html-status'         => $top_status,
		'invoice-table-headers'       => $table_headers,
		'invoice-line-items'          => $line_items,
		'invoice-totals-table'        => $totals_table,
		'invoice-partials-table'      => $partials_table,
		'invoice-pay-button'          => $potential_pay_button,
		'pre-invoice-payment-details' => '',
		'invoice-payment-details'     => $pay_details,
		'invoice-pay-thanks'          => $pay_thanks,

		// client portal
		'portal-view-button'          => $view_in_portal_button,
		'portal-link'                 => $view_in_portal_link,

		// language
		'invoice-label-inv-number'    => __( 'Invoice number', 'zero-bs-crm' ) . ':',
		'invoice-label-inv-date'      => __( 'Invoice date', 'zero-bs-crm' ) . ':',
		'invoice-label-inv-ref'       => $zbs->settings->get( 'reflabel' ),
		'invoice-label-status'        => __( 'Status:', 'zero-bs-crm' ),
		'invoice-label-from'          => __( 'From', 'zero-bs-crm' ) . ':',
		'invoice-label-to'            => __( 'To', 'zero-bs-crm' ) . ':',
		'invoice-label-due-date'      => __( 'Due date', 'zero-bs-crm' ) . ':',
		'invoice-pay-terms'           => __( 'Payment terms', 'zero-bs-crm' ) . ': ' . __( 'Due', 'zero-bs-crm' ) . ' ',

		// global
		'biz-info'                    => $biz_info_table,
		'powered-by'                  => $powered_by,

	);

	// Switch. If partials, put the payment deets on the left next to the partials,
	// rather than in it's own line:
	if ( ! empty( $partials_table ) ) {
		// partials, split to two columns
		$replacements['pre-invoice-payment-details'] = $pay_details;
		$replacements['invoice-payment-details']     = '';
	}

	// replace vars
	$html = $placeholder_templating->replace_placeholders(
		array( 'invoice', 'global', 'contact', 'company' ),
		$html,
		$replacements,
		array(
			ZBS_TYPE_INVOICE   => $invoice,
			$inv_to['objtype'] => $inv_to,
		)
	);

	// ================= / CONTENT BUILDING =================================

	return $html;
}

// Used to generate specific part of invoice pdf: Biz table (Pay To)
function zeroBSCRM_invoicing_generateInvPart_bizTable($args=array()){

	#} =========== LOAD ARGS ==============
	$defaultArgs = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		'zbs_biz_name'      => '',
		'zbs_biz_yourname'  => '',
		'zbs_biz_extra'     => '',
		'zbs_biz_youremail' => '',
		'zbs_biz_yoururl'   => '',

		'template'          => 'pdf', // this'll choose between the html output variants below, e.g. pdf, portal, notification

    ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
	#} =========== / LOAD ARGS =============

	$biz_info_table = '';

	switch ( $template ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

		case 'pdf':
		case 'notification':
			$biz_info_table  = '<div class="zbs-line-info zbs-line-info-title">' . esc_html( $zbs_biz_name ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $zbs_biz_yourname ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div class="zbs-line-info">' . nl2br( esc_html( $zbs_biz_extra ) ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $zbs_biz_youremail ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div class="zbs-line-info">' . esc_html( $zbs_biz_yoururl ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			break;

		case 'portal':
			$biz_info_table  = '<div class="pay-to">';
			$biz_info_table .= '<div class="zbs-portal-label">' . esc_html__( 'Pay To', 'zero-bs-crm' ) . '</div>';
			$biz_info_table .= '<div class="zbs-portal-biz">';
			$biz_info_table .= '<div class="pay-to-name">' . esc_html( $zbs_biz_name ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div>' . esc_html( $zbs_biz_yourname ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div>' . nl2br( esc_html( $zbs_biz_extra ) ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div>' . esc_html( $zbs_biz_youremail ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '<div>' . esc_html( $zbs_biz_yoururl ) . '</div>'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
			$biz_info_table .= '</div>';
			$biz_info_table .= '</div>';
			break;

	}

	return $biz_info_table;
}
/** // phpcs:ignore Squiz.Commenting.FunctionComment.MissingParamTag,Generic.Commenting.DocComment.MissingShort
 * Used to generate specific part of invoice pdf: (Customer table)
 **/
function zeroBSCRM_invoicing_generateInvPart_custTable( $inv_to = array(), $template = 'pdf' ) {

	$invoice_customer_info_table_html = '<div class="customer-info-wrapped">';

	switch ( $template ) {
		case 'pdf':
		case 'notification':
			if ( isset( $inv_to['fname'] ) && isset( $inv_to['fname'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info zbs-line-info-title">' . esc_html( $inv_to['fname'] ) . ' ' . esc_html( $inv_to['lname'] ) . '</div>';
			}
			if ( isset( $inv_to['addr1'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['addr1'] ) . '</div>';
			}
			if ( isset( $inv_to['addr2'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['addr2'] ) . '</div>';
			}
			if ( isset( $inv_to['city'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['city'] ) . '</div>';
			}
			if ( isset( $inv_to['county'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['county'] ) . '</div>';
			}
			if ( isset( $inv_to['postcode'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['postcode'] ) . '</div>';
			}
			if ( isset( $inv_to['country'] ) ) {
				$invoice_customer_info_table_html .= '<div class="zbs-line-info">' . esc_html( $inv_to['country'] ) . '</div>';
			}

			// Append custom fields if specified in settings
			$invoice_customer_info_table_html .= jpcrm_invoicing_generate_customer_custom_fields_lines( $inv_to, $template );

			// the abilty to add in extra info to the customer info area.
			$extra_cust_info = '';
			$extra_cust_info = apply_filters( 'zbs_invoice_customer_info_line', $extra_cust_info );

			$invoice_customer_info_table_html .= $extra_cust_info;
			break;

		case 'portal':
			$invoice_customer_info_table_html .= '<div class="pay-to">';
			$invoice_customer_info_table_html .= '<div class="zbs-portal-label">' . esc_html__( 'Invoice To', 'zero-bs-crm' ) . '</div><div style="margin-top:18px;">&nbsp;</div>';
			$invoice_customer_info_table_html .= '<div class="zbs-portal-biz">';
			if ( isset( $inv_to['fname'] ) && isset( $inv_to['fname'] ) ) {
				$invoice_customer_info_table_html .= '<div class="pay-to-name">' . esc_html( $inv_to['fname'] ) . ' ' . esc_html( $inv_to['lname'] ) . '</div>';
			}
			if ( isset( $inv_to['addr1'] ) ) {
				$invoice_customer_info_table_html .= '<div>' . esc_html( $inv_to['addr1'] ) . '</div>';
			}
			if ( isset( $inv_to['addr2'] ) ) {
				$invoice_customer_info_table_html .= '<div>' . esc_html( $inv_to['addr2'] ) . '</div>';
			}
			if ( isset( $inv_to['city'] ) ) {
				$invoice_customer_info_table_html .= '<div>' . esc_html( $inv_to['city'] ) . '</div>';
			}
			if ( isset( $inv_to['postcode'] ) ) {
				$invoice_customer_info_table_html .= '<div>' . esc_html( $inv_to['postcode'] ) . '</div>';
			}

			// Append custom fields if specified in settings
			$invoice_customer_info_table_html .= jpcrm_invoicing_generate_customer_custom_fields_lines( $inv_to, $template );

			// the abilty to add in extra info to the customer info area.
			$extra_cust_info = apply_filters( 'zbs_invoice_customer_info_line', '' );

			$invoice_customer_info_table_html .= $extra_cust_info;
			$invoice_customer_info_table_html .= '</div>';
			$invoice_customer_info_table_html .= '</div>';
			break;

	}

		$invoice_customer_info_table_html .= '</div>';

		//filter the whole thing if you really want to modify it
		$invoice_customer_info_table_html = apply_filters( 'zbs_invoice_customer_info_table', $invoice_customer_info_table_html );

		return $invoice_customer_info_table_html;
}





/*
* Generates html string to output customer (contact or company) custom field lines for templating
*
* @param array $customer - a contact|company object
* @param string $template - 'pdf', 'notification', or 'portal'
* 
* @return string HTML
*/
function jpcrm_invoicing_generate_customer_custom_fields_lines( $customer, $template ){

    global $zbs;

    $customer_custom_fields_html = '';

    // retrieve custom fields to pass through
    // contact or company?
    if ( $customer['objtype'] == ZBS_TYPE_CONTACT ){

        $custom_fields_to_include = zeroBSCRM_getSetting( 'contactcustomfields' );

    } elseif ( $customer['objtype'] == ZBS_TYPE_COMPANY ){

        $custom_fields_to_include = zeroBSCRM_getSetting( 'companycustomfields' );

    } else {

        // no type? ¯\_(ツ)_/¯
        return '';

    }
    
    
    if ( !empty( $custom_fields_to_include ) ){

        // split the csv
        $custom_fields_to_include = array_map( 'trim', explode( ',',  $custom_fields_to_include ) );

        // retrieve fields
        $invoice_custom_fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => $customer['objtype'] ) );

        // build custom fields string. 
        // here we immitate what we expect the HTML to be, which will be errorsome if people modify heavily.
        // for now it's better than no custom fields, let's see if people have issue with this approach.
        foreach ( $invoice_custom_fields as $field_key => $field_info){

            // where user has set the field in settings
            if ( in_array( $field_key, $custom_fields_to_include ) ){

                $custom_field_str = '';

                if ( isset( $customer[ $field_key ] ) && $customer[ $field_key ] ){

                    $custom_field_str = $customer[ $field_key ];

                    // catch formatted dates
                    if ( isset( $customer[ $field_key . '_cfdate' ] ) ){

                        $custom_field_str = $customer[ $field_key . '_cfdate' ];

                    }

                }

				// skip empties
				if ( empty( $custom_field_str ) ) {
						continue;
				}

				switch ( $template ) {

					case 'pdf':
					case 'notification':
						$customer_custom_fields_html .= '<div class="zbs-line-info">' . esc_html( $field_info[1] ) . ': ' . esc_html( $custom_field_str ) . '</div>';
						break;

					case 'portal':
						$customer_custom_fields_html .= '<div><strong>' . esc_html( $field_info[1] ) . ':</strong> ' . esc_html( $custom_field_str ) . '</div>';
						break;

				}
			}
		}
	}

	return $customer_custom_fields_html;
}


/*
* Generates html string to output invoice custom field lines for templating
*
* @param array $invoice - an invoice object
* @param string $template - 'pdf', 'notification', or 'portal'
* 
* @return string HTML
*/
function jpcrm_invoicing_generate_invoice_custom_fields_lines( $invoice, $template ){

    global $zbs;

    $invoice_custom_fields_html = '';

    // retrieve custom fields to pass through
    $custom_fields_to_include = zeroBSCRM_getSetting( 'invcustomfields' );
    if ( !empty( $custom_fields_to_include ) ){

        // split the csv
        $custom_fields_to_include = array_map( 'trim', explode( ',',  $custom_fields_to_include ) );

        // retrieve fields
        $invoice_custom_fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_INVOICE ) );

        // build custom fields string. 
        // here we immitate what we expect the HTML to be, which will be errorsome if people modify heavily.
        // for now it's better than no custom fields, let's see if people have issue with this approach.
        foreach ( $invoice_custom_fields as $field_key => $field_info){

            // where user has set the field in settings
            if ( in_array( $field_key, $custom_fields_to_include ) ){

                $custom_field_str = '';

                if ( $invoice[ $field_key ] ){

                    $custom_field_str = $invoice[ $field_key ];

                    // catch formatted dates
                    if ( isset( $invoice[ $field_key . '_cfdate' ] ) ){

                        $custom_field_str = $invoice[ $field_key . '_cfdate' ];

                    }
                }

				// skip empties
				if ( empty( $custom_field_str ) ) {
						continue;
				}

				switch ( $template ) {

					case 'pdf':
					case 'notification':
						$invoice_custom_fields_html .= '<tr class="zbs-top-right-box-line">';
						$invoice_custom_fields_html .= '    <td><label for="' . esc_attr( $field_key ) . '">' . esc_html( $field_info[1] ) . ':</label></td>';
						$invoice_custom_fields_html .= '    <td style="text-align:right;">' . esc_html( $custom_field_str ) . '</td>';
						$invoice_custom_fields_html .= '</tr>';
						break;

					case 'portal':
						$invoice_custom_fields_html .= '<div><strong>' . esc_html( $field_info[1] ) . ':</strong> ' . esc_html( $custom_field_str ) . '</div>';
						break;
				}
			}
		}
	}

	return $invoice_custom_fields_html;
}


// Used to generate specific part of invoice pdf: (Lineitem row in inv table)
// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
function zeroBSCRM_invoicing_generateInvPart_lineitems( $invlines = array(), $template = 'pdf' ) {

	$line_item_html = '';

	switch ( $template ) {

		case 'pdf':
			if ( $invlines != '' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
				$i = 1;
				foreach ( $invlines as $invline ) {

					$line_item_html .=
						'<tr>
						<td style="width:55%;"><div class="item-name">' . esc_html( $invline['title'] ) . '</div><div class="item-description">' . nl2br( esc_html( $invline['desc'] ) ) . '</div></td>
						<td style="width:15%;text-align:center;" class="cen">' . esc_html( zeroBSCRM_format_quantity( $invline['quantity'] ) ) . '</td>
						<td style="width:15%;text-align:center;" class="cen">' . esc_html( zeroBSCRM_formatCurrency( $invline['price'] ) ) . '</td>
						<td style="width:15%;text-align:right;" class="row-amount">' . esc_html( zeroBSCRM_formatCurrency( $invline['net'] ) ) . '</td>
						</tr>';

					++$i;

				}
			}

			break;

		case 'portal':
			if ( $invlines != '' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
				$i = 1;
				foreach ( $invlines as $invline ) {

					$line_item_html .=
						'<tbody class="zbs-item-block" data-tableid="' . esc_attr( $i ) . '" id="tblock' . esc_attr( $i ) . '">
						<tr class="top-row">
						<td style="width:50%">' . esc_html( $invline['title'] ) . '<br/><span class="dz">' . nl2br( esc_html( $invline['desc'] ) ) . '</span></td>
						<td style="width:15%;text-align:center;" rowspan="3" class="cen">' . esc_html( zeroBSCRM_format_quantity( $invline['quantity'] ) ) . '</td>
						<td style="width:15%;text-align:center;" rowspan="3"class="cen">' . esc_html( zeroBSCRM_formatCurrency( $invline['price'] ) ) . '</td>
						<td style="width:15%;text-align:right;" rowspan="3" class="row-amount">' . esc_html( zeroBSCRM_formatCurrency( $invline['net'] ) ) . '</td>
						</tr>
						</tbody>';

					++$i;
				}
			}

			break;

		case 'notification':
			if ( $invlines != '' ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
				$i = 1;
				foreach ( $invlines as $invline ) {

					$line_item_html = '<tbody class="zbs-item-block" data-tableid="' . esc_attr( $i ) . '" id="tblock' . esc_attr( $i ) . '">';
					foreach ( $invlines as $invline ) {

						$line_item_html .= '
							<tr class="top-row">
							<td style="width:70%;font-weight:bold">' . esc_html( $invline['title'] ) . '</td>
							<td style="width:7.5%;text-align:center;" rowspan="3" class="cen">' . esc_html( $invline['quantity'] ) . '</td>
							<td style="width:7.5%;text-align:center;" rowspan="3"class="cen">' . esc_html( zeroBSCRM_formatCurrency( $invline['price'] ) ) . '</td>
							<td style="width:7.5%;text-align:right;" rowspan="3" class="row-amount">' . esc_html( zeroBSCRM_formatCurrency( $invline['net'] ) ) . '</td>
							</tr>
							<tr class="bottom-row">
							<td colspan="4" class="tapad">' . esc_html( $invline['desc'] ) . '</td>
							</tr>
							<tr class="add-row"></tr>';

						++$i;
					}

					$line_item_html .= '</tbody>';

					++$i;
				}
			}

			break;

	}

	return $line_item_html;
}
// Used to generate specific part of invoice pdf: (pay button)
function zeroBSCRM_invoicing_generateInvPart_payButton( $invoice_id = -1, $status = '', $template = 'pdf' ) { // phpcs:ignore Squiz.Commenting.FunctionComment.WrongStyle

	$potential_pay_button = '';

	switch ( $template ) {

		case 'pdf':
			$potential_pay_button = '';
			break;

		case 'portal':
			if ( $status !== 'Paid' ) {

				// need to add somethere here which stops the below if WooCommerce meta set
				// so the action below will fire in WooSync, and remove the three filters below
				// https://codex.wordpress.org/Function_Reference/remove_filter
				// and then filter itself in. EDIT the remove filter does not seem to remove them below
				// think they already need to be applied (i.e. this below). The below works but should
				// think how best to do this for further extension later?

				// WH: This'll be the ID if woo doesn't return a button (e.g. it's a woo inv so don't show pay buttons)
				$potential_woo_pay_button_or_inv_id = apply_filters( 'zbs_woo_pay_invoice', $invoice_id );

				if ( $potential_woo_pay_button_or_inv_id == $invoice_id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
					$potential_pay_button = apply_filters( 'invpro_pay_online', $invoice_id );
				} else {
					$potential_pay_button = $potential_woo_pay_button_or_inv_id;
				}

				if ( $potential_pay_button == $invoice_id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
					$potential_pay_button = '';
				}
			}

			break;

		case 'notification':
			$potential_pay_button = '';
			break;

	}

	return $potential_pay_button;
}
// Used to generate specific part of invoice pdf: (table headers)
// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
function zeroBSCRM_invoicing_generateInvPart_tableHeaders( $zbs_invoice_hours_or_quantity = 1, $template = 'pdf' ) {

	$table_headers = '';

	switch ( $template ) {

		case 'pdf':
			$table_headers = '<th style="text-align:left;"><span class="table-title">' . esc_html__( 'Description', 'zero-bs-crm' ) . '</span></th>';

			if ( $zbs_invoice_hours_or_quantity == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
				$table_headers .= '<th id="zbs_inv_qoh"><span class="table-title">' . esc_html__( 'Quantity', 'zero-bs-crm' ) . '</th>';
				$table_headers .= '<th id="zbs_inv_por"><span class="table-title">' . esc_html__( 'Price', 'zero-bs-crm' ) . '</th>';
			} else {
				$table_headers .= '<th id="zbs_inv_qoh"><span class="table-title">' . esc_html__( 'Hours', 'zero-bs-crm' ) . '</th>';
				$table_headers .= '<th id="zbs_inv_por"><span class="table-title">' . esc_html__( 'Rate', 'zero-bs-crm' ) . '</th>';
			}
			$table_headers .= '<th style="text-align: right;"><span class="table-title">' . esc_html__( 'Amount', 'zero-bs-crm' ) . '</span></th>';

			break;

		case 'portal':
			$table_headers = '<th class="left">' . esc_html__( 'Description', 'zero-bs-crm' ) . '</th>';

			if ( $zbs_invoice_hours_or_quantity == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
					$table_headers .= '<th class="cen" id="zbs_inv_qoh">' . esc_html__( 'Quantity', 'zero-bs-crm' ) . '</th>';
					$table_headers .= '<th class="cen" id="zbs_inv_por">' . esc_html__( 'Price', 'zero-bs-crm' ) . '</th>';
			} else {
					$table_headers .= '<th class="cen" id="zbs_inv_qoh"> ' . esc_html__( 'Hours', 'zero-bs-crm' ) . '</th>';
					$table_headers .= '<th class="cen" id="zbs_inv_por">' . esc_html__( 'Rate', 'zero-bs-crm' ) . '</th>';
			}

			$table_headers .= '<th class="ri">' . esc_html__( 'Amount', 'zero-bs-crm' ) . '</th>';

			break;

		case 'notification':
			if ( $zbs_invoice_hours_or_quantity == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
				$table_headers = '<th class="left">' . esc_html__( 'Description', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Quantity', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Price', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Total', 'zero-bs-crm' ) . '</th>';
			} else {
				$table_headers = '<th class="left">' . esc_html__( 'Description', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Hours', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Rate', 'zero-bs-crm' ) . '</th><th>' . esc_html__( 'Total', 'zero-bs-crm' ) . '</th>';
			}

			break;
	}

	return $table_headers;
}
