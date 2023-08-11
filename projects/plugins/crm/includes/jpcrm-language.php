<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V4.0.7
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

	// gets 'Contact' (legacy/deprecated)
   	// Unless this is used in any extensions this can be removed.
	function zeroBSCRM_getContactOrCustomer(){ return __('Contact',"zero-bs-crm"); }

	// gets company label, backward compatibility:
	function zeroBSCRM_getCompanyOrOrg(){
		return jpcrm_label_company(false);
	}	
	function zeroBSCRM_getCompanyOrOrgPlural(){
		return jpcrm_label_company(true);
	}


    /**
     * Returns global label used to differentiate b2b mode objects (Companies)
     * Replaces old functions zeroBSCRM_getCompanyOrOrg and zeroBSCRM_getCompanyOrOrgPlural
     * Note, I still prefer this to using a gettext filter (as we do in rebrandr)
     *
     * @param array $plural return singular or plural
     *
     * @return string label
     */
	function jpcrm_label_company($plural=false){

		// retrieve type. 
	    $organisationType = zeroBSCRM_getSetting('coororg');

		if (!$plural){

			// singular
			$s = __('Company',"zero-bs-crm"); 
		    if ($organisationType == 'org') $s = __('Organisation',"zero-bs-crm");
			if ($organisationType == 'domain') $s = __('Domain',"zero-bs-crm");

		} else {

			// plural
		    $s = __('Companies',"zero-bs-crm"); 
		    if ($organisationType == 'org') $s = __('Organisations',"zero-bs-crm");
			if ($organisationType == 'domain') $s = __('Domains',"zero-bs-crm");

		}

	    return $s;

	}