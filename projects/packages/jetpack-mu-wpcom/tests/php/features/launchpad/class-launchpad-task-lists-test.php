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
	 * Provide test cases for {@see test_repetition_counting_task_list()}.
	 *
	 * @return array The test cases.
	 */
	public function provide_repetition_counting_task_list_test_cases() {
		return array(
			'Task with no repetitions'   => array(
				array(
					'id'                        => 'test-repeating-task-with-no-repetitions',
					'title'                     => 'test-repeating-task-with-no-repetitions',
					'target_repetitions'        => 5,
					'repetition_count_callback' => function () {
						return 0;
					},
				),
				5,
				0,
			),
			'Task with some repetitions' => array(
				array(
					'id'                        => 'test-repeating-task-with-some-repetitions',
					'title'                     => 'test-repeating-task-with-some-repetitions',
					'target_repetitions'        => 7,
					'repetition_count_callback' => function () {
						return 5;
					},
				),
				7,
				5,
			),
			'Task with repetitions matching target repetitions' => array(
				array(
					'id'                        => 'test-repeating-task-with-repetitions-matching-target-repetitions',
					'title'                     => 'test-repeating-task-with-repetitions-matching-target-repetitions',
					'target_repetitions'        => 4,
					'repetition_count_callback' => function () {
						return 4;
					},
				),
				4,
				4,
			),
			'Task with more repetitions than target repetitions' => array(
				array(
					'id'                        => 'test-repeating-task-with-repetitions-matching-target-repetitions',
					'title'                     => 'test-repeating-task-with-repetitions-matching-target-repetitions',
					'target_repetitions'        => 3,
					'repetition_count_callback' => function () {
						return 4;
					},
				),
				3,
				3,
			),
		);
	}

	/**
	 * Test the values for target_repetitions and repetition_count_callback.
	 *
	 * @dataProvider provide_repetition_counting_task_list_test_cases()
	 * @param array $task                        The task data to register and test.
	 * @param int   $expected_target_repetitions The expected target_repetitions value.
	 * @param int   $expected_repetition_count   The expected repetition_count value.
	 */
	public function test_repetition_counting_task_list( $task, $expected_target_repetitions, $expected_repetition_count ) {
		wpcom_register_launchpad_task( $task );

		$test_task_list_id = 'task-list-repetition-test-' . $task['id'];

		wpcom_launchpad_checklists()->unregister_task_list( $test_task_list_id );
		wpcom_register_launchpad_task_list(
			array(
				'id'       => $test_task_list_id,
				'title'    => 'Test repetition counting for ' . $task['id'],
				'task_ids' => array( $task['id'] ),
			)
		);

		$tasks = wpcom_get_launchpad_checklist_by_checklist_slug( $test_task_list_id );
		$this->assertIsArray( $tasks );

		$returned_task = reset( $tasks );
		$this->assertIsArray( $returned_task );

		$this->assertEquals( $expected_target_repetitions, $returned_task['target_repetitions'] );
		$this->assertSame( $expected_repetition_count, $returned_task['repetition_count'] );
	}

	/**
	 * Data provider for {@see test_wpcom_launchpad_is_repeated_task_complete()}.
	 *
	 * @return array Test cases for the unit test.
	 */
	public function provide_wpcom_launchpad_is_repeated_task_complete_test_cases() {
		return array(
			'Task is complete when the task option was already complete' => array(
				array(
					'id'                        => 'test-repeated-completion-already-complete',
					'title'                     => 'test-repeated-completion-already-complete',
					'is_complete_callback'      => 'wpcom_launchpad_is_repeated_task_complete',
					'target_repetitions'        => 5,
					'repetition_count_callback' => function () {
						return 1;
					},
				),
				true,
				true,
			),
			'Task is complete when target_repetitions is reached'        => array(
				array(
					'id'                        => 'test-repeated-completion-target-repetitions-reached',
					'title'                     => 'test-repeated-completion-target-repetitions-reached',
					'is_complete_callback'      => 'wpcom_launchpad_is_repeated_task_complete',
					'target_repetitions'        => 5,
					'repetition_count_callback' => function () {
						return 5;
					},
				),
				true,
				false,
			),
			'Task is complete when target_repetitions is exceeded'       => array(
				array(
					'id'                        => 'test-repeated-completion-target-repetitions-exceeded',
					'title'                     => 'test-repeated-completion-target-repetitions-exceeded',
					'is_complete_callback'      => 'wpcom_launchpad_is_repeated_task_complete',
					'target_repetitions'        => 5,
					'repetition_count_callback' => function () {
						return 7;
					},
				),
				true,
				false,
			),
			'Task is incomplete when target_repetitions is not reached'   => array(
				array(
					'id'                        => 'test-repeated-completion-target-repetitions-not-reached',
					'title'                     => 'test-repeated-completion-target-repetitions-not-reached',
					'is_complete_callback'      => 'wpcom_launchpad_is_repeated_task_complete',
					'target_repetitions'        => 7,
					'repetition_count_callback' => function () {
						return 3;
					},
				),
				false,
				false,
			),
		);
	}

	/**
	 * Tests for {@see wpcom_launchpad_is_repeated_task_complete()}.
	 *
	 * @dataProvider provide_wpcom_launchpad_is_repeated_task_complete_test_cases()
	 * @param array $task                           The task data.
	 * @param bool  $expected_completion_status     The expected status for the task at the end of the test.
	 * @param bool  $initial_task_completion_status The status to set up for the task at the beginning of the test.
	 * @return void
	 */
	public function test_wpcom_launchpad_is_repeated_task_complete( $task, $expected_completion_status, $initial_task_completion_status ) {
		delete_option( 'launchpad_checklist_tasks_statuses' );

		$option_value = array();
		if ( $initial_task_completion_status ) {
			$option_value[ $task['id'] ] = true;
		}

		update_option( 'launchpad_checklist_tasks_statuses', $option_value );

		// Ensure the task definition is in the definition list.
		add_filter(
			'wpcom_launchpad_extended_task_definitions',
			function ( $extended_task_definitions ) use ( $task ) {
				$extended_task_definitions[ $task['id'] ] = $task;

				return $extended_task_definitions;
			}
		);

		wpcom_register_launchpad_task( $task );

		wpcom_launchpad_checklists()->unregister_task_list( 'test_wpcom_launchpad_is_repeated_task_complete' );
		wpcom_register_launchpad_task_list(
			array(
				'id'       => 'test_wpcom_launchpad_is_repeated_task_complete',
				'title'    => 'Test task list for wpcom_launchpad_is_repeated_task_complete()',
				'task_ids' => array( $task['id'] ),
			)
		);

		$task_list_for_api = wpcom_get_launchpad_checklist_by_checklist_slug( 'test_wpcom_launchpad_is_repeated_task_complete' );

		$this->assertIsArray( $task_list_for_api );
		$this->assertCount( 1, $task_list_for_api );

		$first_task = reset( $task_list_for_api );

		$this->assertIsArray( $first_task );
		$this->assertSame( $task['id'], $first_task['id'] );

		// Verify that the returned task has the right completion status.
		$this->assertSame( $expected_completion_status, $first_task['completed'] );

		// Verify that the task option has the right value.
		$this->assertSame( $expected_completion_status, wpcom_launchpad_is_task_option_completed( $task ) );
	}

	/**
	 * Data provider for {@see test_get_calypso_path_validation()}.
	 *
	 * @return array
	 */
	public function provide_get_calypso_path_validation_test_cases() {
		return array(
			'External absolute URL should be invalid'    => array(
				'https://example.com/invalid-full-url',
				null,
			),
			'Admin URL should be valid'                  => array(
				'http://example.org/wp-admin/admin.php?page=jetpack#/discussion',
				'http://example.org/wp-admin/admin.php?page=jetpack#/discussion',
			),
			'Same-protocol URL is rejected'              => array(
				'//example.com/invalid-protocol-url',
				null,
			),
			'Relative URL without leading / is rejected' => array(
				'test/relative-url-invalid',
				null,
			),
			'Null value is rejected'                     => array(
				null,
				null,
			),
			'Empty string is rejected'                   => array(
				'',
				null,
			),
			'Valid absolute path is accepted'            => array(
				'/test/example',
				'/test/example',
			),
		);
	}

	/**
	 * Test that we correctly validate return values from the
	 * `get_calypso_path` callback for tasks.
	 *
	 * @dataProvider provide_get_calypso_path_validation_test_cases()
	 * @param string|null $calypso_path_to_test The path to test.
	 * @param string|null $expected_path        The path we expect to be returned.
	 * @return void
	 */
	public function test_get_calypso_path_validation( $calypso_path_to_test, $expected_path ) {
		wpcom_register_launchpad_task(
			array(
				'id'               => 'test-get-calypso-path-validation',
				'title'            => 'Test get_calypso_path validation',
				'get_calypso_path' => function () use ( $calypso_path_to_test ) {
					return $calypso_path_to_test;
				},
			)
		);

		wpcom_launchpad_checklists()->unregister_task_list( 'test-get-calypso-path-validation-task-list' );
		wpcom_register_launchpad_task_list(
			array(
				'id'       => 'test-get-calypso-path-validation-task-list',
				'title'    => 'Test task list for testing get_calypso_path validation',
				'task_ids' => array( 'test-get-calypso-path-validation' ),
			)
		);

		$tasks = wpcom_get_launchpad_checklist_by_checklist_slug( 'test-get-calypso-path-validation-task-list' );

		$this->assertIsArray( $tasks );
		$this->assertCount( 1, $tasks );

		$first_task = reset( $tasks );

		$this->assertIsArray( $first_task );
		$this->assertArrayHasKey( 'id', $first_task );
		$this->assertSame( 'test-get-calypso-path-validation', $first_task['id'] );

		if ( null === $expected_path ) {
			$this->assertArrayNotHasKey( 'calypso_path', $first_task );
		} else {
			$this->assertArrayHasKey( 'calypso_path', $first_task );
			$this->assertSame( $expected_path, $first_task['calypso_path'] );
		}
	}

	/**
	 * Test dismiss temporally a task list when a date in future is used
	 *
	 * @covers wpcom_launchpad_is_task_list_dismissed
	 */
	public function test_temporary_dismiss_task_when_date_is_in_the_future() {
		wpcom_register_launchpad_task(
			array(
				'id'    => 'task_0',
				'title' => 'task_0',
			)
		);

		wpcom_register_launchpad_task_list(
			array(
				'id'       => 'test-task-list-with-temporary-dismiss',
				'title'    => 'test-task-list',
				'task_ids' => array(
					'task_0',
				),
			)
		);

		$date        = new DateTime();
		$future_date = $date->modify( '+10 days' )->getTimestamp();

		wpcom_launchpad_set_task_list_dismissed( 'test-task-list-with-temporary-dismiss', null, $future_date );
		$this->assertTrue( wpcom_launchpad_is_task_list_dismissed( 'test-task-list-with-temporary-dismiss' ) );
	}

	/**
	 * Test remove the dismiss status when the temporary dismiss date is expired
	 *
	 * @covers wpcom_launchpad_is_task_list_dismissed
	 */
	public function test_remove_temporary_dismiss_when_date_is_in_the_past() {
		wpcom_register_launchpad_task(
			array(
				'id'    => 'task_0',
				'title' => 'task_0',
			)
		);

		wpcom_register_launchpad_task_list(
			array(
				'id'       => 'test-task-list-with-the-temporary-dismiss-removed',
				'title'    => 'test-task-list',
				'task_ids' => array(
					'task_0',
				),
			)
		);

		$date      = new DateTime();
		$past_date = $date->modify( '-10 days' )->getTimestamp();

		wpcom_launchpad_set_task_list_dismissed( 'test-task-list-with-temporary-dismiss-removed', null, $past_date );
		$this->assertFalse( wpcom_launchpad_is_task_list_dismissed( 'test-task-list-with-temporary-dismiss-removed' ) );
	}
}
