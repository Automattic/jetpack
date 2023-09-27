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
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Tag_Data;

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

		$this->valid_operators = array(
			'tag_added'   => __( 'Tag was added', 'zero-bs-crm' ),
			'tag_removed' => __( 'Tag was removed', 'zero-bs-crm' ),
			'has_tag'     => __( 'Has tag', 'zero-bs-crm' ),
			'not_has_tag' => __( 'Does not have tag', 'zero-bs-crm' ),
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
	 * @param string $operator The operator.
	 * @param mixed  $data The data to validate.
	 * @param mixed  $previous_data The previous data to validate.
	 * @return bool True if parameters are valid, false otherwise.
	 */
	private function check_for_valid_parameters( $operator, $data, $previous_data ) {

		switch ( $operator ) {
			case 'tag_added':
			case 'tag_removed':
				if ( $previous_data === null || ! $this->is_valid_tag_data( $data ) || ! $this->is_valid_tag_data( $previous_data ) ) {
					$this->logger->log( 'Invalid tag data: parameters not valid' );

					return false;
				}
				break;
			case 'has_tag':
			case 'not_has_tag':
				if ( ! $this->is_valid_tag_data( $data ) ) {
					$this->logger->log( 'Invalid tag data: parameters not valid' );
					$this->condition_met = false;

					return false;
				}
				break;
			default:
				$this->logger->log( 'Unknown operator: ' . $operator );
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
	private function has_tag_by_name( $data, string $tag_name ) {
		if ( ! is_array( $data ) ) {
			$this->logger->log( 'The given tag data is not in the correct (array) format, so is not valid.' );
			return false;
		}
		foreach ( $data as $item ) {
			if ( is_array( $item ) && $item['name'] === $tag_name ) {
				return true;
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
	 * @param Data_Type $data Data passed from the trigger.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( Data_Type $data ) {

		$operator = $this->get_attributes()['operator'];
		$tag      = $this->get_attributes()['tag'];

		$this->check_for_valid_operator( $operator );

		$previous_data = $data->get_previous_data();
		$data          = $data->get_data();

		$this->logger->log( 'Condition: Object_Tag ' . $tag . ' => ' . $operator );

		switch ( $operator ) {
			case 'tag_added':
				$this->condition_met = ( ! $this->has_tag_by_name( $previous_data, $tag ) && $this->has_tag_by_name( $data, $tag ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'tag_removed':
				$this->condition_met = ( $this->has_tag_by_name( $previous_data, $tag ) && ! $this->has_tag_by_name( $data, $tag ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'has_tag':
				$this->condition_met = $this->has_tag_by_name( $data, $tag );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'not_has_tag':
				$this->condition_met = ! ( $this->has_tag_by_name( $data, $tag ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			default:
				$this->condition_met = false;
				throw new Automation_Exception(
					/* Translators: %s is the unimplemented operator. */
					sprintf( __( 'Valid but unimplemented operator: %s', 'zero-bs-crm' ), $operator ),
					Automation_Exception::CONDITION_OPERATOR_NOT_IMPLEMENTED
				);
		}
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

		if ( is_array( $data ) ) {
			foreach ( $data as $item ) {
				if ( ! is_array( $item ) || ! isset( $item['name'] ) ) {
					return false;
				}
			}
		}
		return true;
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
		return Tag_Data::get_slug();
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
			'jpcrm/company_updated',
			'jpcrm/event_updated',
			'jpcrm/invoice_updated',
			'jpcrm/quote_updated',
			'jpcrm/transaction_updated',
		);
	}
}
