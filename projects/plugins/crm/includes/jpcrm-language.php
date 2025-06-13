<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * @package automattic/jetpack-crm
 */

defined( 'ZEROBSCRM_PATH' ) || exit( 0 );

/**
 * Returns global label used to differentiate b2b mode objects (Companies)
 * Replaces old functions zeroBSCRM_getCompanyOrOrg and zeroBSCRM_getCompanyOrOrgPlural
 * Note, I still prefer this to using a gettext filter (as we do in rebrandr)
 *
 * @param bool $plural return singular or plural.
 *
 * @return string label
 */
function jpcrm_label_company( $plural = false ) {

	// retrieve type.
	$organisation_type = zeroBSCRM_getSetting( 'coororg' );

	if ( ! $plural ) {

		// singular
		$s = __( 'Company', 'zero-bs-crm' );
		if ( $organisation_type === 'org' ) {
			$s = __( 'Organisation', 'zero-bs-crm' );
		} elseif ( $organisation_type === 'domain' ) {
			$s = __( 'Domain', 'zero-bs-crm' );
		}
	} else {

		// plural
		$s = __( 'Companies', 'zero-bs-crm' );
		if ( $organisation_type === 'org' ) {
			$s = __( 'Organisations', 'zero-bs-crm' );
		} elseif ( $organisation_type === 'domain' ) {
			$s = __( 'Domains', 'zero-bs-crm' );
		}
	}

	return $s;
}
