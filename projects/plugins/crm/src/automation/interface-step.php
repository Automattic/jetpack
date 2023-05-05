<?php
/**
 * Interface to define Step in a automation recipe.
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

interface Step {

	/**
	 * Execute the step
	 *
	 * @param array $data Data passed from the trigger.
	 */
	public function execute( array $data );

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
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public function get_name(): string;

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public function get_title(): string;

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public function get_description(): ?string;

	/**
	 * Get the type of the step
	 *
	 * @return string
	 */
	public function get_type(): string;

	/**
	 * Get the category of the step
	 *
	 * @return string
	 */
	public function get_category(): string;

	/**
	 * Get the attributes of the step
	 *
	 * @return array
	 */
	public function get_attributes(): array;
}
