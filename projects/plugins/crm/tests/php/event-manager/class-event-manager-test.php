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
	 * @testdox Test that contact multi fields updated event is fired
	 */
	public function test_notify_on_contact_multi_fields_updated() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		$contact_updated           = $contact_data;
		$contact_updated['status'] = 'Customer';
		$contact_updated['name']   = 'John2';
		$contact_updated['email']  = 'johndoe2@example.com';
		$assertions_ran            = 0;

		// Listen and test the name was updated.
		add_action(
			'jpcrm_contact_name_updated',
			function ( $contact, $old_name ) use ( &$assertions_ran ) {
				$this->assertEquals( 'John Doe', $old_name );
				$this->assertEquals( 'John2', $contact['name'] );
				$assertions_ran += 2;
			},
			10,
			2
		);

		// Listen and test the email was updated.
		add_action(
			'jpcrm_contact_email_updated',
			function ( $contact, $old_email ) use ( &$assertions_ran ) {
				$this->assertEquals( 'johndoe@example.com', $old_email );
				$this->assertEquals( 'johndoe2@example.com', $contact['email'] );
				$assertions_ran += 2;
			},
			10,
			2
		);

		$contact_event = new Contact_Event();
		$contact_event->updated( $contact_updated, $contact_data );
		$this->assertEquals( 4, $assertions_ran, 'All assertions did not run!' );
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

	/**
	 * @testdox Test that contact deleted event is fired
	 */
	public function test_notify_on_contact_deleted() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		add_action(
			'jpcrm_contact_deleted',
			function ( $contact_id ) use ( $contact_data ) {
				$this->assertEquals( $contact_data['id'], $contact_id );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->deleted( $contact_data['id'] );
	}

	/**
	 * @testdox Test contact is about to be deleted event is fired
	 */
	public function test_notify_on_contact_before_delete() {

		$contact_data = Event_Manager_Faker::instance()->contact_data();

		add_action(
			'jpcrm_contact_before_delete',
			function ( $contact_id ) use ( $contact_data ) {
				$this->assertEquals( $contact_data['id'], $contact_id );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->before_delete( $contact_data['id'] );
	}
}
