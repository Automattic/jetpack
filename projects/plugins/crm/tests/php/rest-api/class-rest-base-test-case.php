<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Base class for API test cases.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Tests;

/**
 * Base class for Jetpack CRM API tests.
 */
abstract class REST_Base_Test_Case extends JPCRM_Base_Integration_Test_Case {

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
	 * Create WordPress user with the 'zerobs_admin' role.
	 *
	 * @param array $args A list of arguments to create the WP user from.
	 *
	 * @return int
	 */
	public function create_wp_jpcrm_admin( $args = array() ) {
		$user_id = $this->create_wp_user( $args );

		if ( ! is_wp_error( $user_id ) ) {
			$user = get_userdata( $user_id );
			$user->add_role( 'zerobs_admin' );
		}

		return $user_id;
	}

}
