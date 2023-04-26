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
	 * @return bool
	 */
	public function execute( array $data ): bool;

	/**
	 * Get the next step
	 *
	 * @return Step|null
	 */
	public function get_next_step(): ?Step;

	/**
	 * Set the next step
	 *
	 * @param Step $step The next linked step.
	 */
	public function set_next_step( Step $step );

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
	 * Get the data of the step
	 *
	 * @return array
	 */
	public function get_data(): array;
}
