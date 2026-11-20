<?php
/**
 * Tests for the Protect dashboard's Login protection section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Protect\Sections\Login_Protection;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
		remove_all_filters( 'jetpack_offline_mode' );
		Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
		// Both answers are memoized for the request.
		Status_Cache::clear();
		( new Connection_Manager() )->reset_connection_status();
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
	 * Test that WordPress.com login needs a connected owner and a site that isn't in offline mode.
	 *
	 * @dataProvider provide_sso_conditions
	 *
	 * @param bool $has_owner  Whether the site has a connected owner.
	 * @param bool $is_offline Whether the site is in offline mode.
	 * @param bool $usable     Whether WordPress.com login can be turned on.
	 */
	#[DataProvider( 'provide_sso_conditions' )]
	public function test_sso_is_usable_with_a_connected_owner_and_not_offline( $has_owner, $is_offline, $usable ) {
		if ( $has_owner ) {
			$user_id = wp_insert_user(
				array(
					'user_login' => 'owner',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			);
			Jetpack_Options::update_option( 'master_user', $user_id );
			Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );
		}
		add_filter( 'jetpack_offline_mode', $is_offline ? '__return_true' : '__return_false' );

		$state = ( new Login_Protection() )->get_state();

		$this->assertSame( $usable, $state['ssoUsable'] );
		$this->assertSame( $is_offline, $state['isOffline'] );
	}

	/**
	 * Data provider for the conditions WordPress.com login depends on.
	 *
	 * @return array<string,array{bool,bool,bool}> [ $has_owner, $is_offline, $usable ]
	 */
	public static function provide_sso_conditions() {
		return array(
			'connected owner'          => array( true, false, true ),
			'no connected owner'       => array( false, false, false ),
			'connected owner, offline' => array( true, true, false ),
		);
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
