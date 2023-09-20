<?php
/**
 * Jetpack CRM Automation Object Tag condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Tag;

/**
 * Object Tag condition class.
 *
 * @since $$next-version$$
 */
class Object_Tag extends Base_Condition {

	/**
	 * Object Tag constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		// @todo - the list of valid conditions should be retrieved from a central, maintained location.
		$this->valid_operators = array(
			'Contact_Field_Changed'       => 'Contact_Field_Changed',
			'Contact_Tag'                 => 'Contact_Tag',
			'Contact_Transitional_Status' => 'Contact_Transitional_Status',
			'Invoice_Field_Contains'      => 'Invoice_Field_Contains',
			'Invoice_Status_Changed'      => 'Invoice_Status_Changed',
			'Quote_Status_Changed'        => 'Quote_Status_Changed',
			'Object_Tag'                  => 'Object_Tag',
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the field is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'tag', __( 'Tag', 'zero-bs-crm' ), __( 'Object Tag to compare with.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
			)
		);
	}

	/**
	 * Check for valid parameters.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $data The data to validate.
	 * @param mixed $previous_data The previous data to validate.
	 * @return bool True if parameters are valid, false otherwise.
	 */
	private function check_for_valid_parameters( $data, $previous_data ) {

		if ( $previous_data === null || ! $this->is_valid_tag_data( $data ) || ! $this->is_valid_tag_data( $previous_data ) ) {
			$this->logger->log( 'Invalid tag data: parameters not valid' );

			return false;
		}

		return true;
	}

	/**
	 * Checks if a given tag name exists in the tags array.
	 *
	 * @param array  $data     The array containing tag data.
	 * @param string $tag_name The name of the tag to check for.
	 *
	 * @return bool True if the tag name exists, false otherwise.
	 */
	private function has_tag_by_name( $data, $tag_name ) {
		if ( ! is_array( $data ) ) {
			$this->logger->log( 'The given tag data is not in the correct (array) format, so is not valid.' );
			return false;
		}

		foreach ( $data as $item ) {
			if ( is_array( $item ) ) {
				foreach ( $item as $key => $value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					if ( $value['name'] === $tag_name ) {
						return true;
					}
				}
			}
		}
		$this->logger->log( 'Tag does not exist in the given array of tags: ' );
		return false;
	}

	/**
	 * Executes and valid conditions. If the condition is met, the value stored in the
	 * attribute $condition_met is set to true; otherwise, it is set to false.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$operator = $this->get_attributes()['operator'];
		$tag      = $this->get_attributes()['tag'];

		$this->check_for_valid_operator( $operator );

		if ( ! $this->check_for_valid_parameters( $data, $previous_data ) ) {
			$this->condition_met = false;
			return;
		}

		$this->logger->log( 'Condition: Object_Tag ' . $tag . ' => ' . $operator );

		$this->condition_met = $this->has_tag_by_name( $data, $tag );
		$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
	}

	/**
	 * Checks if the object has at least the necessary keys to detect an object
	 * tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data The event data.
	 * @return bool True if the data is valid to evaluate an object tag condition, false otherwise.
	 */
	private function is_valid_tag_data( array $data ): bool {
		return is_array( $data ) && isset( $data['tags'] );
	}

	/**
	 * Get the title for the object tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title.
	 */
	public static function get_title(): string {
		return __( 'Object Tag', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the object tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'jpcrm/condition/object_tag'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/object_tag';
	}

	/**
	 * Get the description for the object tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if an object tag matches a specified condition', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the object tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The translated string for the object.
	 */
	public static function get_category(): string {
		return __( 'Tag', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Data_Type_Tag::get_slug();
	}

	/**
	 * Get the allowed triggers for the contact tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/contact_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/contact_updated',
		);
	}
}
