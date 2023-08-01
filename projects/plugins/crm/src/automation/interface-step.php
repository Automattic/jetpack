<?php
/**
 * Interface to define Step in a automation workflow.
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

interface Step {

	/**
	 * Execute the step
	 *
	 * @param Data_Type_Base $data Data passed from the trigger.
	 */
	public function execute( Data_Type_Base $data );

	/**
	 * Get the next step
	 *
	 * @return array|null
	 */
	public function get_next_step(): ?array;

	/**
	 * Set the next step
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data );

	/**
	 * Get the attributes of the step.
	 *
	 * @return array
	 */
	public function get_attributes(): ?array;

	/**
	 * Get the attributes of the step
	 *
	 * @param array $attributes Set attributes to this step.
	 */
	public function set_attributes( array $attributes );

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public static function get_description(): ?string;

	/**
	 * Get the data type
	 *
	 * @return string
	 */
	public static function get_data_type(): string;

	/**
	 * Get the category of the step
	 *
	 * @return string
	 */
	public static function get_category(): ?string;

	/**
	 * Get the category of the step
	 *
	 * @return array
	 */
	public static function get_allowed_triggers(): ?array;
}
