<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Company;
use Automattic\Jetpack\CRM\Entities\Factories\Company_Factory;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Company_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that company entity is created from input data.
	 */
	public function test_company_entity_from_input_data() {

		$company_data = $this->generate_company_data();

		// Create the Company instance from the company data (tidy DAL format)
		$company = Company_Factory::create( $company_data );

		$this->assertInstanceOf( Company::class, $company );

		// Check that the company data field values are the same to the Company instance field values.
		foreach ( $company_data as $key => $value ) {
			if ( ! property_exists( $company, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $company->$key, "Company property $key does not match" );
		}
	}

	/**
	 * @testdox Test create company entity from input data and insert in DB via DAL.
	 */
	public function test_create_company_from_input_data_and_insert_into_DB() {

		$company_data = $this->generate_company_data();

		// Create the Company instance from the company data (tidy DAL format)
		$company = Company_Factory::create( $company_data );

		$this->assertInstanceOf( Company::class, $company );

		// This is not necessary for this test, but we ensure we modify the entity
		$company->name = 'Factory Test';

		global $zbs;

		// Prepare the Company data from the instance to save it via DAL
		$company_data_to_save = Company_Factory::data_for_dal( $company );

		$id = $zbs->DAL->companies->addUpdateCompany( $company_data_to_save );

		// Check that the Company is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the company and check that the data is the same.
		$company_data_from_db = $zbs->DAL->companies->getCompany( $id );

		// Create the instance from the company data retrieve from the DAL/DB.
		$company_instance = Company_Factory::create( $company_data_from_db );

		$this->assertInstanceOf( Company::class, $company_instance );
		$this->assertNotNull( $company_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'name',
			'email',
			'status',
			'addr1',
			'addr2',
			'city',
			'country',
			'postcode',
			'maintel',
			'sectel',
		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $company->$field, $company_instance->$field, "Company property $field does not match" );
		}
	}
}
