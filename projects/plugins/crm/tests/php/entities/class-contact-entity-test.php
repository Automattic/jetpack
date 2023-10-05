<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Contact_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that contact entity is created from input data.
	 */
	public function test_contact_entity_from_input_data() {

		$contact_data = $this->generate_contact_data();

		// Create the Contact instance from the contact data (tidy DAL format)
		$contact = Contact_Factory::create( $contact_data );

		$this->assertInstanceOf( Contact::class, $contact );

		// Check that the contact data field values are the same to the Contact instance field values.
		foreach ( $contact_data as $key => $value ) {
			if ( ! property_exists( $contact, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $contact->$key, "Contact property $key does not match" );
		}
	}

	/**
	 * @testdox Test create contact entity from input data and insert in DB via DAL.
	 */
	public function test_create_contact_from_input_data_and_insert_into_DB() {

		$contact_data = $this->generate_contact_data();

		// Create the Contact instance from the contact data (tidy DAL format)
		$contact = Contact_Factory::create( $contact_data );

		$this->assertInstanceOf( Contact::class, $contact );

		// This is not necessary for this test, but we ensure we modify the entity
		$contact->fname = 'Factory Test';

		global $zbs;

		// Prepare the Contact data from the instance to save it via DAL
		$contact_data_to_save = Contact_Factory::data_for_dal( $contact );

		$id = $zbs->DAL->contacts->addUpdateContact( $contact_data_to_save );

		// Check that the Contact is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the contact and check that the data is the same.
		$contact_data_from_db = $zbs->DAL->contacts->getContact( $id );

		// Create the instance from the contact data retrieve from the DAL/DB.
		$contact_instance = Contact_Factory::create( $contact_data_from_db );

		$this->assertInstanceOf( Contact::class, $contact_instance );
		$this->assertNotNull( $contact_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'fname',
			'lname',
			'email',
			'status',
			'addr1',
			'addr2',
			'city',
			'country',
			'postcode',
			'hometel',
			'worktel',
			'mobtel',
		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $contact->$field, $contact_instance->$field, "Contact property $field does not match" );
		}
	}
}
