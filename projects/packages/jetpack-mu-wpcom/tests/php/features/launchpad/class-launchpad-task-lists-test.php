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
	 * Filter out tasks with the task list callback.
	 *
	 * @covers ::build
	 */
	public function test_task_list_is_visible_callback() {
		wpcom_register_launchpad_task(
			array(
				'id'    => 'task_0',
				'title' => 'task_0',
			)
		);

		wpcom_register_launchpad_task(
			array(
				'id'    => 'task_1',
				'title' => 'task_1',
			)
		);

		wpcom_register_launchpad_task_list(
			array(
				'id'                     => 'test-task-list',
				'title'                  => 'test-task-list',
				'task_ids'               => array(
					'task_0',
					'task_1',
				),
				'visible_tasks_callback' => function ( $task_list, $task_ids ) {
					return array_filter(
						$task_ids,
						function ( $task_id ) {
							return 'task_1' === $task_id;
						}
					);
				},
			)
		);

		$result = Launchpad_Task_Lists::get_instance()->build( 'test-task-list' );

		$this->assertCount( 1, $result );
		$this->assertEquals( 'task_1', $result[0]['id'] );
	}
}
