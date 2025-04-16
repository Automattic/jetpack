<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V4.0.7
 */

defined( 'ZEROBSCRM_PATH' ) || exit( 0 );

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
