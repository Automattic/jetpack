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
					'test_task1' => array(),
					'test_task2' => array(),
					'test_task3' => array(),
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
}
