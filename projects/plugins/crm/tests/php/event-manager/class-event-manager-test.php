<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Event_Manager\Tests;

use Automattic\Jetpack\CRM\Event_Manager\Contact_Event;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/class-event-manager-faker.php';

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Event_Manager
 */
class Event_Manager_Test extends BaseTestCase {

	/**
	 * @testdox Test that contact created event is fired
	 */
	public function test_notify_on_contact_created() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		add_action(
			'jpcrm_contact_created',
			function ( $contact ) use ( $contact_data ) {
				$this->assertEquals( $contact, $contact_data );
			},
			10,
			1
		);

		$contact_event = new Contact_Event();

		$contact_event->created( $contact_data );
	}

	/**
	 * @testdox Test that contact status updated event is fired
	 */
	public function test_notify_on_contact_status_updated() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		$contact_updated           = $contact_data;
		$contact_updated['status'] = 'Customer';

		add_action(
			'jpcrm_contact_status_updated',
			function ( $contact, $old_status_value ) {
				$this->assertEquals( 'Customer', $contact['status'] );
				$this->assertEquals( 'Lead', $old_status_value );
			},
			10,
			2
		);

		$contact_event = new Contact_Event();

		$contact_event->updated( $contact_updated, $contact_data );
	}

	/**
	 * @testdox Test that contact updated event is fired
	 */
	public function test_notify_on_contact_updated() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		$contact_updated           = $contact_data;
		$contact_updated['status'] = 'Customer';

		add_action(
			'jpcrm_contact_updated',
			function ( $contact ) {
				$this->assertEquals( 'Customer', $contact['status'] );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->updated( $contact_updated, $contact_data );
	}
}
