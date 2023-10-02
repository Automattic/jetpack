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
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string|null The next linked step.
	 */
	public function get_next_step_id();

	/**
	 * Get the next step if the current one is successful.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_true();

	/**
	 * Set the next step if the current one is successful.
	 *
	 * @since $$next-version$$
	 *
	 * @param string|int|null $step_id The next linked step id.
	 * @return void
	 */
	public function set_next_step_true( $step_id ): void;

	/**
	 * Get the next step if the current one is falsy.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_false();

	/**
	 * Set the next step if the current one is falsy.
	 *
	 * @since $$next-version$$
	 *
	 * @param string|int|null $step_id The next linked step id.
	 * @return void
	 */
	public function set_next_step_false( $step_id ): void;

	/**
	 * Get the step attribute definitions.
	 *
	 * @since $$next-version$$
	 *
	 * @return Attribute_Definition[] The attribute definitions of the step.
	 */
	public function get_attribute_definitions(): ?array;

	/**
	 * Get attribute value.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $attribute The attribute to get.
	 * @param mixed  $default The default value to return if the attribute is not set.
	 * @return mixed The attribute value.
	 */
	public function get_attribute( string $attribute, $default = null );

	/**
	 * Set attribute value.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $attribute The attribute key.
	 * @param mixed  $value The default value.
	 * @return void
	 */
	public function set_attribute( string $attribute, $value );

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

	/**
	 * Get the step as an array.
	 *
	 * The main use-case to get the step as an array is to prepare
	 * the items for an API response.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The step as an array.
	 */
	public function to_array(): array;
}
