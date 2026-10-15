<?php
/**
 * Tests for the Monitor class.
 *
 * @package automattic/jetpack-monitor
 */

namespace Automattic\Jetpack\Monitor;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monitor\Monitor
 */
#[CoversClass( Monitor::class )]
class Monitor_Test extends BaseTestCase {

	/**
	 * Log in a new user.
	 *
	 * @return int User ID.
	 */
	private function log_in_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'monitor_user',
				'user_pass'  => 'pass',
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	public function test_get_notifications_reads_saved_choice_without_asking_wpcom() {
		update_option( Monitor::notifications_copy_option_name( $this->log_in_user() ), 1 );

		$this->assertTrue( Monitor::get_notifications() );
	}

	public function test_get_notifications_is_false_without_saved_choice_or_linked_user() {
		$user_id = $this->log_in_user();

		$this->assertFalse( Monitor::get_notifications() );
		$this->assertFalse( get_option( Monitor::notifications_copy_option_name( $user_id ) ) );
	}

	public function test_disconnect_forgets_only_linked_users_choices() {
		Jetpack_Options::update_option(
			'user_tokens',
			array(
				2 => 'token.secret.2',
				3 => 'token.secret.3',
			)
		);
		foreach ( array( 2, 3, 4 ) as $user_id ) {
			update_option( Monitor::notifications_copy_option_name( $user_id ), 1 );
		}

		Monitor::delete_all_notifications_copies();

		$this->assertFalse( get_option( Monitor::notifications_copy_option_name( 2 ) ) );
		$this->assertFalse( get_option( Monitor::notifications_copy_option_name( 3 ) ) );
		$this->assertSame( 1, (int) get_option( Monitor::notifications_copy_option_name( 4 ) ) );
	}

	public function test_add_standalone_module_does_not_duplicate() {
		$this->assertSame( array( 'protect', 'monitor' ), Monitor::add_standalone_module( array( 'protect', 'monitor' ) ) );
		$this->assertSame( array( 'protect', 'monitor' ), Monitor::add_standalone_module( array( 'protect' ) ) );
	}
}
