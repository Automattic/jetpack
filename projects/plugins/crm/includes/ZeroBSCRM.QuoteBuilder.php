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


// This fires post CRM init
add_action('zerobscrm_post_init','jpcrm_quote_generate_posted_pdf');

/*
 * Catches any quote PDF requests
 *
 * @returns (conditionally) pdf file
 */
function jpcrm_quote_generate_posted_pdf(){

    // download flag
    if ( isset($_POST['jpcrm_quote_download_pdf'])  ) {

	    // Check nonce
	    if (!wp_verify_nonce( $_POST['jpcrm_quote_pdf_gen_nonce'], 'jpcrm-quote-pdf-gen' )) exit();

	    // check permissions
	    if (!zeroBSCRM_permsQuotes()) exit();

	    global $zbs;

	    // only 3.0+
	    if (!$zbs->isDAL3()) exit();

        #} Check ID
        $quoteID = -1;
        if (isset($_POST['jpcrm_quote_id']) && !empty($_POST['jpcrm_quote_id'])) $quoteID = (int)sanitize_text_field($_POST['jpcrm_quote_id']);
        if ($quoteID <= 0) exit();

        // generate the PDF
        $pdf_file = jpcrm_quote_generate_pdf($quoteID);

        if ($pdf_file !== false){

            // output the PDF
            header('Content-type: application/pdf');
            header('Content-Disposition: attachment; filename="quote-'.$quoteID.'.pdf"');
            header('Content-Transfer-Encoding: binary');
            header('Content-Length: ' . filesize($pdf_file));
            header('Accept-Ranges: bytes');
            readfile($pdf_file);

            // delete the PDF file once it's been read (i.e. downloaded)
            unlink($pdf_file); 

        }

        exit();
    }


}


/*
 * Generate PDF file for a quote
 *
 * @param int Quote ID
 * @returns str Path to created pdf
 */
function jpcrm_quote_generate_pdf( $quoteID = false ){
    
    // got permissions?
    if (!zeroBSCRM_permsQuotes()) return false;

	// Check ID	
	if ($quoteID == false || $quoteID <= 0) return false;

    // let's build a PDF
    global $zbs;

    // Discern template and retrieve    
    $global_quote_pdf_template = zeroBSCRM_getSetting('quote_pdf_template');
    if ( !empty( $global_quote_pdf_template ) ){
        $html = jpcrm_retrieve_template( $global_quote_pdf_template, false );
    }

    // fallback to default template
    if ( !isset( $html ) || empty( $html ) ){

        // template failed as setting potentially holds out of date (removed) template
        // so use the default
        $html = jpcrm_retrieve_template( 'quotes/quote-pdf.html', false );

    }

    // load templating
    $placeholder_templating = $zbs->get_templating();

	// build HTML
    $content = zeroBS_getQuoteBuilderContent($quoteID);
    $html   = $placeholder_templating->replace_single_placeholder( 'quote-content', $content['content'], $html );

    // build PDF
    $dompdf = $zbs->pdf_engine();
    $dompdf->loadHtml($html,'UTF-8');
	$dompdf->render();

	// directory & target
	$upload_dir = wp_upload_dir();
	$pdf_dir = $upload_dir['basedir'].'/quotes/';

        if ( ! file_exists( $pdf_dir ) ) {
            wp_mkdir_p( $pdf_dir );
        }       
    $file_to_save = $pdf_dir.'quote-'.$quoteID.'.pdf';	
    
	// save the .pdf
	file_put_contents($file_to_save, $dompdf->output());		

	return $file_to_save;

}