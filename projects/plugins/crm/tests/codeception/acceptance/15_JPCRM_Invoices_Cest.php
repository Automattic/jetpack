<?php

/**
 * Invoice related tests
 */
class JPCRM_Invoices_Cest {

	protected $item1        = array(
		'name'        => 'Item-1',
		'description' => 'Description of item 1',
		'quantity'    => 1,
		'price'       => 10.5,
	);
	protected $item2        = array(
		'name'        => 'Item-2',
		'description' => 'Description of item 2',
		'quantity'    => 2,
		'price'       => 30,
	);
	protected $invoice_data = array(
		'zbsi_date'               => '2021-01-08',
		'zbsi_due'                => '30',
		'zbs_invoice_contact'     => 1,
		'zbs_invoice_company'     => -1,
		'invoice-customiser-type' => 'quantity',
		'invoice_discount_total'  => 10,
		'invoice_discount_type'   => '%',
		'zbs-tag-list'            => '["important"]',
	);

	protected $invoice_db_data = array(
		'zbsi_date'              => '1610064000',
		'zbsi_due_date'          => '1612656000',
		'zbsi_hours_or_quantity' => 1,
		'zbsi_id_override'       => '1',
		'zbsi_discount'          => 10.0,
		'zbsi_discount_type'     => '%',
		'zbsi_net'               => 70.5,
		'zbsi_total'             => 63.45,
		'zbsi_status'            => 'Draft',
	);

	public function __construct() {
		$this->invoice_data['zbsli_itemname'] = array(
			$this->item1['name'],
			$this->item2['name'],
		);
		$this->invoice_data['zbsli_itemdes']  = array(
			$this->item1['description'],
			$this->item2['description'],
		);
		$this->invoice_data['zbsli_quan']     = array(
			$this->item1['quantity'],
			$this->item2['quantity'],
		);
		$this->invoice_data['zbsli_price']    = array(
			$this->item1['price'],
			$this->item2['price'],
		);
	}

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_invoices_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'invoices' );
		$I->see( 'Invoices', '.jpcrm-learn-page-title' );
	}

	public function see_new_invoice_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=invoice' );
		$I->see( 'New Invoice', '.jpcrm-learn-page-title' );
	}

	public function create_new_invoice( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=invoice' );
		$I->submitForm( '#zbs-edit-form', $this->invoice_data );

		$I->seeInDatabase( $I->table( 'invoices' ), $this->invoice_db_data );
	}

	public function see_created_invoice( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=invoice&zbsid=1' );

		// We can check only that we reach the page. The data is load via AJAX.
		$I->see( 'Edit Invoice', '.jpcrm-learn-page-title' );
	}

	public function create_second_invoice( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=invoice' );

		$this->invoice_data['invoice_status'] = 'Paid';

		$I->submitForm( '#zbs-edit-form', $this->invoice_data );

		$this->invoice_db_data['zbsi_status']      = 'Paid';
		$this->invoice_db_data['ID']               = '2';
		$this->invoice_db_data['zbsi_id_override'] = '2';

		$I->seeInDatabase( $I->table( 'invoices' ), $this->invoice_db_data );
	}

	// todo: Check invoice autonumber. Configurate the autonumber
}
