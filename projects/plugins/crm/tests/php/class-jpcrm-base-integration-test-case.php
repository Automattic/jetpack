<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Tests;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Test case that ensures we have a clean and functioning Jetpack CRM instance.
 */
class JPCRM_Base_Integration_Test_Case extends JPCRM_Base_Test_Case {

	/**
	 * Clean up the database after each test.
	 *
	 * @since $$next-version$$
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
	 * Get a contact.
	 *
	 * @param int|string $id The ID of the contact we want to get.
	 * @param array $args (Optional) A list of arguments we should use for the contact.
	 * @return array|false
	 */
	public function get_contact( $id, array $args = array() ) {
		global $zbs;

		$contact = $zbs->DAL->contacts->getContact( $id, $args );

		return ( new Data_Type_Contact( $contact ) )->get_entity();
	}

}
