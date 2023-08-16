<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Tests;

use WP_UnitTestCase;
use ZeroBSCRM;

/**
 * Test case that ensures we have a clean and functioning Jetpack CRM instance.
 */
class JPCRM_Base_Test_Case extends WP_UnitTestCase {

	/**
	 * The original/initial ZBS instance.
	 *
	 * This can be used to always reset to the original state.
	 * Use-case: someone has to mock part of ZBS for a specific outcome. E.g.: returning a fatal error?
	 *
	 * @since $$next-version$$
	 *
	 * @var ?ZeroBSCRM
	 */
	private $original_zbs;

	/**
	 * Store the initial state of ZBS.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		// We have to clone the value of $GLOBALS['zbs'] because just assigning
		// it to a static property will still create a reference which means
		// we would never restore the previous state.
		global $zbs;
		$this->original_zbs = clone $zbs;

		zeroBSCRM_database_reset( false );
	}

	/**
	 * Restore the original state of ZBS.
	 *
	 * Restore the original state of ZBS and the database after each test.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function tear_down(): void {
		parent::tear_down();

		global $zbs;
		$zbs = $this->original_zbs;

		zeroBSCRM_database_reset( false );
	}

	/**
	 * Generate default contact information.
	 *
	 * @param array $args (Optional) A list of arguments we should use for the contact.
	 *
	 * @return int The contact ID.
	 */
	public function generate_contact( $args = array() ) {
		global $zbs;

		return $zbs->DAL->contacts->addUpdateContact(
			array(
				'data' => wp_parse_args(
					$args,
					array(
						'fname'    => 'John',
						'lname'    => 'Doe',
						'email'    => 'dev@domain.null',
						'addr1'    => 'My Street 1',
						'addr2'    => 'First floor',
						'city'     => 'New York',
						'country'  => 'US',
						'postcode' => '10001',
						'hometel'  => '11111111',
						'worktel'  => '22222222',
						'mobtel'   => '33333333',
					)
				),
			)
		);
	}

}
