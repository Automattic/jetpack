<?php
/**
 * Tests for the Protect dashboard's Login protection section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Login_Protection;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Login_Protection
 */
#[CoversClass( Login_Protection::class )]
class Login_Protection_Section_Test extends BaseTestCase {

	/**
	 * Drop the options and filters the tests set.
	 */
	public function tear_down() {
		delete_site_option( 'jetpack_protect_blocked_attempts' );
		delete_option( 'jetpack_sso_match_by_email' );
		delete_option( 'jetpack_sso_require_two_step' );
		remove_all_filters( 'jetpack_sso_require_two_step' );
		remove_all_filters( 'jetpack_sso_match_by_email' );
		parent::tear_down();
	}

	/**
	 * Test that the blocked attempt count is formatted for display.
	 */
	public function test_blocked_count_is_formatted() {
		update_site_option( 'jetpack_protect_blocked_attempts', 12345 );

		$this->assertSame( '12,345', ( new Login_Protection() )->get_state()['blockedCount'] );
	}

	/**
	 * Test that WordPress.com login can't be turned on without a connected owner.
	 */
	public function test_sso_is_not_usable_without_a_connected_owner() {
		$this->assertFalse( ( new Login_Protection() )->get_state()['ssoUsable'] );
	}

	/**
	 * Test that stored SSO options are reported as changeable.
	 */
	public function test_stored_sso_options_are_not_locked() {
		update_option( 'jetpack_sso_match_by_email', 0 );
		update_option( 'jetpack_sso_require_two_step', 1 );

		$state = ( new Login_Protection() )->get_state();

		$unlocked = array(
			'matchByEmail' => false,
			'twoStep'      => false,
		);
		$this->assertSame( $unlocked, $state['ssoLocks'] );
		$this->assertSame(
			array(
				'matchByEmail' => false,
				'twoStep'      => true,
			),
			$state['ssoEffective']
		);
	}

	/**
	 * Test that a filter locks an SSO option and its value wins over the stored one.
	 */
	public function test_filtered_sso_options_are_locked_to_the_filtered_value() {
		update_option( 'jetpack_sso_match_by_email', 1 );
		update_option( 'jetpack_sso_require_two_step', 0 );
		add_filter( 'jetpack_sso_match_by_email', '__return_false' );
		add_filter( 'jetpack_sso_require_two_step', '__return_true' );

		$state = ( new Login_Protection() )->get_state();

		$this->assertSame(
			array(
				'matchByEmail' => true,
				'twoStep'      => true,
			),
			$state['ssoLocks']
		);
		$this->assertSame(
			array(
				'matchByEmail' => false,
				'twoStep'      => true,
			),
			$state['ssoEffective']
		);
	}
}
