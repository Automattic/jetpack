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
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}
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
	 * Data provider for {@see test_task_list_is_completed()}.
	 */
	public function provider_test_task_list_is_completed() {
		$incomplete_task = array();
		$completed_task  = array(
			'is_complete_callback' => '__return_true',
		);

		$launch_task_incomplete = array(
			'isLaunchTask' => true,
		);

		$launch_task_completed = array(
			'isLaunchTask'         => true,
			'is_complete_callback' => '__return_true',
		);

		return array(
			// tasks, expected, task_list_options
			'all tasks incomplete should be incomplete using default options'
				=> array( array( $incomplete_task, $incomplete_task ), false ),
			'all tasks complete should be complete using default options'
				=> array( array( $completed_task, $completed_task ), true ),
			'incomplete task and incomplete launch task should be incomplete using default options'
				=> array( array( $incomplete_task, $launch_task_incomplete ), false ),
			'having the launch task completed should make the task list complete'
				=> array( array( $incomplete_task, $launch_task_completed ), true ),
			'with the require_last_task_completion option, the last task being complete should make the task list complete'
				=> array( array( $incomplete_task, $completed_task ), true, array( 'require_last_task_completion' => true ) ),
			'with the require_last_task_completion option, the last task being incomplete should make the task list incomplete'
				=> array( array( $completed_task, $incomplete_task ), false, array( 'require_last_task_completion' => true ) ),
			'with the required_task_ids option, the task list should be complete if the required task is complete'
				=> array( array( $completed_task, $incomplete_task ), true, array( 'required_task_ids' => array( 'task_0' ) ) ),
			'with the required_task_ids option, the task list should be incomplete if the required task is incomplete'
				=> array( array( $incomplete_task, $incomplete_task ), false, array( 'required_task_ids' => array( 'task_0' ) ) ),
			'with the required_task_ids and require_last_task_completion options and the last task complete, the task list should be incomplete if the required task is incomplete'
				=> array(
					array( $incomplete_task, $completed_task ),
					false,
					array(
						'required_task_ids'            => array( 'task_0' ),
						'require_last_task_completion' => true,
					),
				),
			'the launch task completion should not mark the task list complete if the required task is incomplete'
				=> array( array( $incomplete_task, $launch_task_completed ), false, array( 'required_task_ids' => array( 'task_0' ) ) ),
			'overriding the is_completed_callback should be the only thing that matters'
				=> array( array( $incomplete_task, $incomplete_task ), true, array( 'is_completed_callback' => '__return_true' ) ),
			'custom is_completed_callback should be able to check if first task is complete'
				=> array(
					array( $completed_task, $incomplete_task ),
					true,
					array(
						'is_completed_callback' => function ( $task_list ) {
									$first_task = reset( wpcom_launchpad_checklists()->build( $task_list['id'] ) );
									return $first_task['completed'];
						},
					),
				),
		);
	}

	/**
	 * Tests wpcom_launchpad_is_task_list_completed().
	 *
	 * @dataProvider provider_test_task_list_is_completed
	 *
	 * @param array $tasks             Array of tasks to register.
	 * @param bool  $expected          Expected result of wpcom_launchpad_is_task_list_completed().
	 * @param array $task_list_options Optional. Array of options to pass to wpcom_register_launchpad_task_list().
	 */
	public function test_task_list_is_completed( $tasks, $expected, $task_list_options = array() ) {
		$task_ids = array();
		foreach ( $tasks as $key => $task ) {
			$task_id    = 'task_' . $key;
			$task_ids[] = $task_id;
			wpcom_launchpad_checklists()->unregister_task( $task_id );
			wpcom_register_launchpad_task(
				array_merge(
					array(
						'id'    => $task_id,
						'title' => 'Task ' . $key,
					),
					$task
				)
			);
		}

		wpcom_launchpad_checklists()->unregister_task_list( 'task-list-test' );
		wpcom_register_launchpad_task_list(
			array_merge(
				array(
					'id'       => 'task-list-test',
					'title'    => 'Simple testing task list',
					'task_ids' => $task_ids,
				),
				$task_list_options
			)
		);
		$this->assertEquals( $expected, wpcom_launchpad_is_task_list_completed( 'task-list-test' ) );
	}
}
