<?php
/*
!
 * Main Page file for User Profile: This file renders views associated with the CRM user profile
 * Jetpack CRM - https://jetpackcrm.com
 */
defined( 'ZEROBSCRM_PATH' ) || exit;

// permissions check
if ( ! zeroBSCRM_permsIsZBSBackendUser() ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
}

/**
 * Render the user profile page
 */
function zeroBSCRM_render_userprofile() {

	require_once 'user-profile.page.php';
}

/*
* Render user profile page
*/
zeroBSCRM_render_userprofile();
