<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Factories\Quote_Factory;
use Automattic\Jetpack\CRM\Entities\Quote;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Quote_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that quote entity is created from input data.
	 */
	public function test_quote_entity_from_input_data() {

		$quote_data = $this->generate_quote_data();

		// Create the Quote instance from the quote data (tidy DAL format)
		$quote = Quote_Factory::create( $quote_data );

		$this->assertInstanceOf( Quote::class, $quote );

		// Check that the quote data field values are the same to the Quote instance field values.
		foreach ( $quote_data as $key => $value ) {
			if ( ! property_exists( $quote, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $quote->$key, "Quote property $key does not match" );
		}
	}

	/**
	 * @testdox Test create quote entity from input data and insert in DB via DAL.
	 */
	public function test_create_quote_from_input_data_and_insert_into_DB() {

		$quote_data = $this->generate_quote_data();

		// Create the Quote instance from the quote data (tidy DAL format)
		$quote = Quote_Factory::create( $quote_data );

		$this->assertInstanceOf( Quote::class, $quote );

		// This is not necessary for this test, but we ensure we modify the entity
		$quote->title = 'Factory Test';

		global $zbs;

		// Prepare the Quote data from the instance to save it via DAL
		$quote_data_to_save = Quote_Factory::data_for_dal( $quote );

		$id = $zbs->DAL->quotes->addUpdateQuote( $quote_data_to_save );

		// Check that the Quote is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the quote and check that the data is the same.
		$quote_data_from_db = $zbs->DAL->quotes->getQuote( $id );

		// Create the instance from the quote data retrieve from the DAL/DB.
		$quote_instance = Quote_Factory::create( $quote_data_from_db );

		$this->assertInstanceOf( Quote::class, $quote_instance );
		$this->assertNotNull( $quote_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'id_override',
			'title',
			'value',
			'hash',
			'template',
			'currency',
			'date',
			'notes',
			'send_attachments',
		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $quote->$field, $quote_instance->$field, "Quote property $field does not match" );
		}
	}
}
