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


/**
 * Retrieve Template file path
 * 
 * This checks existence in /wp-content/theme/{active_theme}/jetpack-crm/*
 * ... and if doesn't exist, falls back to /wp-content/plugin/{this_plugin}/templates/*
 *
 * @param string template_file - the file path _after_ the /templates/ directory
 * 
 * @return string|bool false - the full file path to template if exists, false if not
 */
function jpcrm_template_file_path( $template_file = '' ) {

	if ( !empty( $template_file ) ){

		global $zbs;

		// Search for template file in theme folder.
		$template_file_path = locate_template( array(
			$zbs->template_path . '/' . $template_file,
			$template_file
		) );

		
		// check any other externally added locations 
		// default to our core template if no theme or external variant
		if ( !$template_file_path ){

			// see if we have any other locations
			// note this'll effectively 'pick' the first added & viable in this situation.
			$extra_template_locations = apply_filters( 'jpcrm_template_locations', array() );
			if ( is_array( $extra_template_locations ) ){

				foreach ( $extra_template_locations as $location ){

					if ( file_exists( $location[ 'path' ] . $template_file ) ){

						// use this template
						$template_file_path = $location[ 'path' ] . $template_file;

						break;
					}


				}

			}

			// no theme template
			// no filter-given template
			// default to core version:
			if ( empty( $template_file_path ) || !$template_file_path ){
				
				$template_file_path = ZEROBSCRM_PATH . 'templates/' . $template_file;

			}

		}


		// do we have a valid template?
		if ( !empty( $template_file_path ) && file_exists( $template_file_path ) ){

			return $template_file_path;

		}

	}

	return false;

}

/**
 * Retrieve Template file
 * 
 * This checks existence in /wp-content/theme/{active_theme}/jetpack-crm/*
 * ... and if doesn't exist, falls back to /wp-content/plugin/{this_plugin}/templates/*
 *
 * @param string template_file - the file path _after_ the /templates/ directory
 * @param bool load - if true will include
 * 
 * @return string {contents_of_template_file} 
 */
function jpcrm_retrieve_template( $template_file = '', $load = true ) {

	$template_contents = '';

	if ( !empty( $template_file ) ){

		// retrieve path
		$template_file_path = jpcrm_template_file_path( $template_file );

		// do we have a valid template?
		if ( !empty( $template_file_path ) && file_exists( $template_file_path ) ){

			// load or return contents
			if ( $load ){

				// load the file directly (no support for require_once here, expand via params if needed)
				include $template_file_path;

			} else {
				
				// retrieve contents
				if (function_exists('file_get_contents')){

		            try {

		                $template_contents = file_get_contents( $template_file_path );
						return $template_contents;


		            } catch (Exception $e){

		                // Nada 
						// basic dialog
						_doing_it_wrong( __FUNCTION__, sprintf( '<code>%s</code> could not be retrieved.', esc_html( $template_file_path ) ), '4.5.0' );
						
						// add admin notification
						if ( zeroBSCRM_isZBSAdminOrAdmin() ){
						
							jpcrm_template_missing_notification( $template_file );

						}

		            }

		        }


			}

		} else {

			// if current user is an admin, let's return a useful debug string
			if ( zeroBSCRM_isZBSAdminOrAdmin() ){
				
				// add admin notification		
				jpcrm_template_missing_notification( $template_file );

				// return explainer string (note this'll get rolled into PDF/page output)
				return sprintf( __( 'Failed to retrieve <code>%s</code> - Template file does not exist.', 'zero-bs-crm' ), $template_file );

			} else {

				// non-admin user retrieved a non-existent template. Let's return blank
				// _doing_it_wrong( __FUNCTION__, sprintf( '<code>%s</code> does not exist.', $template_file ) );

			}

		}

	}


	// no dice
	return '';

}



/**
 * Attempts to find variants of a template file and returns as an array
 *
 * @param string original_template_path - original template location for template, e.g. 'invoices/invoice-pdf.html'
 *
 * @return array
 */
function jpcrm_retrieve_template_variants( $original_template_path = '' ) {

	global $zbs;

	$variants = array();

	if ( !empty( $original_template_path ) ){

		// get extension (e.g. html)
		$file_extension = pathinfo( $original_template_path, PATHINFO_EXTENSION );

		// split out pre-extension path
		$pre_extension_path = substr( $original_template_path, 0, ( strlen( $original_template_path ) - ( strlen( $file_extension ) + 1 ) ) );

		// check in locations:
		// 1. theme/jetpack-crm/*
		// 2. core/templates/*
		// Finally, pass back via hook, to allow client portal pro to append

		// to provide some form of protection here, we only allow zbs admins to do this
		// (as we're iterating through directories)
		if ( !zeroBSCRM_isZBSAdminOrAdmin() ) return false;

		// Seeks out template files matching a pattern (in wp theme directories, and our core template directory)
		// Adapted from locate_template: https://core.trac.wordpress.org/browser/tags/5.8/src/wp-includes/template.php#L697
		$template_locations = array(
			array( 
				'name' => __( 'Theme directory', 'zero-bs-crm' ), 
				'path' => STYLESHEETPATH . '/' . $zbs->template_path . '/' 
			),
			array( 
				'name' => __( 'Template Path directory', 'zero-bs-crm' ), 
				'path' => TEMPLATEPATH . '/' . $zbs->template_path . '/'
			),
			array( 
				'name' => __( 'Theme Compat directory', 'zero-bs-crm' ), 
				'path' => ABSPATH . WPINC . '/theme-compat/' . $zbs->template_path . '/'
			),
			array( 
				'name' => __( 'Core Plugin', 'zero-bs-crm' ), 
				'path' => ZEROBSCRM_PATH . 'templates/'
			)
		); 

		// we flip the array, so that top-down preference is maintained
		$template_locations = array_reverse( $template_locations );

		// pass our viable locations through a filter so extensions can append their directories.
		$template_locations = apply_filters( 'jpcrm_template_locations', $template_locations );

		// cycle through locations and seek out templates
		if ( is_array( $template_locations ) ) {
			foreach ( $template_locations as $directory ){
			
				// locate matching files
				$template_files = glob( $directory['path'] . $pre_extension_path . '*.' . $file_extension);

				// determine viable
				if ( is_array( $template_files ) ){

					foreach ( $template_files as $file_path ) {

						// (dirty) replace $directory to give clean template_path
						$path = str_replace( $directory['path'], '', $file_path );

						$variants[ $path ] = array(
							'full_path' => $file_path,
							'filename' 	=> basename( $file_path ),
							'origin'	=> $directory['name'],
							'name'		=> '' // tbc
						);

					}

				}

			}

		}

	}

	// return passed through filter so the likes of client portal pro could append
	return apply_filters( 'jpcrm_template_variants', $variants, $original_template_path );

}



