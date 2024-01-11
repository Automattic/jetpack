<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Event_Manager\Tests;

use Automattic\Jetpack\CRM\Automation\Tests\Automation_Faker;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Invoice_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Transaction_Factory;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Entities\Transaction;
use Automattic\Jetpack\CRM\Event_Manager\Contact_Event;
use Automattic\Jetpack\CRM\Event_Manager\Invoice_Event;
use Automattic\Jetpack\CRM\Event_Manager\Transaction_Event;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '/../automation/tools/class-automation-faker.php';

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Event_Manager
 */
class Event_Manager_Test extends JPCRM_Base_Test_Case {

	/**
	 * @testdox Test that contact created event is fired
	 */
	public function test_notify_on_contact_created() {

		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		add_action(
			'jpcrm_contact_created',
			function ( $contact_event ) use ( $contact ) {
				$contact->tags = $contact_event->tags;
				$this->assertEquals( $contact_event, $contact );
			},
			10,
			1
		);

		$contact_event = new Contact_Event();

		$contact_event->created( Contact_Factory::tidy_data( $contact ) );
	}

	/**
	 * @testdox Test that contact status updated event is fired
	 */
	public function test_notify_on_contact_status_updated() {
		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		$contact_updated         = clone $contact;
		$contact_updated->status = 'Customer';

		add_action(
			'jpcrm_contact_status_updated',
			function ( $contact, $previous_contact ) {
				$this->assertEquals( 'lead', $contact->status );
				$this->assertEquals( 'Customer', $previous_contact->status );
			},
			10,
			2
		);

		$contact_event = new Contact_Event();

		$contact_event->updated( Contact_Factory::tidy_data( $contact ), Contact_Factory::tidy_data( $contact_updated ) );
	}

	/**
	 * @testdox Test that contact multi fields updated event is fired
	 */
	public function test_notify_on_contact_multi_fields_updated() {
		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		$contact_updated         = clone $contact;
		$contact_updated->status = 'Customer';
		$contact_updated->fname  = 'John2';
		$contact_updated->email  = 'johndoe2@example.com';

		$contact_data         = Contact_Factory::tidy_data( $contact );
		$contact_updated_data = Contact_Factory::tidy_data( $contact_updated );

		$assertions_ran = 0;

		// Listen and test the name was updated.
		add_action(
			'jpcrm_contact_fname_updated',
			function ( $contact, $contact_updated ) use ( &$assertions_ran ) {
				$this->assertEquals( 'John', $contact->fname );
				$this->assertEquals( 'John2', $contact_updated->fname );
				$assertions_ran += 2;
			},
			10,
			2
		);

		// Listen and test the email was updated.
		add_action(
			'jpcrm_contact_email_updated',
			function ( $contact, $contact_updated ) use ( &$assertions_ran ) {
				$this->assertEquals( 'johndoe@example.com', $contact->email );
				$this->assertEquals( 'johndoe2@example.com', $contact_updated->email );
				$assertions_ran += 2;
			},
			10,
			2
		);

		$contact_event = new Contact_Event();
		$contact_event->updated( $contact_data, $contact_updated_data );
		$this->assertEquals( 4, $assertions_ran, 'All assertions did not run!' );
	}

