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
class Launchpad_Task_Definitions_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter(
			'wpcom_launchpad_extended_task_definitions',
			function () {
				return array(
					'test_task1'            => array(),
					'test_task2'            => array(),
					'test_task3'            => array(),
					'test_task_with_id_map' => array(
						'id_map' => 'test_task_id_map',
					),
				);
			}
		);
	}

	/**
	 * Tests wether the wpcom_mark_launchpad_task_complete works correctly.
	 */
	public function test_wpcom_mark_launchpad_task_complete() {
		wpcom_mark_launchpad_task_complete( 'test_task1' );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( isset( $options['test_task1'] ) );
		$this->assertTrue( $options['test_task1'] );

		wpcom_mark_launchpad_task_complete(
			array(
				'test_task2',
				'test_task3',
			)
		);
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( isset( $options['test_task2'] ) && $options['test_task2'] );
		$this->assertTrue( isset( $options['test_task3'] ) && $options['test_task3'] );

		$this->assertTrue( count( $options ) === 3 );
	}

	/**
	 * Tests wether the wpcom_mark_launchpad_task_incomplete works correctly.
	 */
	public function test_wpcom_mark_launchpad_task_incomplete() {
		wpcom_mark_launchpad_task_incomplete( 'test_task1' );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( isset( $options['test_task1'] ) && ! $options['test_task1'] );

		wpcom_mark_launchpad_task_incomplete(
			array(
				'test_task2',
				'test_task3',
			)
		);
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( isset( $options['test_task2'] ) && ! $options['test_task2'] );
		$this->assertTrue( isset( $options['test_task3'] ) && ! $options['test_task3'] );

		$this->assertTrue( count( $options ) === 3 );
	}

	/**
	 * Tests wether a correct amount of array elements get stored in the 'launchpad_checklist_tasks_statuses' option.
	 */
	public function test_correct_task_count() {
		wpcom_mark_launchpad_task_complete(
			array(
				'test_task2',
				'test_task3',
			)
		);

		$options = get_option( 'launchpad_checklist_tasks_statuses' );

		$this->assertTrue( count( $options ) === 2 );
	}

	/**
	 * Tests wether the correct task ID is stored in the 'launchpad_checklist_tasks_statuses' option.
	 * When tasks have an 'id_map' property, the 'id_map' value should be used as the task ID.
	 */
	public function test_correct_task_id_is_stored() {
		wpcom_mark_launchpad_task_complete( 'test_task_with_id_map' );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertFalse( isset( $options['test_task_with_id_map'] ) );
		$this->assertTrue( isset( $options['test_task_id_map'] ) );
	}
}
