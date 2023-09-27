<?php
/**
 * Interface to define Step in an automation workflow.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

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
	 * @param Data_Type $data Data passed from the trigger.
	 */
	public function execute( Data_Type $data );

	/**
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string|null The next linked step.
	 */
	public function get_next_step_id();

	/**
	 * Set the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @param int|string|null $step_id The next linked step.
	 */
	public function set_next_step( $step_id );

	/**
	 * Get the step attribute definitions.
	 *
	 * @since $$next-version$$
	 *
	 * @return Attribute_Definition[] The attribute definitions of the step.
	 */
	public function get_attribute_definitions(): ?array;

	/**
	 * Set the step attribute definitions.
	 *
	 * @since $$next-version$$
	 *
	 * @param Attribute_Definition[] $attribute_definitions Set the attribute definitions.
	 */
	public function set_attribute_definitions( array $attribute_definitions );

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
	 * Get the data type expected by the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The data type expected by the step.
	 */
	public static function get_data_type(): string;

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string;
}
