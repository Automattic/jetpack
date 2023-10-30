<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Step;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

class Dummy_Step extends Base_Step {

	/**
	 * {@inheritDoc}
	 */
	public function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
		return Contact_Data::class;
	}

	public static function get_category(): ?string {
		return 'testing';
	}
}
