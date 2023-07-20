<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Base class for API test cases.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Tests;

use WorDBless\BaseTestCase;

/**
 * Base class for Jetpack CRM API tests.
 */
abstract class REST_Base_Test_Case extends BaseTestCase {

	/**
	 * Set up for individual tests.
	 */
	protected function set_up() {
		parent::set_up();

		zeroBSCRM_addUserRoles();

		wp_set_current_user( 0 );
		do_action( 'rest_api_init' );
	}

	/**
	 * Reset CRM objects and other miscellaneous data between tests.
	 *
	 * @return void
	 */
	protected function tear_down() {
		parent::tear_down();

		zeroBSCRM_clearUserRoles();

		// WorDBless doesn't use an actual database which means DAL doesn't work and
		// do_action( 'init' ) is never executed, so DAL is never initialised as
		// well, so we can strongly assume that if it's defined, then it's because
		// we've mocked a response we need from it.
		if ( isset( $GLOBALS['zbs']->DAL ) ) {
			unset( $GLOBALS['zbs']->DAL );
		}
	}

	/**
	 * Create WordPress user.
	 *
	 * @param array $args A list of arguments to create the WP user from.
	 *
	 * @return int
	 */
	public function create_wp_user( $args = array() ) {
		return wp_insert_user(
			wp_parse_args(
				$args,
				array(
					'user_login' => 'dummy_user',
					'user_pass'  => 'dummy_pass',
					'role'       => 'administrator',
				)
			)
		);
	}

	/**
	 * Generate default contact information.
	 *
	 * @param array $args (Optional) A list of arguments we should use for the contact.
	 *
	 * @return array The contact.
	 */
	public function generate_contact( $args = array() ) {
		return wp_parse_args(
			$args,
			array(
				'id'       => 1,
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
		);
	}

}
