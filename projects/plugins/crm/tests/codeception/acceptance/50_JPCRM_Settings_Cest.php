<?php

/**
 * Contact related tests
 */
class JPCRM_Settings_Cest {

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_settings_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings' );
		$I->see( 'Settings', '.jpcrm-learn-page-title' );

		$I->see( '', '.item' );
	}

	public function see_settings_page_menus( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings' );

		$I->see( 'General', '.item' );
		$I->see( 'Companies', '.item' );
		$I->see( 'Quotes', '.item' );
		$I->see( 'Invoicing', '.item' );
		$I->see( 'Transactions', '.item' );
		$I->see( 'Forms', '.item' );
		$I->see( 'Client Portal', '.item' );
		$I->see( 'Mail', '.item' );
		$I->see( 'Extensions', '.item' );
	}

	public function see_general_settings_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=settings' );

		$I->see( 'General Settings', 'h1.header' );

		$I->see( 'Menu Layout', 'label' );
		$I->see( 'Show Prefix', 'label' );
		$I->see( 'Show Contact Address Fields', 'label' );
		$I->see( 'Second Address Fields', 'label' );
		$I->see( 'Second Address Label', 'label' );
		$I->see( 'Use "Countries" in Address Fields', 'label' );
		$I->see( 'Contact Assignment', 'label' );
		$I->see( 'Assign Ownership', 'label' );
		$I->see( 'Task Scheduler Ownership', 'label' );
		$I->see( 'Show Click 2 Call links', 'label' );
		$I->see( 'Click 2 Call link type', 'label' );
		$I->see( 'Use Navigation Mode', 'label' );
		$I->see( 'Show Social Accounts', 'label' );
		$I->see( 'Use AKA Mode', 'label' );
		$I->see( 'Contact Image Mode', 'label' );
		$I->see( 'Override WordPress', 'label' );
		$I->see( 'Login Logo Override', 'label' );
		$I->see( 'Custom CRM Header', 'label' );
		$I->see( 'Disable Front-End', 'label' );
		$I->see( 'Usage Tracking', 'label' );
		$I->see( 'Show public credits', 'label' );
		$I->see( 'Show admin credits', 'label' );
		$I->see( 'Accepted Upload File Types', 'label' );
		$I->see( 'Auto-log', 'label' );
	}

	public function save_general_settings_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=settings' );

		$I->seeInField( 'wpzbscrm_avatarmode', '1' );
		$I->dontSeeCheckboxIsChecked( 'jpcrm_showpoweredby_public' );
		$I->seeCheckboxIsChecked( 'jpcrm_showpoweredby_admin' );

		$I->selectOption( 'select[name=wpzbscrm_avatarmode]', '2' );
		$I->checkOption( 'jpcrm_showpoweredby_public' );
		$I->uncheckOption( 'jpcrm_showpoweredby_admin' );

		$I->click( 'Save Settings', 'button' );

		$I->seeInField( 'wpzbscrm_avatarmode', '2' );
		$I->seeCheckboxIsChecked( 'jpcrm_showpoweredby_public' );
		$I->dontSeeCheckboxIsChecked( 'jpcrm_showpoweredby_admin' );
	}

	public function see_business_info_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=bizinfo' );

		$I->see( 'Business Info', 'h1.header' );

		$I->see( 'Your Business Name', 'label' );
		$I->see( 'Your Business Logo', 'label' );
		$I->see( 'Owner Name', 'label' );
		$I->see( 'Business Contact Email', 'label' );
		$I->see( 'Business Website URL', 'label' );
		$I->see( 'Business Telephone Number', 'label' );
		$I->see( 'Twitter Handle', 'label' );
		$I->see( 'Facebook Page', 'label' );
		$I->see( 'LinkedIn ID', 'label' );

		$I->see( 'follow Jetpack CRM' );
	}
	public function save_business_info_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=bizinfo' );

		$I->fillField( 'businessname', 'Test Company' );
		$I->click( 'Save Settings', 'button' );

		$I->seeInField( 'businessname', 'Test Company' );
	}

	public function see_custom_fields_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=customfields' );

		$I->see( 'Custom Fields', 'h1.header' );
		$I->see( 'Contact Custom Fields' );
		$I->see( 'Contact Custom File Upload Boxes' );
		$I->see( 'Company Custom Fields' );
		$I->see( 'Quote Custom Fields' );
		$I->see( 'Invoice Custom Fields' );
		$I->see( 'Transaction Custom Fields' );
		$I->see( 'Address Custom Fields' );
		$I->see( 'Save Custom Fields' );
	}

	public function save_custom_fields_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=customfields' );

		$custom_field = array(
			'wpzbscrm_cf[customers][name][]'        => 'New Field',
			'wpzbscrm_cf[customers][type][]'        => 'text',
			'wpzbscrm_cf[customers][placeholder][]' => 'This is the placeholder',
		);

		$I->submitForm( '[action="?page=zerobscrm-plugin-settings&tab=customfields"]', $custom_field );

		$I->seeInSource( '{"customers":{"new-field":["text","New Field","This is the placeholder","new-field"]}' );
	}

	public function see_field_sorts_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=fieldsorts' );

		$I->see( 'Field Sorts', 'h1.header' );
		$I->see( 'Address Fields' );
		$I->see( 'Contact Fields' );
		$I->see( 'Company Fields' );
	}

	public function see_field_options_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=fieldoptions' );

		$I->see( 'Field Options', 'h1.header' );
		$I->see( 'General Field Options' );
		$I->see( 'Contact Field Options' );
		$I->see( 'Funnels' );
	}

	public function see_list_view_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=listview' );

		$I->see( 'List View', 'h1.header' );
		$I->see( 'Not Contacted in X Days' );
		$I->see( 'Allow Inline Edits' );
	}

	public function save_list_view_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=listview' );

		$I->fillField( 'wpzbscrm_notcontactedinx', '40' );
		$I->click( 'Save Settings' );

		$I->seeInField( 'wpzbscrm_notcontactedinx', '40' );
	}

	public function see_tax_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=tax' );

		$I->see( 'Tax Settings', 'h1.header' );
		$I->see( 'Tax Rates' );
	}

	public function save_tax_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=tax' );

		$tax_data = array(
			'jpcrm-taxtable-line[ids][]'   => -1,
			'jpcrm-taxtable-line[names][]' => 'IGIC',
			'jpcrm-taxtable-line[rates][]' => 7.0,
		);

		$I->submitForm( 'form', $tax_data );

		$I->seeInSource( '{"id":"1","owner":"1","name":"IGIC","rate":"7.00"' );
	}

	public function see_license_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=license' );

		$I->see( 'License Key', 'h1.header' );
		$I->see( 'License Key' );
	}

	public function see_companies_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=companies' );

		$I->see( 'Companies Settings', 'h1.header' );
		$I->see( 'General B2B Settings' );
		$I->see( 'Company Field Options' );
	}

	public function save_companies_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=companies' );

		$I->selectOption( 'jpcrm_setting_coororg', 'Domain' );
		$I->fillField( 'jpcrm-status-companies', 'Lead,Customer,Refused,Priority' );
		$I->click( 'Save Settings' );

		$I->seeOptionIsSelected( 'jpcrm_setting_coororg', 'Domain' );
		$I->seeInField( 'jpcrm-status-companies', 'Lead,Customer,Refused,Priority' );
	}

	public function see_quotes_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=quotebuilder' );

		$I->see( 'Quotes', 'h1.header' );
		$I->see( 'Enable Quote Builder' );
	}

	public function save_quotes_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=quotebuilder' );

		$I->uncheckOption( 'wpzbscrm_usequotebuilder' );
		$I->click( 'Save Settings' );

		$I->dontSeeCheckboxIsChecked( 'wpzbscrm_usequotebuilder' );

		$I->checkOption( 'wpzbscrm_usequotebuilder' );
		$I->click( 'Save Settings' );

		$I->seeCheckboxIsChecked( 'wpzbscrm_usequotebuilder' );
	}

	public function see_invoicing_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=invbuilder' );

		$I->see( 'Invoicing', 'h1.header' );
		$I->see( 'Reference type' );
		$I->see( 'Invoice reference label' );
		$I->see( 'Extra Invoice Info' );
		$I->see( 'Payment Info' );
		$I->see( 'Thank You' );
		$I->see( 'Extra Statement Info' );
		$I->see( 'Hide Invoice ID' );
		$I->see( 'Enable tax' );
		$I->see( 'Enable discounts' );
		$I->see( 'Enable shipping' );
	}

	public function save_invoicing_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=invbuilder' );

		$invoicing_data = array(
			'refprefix'     => 'INV-',
			'refnextnum'    => 2,
			'refsuffix'     => '-D',
			'reflabel'      => 'Ref',
			'businessextra' => 'Company info',
		);

		foreach ( $invoicing_data as $name => $data ) {
			$I->fillField( $name, $data );
		}

		$I->click( 'Save Settings' );

		foreach ( $invoicing_data as $name => $data ) {
			$I->seeInField( $name, $data );
		}
	}

	public function see_transactions_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=transactions' );

		$I->see( 'Transactions', 'h1.header' );
		$I->see( 'Use Shipping' );
		$I->see( 'Use Paid/Completed Dates' );
		$I->see( 'Include these statuses in the transaction total value' );
		$I->see( 'Transaction Status' );

		$I->see( 'Additional settings on transactions' );
		$I->see( 'Show fee' );
		$I->see( 'Show tax' );
		$I->see( 'Show discount' );
		$I->see( 'Show net amount' );
	}

	public function save_transactions_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=transactions' );

		$I->uncheckOption( 'wpzbscrm_shippingfortransactions' );
		$I->checkOption( 'wpzbscrm_paiddatestransaction' );
		$I->checkOption( 'wpzbscrm_transaction_fee' );
		$I->checkOption( 'wpzbscrm_transaction_tax' );
		$I->checkOption( 'wpzbscrm_transaction_discount' );
		$I->checkOption( 'wpzbscrm_transaction_net' );

		$I->click( 'Save Settings' );

		$I->seeCheckboxIsChecked( 'wpzbscrm_paiddatestransaction' );
		$I->dontSeeCheckboxIsChecked( 'wpzbscrm_shippingfortransactions' );
		$I->seeCheckboxIsChecked( 'wpzbscrm_transaction_fee' );
		$I->seeCheckboxIsChecked( 'wpzbscrm_transaction_tax' );
		$I->seeCheckboxIsChecked( 'wpzbscrm_transaction_discount' );
		$I->seeCheckboxIsChecked( 'wpzbscrm_transaction_net' );
	}

	public function see_forms_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=forms' );

		$I->see( 'Forms', 'h1.header' );
		$I->see( 'Enable reCaptcha' );
		$I->see( 'reCaptcha Site Key' );
		$I->see( 'reCaptcha Site Secret' );
	}

	public function save_forms_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=forms' );

		$I->click( 'Save Settings' );
	}

	public function see_client_portal_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=clients' );

		$I->see( 'Client Portal', 'h1.header' );
		$I->see( 'Client Portal Page' );
		$I->see( 'Allow Easy-Access Links' );
		$I->see( 'Generate WordPress Users for new contacts' );
		$I->see( 'Only Generate Users for Statuses' );
		$I->see( 'Assign extra role when generating users' );
		$I->see( 'Fields to hide on Portal' );
	}

	public function save_client_portal_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=clients' );

		$I->uncheckOption( 'wpzbscrm_easyaccesslinks' );

		$I->click( 'Save Settings' );

		$I->dontSeeCheckboxIsChecked( 'wpzbscrm_easyaccesslinks' );
	}

	/*
	public function see_api_settings( AcceptanceTester $I )
	{
		$I->goToPageViaSlug('settings', '&tab=api');

		$I->see('API Settings', 'h1.header');
		$I->see( 'API Endpoint' );
		$I->see( 'API Key' );
		$I->see( 'API Secret' );
	}*/

	public function see_mail_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=mail' );

		$I->see( 'Mail Settings', 'h1.header' );
		$I->see( 'Track Open Statistics' );
		$I->see( 'Disable SSL Verification' );
		$I->see( 'Format of Sender Name' );
		$I->see( 'Email Unsubscribe Line' );
		$I->see( 'Unsubscribe Page' );
		$I->see( 'Email Unsubscribe Line' );
	}

	public function save_mail_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=mail' );

		$I->uncheckOption( 'wpzbscrm_emailtracking' );

		$I->click( 'Save Settings' );

		$I->dontSeeCheckboxIsChecked( 'wpzbscrm_emailtracking' );
	}

	public function see_mail_delivery_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=maildelivery' );

		$I->see( 'Mail Delivery', 'h1.header' );
	}

	public function see_locale_settings( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=locale' );

		$I->see( 'Currency Symbol', 'label' );
		$I->see( 'Currency Format', 'label' );
		$I->see( 'Install a font', 'label' );
	}

	public function save_locale_settings_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'settings', '&tab=locale' );

		$I->seeInField( 'wpzbscrm_currency', 'USD' );

		$I->selectOption( 'select[name=wpzbscrm_currency]', 'EUR' );

		$I->click( 'Save Settings', 'button' );

		$I->seeInField( 'wpzbscrm_currency', 'EUR' );
	}
}
