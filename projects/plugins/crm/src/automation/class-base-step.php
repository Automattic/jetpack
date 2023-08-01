<?php
/**
 * Base Step
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

/**
 * Base Step
 *
 * @inheritDoc
 */
abstract class Base_Step implements Step {

	/**
	 * @var array Step attributes
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
	 * Get the data of the step
	 *
	 * @return array
	 */
	public function get_attributes(): array {
		return $this->attributes;
	}

	/**
	 * Set attributes of the step
	 *
	 * @param array $attributes The attributes to set.
	 */
	public function set_attributes( array $attributes ) {
		$this->attributes = $attributes;
	}

	/**
	 * Set the next step
	 *
	 * @param array $step_data The next linked step.
	 */
	public function set_next_step( array $step_data ) {
		$this->next_step = $step_data;
	}

	/**
	 * Get the next step
	 *
	 * @return array|null
	 */
	public function get_next_step(): ?array {
		return $this->next_step;
	}

	/**
	 * Execute the step
	 *
	 * @param Data_Type_Base $data Data passed from the trigger.
	 */
	abstract public function execute( Data_Type_Base $data );

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the type of the step
	 *
	 * @return string
	 */
	abstract public static function get_data_type(): string;

	/**
	 * Get the category of the step
	 *
	 * @return string
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Get the allowed triggers
	 *
	 * @return array
	 */
	abstract public static function get_allowed_triggers(): ?array;
}
