<?php
/**
 * Base Step
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

/**
 * Base Step.
 *
 * @since $$next-version$$
 * {@inheritDoc}
 */
abstract class Base_Step implements Step {

	/**
	 * Step attributes.
	 *
	 * @since $$next-version$$
	 * @var array
	 */
	protected $attributes;

	/**
	 * Next linked step.
	 *
	 * @since $$next-version$$
	 * @var array|null
	 */
	protected $next_step;

	/**
	 * Base_Step constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data An array of data for the current step.
	 */
	public function __construct( array $step_data ) {
		$this->attributes = $step_data['attributes'] ?? null;
	}

	/**
	 * Get the data of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The step data.
	 */
	public function get_attributes(): array {
		return $this->attributes;
	}

	/**
	 * Set attributes of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $attributes The attributes to set.
	 */
	public function set_attributes( array $attributes ) {
		$this->attributes = $attributes;
	}

	/**
	 * Set the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data ) {
		$this->next_step = $step_data;
	}

	/**
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The next linked step.
	 */
	public function get_next_step(): ?array {
		return $this->next_step;
	}

	/**
	 * Execute the step.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data Data passed from the trigger.
	 */
	abstract public function execute( Data_Type_Base $data );

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the type of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	abstract public static function get_data_type(): string;

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Get the allowed triggers.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The allowed triggers.
	 */
	abstract public static function get_allowed_triggers(): ?array;
}
