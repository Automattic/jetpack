<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

##WLREMOVE
/**
 * Save welcome wizard settings
 */
function zbs_wizard_fin() {

	// nonce to bounce out if not from right page
	check_ajax_referer( 'zbswf-ajax-nonce', 'security' );
	// only admin can do this too (extra security layer)

	$r = array();

	if ( current_user_can( 'manage_options' ) ) {

		global $zbs;

		// Retrieve post
		$crm_name       = sanitize_text_field( $_POST['zbs_crm_name'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$crm_curr       = sanitize_text_field( $_POST['zbs_crm_curr'] );  // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$crm_type       = sanitize_text_field( $_POST['zbs_crm_type'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$crm_other      = sanitize_text_field( $_POST['zbs_crm_other'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$crm_menu_style = (int) sanitize_text_field( $_POST['zbs_crm_menu_style'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$crm_share      = empty( $_POST['zbs_crm_share_essentials'] ) ? 0 : 1;

		$crm_enable_quotes     = empty( $_POST['zbs_quotes'] ) ? 0 : 1;
		$crm_enable_invoices   = empty( $_POST['zbs_invoicing'] ) ? 0 : 1;
		$crm_enable_woo_module = empty( $_POST['jpcrm_woo_module'] ) ? 0 : 1;

		$bn      = sanitize_text_field( $_POST['zbs_crm_subblogname'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$fn      = sanitize_text_field( $_POST['zbs_crm_first_name'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$ln      = sanitize_text_field( $_POST['zbs_crm_last_name'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$em      = sanitize_text_field( $_POST['zbs_crm_email'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$emv     = zeroBSCRM_validateEmail( $em );
		$crm_sub = empty( $_POST['zbs_crm_subscribed'] ) ? 0 : 1;

		// Just to pass for smm:
		$crm_enable_forms = 1;
		$crm_override     = 0;
		$crm_url          = '';

		// Save down initial options as option bk
		$init_options = array(
			'share' => $crm_share,
			'bn'    => $bn,
			'fn'    => $fn,
			'ln'    => $ln,
			'em'    => $em,
			'emv'   => $emv,
			'smm'   => time(),
			'n'     => $crm_name,
			'u'     => $crm_url,
			'o'     => $crm_other,
			's'     => $crm_sub,
			't'     => $crm_type,
			'ov'    => $crm_override,
			'eq'    => $crm_enable_quotes,
			'ei'    => $crm_enable_invoices,
			'ef'    => $crm_enable_forms,
			'ew'    => $crm_enable_woo_module,
			'ems'   => $crm_menu_style,
			'v'     => $zbs->version,
			'cu'    => $crm_curr,
		);
		update_option( 'zbs_initopts_' . time(), $init_options, false );

		// Note: this only shares if "share essentials" has been ticked...
		// ... or email subscribe (where upon our server ignores customer data except email sub details)
		if ( is_callable( 'curl_init' ) && ( $crm_share === 1 || $crm_sub === 1 ) ) {

			$crm_url = home_url();

			// pass whether we are sharing essentials
			$m = $init_options;

			wp_remote_post(
				$zbs->urls['smm'],
				array(
					'method'      => 'POST',
					'timeout'     => 45,
					'redirection' => 5,
					'httpversion' => '1.0',
					'blocking'    => true,
					'headers'     => array(),
					'body'        => $m,
					'cookies'     => array(),
				)
			);

		}

		// Header text
		$zbs->settings->update( 'customheadertext', $crm_name );

		// load currency list
		global $whwpCurrencyList; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		if ( ! isset( $whwpCurrencyList ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			require_once ZEROBSCRM_INCLUDE_PATH . 'wh.currency.lib.php';
		}

		// Currency (Grim but will work for now)
		$curr_setting = array(
			'chr'    => '$',
			'strval' => 'USD',
		);
		if ( ! empty( $crm_curr ) ) {
			foreach ( $whwpCurrencyList as $currency_obj ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				if ( $currency_obj[1] === $crm_curr ) {
					$curr_setting['chr']    = $currency_obj[0];
					$curr_setting['strval'] = $currency_obj[1];
					break;
				}
			}
		}

		// Save currency
		$zbs->settings->update( 'currency', $curr_setting );

		// Save Share Essentials
		$zbs->settings->update( 'shareessentials', $crm_share );

		// Menu style
		switch ( $crm_menu_style ) {

			case 1:
				// full (normal) wp
				$zbs->settings->update( 'menulayout', 1 );
				break;

			case 2:
				// slimline
				$zbs->settings->update( 'menulayout', 2 );
				break;

			case 3:
				// CRM only
				$zbs->settings->update( 'menulayout', 3 );
				break;

		}

		// Enable/disable extensions
		if ( $crm_enable_quotes === 1 ) {
			zeroBSCRM_extension_install_quotebuilder();
		} else {
			zeroBSCRM_extension_uninstall_quotebuilder();
		}

		if ( $crm_enable_invoices === 1 ) {

			zeroBSCRM_extension_install_invbuilder();
			// This assumes they want pdf inv too ;)
			zeroBSCRM_extension_install_pdfinv();

		} else {

			zeroBSCRM_extension_uninstall_invbuilder();

		}

		if ( $crm_enable_forms === 1 ) {
			zeroBSCRM_extension_install_forms();
		} else {
			zeroBSCRM_extension_uninstall_forms();
		}

		if ( $crm_enable_woo_module === 1 ) {
			zeroBSCRM_extension_install_woo_sync();
		} else {
			zeroBSCRM_extension_uninstall_woo_sync();
		}

		// Tax tables, defaults
		// added basic in v3.0, this would be great to expand if we get operational country (assume by ip?)
		// based on currency, not ideal.
		$current_tax_tables = zeroBSCRM_taxRates_getTaxTableArr();
		if ( is_array( $current_tax_tables ) && count( $current_tax_tables ) === 0 && is_array( $curr_setting ) && isset( $curr_setting['strval'] ) ) {

			$rates_to_add = array();

			// this can be factored out into a single 'setup packs' file ++
			switch ( $curr_setting['strval'] ) {

				case 'USD':
					// state based, MEH. leave for v3.1+
					break;

				case 'GBP':
					$rates_to_add[] = array(
						'name' => 'VAT',
						'rate' => 20.0,
					);
					break;

			}

			// add any
			if ( count( $rates_to_add ) > 0 ) {
				foreach ( $rates_to_add as $rate ) {

					zeroBSCRM_taxRates_addUpdateTaxRate(
						array(
							// fields (directly)
							'data' => $rate,
						)
					);
				}
			}
		}

		// log successful wizard completion
		update_option( 'jpcrm_wizard_completed', 1 );

		$r['message'] = 'success';
		$r['success'] = 1;
		echo wp_json_encode( $r );
		die();
	} else {
		$r['message'] = 'Unauthorised to do this...';
		$r['success'] = 0;
		echo wp_json_encode( $r );
		die();
	}
}
add_action( 'wp_ajax_nopriv_zbs_wizard_fin', 'zbs_wizard_fin' );
add_action( 'wp_ajax_zbs_wizard_fin', 'zbs_wizard_fin' );
##/WLREMOVE
