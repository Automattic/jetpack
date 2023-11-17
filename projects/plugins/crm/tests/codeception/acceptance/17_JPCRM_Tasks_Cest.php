<?php

/**
 * Task related tests
 */
class JPCRM_Tasks_Cest {

	protected $task_data = array(
		'zbse_title'           => 'Task 1',
		'zbse_owner'           => '1',
		'jpcrm_start_datepart' => '2021-01-26',
		'jpcrm_start_timepart' => '17:58',
		'jpcrm_end_datepart'   => '2021-02-04',
		'jpcrm_end_timepart'   => '07:58',
		'zbse_desc'            => 'This is the task 1 description',
		'zbse_show_on_cal'     => 1,
		'zbse_customer'        => 1,
		'zbse_company'         => '',
		'zbs-task-complete'    => -1,
		'zbs_remind_task_24'   => '24',
	);

	protected $task_db_data = array(
		'zbse_title'       => 'Task 1',
		'zbs_owner'        => '1',
		'zbse_start'       => 1611683880,
		'zbse_end'         => 1612425480,
		'zbse_desc'        => 'This is the task 1 description',
		'zbse_show_on_cal' => 1,
		'zbse_complete'    => -1,
	);

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_tasks_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'tasks' );
		$I->see( 'Task Calendar', '.jpcrm-learn-page-title' );
	}

	public function see_new_task_page( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=event' );
		$I->see( 'New Task', '.jpcrm-learn-page-title' );
	}

	public function create_new_task( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=event' );

		$I->seeInField( 'zbscrm_newevent', 1 );

		$I->submitForm( '#zbs-edit-form', $this->task_data );

		$I->seeInDatabase( $I->table( 'events' ), $this->task_db_data );
	}

	public function see_created_task( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'add-edit', '&action=edit&zbstype=event&zbsid=1' );

		$task_view_data = array(
			'zbse_title'           => $this->task_data['zbse_title'],
			'jpcrm_start_datepart' => $this->task_data['jpcrm_start_datepart'],
			'jpcrm_start_timepart' => $this->task_data['jpcrm_start_timepart'],
			'jpcrm_end_datepart'   => $this->task_data['jpcrm_end_datepart'],
			'jpcrm_end_timepart'   => $this->task_data['jpcrm_end_timepart'],
			'zbse_desc'            => $this->task_data['zbse_desc'],
			'zbse_show_on_cal'     => $this->task_data['zbse_show_on_cal'],
			'zbse_customer'        => $this->task_data['zbse_customer'],
			'zbse_company'         => $this->task_data['zbse_company'],
			'zbs-task-complete'    => $this->task_data['zbs-task-complete'],
			'zbs_remind_task_24'   => $this->task_data['zbs_remind_task_24'],
		);

		$I->see( 'Edit Task', '.jpcrm-learn-page-title' );

		foreach ( $task_view_data as $field => $value ) {
			$I->seeInField( $field, $value );
		}
	}

	public function see_task_in_calendar( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'tasks' );

		$I->seeInTitle( 'Task Scheduler' );
		$I->see( 'Task Calendar', '.jpcrm-learn-page-title' );

		$task_view_data = array(
			'zbse_title'           => $this->task_data['zbse_title'],
			'jpcrm_start_datepart' => $this->task_data['jpcrm_start_datepart'],
			'jpcrm_start_timepart' => $this->task_data['jpcrm_start_timepart'],
			'jpcrm_end_datepart'   => $this->task_data['jpcrm_end_datepart'],
			'jpcrm_end_timepart'   => $this->task_data['jpcrm_end_timepart'],
		);

		// Check the value in the Javascript script block
		foreach ( $task_view_data as $value ) {
			$I->seeInSource( $value );
		}
	}
}
