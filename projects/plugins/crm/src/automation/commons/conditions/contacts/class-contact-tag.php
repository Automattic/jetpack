<?php
/**
 * Jetpack CRM Automation Contact_Tag condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Contact_Tag condition class.
 *
 * @since $$next-version$$
 */
class Contact_Tag extends Base_Condition {

	/**
	 * Contact_Tag constructor.
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
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the field is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'tag', __( 'Tag', 'zero-bs-crm' ), __( 'Contact Tag to compare with.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
			)
		);
	}

	/**
	 * Checks if a given tag name exists in the tags array.
	 *
	 * @param array  $data     The data array containing the 'tags' key.
	 * @param string $tag_name The name of the tag to check for.
	 *
	 * @return bool True if the tag name exists, false otherwise.
	 */
	private function has_tag_by_name( $data, $tag_name ) {
		if ( ! isset( $data['tags'] ) || ! is_array( $data['tags'] ) ) {
			return false;
		}

		foreach ( $data['tags'] as $tag ) {
			if ( isset( $tag['name'] ) && $tag['name'] === $tag_name ) {
					return true;
			}
		}

		return false;
	}

	/**
	 * Executes the condition. If the condition is met, the value stored in the
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
		if ( $previous_data === null ) {
			$this->logger->log( 'Invalid previous contact tag data' );
			$this->condition_met = false;

			return;
		}

		if ( ! $this->is_valid_contact_tag_data( $data ) || ! $this->is_valid_contact_tag_data( $previous_data ) ) {
			$this->logger->log( 'Invalid contact tag data' );
			$this->condition_met = false;

			return;
		}

		$operator = $this->get_attributes()['operator'];
		$tag      = $this->get_attributes()['tag'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: Contact_Tag ' . $operator . ' => ' . $tag );

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
	 * Checks if the contact has at least the necessary keys to detect a contact
	 * tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data The event data.
	 * @return bool True if the data is valid to evaluate a contact tag condition, false otherwise.
	 */
	private function is_valid_contact_tag_data( array $data ): bool {
		return is_array( $data ) && isset( $data['tags'] );
	}

	/**
	 * Get the title for the contact tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title.
	 */
	public static function get_title(): string {
		return __( 'Contact Tag', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the contact tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'jpcrm/condition/contact_tag'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_tag';
	}

	/**
	 * Get the description for the contact tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact tag matches a specified condition', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the contact tag condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'contact'.
	 */
	public static function get_category(): string {
		return 'contact';
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Data_Type_Contact::get_slug();
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
