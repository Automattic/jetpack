<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

/*
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

// block direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

// This fires post CRM init
add_action( 'zerobscrm_post_init', 'jpcrm_quote_generate_posted_pdf' );

/**
 * Catches any quote PDF requests
 *
 * @returns (conditionally) pdf file
 */
function jpcrm_quote_generate_posted_pdf() {

	// download flag
	if ( isset( $_POST['jpcrm_quote_download_pdf'] ) ) {

		// Check nonce
		if ( ! wp_verify_nonce( $_POST['jpcrm_quote_pdf_gen_nonce'], 'jpcrm-quote-pdf-gen' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			exit();
		}

		// check permissions
		if ( ! zeroBSCRM_permsQuotes() ) {
			exit();
		}

		// Check ID
		$quote_id = -1;
		if ( ! empty( $_POST['jpcrm_quote_id'] ) ) {
			$quote_id = (int) $_POST['jpcrm_quote_id'];
		}

		if ( $quote_id <= 0 ) {
			exit();
		}

		// generate the PDF
		$pdf_path = jpcrm_quote_generate_pdf( $quote_id );

		if ( $pdf_path !== false ) {
			$pdf_filename = basename( $pdf_path );

			// output the PDF
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

/**
 * Generate PDF file for a quote
 *
 * @param int $quote_id Quote ID.
 * @return str $file_to_save path to created pdf
 */
function jpcrm_quote_generate_pdf( $quote_id = false ) {

	// got permissions?
	if ( ! zeroBSCRM_permsQuotes() ) {
		return false;
	}

	// Check ID
	if ( $quote_id === false || $quote_id <= 0 ) {
		return false;
	}

	// Discern template and retrieve
	$global_quote_pdf_template = zeroBSCRM_getSetting( 'quote_pdf_template' );
	if ( ! empty( $global_quote_pdf_template ) ) {
		$html = jpcrm_retrieve_template( $global_quote_pdf_template, false );
	}

	// fallback to default template
	if ( empty( $html ) ) {

		// template failed as setting potentially holds out of date (removed) template
		// so use the default
		$html = jpcrm_retrieve_template( 'quotes/quote-pdf.html', false );

	}

	// load templating
	global $zbs;
	$placeholder_templating    = $zbs->get_templating();
	$replacements              = $placeholder_templating->get_generic_replacements();
	$replacements['quote-url'] = zeroBSCRM_portal_linkObj( $quote_id, ZBS_TYPE_QUOTE );

	// Retrieve quote (for any quote placeholders within the template)
	$quote = zeroBS_getQuote( $quote_id, true );
	// replacements
	$html = $placeholder_templating->replace_placeholders( array( 'global', 'quote' ), $html, $replacements, array( ZBS_TYPE_QUOTE => $quote ) );

	// normalise translated text to alphanumeric, resulting in a filename like `quote-321.pdf`
	$pdf_filename = sanitize_title( __( 'Quote', 'zero-bs-crm' ) . '-' . $quote_id ) . '.pdf';

	// return PDF filename if successful, false if not
	return jpcrm_generate_pdf( $html, $pdf_filename );
}
