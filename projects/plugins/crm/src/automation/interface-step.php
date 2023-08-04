<?php
/**
 * Interface to define Step in an automation workflow.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Interface Step.
 *
 * @since $$next-version$$
 */
interface Step {

	/**
	 * Execute the step.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data Data passed from the trigger.
	 */
	public function execute( array $data );

	/**
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The next linked step.
	 */
	public function get_next_step(): ?array;

	/**
	 * Set the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data );

	/**
	 * Get the attributes of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The attributes of the step.
	 */
	public function get_attributes(): ?array;

	/**
	 * Get the attributes of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $attributes Set attributes to this step.
	 */
	public function set_attributes( array $attributes );

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string;

	/**
	 * Get the type of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The type of the step.
	 */
	public static function get_type(): ?string;

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string;

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The allowed triggers for the step.
	 */
	public static function get_allowed_triggers(): ?array;

}
