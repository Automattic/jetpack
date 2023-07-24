<?php

/**
 * Transaction related tests
 */
class JPCRM_Transactions_Cest {

	protected $transaction_data = array(
		'zbst_ref'            => 'Transaction-ref-1',
		'zbst_status'         => 'Succeeded',
		'zbst_title'          => 'Transaction 1',
		'zbst_total'          => '111.30',
		'zbst_date_datepart'  => '2021-08-01',
		'zbst_date_timepart'  => '11:00',
		'zbst_type'           => 'Sale',
		'zbst_desc'           => 'This is the Transaction 1 description',
		'zbst_shipping'       => 5.5,
		'zbst_shipping_taxes' => '',
		'customer'            => 1,
		'invoice_id'          => 1,
	);

	protected $transaction_db_data = array(
		'zbst_ref'            => 'Transaction-ref-1',
		'zbst_status'         => 'Succeeded',
		'zbst_title'          => 'Transaction 1',
		'zbst_total'          => 111.30,
		'zbst_date'           => 1627815600,
		'zbst_type'           => 'Sale',
		'zbst_desc'           => 'This is the Transaction 1 description',
		'zbst_shipping'       => 5.5,
		'zbst_shipping_taxes' => '',
	);

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_transactions_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'transactions' );
		$I->see( 'Transactions', '.jpcrm-learn-page-title' );
	}

	public function see_new_transaction_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=transaction' );
		$I->see( 'New Transaction', '.jpcrm-learn-page-title' );
	}

	public function create_new_transaction( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=transaction' );

		$I->seeInField( 'zbscrm_newtransaction', 1 );

		// Get the generated transaction reference >>> doesn't work
		// $this->transaction_db_data['zbst_ref'] = $I->grabTextFrom( '#ref' );

		$I->submitForm( '#zbs-edit-form', $this->transaction_data );

		$I->seeInDatabase( $I->table( 'transactions' ), $this->transaction_db_data );
	}

	public function see_created_transaction( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=transaction&zbsid=1' );

		// todo: get zbst_ref value to check it in the view
		// $I->grabColumnFromDatabase()

		$transaction_view_data = array(
			'zbst_ref'           => $this->transaction_data['zbst_ref'],
			'zbst_status'        => $this->transaction_data['zbst_status'],
			'zbst_title'         => $this->transaction_data['zbst_title'],
			'zbst_total'         => $this->transaction_data['zbst_total'],
			'zbst_date_datepart' => $this->transaction_data['zbst_date_datepart'],
			'zbst_date_timepart' => $this->transaction_data['zbst_date_timepart'],
			'zbst_type'          => $this->transaction_data['zbst_type'],
			'zbst_desc'          => $this->transaction_data['zbst_desc'],
			'customer'           => $this->transaction_data['customer'],
			'invoice_id'         => $this->transaction_data['invoice_id'],
		);

		$I->see( 'Edit Transaction', '.jpcrm-learn-page-title' );

		foreach ( $transaction_view_data as $field => $value ) {
			$I->seeInField( $field, $value );
		}
	}
}
