<?php
/**
 * Tests for the Newsletter Mode intro seen state.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The intro is personal onboarding state, so it is stored per user.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Intro_Seen_Test extends BaseTestCase {

	/**
	 * An administrator, set as the current user for each test.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'intro_admin',
				'user_pass'  => 'password',
				'user_email' => 'intro_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $this->user_id );
	}

	/**
	 * A user who has never seen the intro starts unseen.
	 */
	public function test_defaults_to_intro_not_seen() {
		$this->assertFalse( Mode::is_intro_seen() );
	}

	/**
	 * Posting `seen: true` persists it for the current user.
	 */
	public function test_marking_intro_seen_persists_for_the_current_user() {
		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/intro-seen' );
		$request->set_param( 'seen', true );

		$response = Mode::rest_update_intro_seen( $request );

		$this->assertTrue( $response->get_data()['seen'] );
		$this->assertTrue( Mode::is_intro_seen() );
	}

	/**
	 * Posting `seen: false` clears it again, leaving no meta row behind.
	 */
	public function test_clearing_intro_seen_removes_the_meta_row() {
		update_user_meta( $this->user_id, Mode::META_INTRO_SEEN, 1 );

		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/intro-seen' );
		$request->set_param( 'seen', false );

		$response = Mode::rest_update_intro_seen( $request );

		$this->assertFalse( $response->get_data()['seen'] );
		$this->assertFalse( Mode::is_intro_seen() );
		$this->assertSame( '', get_user_meta( $this->user_id, Mode::META_INTRO_SEEN, true ) );
	}

	/**
	 * The GET handler reports the current user's own state.
	 */
	public function test_get_reports_the_current_state() {
		$this->assertFalse( Mode::rest_get_intro_seen()->get_data()['seen'] );

		update_user_meta( $this->user_id, Mode::META_INTRO_SEEN, 1 );

		$this->assertTrue( Mode::rest_get_intro_seen()->get_data()['seen'] );
	}

	/**
	 * One user seeing the intro must not mark it seen for another.
	 */
	public function test_intro_seen_does_not_leak_between_users() {
		update_user_meta( $this->user_id, Mode::META_INTRO_SEEN, 1 );
		$this->assertTrue( Mode::is_intro_seen() );

		$other_user_id = wp_insert_user(
			array(
				'user_login' => 'intro_admin_two',
				'user_pass'  => 'password',
				'user_email' => 'intro_admin_two@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $other_user_id );

		$this->assertFalse( Mode::is_intro_seen() );
	}
}
