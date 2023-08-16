<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Contact_WP_Dev_Test extends JPCRM_Base_Test_Case {

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

		$test = $zbs->DAL->contacts->getContacts();
		$this->assertCount( 1, $test );
	}

}