/**
 * Adds an admin notice for missing template
 *
 * @param string template_file - template file location for template, e.g. 'invoices/invoice-pdf.html'
 *
 * @return bool - true (if outstanding notification), false if no notifcation
 */
function jpcrm_template_missing_notification( $template_file = '' ) {

	if ( !empty( $template_file ) ){

		global $zbs;

		// generate a transient key to use
		$transient_key = 'jpcrm-missing-' . $zbs->DAL->makeSlug( $template_file );

		// check not fired within past week
		$existing_transient = get_transient( $transient_key );
		if ( $existing_transient ) {

			return true;

		}

		// add notice & transient
		zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'missing.template', $template_file );
		set_transient( $transient_key, $template_file, HOUR_IN_SECONDS * 24 * 7 );

		return true;

	}

	return false;


}




/*
* Function to return html file related to PDF
* we've done away with the need for this via the jpcrm_templating_placeholders class.
*/
function zeroBSCRM_retrievePDFTemplate($template='default'){

	zeroBSCRM_DEPRECATEDMSG('zeroBSCRM_retrievePDFTemplate was deprecated in v4.5.0, please use the jpcrm_templating_placeholders class');

	return '';

}


/*
* Function to return html file of a quote template
* we've done away with the need for this via the jpcrm_templating_placeholders class.
*/
function zeroBSCRM_retrieveQuoteTemplate($template='default'){

	zeroBSCRM_DEPRECATEDMSG('zeroBSCRM_retrieveQuoteTemplate was deprecated in v4.5.0, please use the jpcrm_templating_placeholders class');

	return '';

}



/* WH Notes:

	There was all this note-age from old vers:
			Customer Meta Translation - 2.90 
			#}PUT THE EMAIL THROUGH THE FILTERS (FOR THE #FNAME# NEW CUSTOMER TAGS do prepare_email_{trigger}_template
			#} WH: Let's do this as filters :)
	
	... but I think these funcs needed a bit of a clean up
	... should be backward compatible, and safe to stick to using the filter: zeroBSCRM_replace_customer_placeholders
	... MC2.0 uses this indirectly through 'zerobscrm_mailcamp_merge' and 'zerobscrm_mailcamp_merge_text'
	... so be careful with it

	... v3.0 I've made them DAL3 safe, not fully refactored as approaching deadline
*/
// Note: this function is deprecated from ~4.3.0, please use $zbs->get_templating()->replace_placeholders()
function zeroBSCRM_replace_customer_placeholders($html = '', $cID = -1, $contactObj = false){

	if ($cID > 0 && $html != ''){

		global $zbs;

		if (is_array($contactObj) && isset($contactObj['id']))
			$contact = $contactObj;
		else {
			if ($zbs->isDAL3())
				// v3.0
				$contact = $zbs->DAL->contacts->getContact($cID,array(
		            'withCustomFields'  => true,
		            // need any of these?
		            'withQuotes'        => false,
		            'withInvoices'      => false,
		            'withTransactions'  => false,
		            'withLogs'          => false,
		            'withLastLog'       => false,
		            'withTags'          => false,
		            'withCompanies'     => false,
		            'withOwner'         => false,
		            'withValues'        => false,
            ));
			else
				// pre v3.0
				$contact = zeroBS_getCustomerMeta($cID);
		}

		// replace all placeholders :)
		$newHTML = $html;
		foreach ($contact as $k => $v){
			$newHTML = str_replace('##CONTACT-'.strtoupper($k) . '##' ,$v, $newHTML);  
		}
		$html = $newHTML;

	}

    return $html;

}

add_filter( 'zerobscrm_quote_html_generate','zeroBSCRM_replace_customer_placeholders', 20, 2);

// as above, but replaces with 'demo data'
function zeroBSCRM_replace_customer_placeholders_demo( $html = '' ){
	
	if ( !empty( $html ) ){
		
		global $zbs;

		// load templater
		$placeholder_templating = $zbs->get_templating();

		// assigned-to-*
		$replacements = array(

			'assigned-to-name' => __( 'Demo Contact Owner', 'zero-bs-crm' ),
			'assigned-to-email' => 'demo.contact.owner@example.com',
			'assigned-to-username' => 'demo.contact.owner.username',
			'assigned-to-mob' => '999 999 999',

		);

		// return the example, with demo contact fields and assignments replaced
		return $placeholder_templating->replace_placeholders( array(  'global', 'contact' ), $html, $replacements, array( ZBS_TYPE_CONTACT => zeroBS_getDemoCustomer() ), true );

	}

    return $html;
}
