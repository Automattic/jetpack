<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Tests;

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
	public function add_contact( $args = array() ) {
		global $zbs;

		return $zbs->DAL->contacts->addUpdateContact( array( 'data' => $this->generate_contact_data( $args ) ) );
	}

}
