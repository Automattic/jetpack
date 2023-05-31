<?php

/**
 * Contact related tests
 */
class JPCRM_Contacts_Cest {

	protected $user_data      = array(
		'zbsc_fname'       => 'Testing user',
		'zbsc_lname'       => 'Last name',
		'zbsc_status'      => 'Customer',
		'zbsc_email'       => 'my_email@email.com',
		'zbsc_addr1'       => 'Address line 1',
		'zbsc_addr2'       => 'Address line 2',
		'zbsc_city'        => 'The City',
		'zbsc_county'      => 'The County',
		'zbsc_country'     => 'The Country',
		'zbsc_postcode'    => '1111',
		'zbsc_secaddr1'    => 'Address2 line 1',
		'zbsc_secaddr2'    => 'Address2 line 2',
		'zbsc_seccity'     => 'The City2',
		'zbsc_seccounty'   => 'The County2',
		'zbsc_seccountry'  => 'The Country2',
		'zbsc_secpostcode' => '2222',
		'zbsc_hometel'     => '12345678',
		'zbsc_worktel'     => '87654321',
		'zbsc_mobtel'      => '11223344',
	);
	protected $edit_user_data = array(
		'zbsc_fname'       => 'Testing user2',
		'zbsc_lname'       => 'Last name2',
		'zbsc_status'      => 'Lead',
		'zbsc_email'       => 'my_email2@email.com',
		'zbsc_addr1'       => 'Address3 line 1',
		'zbsc_addr2'       => 'Address3 line 2',
		'zbsc_city'        => 'The City3',
		'zbsc_county'      => 'The County3',
		'zbsc_country'     => 'The Country3',
		'zbsc_postcode'    => '3333',
		'zbsc_secaddr1'    => 'Address4 line 1',
		'zbsc_secaddr2'    => 'Address4 line 2',
		'zbsc_seccity'     => 'The City4',
		'zbsc_seccounty'   => 'The County4',
		'zbsc_seccountry'  => 'The Country4',
		'zbsc_secpostcode' => '4444',
		'zbsc_hometel'     => '+3412345678',
		'zbsc_worktel'     => '+3487654321',
		'zbsc_mobtel'      => '+3411223344',
	);

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_contacts_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'contacts' );
		$I->see( 'Contacts', '.jpcrm-learn-page-title' );
	}

	public function see_new_contact_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=contact' );
		$I->see( 'New Contact', '.jpcrm-learn-page-title' );
	}

	public function create_new_contact( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=contact' );
		$I->submitForm( '#zbs-edit-form', $this->user_data );

		$I->seeInDatabase( $I->table( 'contacts' ), $this->user_data );

		// todo: add a tag
	}

	public function view_contact( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=view&zbstype=contact&zbsid=1' );

		foreach ( $this->user_data as $data ) {
			$I->see( $data );
		}
	}

	public function check_dashboard_has_the_added_contact( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'dashboard' );

		// See the contact data in the Latest Contacts block
		$I->see( 'Latest Contacts', '#settings_dashboard_latest_contacts_display' );
		$I->see( $this->user_data['zbsc_fname'], '#settings_dashboard_latest_contacts_display' );
		$I->see( $this->user_data['zbsc_lname'], '#settings_dashboard_latest_contacts_display' );
		$I->see( $this->user_data['zbsc_status'], '#settings_dashboard_latest_contacts_display' );
	}

	public function edit_contact( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=contact&zbsid=1' );

		$I->submitForm( '#zbs-edit-form', $this->edit_user_data );

		$I->seeInDatabase( $I->table( 'contacts' ), $this->edit_user_data );
	}
}
