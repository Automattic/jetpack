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


// Centralised date processing for invoices,
// DAL2 will thankfully do away with this? (timezone sensitive?)
function zeroBSCRM_invoiceBuilder_dateMetaToDate($zbs_inv_meta=array(),$plusDays=0,$returnAsUTS=false){

    $inv_date = '';
    if (isset($zbs_inv_meta['date']) && $zbs_inv_meta['date'] != 'Invalid Date'){
        $dt = zeroBSCRM_locale_dateToUTS($zbs_inv_meta['date']);
        // this only happens when people have $date in one format, but their settings match a diff setting                                
    // NOTE there is NO TIME used here, so we use post_date_gmt + 'true' for isGMT in  zeroBSCRM_date_i18n
        if ($dt !== false) {
            if ($plusDays !== 0) $dt += ($plusDays*86400);  

            // return as uts?
            if ($returnAsUTS) return $dt;
            // or date?
            $inv_date = zeroBSCRM_date_i18n(-1,$dt,false,true);
        }
    }else{

        $dt = time();
        if ($plusDays !== 0) $dt += ($plusDays*86400);    
        // return as uts?
        if ($returnAsUTS) return $dt;
        // or date?    
        $inv_date = zeroBSCRM_date_i18n(-1,$dt);
    }

    return $inv_date;
}

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

    global $zbs;

    #} download flag
    if ( isset($_POST['zbs_invoicing_download_pdf'])  ) {

        #} THIS REALLLY needs nonces! For now (1.1.19) added this for you...
        if (!zeroBSCRM_permsInvoices()) exit();

        #} Check ID
        $invoiceID = -1;
        if (isset($_POST['zbs_invoice_id']) && !empty($_POST['zbs_invoice_id'])) $invoiceID = (int)sanitize_text_field($_POST['zbs_invoice_id']);
        if ($invoiceID <= 0) exit();

        // generate the PDF
        $pdfFileLocation = zeroBSCRM_generateInvoicePDFFile($invoiceID);

        if ($pdfFileLocation !== false){

            $invoice = $zbs->DAL->invoices->getInvoice( $invoiceID );
            $ref = $invoice[ 'id_override' ];

            if ( empty( $ref ) ) {
                $ref = $invoiceID;
            }

            //print the pdf file to the screen for saving
            header('Content-type: application/pdf');
            header('Content-Disposition: attachment; filename="invoice-' . $ref . '.pdf"' );
            header('Content-Transfer-Encoding: binary');
            header('Content-Length: ' . filesize($pdfFileLocation));
            header('Accept-Ranges: bytes');
            readfile($pdfFileLocation);

            //delete the PDF file once it's been read (i.e. downloaded)
            unlink($pdfFileLocation); 

        }

        exit();
    }

}
#} This fires post ZBS init
add_action('zerobscrm_post_init','zbs_invoice_generate_pdf');

