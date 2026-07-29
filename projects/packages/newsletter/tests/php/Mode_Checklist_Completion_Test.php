<?php
/**
 * Tests for Newsletter Mode getting-started checklist completion.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Completion is stored per user against the stable ids in Mode::CHECKLIST_TASKS,
 * which is also the REST enum — so only a real task can ever be written.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Checklist_Completion_Test extends BaseTestCase {

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
				'user_login' => 'completion_admin',
				'user_pass'  => 'password',
				'user_email' => 'completion_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $this->user_id );
	}

	/**
	 * Build a POST request for the completion route.
	 *
	 * @param string $task Task id to record.
	 * @return \WP_REST_Request
	 */
	private function completion_request( $task ) {
		$request = new \WP_REST_Request( 'POST', '/' . Mode::REST_NAMESPACE . '/checklist-completed' );
		$request->set_param( 'task', $task );

		return $request;
	}

	/**
	 * A user who has done nothing starts with an empty list.
	 */
	public function test_starts_with_nothing_completed() {
		$this->assertSame( array(), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * Recording a task persists it for the current user.
	 */
	public function test_recording_a_task_persists_it() {
		$response = Mode::rest_update_checklist_completed( $this->completion_request( 'make-it-yours' ) );

		$this->assertSame( array( 'make-it-yours' ), $response->get_data()['completed'] );
		$this->assertSame( array( 'make-it-yours' ), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * Tasks accumulate rather than replacing one another.
	 */
	public function test_tasks_accumulate() {
		Mode::rest_update_checklist_completed( $this->completion_request( 'make-it-yours' ) );
		Mode::rest_update_checklist_completed( $this->completion_request( 'grow-audience' ) );

		$this->assertSame(
			array( 'make-it-yours', 'grow-audience' ),
			Mode::get_completed_checklist_tasks()
		);
	}

	/**
	 * Recording the same task twice is a no-op, not a duplicate — the Dashboard
	 * fires on a click it does not de-duplicate across tabs.
	 */
	public function test_recording_a_task_twice_is_idempotent() {
		Mode::rest_update_checklist_completed( $this->completion_request( 'grow-audience' ) );
		Mode::rest_update_checklist_completed( $this->completion_request( 'grow-audience' ) );

		$this->assertSame( array( 'grow-audience' ), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * A value that is no longer a task cannot reach callers, however it came to be
	 * stored — a renamed or dropped step must not linger.
	 */
	public function test_unknown_tasks_are_filtered_out() {
		update_user_meta(
			$this->user_id,
			Mode::META_CHECKLIST_COMPLETED,
			array( 'make-it-yours', 'a-step-that-no-longer-exists' )
		);

		$this->assertSame( array( 'make-it-yours' ), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * Meta that is not an array (or was never set) degrades to empty rather than
	 * blowing up the Dashboard payload.
	 */
	public function test_non_array_meta_degrades_to_empty() {
		update_user_meta( $this->user_id, Mode::META_CHECKLIST_COMPLETED, 'nonsense' );

		$this->assertSame( array(), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * The route only accepts real task ids, so the meta cannot be grown by an
	 * arbitrary request. The enum lives on the route args rather than in the
	 * handler, so assert it through the schema the way the REST server does.
	 */
	public function test_route_rejects_a_task_that_is_not_on_the_list() {
		$request = $this->completion_request( 'not-a-real-task' );

		$validated = rest_validate_value_from_schema(
			$request->get_param( 'task' ),
			array(
				'type' => 'string',
				'enum' => Mode::CHECKLIST_TASKS,
			),
			'task'
		);

		$this->assertInstanceOf( \WP_Error::class, $validated );
	}

	/**
	 * "Start a newsletter" is true the moment the site exists, so it is never
	 * clicked and must not be storable.
	 */
	public function test_the_always_done_row_is_not_completable() {
		$this->assertNotContains( 'start-newsletter', Mode::CHECKLIST_TASKS );
	}

	/**
	 * Progress is personal: one admin working through the list must not tick it
	 * off for another.
	 */
	public function test_completion_does_not_leak_between_users() {
		Mode::rest_update_checklist_completed( $this->completion_request( 'grow-audience' ) );

		$other_user_id = wp_insert_user(
			array(
				'user_login' => 'completion_admin_two',
				'user_pass'  => 'password',
				'user_email' => 'completion_admin_two@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $other_user_id );

		$this->assertSame( array(), Mode::get_completed_checklist_tasks() );
	}

	/**
	 * The GET handler reports the current state for this user.
	 */
	public function test_get_reports_the_current_state() {
		$this->assertSame( array(), Mode::rest_get_checklist_completed()->get_data()['completed'] );

		Mode::rest_update_checklist_completed( $this->completion_request( 'write-first-post' ) );

		$this->assertSame(
			array( 'write-first-post' ),
			Mode::rest_get_checklist_completed()->get_data()['completed']
		);
	}
}
