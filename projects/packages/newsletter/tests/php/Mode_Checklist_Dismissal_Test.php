<?php
/**
 * Tests for the Newsletter Mode getting-started checklist dismissal.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The checklist is a per-user onboarding aid, so dismissal is stored in user
 * meta rather than a site option: one admin finishing with it must not hide it
 * from another.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Checklist_Dismissal_Test extends BaseTestCase {

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
				'user_login' => 'checklist_admin',
				'user_pass'  => 'password',
				'user_email' => 'checklist_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $this->user_id );
	}

	/**
	 * A user who has never dismissed it starts undismissed.
	 */
	public function test_defaults_to_not_dismissed() {
		$this->assertFalse( Mode::is_checklist_dismissed() );
	}

	/**
	 * Posting `dismissed: true` persists it for the current user.
	 */
	public function test_dismissing_persists_for_the_current_user() {
		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/checklist-dismissed' );
		$request->set_param( 'dismissed', true );

		$response = Mode::rest_update_checklist_dismissed( $request );

		$this->assertTrue( $response->get_data()['dismissed'] );
		$this->assertTrue( Mode::is_checklist_dismissed() );
	}

	/**
	 * Posting `dismissed: false` clears it again, leaving no meta row behind.
	 */
	public function test_undismissing_clears_the_meta_row() {
		update_user_meta( $this->user_id, Mode::META_CHECKLIST_DISMISSED, 1 );

		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/checklist-dismissed' );
		$request->set_param( 'dismissed', false );

		$response = Mode::rest_update_checklist_dismissed( $request );

		$this->assertFalse( $response->get_data()['dismissed'] );
		$this->assertFalse( Mode::is_checklist_dismissed() );
		$this->assertSame( '', get_user_meta( $this->user_id, Mode::META_CHECKLIST_DISMISSED, true ) );
	}

	/**
	 * The GET handler reports the current user's own state.
	 */
	public function test_get_reports_the_current_state() {
		$this->assertFalse( Mode::rest_get_checklist_dismissed()->get_data()['dismissed'] );

		update_user_meta( $this->user_id, Mode::META_CHECKLIST_DISMISSED, 1 );

		$this->assertTrue( Mode::rest_get_checklist_dismissed()->get_data()['dismissed'] );
	}

	/**
	 * One user dismissing it must not hide the checklist from another — the
	 * reason this is user meta and not a site option.
	 */
	public function test_dismissal_does_not_leak_between_users() {
		update_user_meta( $this->user_id, Mode::META_CHECKLIST_DISMISSED, 1 );
		$this->assertTrue( Mode::is_checklist_dismissed() );

		$other_user_id = wp_insert_user(
			array(
				'user_login' => 'checklist_admin_two',
				'user_pass'  => 'password',
				'user_email' => 'checklist_admin_two@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $other_user_id );

		$this->assertFalse( Mode::is_checklist_dismissed() );
	}
}
