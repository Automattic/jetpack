<?php

/**
 * AJAX call: Wizard Finished
 * Updates settings based on welcome wizard options
 */
function jpcrm_woosync_wizard_finished(){

	global $zbs;

	// Nonce check
	check_ajax_referer( 'jpcrm-woo-wizard-ajax-nonce', 'security' );

	// only where access
	if ( current_user_can( 'manage_options' ) ) {

		// settings
		$zeroBSCRM_woocommerce_Settings = $zbs->modules->woosync->settings;

		// track wizard completions
		$runCount = get_option( 'jpcrm_woo_connect_wizard_completions', 0 );
		update_option( 'jpcrm_woo_connect_wizard_completions', $runCount + 1 );

		// Mode
		$wcsetuptype = ( isset( $_POST['jpcrm_wcsetuptype'] ) && $_POST['jpcrm_wcsetuptype'] === '1' ) ? JPCRM_WOO_SYNC_MODE_API : JPCRM_WOO_SYNC_MODE_LOCAL;

		// domain and keys
		$wcdomain = sanitize_text_field( $_POST['jpcrm_wcdomain'] );
		$wckey    = sanitize_text_field( $_POST['jpcrm_wckey'] );
		$wcsecret = sanitize_text_field( $_POST['jpcrm_wcsecret'] );
		$wcprefix = sanitize_text_field( $_POST['jpcrm_wcprefix'] );

		// enable invoices
		$wcinv = ( isset( $_POST['jpcrm_wcinv'] ) && $_POST['jpcrm_wcinv'] === '1' ) ? 1 : 0;

		// tag customers with product name
		$wctagcust = ( isset( $_POST['jpcrm_wctagcust'] ) && $_POST['jpcrm_wctagcust'] === '1' ) ? 1 : 0;

		// enable invoices in Woo My Account
		$wcacc = ( isset( $_POST['jpcrm_wcacc'] ) && $_POST['jpcrm_wcacc'] === '1' ) ? 1 : 0;

		// update settings
		$zeroBSCRM_woocommerce_Settings->update( 'wcsetuptype', $wcsetuptype );
		$zeroBSCRM_woocommerce_Settings->update( 'wcdomain', $wcdomain );
		$zeroBSCRM_woocommerce_Settings->update( 'wckey', $wckey );
		$zeroBSCRM_woocommerce_Settings->update( 'wcsecret', $wcsecret );
		$zeroBSCRM_woocommerce_Settings->update( 'wcinv', $wcinv );
		$zeroBSCRM_woocommerce_Settings->update( 'wctagcust', $wctagcust );
		$zeroBSCRM_woocommerce_Settings->update( 'wcacc', $wcacc );
		$zeroBSCRM_woocommerce_Settings->update( 'wcprefix', $wcprefix );

		echo json_encode(
			array(
				'message' => 'success',
				'success' => 1,
			)
		);
		exit();

	} else {

		echo json_encode(
			array(
				'message' => 'Nope.',
				'success' => 0,
			)
		);
		exit();

	}

}
add_action( 'wp_ajax_jpcrm_woosync_wizard_finished', 'jpcrm_woosync_wizard_finished' );
