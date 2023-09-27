<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Factories\Invoice_Factory;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Invoice_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that invoice entity is created from input data.
	 */
	public function test_invoice_entity_from_input_data() {

		$invoice_data = $this->generate_invoice_data();

		// Create the Invoice instance from the invoice data (tidy DAL format)
		$invoice = Invoice_Factory::create( $invoice_data );

		$this->assertInstanceOf( Invoice::class, $invoice );

		// Check that the invoice data field values are the same to the Invoice instance field values.
		foreach ( $invoice_data as $key => $value ) {
			if ( ! property_exists( $invoice, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $invoice->$key, "Invoice property $key does not match" );
		}
	}

	/**
	 * @testdox Test create invoice entity from input data and insert in DB via DAL.
	 */
	public function test_create_invoice_from_input_data_and_insert_into_DB() {

		$invoice_data = $this->generate_invoice_data();

		// Create the Invoice instance from the invoice data (tidy DAL format)
		$invoice = Invoice_Factory::create( $invoice_data );

		$this->assertInstanceOf( Invoice::class, $invoice );

		// This is not necessary for this test, but we ensure we modify the entity
		$invoice->currency = 'AUD';

		global $zbs;

		// Prepare the Invoice data from the instance to save it via DAL
		$invoice_data_to_save = Invoice_Factory::data_for_dal( $invoice );

		$id = $zbs->DAL->invoices->addUpdateInvoice( $invoice_data_to_save );

		// Check that the Invoice is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the invoice and check that the data is the same.
		$invoice_data_from_db = $zbs->DAL->invoices->getInvoice( $id );

		// Create the instance from the invoice data retrieve from the DAL/DB.
		$invoice_instance = Invoice_Factory::create( $invoice_data_from_db );

		$this->assertInstanceOf( Invoice::class, $invoice_instance );
		$this->assertNotNull( $invoice_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'id_override',
			'parent',
			'status',
			'hash',
			'send_attachments',
			'currency',
			'date',
			'due_date',
			'total',
		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $invoice->$field, $invoice_instance->$field, "Invoice property $field does not match" );
		}
	}
}
