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
					'test_task3_alias'      => array(
						'id_map' => 'test_task3',
					),
					'test_task_with_id_map' => array(
						'id_map' => 'test_task_id_map',
					),
				);
			}
		);
	}

	/**
	 * Tests whether {@see wpcom_mark_launchpad_task_complete()} works correctly.
	 */
	public function test_wpcom_mark_launchpad_task_complete() {
		$bad_task_result = wpcom_mark_launchpad_task_complete( 'bad_task_id' );
		$this->assertFalse( $bad_task_result );
		$options = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertFalse( isset( $options['bad_task_id'] ) );

		$task1_result = wpcom_mark_launchpad_task_complete( 'test_task1' );
		$this->assertTrue( $task1_result );
		$options = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertTrue( isset( $options['test_task1'] ) );
		$this->assertTrue( $options['test_task1'] );

		wpcom_mark_launchpad_task_complete( 'test_task2' );
		$options = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertTrue( isset( $options['test_task2'] ) && $options['test_task2'] );
		$this->assertFalse( isset( $options['test_task3'] ) );

		$this->assertCount( 2, $options );
	}

	/**
	 * Tests whether {@see wpcom_mark_launchpad_task_incomplete()} works correctly.
	 */
	public function test_wpcom_mark_launchpad_task_incomplete() {
		$bad_task_result = wpcom_mark_launchpad_task_incomplete( 'bad_task_id' );
		$this->assertFalse( $bad_task_result );

		$task1_result = wpcom_mark_launchpad_task_incomplete( 'test_task1' );
		$this->assertTrue( $task1_result );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertFalse( isset( $options['test_task1'] ) );

		// Now set a task to be complete.
		$task2_complete_result = wpcom_mark_launchpad_task_complete( 'test_task2' );
		$this->assertTrue( $task2_complete_result );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( isset( $options['test_task2'] ) );
		$this->assertTrue( $options['test_task2'] );

		$task2_incomplete_result = wpcom_mark_launchpad_task_incomplete( 'test_task2' );
		$this->assertTrue( $task2_incomplete_result );
		$options = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertFalse( isset( $options['test_task2'] ) );

		$this->assertEmpty( $options );
	}

	/**
	 * Tests {@see wpcom_launchpad_update_task_status()}.
	 */
	public function test_wpcom_launchpad_update_task_status() {
		$task_updates = array(
			'test_task1' => true,
			'test_task2' => true,
			'test_task3' => false,
		);

		$update_result = wpcom_launchpad_update_task_status( $task_updates );

		// Confirm that the result matches what we expect, including all three requested changes.
		$this->assertCount( 3, $update_result );
		foreach ( $task_updates as $task_id => $new_task_status ) {
			$this->assertTrue( isset( $update_result[ $task_id ] ) );
			$this->assertSame( $new_task_status, $update_result[ $task_id ] );
		}

		$option_value = get_option( 'launchpad_checklist_tasks_statuses' );

		$this->assertIsArray( $option_value );
		$this->assertCount( 2, $option_value );

		// Filter out incomplete tasks from $task_updates.
		$completed_updates = array_filter( $task_updates );
		foreach ( $completed_updates as $task_id => $new_task_status ) {
			$this->assertTrue( isset( $option_value[ $task_id ] ) );
			$this->assertSame( $new_task_status, $option_value[ $task_id ] );
		}
	}

	/**
	 * Data provider for {@see test_wpcom_launchpad_update_task_status_id_map_handling()}.
	 *
	 * @return array[]
	 */
	public function provide_update_task_status_id_map_handling_test_cases() {
		return array(
			// First key is requested task ID, second key is the option we expect to update.
			'Request for unmapped task ID updates that task ID'                         => array(
				'test_task2',
				'test_task2',
			),
			'Request for task ID with id_map for other task updates id_map'             => array(
				'test_task3_alias',
				'test_task3',
			),
			'Request for id_map where no task ID matches the id_map updates the id_map' => array(
				'test_task_id_map',
				'test_task_id_map',
			),
		);
	}

	/**
	 * Tests {@see wpcom_launchpad_update_task_status()} to make sure we handle id_map
	 * values correctly.
	 *
	 * @dataProvider provide_update_task_status_id_map_handling_test_cases()
	 * @param string $requested_task_id The requested task ID or id_map.
	 * @param string $expected_option_key The key we expect to be added to the underlying option.
	 */
	public function test_wpcom_launchpad_update_task_status_id_map_handling( $requested_task_id, $expected_option_key ) {
		delete_option( 'launchpad_checklist_tasks_statuses' );

		$update_request = array(
			$requested_task_id => true,
		);

		$update_result = wpcom_launchpad_update_task_status( $update_request );

		$this->assertSame( $update_request, $update_result );

		$option_value = get_option( 'launchpad_checklist_tasks_statuses' );

		$this->assertIsArray( $option_value );
		$this->assertArrayHasKey( $expected_option_key, $option_value );
		$this->assertTrue( $option_value[ $expected_option_key ] );
	}

	/**
	 * Data provider for {@see test_wpcom_launchpad_update_task_status_forces_booleans()}.
	 *
	 * @return array[]
	 */
	public function provide_non_boolean_task_status_updates() {
		return array(
			'Truthy string 1'   => array( '1', true ),
			'Truthy integer 1'  => array( 1, true ),
			'Truthy array'      => array( array( true ), true ),
			'Falsy empty array' => array( array(), false ),
			'Falsy null'        => array( null, false ),
			'Falsy integer 0'   => array( 0, false ),
			'Falsy string 0'    => array( '0', false ),
		);
	}

	/**
	 * Tests that {@see wpcom_launchpad_update_task_status()} correctly stores only true values.
	 *
	 * @dataProvider provide_non_boolean_task_status_updates
	 * @param mixed $new_status_value New status value to specify for a task.
	 * @param bool  $is_truthy Should the new status value be considered truthy.
	 */
	public function test_wpcom_launchpad_update_task_status_forces_booleans( $new_status_value, $is_truthy ) {
		$task_update = array(
			'test_task1' => $new_status_value,
		);

		$result = wpcom_launchpad_update_task_status( $task_update );
		$this->assertArrayHasKey( 'test_task1', $result );

		$option_value = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertIsArray( $option_value );

		if ( $is_truthy ) {
			$this->assertTrue( $result['test_task1'] );
			$this->assertArrayHasKey( 'test_task1', $option_value );
			$this->assertTrue( $option_value['test_task1'] );
		} else {
			$this->assertFalse( $result['test_task1'] );
			$this->assertArrayNotHasKey( 'test_task1', $option_value );
		}
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
