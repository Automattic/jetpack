<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Factories\Transaction_Factory;
use Automattic\Jetpack\CRM\Entities\Transaction;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Transaction_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that transaction entity is created from input data.
	 */
	public function test_transaction_entity_from_input_data() {

		$transaction_data = $this->generate_transaction_data();

		// Create the Transaction instance from the transaction data (tidy DAL format)
		$transaction = Transaction_Factory::create( $transaction_data );

		$this->assertInstanceOf( Transaction::class, $transaction );

		// Check that the transaction data field values are the same to the Transaction instance field values.
		foreach ( $transaction_data as $key => $value ) {
			if ( ! property_exists( $transaction, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $transaction->$key, "Transaction property $key does not match" );
		}
	}

	/**
	 * @testdox Test create transaction entity from input data and insert in DB via DAL.
	 */
	public function test_create_transaction_from_input_data_and_insert_into_DB() {

		$transaction_data = $this->generate_transaction_data();

		// Create the Transaction instance from the transaction data (tidy DAL format)
		$transaction = Transaction_Factory::create( $transaction_data );

		$this->assertInstanceOf( Transaction::class, $transaction );

		// This is not necessary for this test, but we ensure we modify the entity
		$transaction->title = 'Factory Test';

		global $zbs;

		// Prepare the Transaction data from the instance to save it via DAL
		$transaction_data_to_save = Transaction_Factory::data_for_dal( $transaction );

		$id = $zbs->DAL->transactions->addUpdateTransaction( $transaction_data_to_save );

		// Check that the Transaction is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the transaction and check that the data is the same.
		$transaction_data_from_db = $zbs->DAL->transactions->getTransaction( $id );

		// Create the instance from the transaction data retrieve from the DAL/DB.
		$transaction_instance = Transaction_Factory::create( $transaction_data_from_db );

		$this->assertInstanceOf( Transaction::class, $transaction_instance );
		$this->assertNotNull( $transaction_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'desc',
			'title',
			'hash',
			'type',
			'currency',
			'total',
			'tax',

		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $transaction->$field, $transaction_instance->$field, "Transaction property $field does not match" );
		}
	}
}
