<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Entities\Tests;

use Automattic\Jetpack\CRM\Entities\Factories\Task_Factory;
use Automattic\Jetpack\CRM\Entities\Task;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Event Manager system.
 *
 * @covers Automattic\Jetpack\CRM\Entities
 */
class Task_Entity_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Test that task entity is created from input data.
	 */
	public function test_task_entity_from_input_data() {

		$task_data = $this->generate_task_data();

		// Create the Task instance from the task data (tidy DAL format)
		$task = Task_Factory::create( $task_data );

		$this->assertInstanceOf( Task::class, $task );

		// Check that the task data field values are the same to the Task instance field values.
		foreach ( $task_data as $key => $value ) {
			if ( ! property_exists( $task, $key ) ) {
				continue;
			}
			$this->assertEquals( $value, $task->$key, "Task property $key does not match" );
		}
	}

	/**
	 * @testdox Test create task entity from input data and insert in DB via DAL.
	 */
	public function test_create_task_from_input_data_and_insert_into_DB() {

		$task_data = $this->generate_task_data();

		// Create the Task instance from the task data (tidy DAL format)
		$task = Task_Factory::create( $task_data );

		$this->assertInstanceOf( Task::class, $task );

		// This is not necessary for this test, but we ensure we modify the entity
		$task->title = 'Factory Test';

		global $zbs;

		// Prepare the Task data from the instance to save it via DAL
		$task_data_to_save = Task_Factory::data_for_dal( $task );

		$id = $zbs->DAL->events->addUpdateEvent( $task_data_to_save );

		// Check that the Task is created and returns the id.
		$this->assertTrue( $id > 0 );

		// Retrieve the task and check that the data is the same.
		$task_data_from_db = $zbs->DAL->events->getEvent( $id );

		// Create the instance from the task data retrieve from the DAL/DB.
		$task_instance = Task_Factory::create( $task_data_from_db );

		$this->assertInstanceOf( Task::class, $task_instance );
		$this->assertNotNull( $task_instance->id );

		// List of fields to check their values
		$fields_to_check = array(
			'title',
			'desc',
			'start',
			'end',
			'complete',
			'show_on_portal',
			'show_on_calendar',
		);

		foreach ( $fields_to_check as $field ) {
			$this->assertEquals( $task->$field, $task_instance->$field, "Task property $field does not match" );
		}
	}
}
