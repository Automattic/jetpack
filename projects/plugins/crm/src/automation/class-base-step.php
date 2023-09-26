<?php
/**
 * Base Step
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

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
	 * Attributes definitions.
	 *
	 * @since $$next-version$$
	 * @var array
	 */
	protected $attribute_definitions;

	/**
	 * Next linked step.
	 *
	 * @since $$next-version$$
	 * @var int|string|null
	 */
	protected $next_step_id = null;

	/**
	 * Base_Step constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data An array of data for the current step.
	 */
	public function __construct( array $step_data ) {
		$this->attributes = $step_data['attributes'] ?? array();
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
	 * Get the step attribute definitions.
	 *
	 * @since $$next-version$$
	 *
	 * @return Step_Attribute[] The attribute definitions of the step.
	 */
	public function get_attribute_definitions(): ?array {
		return $this->attribute_definitions;
	}

	/**
	 * Set the step attributes.
	 *
	 * @since $$next-version$$
	 *
	 * @param Step_Attribute[] $attribute_definitions Set the step attributes.
	 */
	public function set_attribute_definitions( array $attribute_definitions ) {
		$this->attribute_definitions = $attribute_definitions;
	}

	/**
	 * Set the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @param int|string|null $step_id The next linked step id.
	 */
	public function set_next_step( $step_id ) {
		$this->next_step = $step_id;
	}

	/**
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_id() {
		return $this->next_step_id;
	}

	/**
	 * Validate data passed to the step
	 *
	 *  @since $$next-version$$
	 *
	 * @param Data_Type $data Data type passed.
	 * @return void
	 *
	 * @throws Data_Type_Exception If the data type passed is not expected.
	 */
	public function validate( Data_Type $data ): void {
		$data_type_class = static::get_data_type();
		if ( ! $data instanceof $data_type_class ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid data type passed to step: %s', static::class ),
				Data_Type_Exception::INVALID_DATA
			);
		}
	}

	/**
	 * Execute the step.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type $data Data type passed from the trigger.
	 */
	abstract public function execute( Data_Type $data );

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
	 * Get the data type exepected by the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The data type expected by the step.
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
}
