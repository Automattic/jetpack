<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Step;

class Dummy_Step extends Base_Step {

	/**
	 * Execute the step
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 * @return void
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