#} V3.0 can generate invoice pdf files without sending them
#} ... used for attaching pdf's to emails etc.
function zeroBSCRM_generateInvoicePDFFile( $invoice_id = -1 ) {

    global $zbs;

    // brutal.
    if ( !zeroBSCRM_permsInvoices() ){
        return false;
    }

    // If user has no perms, or id not present, die
    if ( $invoice_id <= 0 ){
        
        return false;
        
    }

    // Generate html
    $html = zeroBSCRM_invoice_generateInvoiceHTML( $invoice_id );

    // build PDF
    $dompdf = $zbs->pdf_engine();
    $dompdf->loadHtml( $html, 'UTF-8' );
    $dompdf->render();

    $upload_dir = wp_upload_dir();        
    $zbsInvoiceDir = $upload_dir['basedir'].'/invoices/';

    if ( ! file_exists( $zbsInvoiceDir ) ) {
        wp_mkdir_p( $zbsInvoiceDir );
    }
    
    $file_to_save = $zbsInvoiceDir . $invoice_id . '.pdf';

    // save the pdf file on the server
    file_put_contents( $file_to_save, $dompdf->output() ); 
    
    return $file_to_save;

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

#} Generates the HTML of an invoice based on the template in templates/invoices/statement-pdf.html
#} if $return, it'll return, otherwise it'll echo + exit
function zeroBSCRM_invoicing_generateStatementHTML($contactID=-1,$return=true){

    global $zbs;

    if (!empty($contactID) && $contactID > 0){

        // Discern template and retrieve    
        $global_statement_pdf_template = zeroBSCRM_getSetting( 'statement_pdf_template' );
        if ( !empty( $global_statement_pdf_template ) ){
            $templatedHTML = jpcrm_retrieve_template( $global_statement_pdf_template, false );
        }

        // fallback to default template
        if ( !isset( $templatedHTML ) || empty( $templatedHTML ) ){

            // template failed as setting potentially holds out of date (removed) template
            // so use the default
            $templatedHTML = jpcrm_retrieve_template( 'invoices/statement-pdf.html', false );

        }

        #} Act
        if (!empty($templatedHTML)){

            global $zbs;

            return zeroBSCRM_invoicing_generateStatementHTML_v3($contactID,$return,$templatedHTML);

        }

    } 

    #} Empty inv id
    return false;
}

// 3.0+ (could now run off contact or company, but that's not written in yet)
function zeroBSCRM_invoicing_generateStatementHTML_v3($contactID=-1,$return=true,$templatedHTML=''){

    if ($contactID > 0 && $templatedHTML !== ''){

        global $zbs,$wpdb;

        #} Globals
        $bizName = zeroBSCRM_getSetting('businessname');
        $bizContactName =  zeroBSCRM_getSetting('businessyourname');
        $bizContactEmail =  zeroBSCRM_getSetting('businessyouremail');
        $bizURL =  zeroBSCRM_getSetting('businessyoururl');
        $bizExtra = zeroBSCRM_getSetting('businessextra');
        $bizTel = zeroBSCRM_getSetting('businesstel');
        $statementExtra = zeroBSCRM_getSetting('statementextra');
        $logoURL = zeroBSCRM_getSetting('invoicelogourl');

        // invoices          
        $invoices = $zbs->DAL->invoices->getInvoices(array(

            'assignedContact'   => $contactID, // assigned to contact id (int)
            'assignedCompany'   => false, // assigned to company id (int)

            // returns
            'withLineItems'     => true,
            'withCustomFields'  => true,
            'withTransactions'  => true, // partials
            'withTags'          => false,

            // sort
            'sortByField'   => 'ID',
            'sortOrder'     => 'ASC',

        ));

        // statement table wrapper
        $statementTable = '<table id="zbs-statement-table" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#FFF;width:100%;">';

            // logo header
            if (!empty($logoURL)) $statementTable .= '<tr><td colspan="3" style="text-align:right"><img src="'.$logoURL.'" alt="'.$bizName.'" style="max-width:200px;max-height:140px" /></td></tr>';


            // title
            $statementTable .= '<tr><td colspan="3"><h2 class="zbs-statement">'.__('STATEMENT','zero-bs-crm').'</h2></td></tr>';


            // address | dates | biz deets line
            $statementTable .= '<tr>';

                // contact address

                    // get co addr
                    $coAddr = '';
                        // v3.0
                        $contactDetails = $zbs->DAL->contacts->getContact($contactID,array(
                            'withCustomFields'  => true,
                            // anything else?
                            'withQuotes'        => false,
                            'withInvoices'      => false,
                            'withTransactions'  => false,
                            'withLogs'          => false,
                            'withLastLog'       => false,
                            'withTags'          => false,
                            'withCompanies'     => false,
                            'withOwner'         => false,
                            'withValues'        => false
                        ));
                    if (is_array($contactDetails) && isset($contactDetails['fname'])){
                        $invoice_customer_info_table_html = '<div class="zbs-line-info zbs-line-info-title">'.$contactDetails['fname'].' ' .$contactDetails['lname'] . '</div>';
                        if (isset($contactDetails['addr1']) && !empty($contactDetails['addr1'])) $invoice_customer_info_table_html .= '<div class="zbs-line-info">'.$contactDetails['addr1'].'</div>';
                        if (isset($contactDetails['addr2']) && !empty($contactDetails['addr2'])) $invoice_customer_info_table_html .= '<div class="zbs-line-info">'.$contactDetails['addr2'].'</div>';
                        if (isset($contactDetails['city']) && !empty($contactDetails['city'])) $invoice_customer_info_table_html .= '<div class="zbs-line-info">'.$contactDetails['city'].'</div>';
                        if (isset($contactDetails['county']) && !empty($contactDetails['county'])) $invoice_customer_info_table_html .= '<div class="zbs-line-info">'.$contactDetails['county'].'</div>';
                        if (isset($contactDetails['postcode']) && !empty($contactDetails['postcode'])) $invoice_customer_info_table_html .= '<div class="zbs-line-info">'.$contactDetails['postcode'].'</div>';
                    }

                    // add
                    $statementTable .= '<td><div style="text-align:left">'.$invoice_customer_info_table_html.'</div></td>';

                // Dates
                $statementTable .= '<td>';
                    $statementTable .= '<div class="zbs-statement-date"><strong>'.__('Statement Date','zero-bs-crm').'</strong><br />'.zeroBSCRM_locale_utsToDate(time()).'</div>';
                    // VAT NUMBER? Not req. in quote of 23/10/2018 $statementTable .= '<div class=""><strong>'.__('Statement Date','zero-bs-crm').'<strong><br />'.zeroBSCRM_locale_utsToDate(time()).'</div>';
                $statementTable .= '</td>';

                // Biz deets

                    // get biz deets
                    $bizInfoTable = '<div class="zbs-line-info zbs-line-info-title">'.$bizName.'</div>';
                    if (!empty($bizContactName)) $bizInfoTable .= '<div class="zbs-line-info">'.$bizContactName.'</div>';
                    if (!empty($bizExtra)) $bizInfoTable .= '<div class="zbs-line-info">'.zeroBSCRM_textExpose(nl2br($bizExtra)).'</div>';
                    if (!empty($bizContactEmail)) $bizInfoTable .= '<div class="zbs-line-info">'.$bizContactEmail.'</div>';
                    if (!empty($bizURL)) $bizInfoTable .= '<div class="zbs-line-info">'.$bizURL.'</div>';
                    if (!empty($bizTel)) $bizInfoTable .= '<div class="zbs-line-info">'.$bizTel.'</div>';

                    // add
                    $statementTable .= '<td><div class="zbs-biz-info">'.$bizInfoTable.'</div></td>';

            $statementTable .= '</tr>';

        // STATEMENT table

            // start
            $sTable = '<table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#FFF;width:100%">';

                // header
                $sTable .= '<tr><th cellpadding="0" cellspacing="0" >'.__('Date','zero-bs-crm').'</th>';
                $sTable .= '<th cellpadding="0" cellspacing="0" >' . $zbs->settings->get('reflabel') . '</th>';
                $sTable .= '<th cellpadding="0" cellspacing="0" >'.__('Due date','zero-bs-crm').'</th>';
                $sTable .= '<th class="zbs-accountant-td" style="text-align:right">'.__('Amount','zero-bs-crm').'</th>';
                $sTable .= '<th class="zbs-accountant-td" style="text-align:right">'.__('Payments','zero-bs-crm').'</th>';
                $sTable .= '<th class="zbs-accountant-td" style="text-align:right">'.__('Balance','zero-bs-crm').'</th></tr>';

                // should be all of em so can do 'outstanding balance' from this
                $balanceDue = 0.00;

                // rows. (all invs for this contact)
                if (is_array($invoices) && count($invoices) > 0){

                    foreach ($invoices as $invoice){

                            // number
                            $invoiceReference = $invoice['id'];
                            if (isset($invoice['id_override']) && !empty($invoice['id_override'])) {
                                $invoiceReference = $invoice['id_override'];
                            }

                            // date
                            $invoiceDate = $invoice['date_date'];

                            // due
                            if ($invoice['due_date'] <= 0){
                                
                                //no due date;
                                $dueDateStr = __("No due date", "zero-bs-crm");

                            } else {

                                $dueDateStr = $invoice['due_date_date'];

                                // is it due?
                                if (zeroBSCRM_invoiceBuilder_isInvoiceDue($invoice)) $dueDateStr .= ' ['.__('Due','zero-bs-crm').']';
                            
                            }

                            // status
                            if (!isset($invoice['status'])) 
                                $zbs_stat = __('Draft','zero-bs-crm');
                            else
                                $zbs_stat = $invoice['status'];     

                            // inv lines
                            $invlines = $invoice['lineitems'];

                            // is this stored same format?
                            $zbsInvoiceHorQ = $invoice['hours_or_quantity'];

                            // partials = transactions associated in v3.0 model
                            $partials = $invoice['transactions'];

                            // ================= / DATA RETRIEVAL ===================================


                        // total etc.
                        $total = 0.00; $payments = 0.00; $balance = 0.00;
                        if (isset($invoice['total']) && $invoice['total'] > 0) {
                            $total = $invoice['total'];
                            $balance = $total;
                        }

                        // 2 ways here - if marked 'paid', then assume balance
                        // ... if not, then trans allocation check
                        if (isset($invoice['status']) && $invoice['status'] == __('Paid','zero-bs-crm')) {

                            // assume fully paid
                            $balance = 0.00;
                            $payments = $total;

                        } else {

                            // cycle through partial trans + calc
                            if (is_array($partials)){

                                foreach ($partials as $partial){ 

                                    // ignore if status_bool (non-completed status)
                                    $partial['status_bool'] = (int)$partial['status_bool'];
                                    if (isset($partial) && $partial['status_bool'] == 1 && isset($partial['total']) && $partial['total'] > 0){

                                        // v3.0+ has + or - partials. Account for that:
                                        if ($partial['type_accounting'] == 'credit'){
                                            
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

                        }

                        // now we add any outstanding bal to the total bal for table
                        if ($balance > 0) $balanceDue += $balance;


                        // output
                        $sTable .= '<tr><td>'.$invoiceDate.'</td>';
                        $sTable .= '<td>'.$invoiceReference.'</td>';
                        $sTable .= '<td>'.$dueDateStr.'</td>';
                        $sTable .= '<td class="zbs-accountant-td">'.zeroBSCRM_formatCurrency($total).'</td>';
                        $sTable .= '<td class="zbs-accountant-td">'.zeroBSCRM_formatCurrency($payments).'</td>';
                        $sTable .= '<td class="zbs-accountant-td">'.zeroBSCRM_formatCurrency($balance).'</td></tr>';


                    }
                
                } else {

                    // No invoices?           
                    $sTable .= '<tr><td colspan="6" style="text-align:center;font-size:14px;font-weight:bold;padding:2em">'.__('No Activity','zero-bs-crm').'</td></tr>';

                }


                // footer                  
                $sTable .= '<tr class="zbs-statement-footer"><td colspan="6">'.__('BALANCE DUE','zero-bs-crm').' '.zeroBSCRM_formatCurrency($balanceDue).'</td></tr>';


            // close table
            $sTable .= '</table>';

            // add
            $statementTable .= '<tr><td colspan="3">'.$sTable.'</td></tr>';


        // Extra Info
        $statementTable .= '<tr><td colspan="3" style="text-align:left;padding: 30px;">'.zeroBSCRM_textExpose(nl2br($statementExtra)).'</td></tr>';

        // close table
        $statementTable .= '</table>';

        // load templating
        $placeholder_templating = $zbs->get_templating();

        // main content build
        $html = $placeholder_templating->replace_single_placeholder( 'invoice-statement-html', $statementTable, $templatedHTML );

        // return
        if ( !$return ){
            
            echo $html; 
            exit(); 
            
        }

        return $html;

    } // /if anything

    return false;
}


// Generate an invoice as html (where the actual holder-html is passed)
// ... this is a refactor of what was being replicated 3 places 
// ... 1) Invoice PDF Gen (zeroBSCRM_invoice_generateInvoiceHTML)
// ... 2) Invoice Portal Gen (zeroBSCRM_invoice_generatePortalInvoiceHTML)
// ... 3) Invoice email notification Gen (zeroBSCRM_invoice_generateNotificationHTML in mail-templating.php)
// ... now the generic element of the above are all wired through here :) 
// Note:
// $template is crucial. pdf | portal | notification *currently v3.0
function zeroBSCRM_invoicing_generateInvoiceHTML($invoiceID=-1,$template='pdf',$html=''){

	global $zbs;

	// load templating
	$placeholder_templating = $zbs->get_templating();

	// need this.
	if ( $invoiceID <= 0 || $html == '' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,Universal.Operators.StrictComparisons.LooseEqual
		return '';
	}

	// for v3.0 WH split out the data-retrieval from scattering amongst this func, unified here:
	// translated the below cpt way into dal / v3.0:

	// ================== DATA RETRIEVAL ===================================

	$invoice = $zbs->DAL->invoices->getInvoice( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$invoiceID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
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
	$zbsCustomerID = -1; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	if ( is_array( $invoice ) && isset( $invoice['contact'] ) && is_array( $invoice['contact'] ) && count( $invoice['contact'] ) > 0 ) {
		$zbsCustomerID = $invoice['contact'][0]['id']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}
	$zbsCompanyID = -1; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	if ( is_array( $invoice ) && isset( $invoice['company'] ) && is_array( $invoice['company'] ) && count( $invoice['company'] ) > 0 ) {
		$zbsCompanyID = $invoice['company'][0]['id']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// date
	$invDateStr = jpcrm_uts_to_date_str( $invoice['date'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// due
	if ( $invoice['due_date'] <= 0 ) {

		//no due date
		$dueDateStr = __( 'No due date', 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	} else {

		$dueDateStr = jpcrm_uts_to_date_str( $invoice['due_date'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// Custom fields
	$invoice_custom_fields_html = jpcrm_invoicing_generate_invoice_custom_fields_lines( $invoice, $template );

	// status
	if ( ! isset( $invoice['status'] ) ) {
		$zbs_stat = __( 'Draft', 'zero-bs-crm' );
	} else {
		$zbs_stat = $invoice['status'];
	}

	// status html:
	if ( $template === 'portal' ) {

		// portal version: Includes status label and amount (shown at top of portal invoice)
		$topStatus  = '<div class="zbs-portal-label">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$topStatus .= esc_html( $zbs_stat ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$topStatus .= '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// WH added quickly to get around fact this is sometimes empty, please tidy when you address currency formatting :)
		$inv_g_total = '';
		if ( isset( $invoice['total'] ) ) {
			$inv_g_total = zeroBSCRM_formatCurrency( $invoice['total'] );
		}
		$topStatus .= '<h1 class="zbs-portal-value">' . esc_html( $inv_g_total ) . '</h1>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		if ( $zbs_stat === __( 'Paid', 'zero-bs-crm' ) ) {
			$topStatus .= '<div class="zbs-invoice-paid"><i class="fa fa-check"></i>' . esc_html__( 'Paid', 'zero-bs-crm' ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
	} elseif ( $template === 'pdf' ) {

		// pdf status
		if ( $zbs_stat === __( 'Paid', 'zero-bs-crm' ) ) {

			$topStatus = '<div class="jpcrm-invoice-status jpcrm-invoice-paid">' . esc_html__( 'Paid', 'zero-bs-crm' ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		} else {

			$topStatus = '<div class="jpcrm-invoice-status">' . esc_html( $zbs_stat ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		}
	}

	// inv lines
	$invlines = $invoice['lineitems'];

	// SET all new invoices to unpaid
	if (
		// Not set, but inv exists
		( isset( $invoice ) && is_array( $invoice ) && ( ! isset( $invoice['status'] ) || empty( $invoice['status'] ) ) ) ||
		// No inv exists
		( ! isset( $invoice ) || ! is_array( $invoice ) )
	) {
		$invoice['status'] = __( 'Draft', 'zero-bs-crm' ); //moved to draft. Unpaid will be set once the invoice has been sent.
	}

	// switch for Company if set...
	if ( $zbsCompanyID > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$invTo = zeroBS_getCompany( $zbsCompanyID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		if ( is_array( $invTo ) && ( isset( $invTo['name'] ) || isset( $invTo['coname'] ) ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			if ( isset( $invTo['name'] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$invTo['fname'] = $invTo['name']; // DAL3
			}
			if ( isset( $invTo['coname'] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$invTo['fname'] = $invTo['coname']; // DAL2
			}
			$invTo['lname'] = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		} else {

			$invTo = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				'fname' => '',
				'lname' => '',
			);
		}

		// object type flag used downstream, I wonder if we should put these in at the DAL level..
		$invTo['objtype'] = ZBS_TYPE_COMPANY; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	} else {

		$invTo = $zbs->DAL->contacts->getContact( $zbsCustomerID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// object type flag used downstream, I wonder if we should put these in at the DAL level..
		$invTo['objtype'] = ZBS_TYPE_CONTACT; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// is this stored same format?
	$zbsInvoiceHorQ = $invoice['hours_or_quantity']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

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
	$thisInvReference = $invoice['id']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// ID - Portal
	if ( $template === 'portal' ) {
		$thisInvReference = __( 'Invoice #', 'zero-bs-crm' ) . ' ' . $thisInvReference; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// Reference
	if ( isset( $invoice['id_override'] ) && ! empty( $invoice['id_override'] ) ) {

		// Ref
		$thisInvReference = $invoice['id_override']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// Ref - Portal
		if ( $template === 'portal' ) {
			$thisInvReference = $ref_label . ' ' . $thisInvReference; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}

		// and we don't show ID, do show ref label:
		$inv_id_styles  = 'display:none;';
		$inv_ref_styles = '';

	}

	// replacement str
	$invNoStr = $thisInvReference; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// Portal
	if ( $template === 'portal' ) {
		$invNoStr = '<div class="zbs-normal">' . esc_html( $thisInvReference ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// == Build biz info table.

	//the business info from the settings
	$zbs_biz_name      = zeroBSCRM_getSetting( 'businessname' );
	$zbs_biz_yourname  = zeroBSCRM_getSetting( 'businessyourname' );
	$zbs_biz_extra     = zeroBSCRM_getSetting( 'businessextra' );
	$zbs_biz_youremail = zeroBSCRM_getSetting( 'businessyouremail' );
	$zbs_biz_yoururl   = zeroBSCRM_getSetting( 'businessyoururl' );

	// generate a templated biz info table
	$bizInfoTable = zeroBSCRM_invoicing_generateInvPart_bizTable( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
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
	$invoice_customer_info_table_html = zeroBSCRM_invoicing_generateInvPart_custTable( $invTo, $template ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// == Lineitem table > Column headers
	// generate a templated customer info table
	$tableHeaders = zeroBSCRM_invoicing_generateInvPart_tableHeaders( $zbsInvoiceHorQ, $template ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// == Lineitem table > Line items
	// generate a templated lineitems
	$lineItems = zeroBSCRM_invoicing_generateInvPart_lineitems( $invlines, $template ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// == Lineitem table > Totals
	// due to withTotals parameter on get above, we now don't need ot calc anything here, just expose
	$totalsTable = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	$totalsTable .= '<table id="invoice_totals" class="table-totals zebra" style="width: 100%;"><tbody>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	if ( $invsettings['invtax'] != 0 || $invsettings['invpandp'] != 0 || $invsettings['invdis'] != 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,Universal.Operators.StrictComparisons.LooseNotEqual
		$totalsTable .= '<tr class="total-top">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$totalsTable .= '<td  class="bord bord-l" style="text-align:right; width: 80%; text-transform: uppercase;">' . esc_html__( 'Subtotal', 'zero-bs-crm' ) . '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$totalsTable .= '<td class="bord row-amount" class="bord" style="text-align:right; "><span class="zbs-totals">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		if ( isset( $invoice['net'] ) && ! empty( $invoice['net'] ) ) {
			$totalsTable .= esc_html( zeroBSCRM_formatCurrency( $invoice['net'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		} else {
			$totalsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
		$totalsTable .= '</span></td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	// discount
	if ( isset( $invoice['discount'] ) && ! empty( $invoice['discount'] ) ) {

		if ( $invsettings['invdis'] == 1 && isset( $invoice['totals'] ) && is_array( $invoice['totals'] ) && isset( $invoice['totals']['discount'] ) ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			$invoice_percent = '';
			if ( $invoice['discount_type'] == '%' && $invoice['discount'] != 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual,Universal.Operators.StrictComparisons.LooseNotEqual
				$invoice_percent = (float) $invoice['discount'] . '% ';
			}
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$totalsTable .= '<tr class="discount">
				<td class="bord bord-l" style="text-align:right; text-transform: uppercase;">' . esc_html( $invoice_percent . __( 'Discount', 'zero-bs-crm' ) ) . '</td>
				<td class="bord row-amount" id="zbs_discount_combi" style="text-align:right"><span class="zbs-totals">';

			$totalsTable .= '-' . esc_html( zeroBSCRM_formatCurrency( $invoice['totals']['discount'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			$totalsTable .= '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
	}

	// shipping
	if ( $invsettings['invpandp'] == 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$totalsTable .= '<tr class="postage_and_pack">
			<td class="bord bord-l" style="text-align:right; text-transform: uppercase;">' . esc_html__( 'Postage and packaging', 'zero-bs-crm' ) . '</td>
			<td class="bord row-amount" id="pandptotal" style="text-align:right;"><span class="zbs-totals">';
		if ( isset( $invoice['shipping'] ) && ! empty( $invoice['shipping'] ) ) {
			$totalsTable .= esc_html( zeroBSCRM_formatCurrency( $invoice['shipping'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		} else {
			$totalsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
		$totalsTable .= '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
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

				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$totalsTable .= '<tr class="ttclass">
					<td class="bord bord-l" style="text-align:right">' . esc_html( $tax_name ) . '</td>
					<td class="bord bord-l row-amount zbs-tax-total-span" style="text-align:right"><span class="zbs-totals">';
				if ( isset( $tax['value'] ) && ! empty( $tax['value'] ) ) {
					$totalsTable .= esc_html( zeroBSCRM_formatCurrency( $tax['value'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				} else {
					$totalsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				}
				$totalsTable .= '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			}
		} else {

			// simple fallback
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$totalsTable .= '<tr class="ttclass">
				<td class="bord bord-l" style="text-align:right">' . esc_html__( 'Tax', 'zero-bs-crm' ) . '</td>
				<td class="bord bord-l row-amount zbs-tax-total-span" style="text-align:right"><span class="zbs-totals">';
			if ( isset( $invoice['tax'] ) && ! empty( $invoice['tax'] ) ) {
				$totalsTable .= esc_html( zeroBSCRM_formatCurrency( $invoice['tax'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			} else {
				$totalsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			}
			$totalsTable .= '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		}
	}

	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$totalsTable .= '<tr class="zbs_grand_total" style="line-height:30px;">
		<td class="bord-l"  style="text-align:right; font-weight:bold;  border-radius: 0px;"><span class="zbs-total">' . __( 'Total', 'zero-bs-crm' ) . '</span></td>
		<td class="row-amount" style="text-align:right; font-weight:bold; border: 3px double #111!important; "><span class="zbs-total">';
	if ( isset( $invoice['total'] ) && ! empty( $invoice['total'] ) ) {
		$totalsTable .= esc_html( zeroBSCRM_formatCurrency( $invoice['total'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	} else {
		$totalsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}
	$totalsTable .= '</span></td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$totalsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	$totalsTable .= '</table>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// == Partials (Transactions against Invs)
	$partialsTable = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	if ( $invoice['total'] == 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$partialsTable .= '<table id="partials" class="hide table-totals zebra">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	} else {
		$partialsTable .= '<table id="partials" class="table-totals zebra">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	$balance = $invoice['total'];

	if ( is_array( $partials ) && count( $partials ) > 0 ) {

		// header
		$partialsTable .= '<tr><td colspan="2" style="text-align:center;font-weight:bold;  border-radius: 0px;"><span class="zbs-total">' . esc_html__( 'Payments', 'zero-bs-crm' ) . '</span></td></tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

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

				$partialsTable .= '<tr class="total-top">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$partialsTable .= '<td class="bord bord-l" style="text-align:right">' . esc_html__( 'Payment', 'zero-bs-crm' ) . '<br/>(' . esc_html( $partial['ref'] ) . ')</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$partialsTable .= '<td class="bord row-amount"><span class="zbs-partial-value">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				if ( ! empty( $partial['total'] ) ) {
					$partialsTable .= esc_html( zeroBSCRM_formatCurrency( $partial['total'] ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				} else {
					$partialsTable .= esc_html( zeroBSCRM_formatCurrency( 0 ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				}
				$partialsTable .= '</span></td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$partialsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			}
		}
	}

	if ( $balance == $invoice['total'] ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		$balance_hide = 'hide';
	} else {
		$balance_hide = '';
	}

	$partialsTable .= '<tr class="zbs_grand_total' . $balance_hide . '">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$partialsTable .= '<td class="bord bord-l" style="text-align:right; font-weight:bold;  border-radius: 0px;"><span class="zbs-minitotal">' . esc_html__( 'Amount due', 'zero-bs-crm' ) . '</td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$partialsTable .= '<td class="bord row-amount"><span class="zbs-subtotal-value">' . esc_html( zeroBSCRM_formatCurrency( $balance ) ) . '</span></td>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$partialsTable .= '</tr>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$partialsTable .= '</table>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase


	// generate a templated paybutton (depends on template :))
	$potentialPayButton = zeroBSCRM_invoicing_generateInvPart_payButton( $invoiceID, $zbs_stat, $template ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// == Payment terms, thanks etc. will only replace when present in template, so safe to generically check
	$payThanks = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	if ( $zbs_stat === __( 'Paid', 'zero-bs-crm' ) ) {
		$payThanks  = '<div class="deets"><h3>' . esc_html__( 'Thank You', 'zero-bs-crm' ) . '</h3>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$payThanks .= '<div>' . nl2br( esc_html( zeroBSCRM_getSetting( 'paythanks' ) ) ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$payThanks .= '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}
	$payment_info_text = zeroBSCRM_getSetting( 'paymentinfo' );

	$payDetails  = '<div class="deets"><h2>' . esc_html__( 'Payment Details', 'zero-bs-crm' ) . '</h2>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$payDetails .= '<div class="deets-line"><span class="deets-content">' . nl2br( esc_html( $payment_info_text ) ) . '</span></div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$payDetails .= '<div class="deets-line"><span class="deets-title">' . esc_html__( 'Payment Reference:', 'zero-bs-crm' ) . '</span> <span>' . esc_html( $invNoStr ) . '</span></div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$payDetails .= '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase


	// == Template -> HTML build

	// powered by
	$powered_by = zeroBSCRM_mailTemplate_poweredByHTML();

	$view_in_portal_link   = '';
	$view_in_portal_button = '';

	// got portal?
	if ( zeroBSCRM_isExtensionInstalled( 'portal' ) ) {
		$view_in_portal_link   = zeroBSCRM_portal_linkObj( $invoiceID, ZBS_TYPE_INVOICE ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$view_in_portal_button = '<div style="text-align:center;margin:1em;margin-top:2em">' . zeroBSCRM_mailTemplate_emailSafeButton( $view_in_portal_link, esc_html__( 'View Invoice', 'zero-bs-crm' ) ) . '</div>';
	}

	// build replacements array
	$replacements = array(

		// invoice specific
		'invoice-title'               => __( 'Invoice', 'zero-bs-crm' ),
		'css'                         => $css_url,
		'logo-class'                  => $logo_class,
		'logo-url'                    => esc_url( $logo_url ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-number'              => $invNoStr, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-date'                => $invDateStr, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-id-styles'           => $inv_id_styles,
		'invoice-ref'                 => $invNoStr, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-ref-styles'          => $inv_ref_styles,
		'invoice-due-date'            => $dueDateStr, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-custom-fields'       => $invoice_custom_fields_html,
		'invoice-biz-class'           => $biz_info_class,
		'invoice-customer-info'       => $invoice_customer_info_table_html,
		'invoice-html-status'         => $topStatus, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-table-headers'       => $tableHeaders, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-line-items'          => $lineItems, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-totals-table'        => $totalsTable, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-partials-table'      => $partialsTable, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-pay-button'          => $potentialPayButton, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'pre-invoice-payment-details' => '',
		'invoice-payment-details'     => $payDetails, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'invoice-pay-thanks'          => $payThanks, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

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
		'biz-info'                    => $bizInfoTable, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		'powered-by'                  => $powered_by,

	);

	// Switch. If partials, put the payment deets on the left next to the partials,
	// rather than in it's own line:
	if ( ! empty( $partialsTable ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// partials, split to two columns
		$replacements['pre-invoice-payment-details'] = $payDetails; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$replacements['invoice-payment-details']     = '';
	}

	// replace vars
	$html = $placeholder_templating->replace_placeholders(
		array( 'invoice', 'global', 'contact', 'company' ),
		$html,
		$replacements,
		array(
			ZBS_TYPE_INVOICE  => $invoice,
			$invTo['objtype'] => $invTo, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
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

                switch ( $template ){

                    case 'pdf':
                    case 'notification':
                        $customer_custom_fields_html .= '<div class="zbs-line-info">' . $field_info[1] . ': ' . $custom_field_str . '</div>';
                        break;

                    case 'portal':
                        $customer_custom_fields_html .= '<div><strong>' . $field_info[1] . ':</strong> ' . $custom_field_str . '</div>';
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

                switch ( $template ){

                    case 'pdf':
                    case 'notification':

                        $invoice_custom_fields_html .= '<tr class="zbs-top-right-box-line">';
                        $invoice_custom_fields_html .= '    <td><label for="' . $field_key . '">' . $field_info[1] . ':</label></td>';
                        $invoice_custom_fields_html .= '    <td style="text-align:right;">' . $custom_field_str . '</td>';
                        $invoice_custom_fields_html .= '</tr>';
                        break;

                    case 'portal':

                        $invoice_custom_fields_html .= '<div><strong>' . $field_info[1] . ':</strong> ' . $custom_field_str . '</div>';
                        break;

                }

            }

        }     

    }

    return $invoice_custom_fields_html;

}


// Used to generate specific part of invoice pdf: (Lineitem row in inv table)
function zeroBSCRM_invoicing_generateInvPart_lineitems($invlines=array(),$template='pdf'){

    $lineItemHTML = '';


        switch ($template){

            case 'pdf':

                if ($invlines != ''){
                    $i=1;
                    foreach($invlines as $invline){

                        $lineItemHTML .= 
                        '<tr>
                                    <td style="width:55%;"><div class="item-name">'.$invline['title'].'</div><div class="item-description">'.nl2br($invline['desc']).'</div></td>
                                    <td style="width:15%;text-align:center;" class="cen">'.zeroBSCRM_format_quantity( $invline['quantity'] ).'</td>
                                    <td style="width:15%;text-align:center;" class="cen">'. zeroBSCRM_formatCurrency($invline['price']).'</td>
                                    <td style="width:15%;text-align:right;" class="row-amount">' . zeroBSCRM_formatCurrency($invline['net']).'</td>
                        </tr>'; 

                        $i++;

                    }
                }


            break;

            case 'portal':

                if ($invlines != ''){
                    $i=1;
                    foreach($invlines as $invline){
                                
                        // Note for MS: I've approximately changed these fields to match those in DAL3.Obj.Lineitems
                        // ... however some extras (tax) will need to be added?
                        /* WH: this isn't used anywhere? 
                        $zbs_extra_li = "";
                        if ($i == 1){
                            $zbs_extra_li  = '<td class="row-1-pad" colspan="2"></td>';
                        } */
                        $lineItemHTML .= 
                        '<tbody class="zbs-item-block" data-tableid="'.$i.'" id="tblock'.$i.'">
                                <tr class="top-row">
                                    <td style="width:50%">'.$invline['title'].'<br/><span class="dz">'.nl2br($invline['desc']).'</span></td>
                                    <td style="width:15%;text-align:center;" rowspan="3" class="cen">'.zeroBSCRM_format_quantity( $invline['quantity'] ).'</td>
                                    <td style="width:15%;text-align:center;" rowspan="3"class="cen">'. zeroBSCRM_formatCurrency($invline['price']) .'</td>
                                    <td style="width:15%;text-align:right;" rowspan="3" class="row-amount">' . zeroBSCRM_formatCurrency($invline['net']) .'</td>
                                </tr>
                        </tbody>'; 

                        $i++;

                    }
                }  

            break;

            case 'notification':

                if ($invlines != ''){
                    $i=1;
                    foreach($invlines as $invline){

                        // Note for MS: I've approximately changed these fields to match those in DAL3.Obj.Lineitems
                        // ... however some extras (tax) will need to be added?                        
                        $lineItemHTML = '<tbody class="zbs-item-block" data-tableid="'.$i.'" id="tblock'.$i.'">';
                        foreach($invlines as $invline){

                            $lineItemHTML .= '
                                    <tr class="top-row">
                                        <td style="width:70%;font-weight:bold">'.$invline['title'].'</td>
                                        <td style="width:7.5%;text-align:center;" rowspan="3" class="cen">'.$invline['quantity'].'</td>
                                        <td style="width:7.5%;text-align:center;" rowspan="3"class="cen">'. zeroBSCRM_formatCurrency($invline['price']) .'</td>
                                        <td style="width:7.5%;text-align:right;" rowspan="3" class="row-amount">' . zeroBSCRM_formatCurrency($invline['net']) .'</td>
                                    </tr>
                                    <tr class="bottom-row">
                                        <td colspan="4" class="tapad">'.$invline['desc'].'</td>     
                                    </tr>
                                    <tr class="add-row"></tr>';
                            

                            $i++;
                        }

                        $lineItemHTML .= '</tbody>';  

                        $i++;

                    }
                }

            break;

        }

    return $lineItemHTML;
}
// Used to generate specific part of invoice pdf: (pay button)
function zeroBSCRM_invoicing_generateInvPart_payButton($invoiceID=-1,$zbs_stat='',$template='pdf'){

    $potentialPayButton = '';

        switch ($template){

            case 'pdf':
    
               $potentialPayButton = '';

            break;

            case 'portal':
                
                if ($zbs_stat != __('Paid','zero-bs-crm')) {

                    // need to add somethere here which stops the below if WooCommerce meta set
                    // so the action below will fire in WooSync, and remove the three filters below
                    // https://codex.wordpress.org/Function_Reference/remove_filter
                    // and then filter itself in. EDIT the remove filter does not seem to remove them below
                    // think they already need to be applied (i.e. this below). The below works but should
                    // think how best to do this for further extension later?


                    // WH: This'll be the ID if woo doesn't return a button (e.g. it's a woo inv so don't show pay buttons)
                    $potentialWooPayButtonOrInvID = apply_filters('zbs_woo_pay_invoice', $invoiceID);
                    
                    if ($potentialWooPayButtonOrInvID == $invoiceID){

                        $potentialPayButton = apply_filters('invpro_pay_online', $invoiceID);

                    } else {

                        $potentialPayButton = $potentialWooPayButtonOrInvID;

                    }

                    if ($potentialPayButton == $invoiceID) $potentialPayButton = '';


                }

            break;

            case 'notification':
    
               $potentialPayButton = '';

            break;

        }

    return $potentialPayButton;
}
// Used to generate specific part of invoice pdf: (table headers)
function zeroBSCRM_invoicing_generateInvPart_tableHeaders($zbsInvoiceHorQ = 1,$template='pdf'){

    $tableHeaders = '';

        switch ($template){

            case 'pdf':
    
                $tableHeaders = '<th style="text-align:left;"><span class="table-title">'.__('Description','zero-bs-crm').'</span></th>';

                     if($zbsInvoiceHorQ == 1){ 
                        $tableHeaders .= '<th id="zbs_inv_qoh"><span class="table-title">'.__("Quantity","zero-bs-crm").'</th>';
                        $tableHeaders .= '<th id="zbs_inv_por"><span class="table-title">'.__("Price","zero-bs-crm").'</th>';
                     }else{ 
                        $tableHeaders .= '<th id="zbs_inv_qoh"><span class="table-title">'.__("Hours","zero-bs-crm").'</th>';
                        $tableHeaders .= '<th id="zbs_inv_por"><span class="table-title">'.__("Rate","zero-bs-crm").'</th>';
                     }
                $tableHeaders .= '<th style="text-align: right;"><span class="table-title">'.__("Amount","zero-bs-crm").'</span></th>';

            break;

            case 'portal':

                $tableHeaders = '<th class="left">'.__('Description','zero-bs-crm').'</th>';

                if($zbsInvoiceHorQ == 1){
                    $tableHeaders .= '<th class="cen" id="zbs_inv_qoh">'.__("Quantity","zero-bs-crm").'</th>';
                    $tableHeaders .= '<th class="cen" id="zbs_inv_por">'.__("Price","zero-bs-crm").'</th>';
                }else{
                    $tableHeaders .= '<th class="cen" id="zbs_inv_qoh">'.__("Hours","zero-bs-crm").'</th>';
                    $tableHeaders .= '<th class="cen" id="zbs_inv_por">'.__("Rate","zero-bs-crm").'</th>';
                }

                $tableHeaders .= '<th class="ri">'.__("Amount","zero-bs-crm").'</th>';
                // v3.0 rc2 - doesn't seem to be needed: $tableHeaders .= '<th class="ri">'.__("Net","zero-bs-crm").'</th>';

            break;

            case 'notification':


                        if($zbsInvoiceHorQ == 1){ 
                        
                            $tableHeaders = '<th class="left">'.__("Description",'zero-bs-crm').'</th><th>'.__("Quantity",'zero-bs-crm').'</th><th>'.__("Price",'zero-bs-crm').'</th><th>'.__("Total",'zero-bs-crm').'</th>';

                        }else{ 

                            $tableHeaders = '<th class="left">'.__("Description",'zero-bs-crm').'</th><th>'.__("Hours",'zero-bs-crm').'</th><th>'.__("Rate",'zero-bs-crm').'</th><th>'.__("Total",'zero-bs-crm').'</th>';

                        }

            break;

        }

    return $tableHeaders;
}    
