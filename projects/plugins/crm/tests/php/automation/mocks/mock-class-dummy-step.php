<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Step;

class Dummy_Step extends Base_Step {

	/**
	 * Execute the step
	 *
	 * @param array $data
	 * @return void
	 */
	public function execute( array $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		Automation_Logger::instance()->log( 'Dummy step executed' );
	}

	public static function get_slug(): string {
		return 'dummy_step';
	}

	public function get_title(): ?string {
		return 'Dummy Step';
	}

	public static function get_description(): ?string {
		return 'Dummy step for testing purposes';
	}

	public static function get_type(): string {
		return 'dummy';
	}

	public static function get_category(): ?string {
		return 'testing';
	}

	public static function get_allowed_triggers(): ?array {
		return array();
	}
}
