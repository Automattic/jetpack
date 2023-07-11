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
class Launchpad_Task_List_Validation_Test extends \WorDBless\BaseTestCase {
	/**
	 * Data provider for test_validate_task_list.
	 *
	 * The test data is in the format of:
	 *
	 *   'test key' => array(
	 *     (array) $task_list,
	 *     (null | WP_Error) $expected_result,
	 *     (bool) $expected_is_wp_error,
	 *   )
	 *
	 * @return array
	 */
	public function provide_validate_task_list_test_cases() {
		return array(
			'Valid task list with required task IDs and last task completion' => array(
				array(
					'id'                           => 'task_list_1',
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => true,
				),
				null,
				false,
			),
			'Valid task list with last task completion'   => array(
				array(
					'id'                           => 'task_list_1',
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'require_last_task_completion' => true,
				),
				null,
				false,
			),
			'Valid task list with only required task IDs' => array(
				array(
					'id'                => 'task_list_1',
					'task_ids'          => array( 'task_1', 'task_2' ),
					'required_task_ids' => array( 'task_1' ),
				),
				null,
				false,
			),
			'Valid task list with minimal validation'     => array(
				array(
					'id'       => 'task_list_1',
					'task_ids' => array( 'task_1', 'task_2' ),
				),
				null,
				false,
			),
			'Invalid task list with no id'                => array(
				array(
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => true,
				),
				new WP_Error( 'invalid-task-list', 'Task list is missing an ID.' ),
				true,
			),
			'Invalid task list with no task_ids'          => array(
				array(
					'id'                           => 'task_list_1',
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => true,
				),
				new WP_Error( 'invalid-task-list', 'Task list is missing task IDs.' ),
				true,
			),
			'Invalid task list with invalid required_task_ids' => array(
				array(
					'id'                => 'task_list_1',
					'task_ids'          => array( 'task_1', 'task_2' ),
					'required_task_ids' => 'task_1',
				),
				new WP_Error( 'invalid-task-list', 'Task list required task IDs must be an array.' ),
				true,
			),
			'Invalid task list with invalid require_last_task_completion' => array(
				array(
					'id'                           => 'task_list_1',
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => 'true',
				),
				new WP_Error( 'invalid-task-list', 'Task list require last task completion must be a boolean.' ),
				true,
			),
		);
	}

	/**
	 * Test several task list validation scenarios.
	 *
	 * @param array $task_list       Task list to validate.
	 * @param bool  $expected_result Expected validation result.
	 * @param bool  $expected_is_wp_error Flag to signal if the expected result is a WP_Error.
	 * @dataProvider provide_validate_task_list_test_cases
	 */
	public function test_validate_task_list( $task_list, $expected_result, $expected_is_wp_error ) {
		$result = Launchpad_Task_Lists::validate_task_list( $task_list );

		if ( $expected_is_wp_error ) {
			$this->assertTrue( is_wp_error( $result ) );
			return;
		}

		$this->assertSame( $expected_result, $result );
	}
}

