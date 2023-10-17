<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Tests;

use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;

/**
 * Test case that ensures we have a clean and functioning Jetpack CRM instance.
 */
class JPCRM_Base_Integration_Test_Case extends JPCRM_Base_Test_Case {

	/**
	 * Clean up the database after each test.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	public function tear_down(): void {
		parent::tear_down();

		zeroBSCRM_database_reset( false );
	}

	/**
	 * Add a contact.
	 *
	 * @param array $args (Optional) A list of arguments we should use for the contact.
	 *
	 * @return int The contact ID.
	 */
	public function add_contact( array $args = array() ) {
		global $zbs;

		return $zbs->DAL->contacts->addUpdateContact( array( 'data' => $this->generate_contact_data( $args ) ) );
	}

	/**
	 * Add an invoice.
	 *
	 * @param array $args (Optional) A list of arguments we should use for the invoice.
	 *
	 * @return int The invoice ID.
	 */
	public function add_invoice( array $args = array() ) {
		global $zbs;

		return $zbs->DAL->invoices->addUpdateInvoice( array( 'data' => $this->generate_invoice_data( $args ) ) );
	}

	/**
	 * Add a transaction.
	 *
	 * @param array $args (Optional) A list of arguments we should use for the transaction.
	 *
	 * @return int The transaction ID.
	 */
	public function add_transaction( array $args = array() ) {
		global $zbs;

		return $zbs->DAL->transactions->addUpdateTransaction( array( 'data' => $this->generate_transaction_data( $args ) ) );
	}

	/**
	 * Get a contact.
	 *
	 * @param int|string $id The ID of the contact we want to get.
	 * @param array $args (Optional) A list of arguments we should use for the contact.
	 * @return Contact|null
	 */
	public function get_contact( $id, array $args = array() ) {
		global $zbs;

		$contact_data = $zbs->DAL->contacts->getContact( $id, $args );

		return Contact_Factory::create( $contact_data );
	}

	/**
	 * Add a WP User.
	 *
	 * @return int The user ID.
	 */
	public function add_wp_user() {

		return wp_create_user( 'testuser', 'password', 'user@demo.com' );
	}
}
