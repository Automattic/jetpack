<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Step;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

class Dummy_Step extends Base_Step {

	/**
	 * Execute the step
	 *
	 * @param Data_Type_Base $data
	 * @param ?Data_Type_Base $previous_data
	 * @return void
	 */
	public function execute( Data_Type_Base $data, ?Data_Type_Base $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		Automation_Logger::instance()->log( 'Dummy step executed' );
	}

	public static function get_slug(): string {
		return 'dummy_step';
	}

	public static function get_title(): ?string {
		return 'Dummy Step';
	}

	public static function get_description(): ?string {
		return 'Dummy step for testing purposes';
	}

	public static function get_data_type(): string {
		return 'contact';
	}

	public static function get_category(): ?string {
		return 'testing';
	}

	public static function get_allowed_triggers(): ?array {
		return array();
	}
}
