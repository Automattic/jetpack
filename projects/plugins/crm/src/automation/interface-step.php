<?php
/**
 * Interface to define Step in a automation workflow.
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

interface Step {

	/**
	 * Execute the step.
	 *
	 * @param array $data Data passed from the trigger.
	 */
	public function execute( array $data );

	/**
	 * Get the next step.
	 *
	 * @return array|null The next linked step.
	 */
	public function get_next_step(): ?array;

	/**
	 * Set the next step.
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data );

	/**
	 * Get the attributes of the step.
	 *
	 * @return array The attributes of the step.
	 */
	public function get_attributes(): ?array;

	/**
	 * Get the attributes of the step.
	 *
	 * @param array $attributes Set attributes to this step.
	 */
	public function set_attributes( array $attributes );

	/**
	 * Get the slug name of the step.
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the step.
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the step.
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): ?string;

	/**
	 * Get the type of the step.
	 *
	 * @return string The type of the step.
	 */
	public static function get_type(): ?string;

	/**
	 * Get the category of the step.
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): ?string;

	/**
	 * Get the category of the step.
	 *
	 * @return array The allowed triggers for the step.
	 */
	public static function get_allowed_triggers(): ?array;
}
