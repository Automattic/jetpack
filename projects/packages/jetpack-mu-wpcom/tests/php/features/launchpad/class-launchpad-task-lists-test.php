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
			/**
			 * Test data is in the format of:
			 *
			 * 'test name' => array(
			 *   array( $task1, $task2, ... ),
			 *   $expected,
			 *   array( $task_list_options ) (optional)
			 * )
			 */
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

	/**
	 * Test the validation of the repetition props.
	 * Both target_repetitions and repetition_count_callback must be set if either property is set.
	 */
	public function test_repetition_counting_task_definition() {
		$valid_task = array(
			'id'                        => 'task_0',
			'title'                     => 'task_0',
			'target_repetitions'        => 2,
			'repetition_count_callback' => function () {
				return 1;
			},
		);
		$this->assertTrue( Launchpad_Task_Lists::validate_task( $valid_task ) );

		$invalid_task_without_repetition_count_callback = array(
			'id'                 => 'task_0',
			'title'              => 'task_0',
			'target_repetitions' => 2,
		);
		$this->assertFalse( Launchpad_Task_Lists::validate_task( $invalid_task_without_repetition_count_callback ) );

		$invalid_task_without_target_repetitions = array(
			'id'                        => 'task_0',
			'title'                     => 'task_0',
			'repetition_count_callback' => function () {
				return 1;
			},
		);
		$this->assertFalse( Launchpad_Task_Lists::validate_task( $invalid_task_without_target_repetitions ) );
	}

	/**
	 * Test the values for target_repetitions and repetition_count_callback.
	 */
	public function test_repetition_counting_task_list() {
		wpcom_register_launchpad_task(
			array(
				'id'                        => 'task-0',
				'title'                     => 'Task 0',
				'target_repetitions'        => 2,
				'repetition_count_callback' => function () {
					return 1;
				},
			)
		);

		wpcom_register_launchpad_task(
			array(
				'id'    => 'task-1',
				'title' => 'Task 1',
			)
		);

		wpcom_launchpad_checklists()->unregister_task_list( 'task-list-test' );
		wpcom_register_launchpad_task_list(
			array(
				'id'       => 'task-list-test',
				'title'    => 'Simple testing task list',
				'task_ids' => array( 'task-0', 'task-1' ),
			)
		);

		$first_task = wpcom_get_launchpad_checklist_by_checklist_slug( 'task-list-test' )[0];

		$this->assertSame( 1, $first_task['repetition_count'] );
		$this->assertEquals( 2, $first_task['target_repetitions'] );
	}
}
