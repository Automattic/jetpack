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
				true,
			),
			'Valid task list with last task completion'   => array(
				array(
					'id'                           => 'task_list_1',
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'require_last_task_completion' => true,
				),
				true,
			),
			'Valid task list with only required task IDs' => array(
				array(
					'id'                => 'task_list_1',
					'task_ids'          => array( 'task_1', 'task_2' ),
					'required_task_ids' => array( 'task_1' ),
				),
				true,
			),
			'Valid task list with minimal validation'     => array(
				array(
					'id'       => 'task_list_1',
					'task_ids' => array( 'task_1', 'task_2' ),
				),
				true,
			),
			'Invalid task list with no id'                => array(
				array(
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => true,
				),
				false,
			),
			'Invalid task list with no task_ids'          => array(
				array(
					'id'                           => 'task_list_1',
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => true,
				),
				false,
			),
			'Invalid task list with invalid required_task_ids' => array(
				array(
					'id'                => 'task_list_1',
					'task_ids'          => array( 'task_1', 'task_2' ),
					'required_task_ids' => 'task_1',
				),
				false,
			),
			'Invalid task list with invalid require_last_task_completion' => array(
				array(
					'id'                           => 'task_list_1',
					'task_ids'                     => array( 'task_1', 'task_2' ),
					'required_task_ids'            => array( 'task_1' ),
					'require_last_task_completion' => 'true',
				),
				false,
			),
		);
	}

	/**
	 * Test several task list validation scenarios.
	 *
	 * @param array $task_list       Task list to validate.
	 * @param bool  $expected_result Expected validation result.
	 * @dataProvider provide_validate_task_list_test_cases
	 */
	public function test_validate_task_list( $task_list, $expected_result ) {
		$result = Launchpad_Task_Lists::validate_task_list( $task_list );

		$this->assertSame( $expected_result, $result );
	}
}

