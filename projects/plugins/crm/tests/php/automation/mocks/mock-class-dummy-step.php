<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Step;

class Dummy_Step extends Base_Step {
	
	public function __construct( array $step_data )
	{
	 	parent::__construct( $step_data );
		 
		$this->name = 'dummy_step';
		$this->title = 'Dummy Step';
		$this->description = 'Dummy step for testing purposes';
		$this->type = 'dummy';
		$this->category = 'testing';
		
		$this->attributes = [
			'name' => 'dummy_step',
			'title' => 'Dummy Step',
			'description' => 'Dummy step for testing purposes',
			'type' => 'dummy',
			'category' => 'testing',
		];
	}

	/**
	 * Execute the step
	 * 
	 * @param array $data
	 * @return void
	 */
	public function execute( array $data ) {
		Automation_Logger::instance()->log( 'Dummy step executed' );
	}
}