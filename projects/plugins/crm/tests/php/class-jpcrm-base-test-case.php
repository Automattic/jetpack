<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use WP_UnitTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';
require_once __DIR__ . '../../mocks/mock-zbs-dal.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class JPCRM_Base_Test_Case extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		zeroBSCRM_database_reset( false );
	}

	/**
	 * @testdox Test the update contact status action executes the action
	 */
	public function test_update_contact_status_action() {
		global $zbs;

		$zbs->DAL->contacts->addUpdateContact(
			array(
				'data' => array(
					'status' => 'Lead',
					'name'   => 'John Doe',
					'email'  => '',
				),
			)
		);

		$contacts = $zbs->DAL->contacts->getContacts();
		$this->assertCount( 1, $contacts );
	}

}