	/**
	 * @testdox Test that contact updated event is fired
	 */
	public function test_notify_on_contact_updated() {
		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		$contact_updated         = clone $contact;
		$contact_updated->status = 'Customer';

		add_action(
			'jpcrm_contact_updated',
			function ( $contact ) {
				$this->assertEquals( 'Customer', $contact->status );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->updated( Contact_Factory::tidy_data( $contact_updated ), Contact_Factory::tidy_data( $contact ) );
	}

	/**
	 * @testdox Test that contact deleted event is fired
	 */
	public function test_notify_on_contact_deleted() {
		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		add_action(
			'jpcrm_contact_deleted',
			function ( $contact_to_delete ) use ( $contact ) {
				$this->assertEquals( $contact->id, $contact_to_delete );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->deleted( $contact->id );
	}

	/**
	 * @testdox Test contact is about to be deleted event is fired
	 */
	public function test_notify_on_contact_before_delete() {
		/** @var Contact $contact */
		$contact = Automation_Faker::instance()->contact();

		add_action(
			'jpcrm_contact_before_delete',
			function ( $contact_to_delete ) use ( $contact ) {
				$this->assertEquals( $contact->id, $contact_to_delete );
			}
		);

		$contact_event = new Contact_Event();

		$contact_event->before_delete( $contact->id );
	}

	/**
	 * @testdox Test that invoice created event is fired
	 */
	public function test_notify_on_invoice_created() {
		/** @var Invoice $invoice */
		$invoice = Automation_Faker::instance()->invoice();

		$invoice_data = Invoice_Factory::tidy_data( $invoice );

		add_action(
			'jpcrm_invoice_created',
			function ( $invoice_created ) use ( $invoice ) {
				$this->assertEquals( $invoice_created, $invoice );
			},
			10,
			1
		);

		$invoice_event = new Invoice_Event();
		$invoice_event->created( $invoice_data );
	}

	/**
	 * @testdox Test that invoice updated event is fired
	 */
	public function test_notify_on_invoice_updated() {
		/** @var Invoice $invoice */
		$invoice          = Automation_Faker::instance()->invoice();
		$previous_invoice = clone $invoice;

		$invoice->currency          = 'EUR';
		$previous_invoice->currency = 'USD';

		$invoice_data          = Invoice_Factory::tidy_data( $invoice );
		$previous_invoice_data = Invoice_Factory::tidy_data( $previous_invoice );

		add_action(
			'jpcrm_invoice_updated',
			function ( $invoice_updated, $previous_invoice ) {
				$this->assertEquals( 'EUR', $invoice_updated->currency );
				$this->assertEquals( 'USD', $previous_invoice->currency );
			},
			10,
			2
		);

		$invoice_event = new Invoice_Event();
		$invoice_event->updated( $invoice_data, $previous_invoice_data );
	}

	/**
	 * @testdox Test that transaction created event is fired
	 */
	public function test_notify_on_transaction_created() {
		/** @var Transaction $transaction */
		$transaction = Automation_Faker::instance()->transaction();

		$transaction_data = Transaction_Factory::tidy_data( $transaction );

		add_action(
			'jpcrm_transaction_created',
			function ( $transaction_created ) use ( $transaction ) {
				// @todo Matching tags for now, but we should investigate the factory / what the DAL is returning.
				$transaction_created->tags = $transaction->tags;
				$this->assertEquals( $transaction_created, $transaction );
			},
			10,
			1
		);

		$transaction_event = new Transaction_Event();
		$transaction_event->created( $transaction_data );
	}

	/**
	 * @testdox Test that transaction created event is fired
	 */
	public function test_notify_on_transaction_updated() {
		/** @var Transaction $transaction */
		$transaction          = Automation_Faker::instance()->transaction();
		$previous_transaction = clone $transaction;

		$transaction_data          = Transaction_Factory::tidy_data( $transaction );
		$previous_transaction_data = Transaction_Factory::tidy_data( $previous_transaction );

		add_action(
			'jpcrm_transaction_updated',
			function ( $transaction_updated ) use ( $transaction ) {
				// @todo Matching tags for now, but we should investigate the factory / what the DAL is returning.
				$transaction_updated->tags = $transaction->tags;
				$this->assertEquals( $transaction_updated, $transaction );
			},
			10,
			1
		);

		$transaction_event = new Transaction_Event();
		$transaction_event->updated( $transaction_data, $previous_transaction_data );
	}

	/**
	 * @testdox Test that transaction deleted event is fired
	 */
	public function test_notify_on_transaction_deleted() {

		$transaction_deleted_id = 12345;

		add_action(
			'jpcrm_transaction_deleted',
			function ( $invoice_id ) use ( $transaction_deleted_id ) {
				$this->assertEquals( $invoice_id, $transaction_deleted_id );
			},
			10,
			1
		);

		$transaction_event = new Transaction_Event();
		$transaction_event->deleted( $transaction_deleted_id );
	}
}
