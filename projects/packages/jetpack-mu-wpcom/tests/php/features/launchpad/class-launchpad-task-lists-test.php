<?php
/**
 * Test class for Launchpad_Task_Lists.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Test class for Launchpad_Task_Lists.
 *
 * @coversDefaultClass Launchpad_Task_Lists
 */
class Launchpad_Task_Lists_Test extends \WorDBless\BaseTestCase {
	/**
	 * Make sure that ::build() doesn't create a PHP warning when it doesn't get a valid ID.
	 *
	 * @covers ::build
	 */
	public function test_build_creates_no_PHP_warnings() {
		$result = Launchpad_Task_Lists::get_instance()->build( '' );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test completing a task and verifying that it's marked as complete.
	 *
	 * @covers ::mark_task_complete ::is_task_complete
	 */
	public function test_mark_task_complete() {
		$task_to_complete = 'task_0';
		$task_incomplete  = 'task_1';
		wpcom_register_launchpad_task(
			array(
				'id'    => $task_to_complete,
				'title' => $task_to_complete,
			)
		);
		wpcom_register_launchpad_task(
			array(
				'id'    => $task_incomplete,
				'title' => $task_incomplete,
			)
		);

		$task_lists = Launchpad_Task_Lists::get_instance();
		$task_lists->mark_task_complete( $task_to_complete );

		$this->assertTrue( $task_lists->is_task_id_complete( $task_to_complete ) );
		$this->assertTrue( $task_lists->get_task_status( $task_to_complete ) );
		$this->assertEquals( array( $task_to_complete => true ), $task_lists->get_task_statuses() );
		$this->assertFalse( $task_lists->is_task_id_complete( $task_incomplete ) );
		$this->assertFalse( $task_lists->get_task_status( false ) );
	}
}
