<?php

/**
 * Quote related tests
 */
class JPCRM_Quotes_Cest {

	protected $quote_data = array(
		'zbscq_title'       => 'Testing quote',
		'zbscq_value'       => '1000.50',
		'zbscq_date'        => '2021-01-01',
		'zbscq_notes'       => 'This is the quote note',
		'zbs_quote_content' => 'This is the quote content',
	);

	protected $quote_data2 = array(
		'zbscq_title'       => 'Testing quote2',
		'zbscq_value'       => '1010.50',
		'zbscq_date'        => '2021-01-02',
		'zbscq_notes'       => 'This is the quote note2',
		'zbs_quote_content' => 'This is the quote content2',
	);

	protected $expected_quote = array(
		'zbsq_title'    => 'Testing quote',
		'zbsq_value'    => '1000.50',
		'zbsq_date'     => 1609459200,
		'zbsq_notes'    => 'This is the quote note',
		'zbsq_content'  => 'This is the quote content',
		'zbsq_accepted' => false,
	);

	protected $tags = array( 'the-tag' );

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_quotes_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'quotes' );
		$I->see( 'Quotes', '.jpcrm-learn-page-title' );
	}

	public function see_new_quote_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=quote' );
		$I->see( 'New Quote', '.jpcrm-learn-page-title' );
	}

	public function create_new_quote( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=quote' );
		$I->submitForm( '#zbs-edit-form', $this->quote_data );

		// todo: add a tag

		$I->seeInDatabase( $I->table( 'quotes' ), $this->expected_quote );
	}

	public function view_quote( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=quote&zbsid=1' );

		foreach ( $this->quote_data as $field => $data ) {
			$I->seeInField( $field, $data );
		}
	}

	public function edit_quote( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=quote&zbsid=1' );
		$I->submitForm( '#zbs-edit-form', $this->quote_data2 );

		$expected_quote = array(
			'zbsq_title'   => 'Testing quote2',
			'zbsq_value'   => 1010.5,
			'zbsq_notes'   => 'This is the quote note2',
			'zbsq_content' => 'This is the quote content2',
		);

		$I->seeInDatabase( $I->table( 'quotes' ), $expected_quote );
	}
}
