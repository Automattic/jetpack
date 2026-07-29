<?php
/**
 * Tests for the Newsletter Mode enabled flag.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The mode is gated by availability and then a plain per-site option.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Flag_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'mode_flag_admin',
				'user_pass'  => 'password',
				'user_email' => 'mode_flag_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );
		delete_option( Mode::OPTION_NAME );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		delete_option( Mode::OPTION_NAME );

		parent::tear_down();
	}

	/**
	 * The dark-launch availability gate wins over the stored option.
	 */
	public function test_unavailable_mode_is_never_enabled() {
		update_option( Mode::OPTION_NAME, true );

		$this->assertFalse( Mode::is_available() );
		$this->assertFalse( Mode::is_enabled() );
	}

	/**
	 * Once available, the stored option controls the enabled state.
	 */
	public function test_available_mode_reads_the_stored_option() {
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$this->assertTrue( Mode::is_available() );
		$this->assertFalse( Mode::is_enabled() );

		update_option( Mode::OPTION_NAME, true );

		$this->assertTrue( Mode::is_enabled() );
	}

	/**
	 * The REST GET handler reports the effective enabled state, including the
	 * availability gate.
	 */
	public function test_rest_get_reports_the_effective_enabled_state() {
		update_option( Mode::OPTION_NAME, true );

		$this->assertFalse( Mode::rest_get_mode()->get_data()['enabled'] );

		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$this->assertTrue( Mode::rest_get_mode()->get_data()['enabled'] );
	}

	/**
	 * The REST POST handler writes the option and returns the resulting state.
	 */
	public function test_rest_update_persists_the_mode_flag() {
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/mode' );
		$request->set_param( 'enabled', true );

		$response = Mode::rest_update_mode( $request );

		$this->assertTrue( get_option( Mode::OPTION_NAME ) );
		$this->assertTrue( $response->get_data()['enabled'] );

		$request->set_param( 'enabled', false );
		$response = Mode::rest_update_mode( $request );

		$this->assertFalse( (bool) get_option( Mode::OPTION_NAME ) );
		$this->assertFalse( $response->get_data()['enabled'] );
	}

	/**
	 * Only users who can manage options can use the mode routes.
	 */
	public function test_rest_permission_requires_manage_options() {
		$this->assertTrue( Mode::rest_permission_check() );

		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'mode_flag_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'mode_flag_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$this->assertFalse( Mode::rest_permission_check() );
	}
}
