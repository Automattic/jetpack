<?php
/**
 * Base Step
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Step.
 *
 * @since $$next-version$$
 * @inheritDoc
 */
abstract class Base_Step implements Step {

	/**
	 * @var array Step attributes.
	 */
	protected $attributes;
	/**
	 * @var array|null Next linked step.
	 */
	protected $next_step;

	/**
	 * Base_Step constructor.
	 *
	 * @param array $step_data An array of data for the current step.
	 */
	public function __construct( array $step_data ) {
		$this->attributes = $step_data['attributes'] ?? null;
	}

	/**
	 * Get the data of the step.
	 *
	 * @return array The step data.
	 */
	public function get_attributes(): array {
		return $this->attributes;
	}

	/**
	 * Set attributes of the step.
	 *
	 * @param array $attributes The attributes to set.
	 */
	public function set_attributes( array $attributes ) {
		$this->attributes = $attributes;
	}

	/**
	 * Set the next step.
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data ) {
		$this->next_step = $step_data;
	}

	/**
	 * Get the next step.
	 *
	 * @return array|null The next linked step.
	 */
	public function get_next_step(): ?array {
		return $this->next_step;
	}

	/**
	 * Execute the step.
	 *
	 * @param array $data Data passed from the trigger.
	 */
	abstract public function execute( array $data );

	/**
	 * Get the slug name of the step.
	 *
	 * @return string The slug name of the step.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the title of the step.
	 *
	 * @return string The title of the step.
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the description of the step.
	 *
	 * @return string The description of the step.
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the type of the step.
	 *
	 * @return string The type of the step.
	 */
	abstract public static function get_type(): string;

	/**
	 * Get the category of the step.
	 *
	 * @return string The category of the step.
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Get the allowed triggers.
	 *
	 * @return array The allowed triggers.
	 */
	abstract public static function get_allowed_triggers(): ?array;
}
