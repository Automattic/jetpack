<?php
/**
 * Base Step
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

/**
 * Base Step.
 *
 * @since 6.2.0
 * {@inheritDoc}
 */
abstract class Base_Step implements Step {

	/**
	 * Step attributes.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected $attributes;

	/**
	 * Attributes definitions.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected $attribute_definitions = array();

	/**
	 * The next step if the current one is successful.
	 *
	 * @since 6.2.0
	 * @var int|string|null
	 */
	protected $next_step_true = null;

	/**
	 * The next step if not successful.
	 *
	 * @since 6.2.0
	 * @var int|string|null
	 */
	protected $next_step_false = null;

	/**
	 * Base_Step constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data An array of data for the current step.
	 */
	public function __construct( array $step_data ) {
		$this->attributes      = $step_data['attributes'] ?? array();
		$this->next_step_true  = $step_data['next_step_true'] ?? null;
		$this->next_step_false = $step_data['next_step_false'] ?? null;
	}

	/**
	 * Get the data of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return array The step data.
	 */
	public function get_attributes(): array {
		return $this->attributes;
	}

	/**
	 * Set attributes of the step.
	 *
	 * @since 6.2.0
	 *
	 * @param array $attributes The attributes to set.
	 */
	public function set_attributes( array $attributes ) {
		$this->attributes = $attributes;
	}

	/**
	 * Get attribute value.
	 *
	 * @since 6.2.0
	 *
	 * @param string $attribute The attribute to get.
	 * @param mixed  $default The default value to return if the attribute is not set.
	 * @return mixed The attribute value.
	 */
	public function get_attribute( string $attribute, $default = null ) {
		return $this->attributes[ $attribute ] ?? $default;
	}

	/**
	 * Set attribute value.
	 *
	 * @since 6.2.0
	 *
	 * @param string $attribute The attribute key.
	 * @param mixed  $value The default value.
	 * @return void
	 */
	public function set_attribute( string $attribute, $value ): void {
		$this->attributes[ $attribute ] = $value;
	}

	/**
	 * Get the step attribute definitions.
	 *
	 * @since 6.2.0
	 *
	 * @return Attribute_Definition[] The attribute definitions of the step.
	 */
	public function get_attribute_definitions(): array {
		return $this->attribute_definitions;
	}

	/**
	 * Set the step attributes.
	 *
	 * @since 6.2.0
	 *
	 * @param Attribute_Definition[] $attribute_definitions Set the step attributes.
	 */
	public function set_attribute_definitions( array $attribute_definitions ) {
		$this->attribute_definitions = $attribute_definitions;
	}

	/**
	 * Get the next step.
	 *
	 * Unless anything else is defined, then we assume to only continue with the
	 * next step if the current one is successful.
	 * One example of this will be conditions where a certain criteria has not been met.
	 *
	 * @since 6.2.0
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_id() {
		return $this->get_next_step_true();
	}

	/**
	 * Get the next step if the current one is successful.
	 *
	 * @since 6.2.0
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_true() {
		return $this->next_step_true;
	}

	/**
	 * Set the next step if the current one is successful.
	 *
	 * @since 6.2.0
	 *
	 * @param string|int|null $step_id The next linked step id.
	 * @return void
	 */
	public function set_next_step_true( $step_id ): void {
		$this->next_step_true = $step_id;
	}

	/**
	 * Get the next step if the current one is falsy.
	 *
	 * @since 6.2.0
	 *
	 * @return int|string|null The next linked step id.
	 */
	public function get_next_step_false() {
		return $this->next_step_false;
	}

	/**
	 * Set the next step if the current one is falsy.
	 *
	 * @since 6.2.0
	 *
	 * @param string|int|null $step_id The next linked step id.
	 * @return void
	 */
	public function set_next_step_false( $step_id ): void {
		$this->next_step_false = $step_id;
	}

	/**
	 * Validate data passed to the step
	 *
	 *  @since 6.2.0
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
	 * Validate and execute the step.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data type passed.
	 * @return void
	 *
	 * @throws Data_Type_Exception If the data type passed is not expected.
	 */
	public function validate_and_execute( Data_Type $data ): void {
		$this->validate( $data );
		$this->execute( $data );
	}

	/**
	 * Execute the step.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data type passed from the trigger.
	 */
	abstract protected function execute( Data_Type $data );

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the step.
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the step.
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the data type exepected by the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The data type expected by the step.
	 */
	abstract public static function get_data_type(): string;

	/**
	 * Get the category of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The category of the step.
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Get the step as an array.
	 *
	 * The main use-case to get the step as an array is to prepare
	 * the items for an API response.
	 *
	 * @since 6.2.0
	 *
	 * @return array The step as an array.
	 */
	public function to_array(): array {
		$step = array(
			'title'                 => static::get_title(),
			'description'           => static::get_description(),
			'slug'                  => static::get_slug(),
			'category'              => static::get_category(),
			'step_type'             => is_subclass_of( $this, Action::class ) ? 'action' : 'condition',
			'next_step_true'        => $this->get_next_step_true(),
			'next_step_false'       => $this->get_next_step_false(),
			'attributes'            => $this->get_attributes(),
			'attribute_definitions' => array(),
		);

		foreach ( $this->get_attribute_definitions() as $attribute_definition ) {
			$step['attribute_definitions'][ $attribute_definition->get_slug() ] = $attribute_definition->to_array();
		}

		return $step;
	}
}
