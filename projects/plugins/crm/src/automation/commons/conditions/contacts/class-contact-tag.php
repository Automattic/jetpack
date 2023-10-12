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
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact_Tag condition class.
 *
 * @since 6.2.0
 */
class Contact_Tag extends Base_Condition {

	/**
	 * Contact_Tag constructor.
	 *
	 * @since 6.2.0
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
	 * @param Contact $contact The contact containing the 'tags' key.
	 * @param string  $tag_name The name of the tag to check for.
	 *
	 * @return bool True if the tag name exists, false otherwise.
	 */
	private function has_tag_by_name( Contact $contact, string $tag_name ) {

		foreach ( $contact->tags as $tag ) {
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
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	protected function execute( Data_Type $data ) {

		/** @var Contact $contact */
		$contact = $data->get_data();

		$operator = $this->get_attributes()['operator'];
		$tag      = $this->get_attributes()['tag'];

		$this->check_for_valid_operator( $operator );

		$previous_data = $data->get_previous_data();

		$this->logger->log( 'Condition: Contact_Tag ' . $operator . ' => ' . $tag );

		switch ( $operator ) {
			case 'tag_added':
				if ( ! $previous_data instanceof Contact ) {
					$this->condition_met = false;
					$this->logger->log( 'Condition met?: false' );

					return;
				}

				$this->condition_met = ( ! $this->has_tag_by_name( $previous_data, $tag ) && $this->has_tag_by_name( $contact, $tag ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;

			case 'tag_removed':
				if ( ! $previous_data instanceof Contact ) {
					$this->condition_met = false;
					$this->logger->log( 'Condition met?: false' );

					return;
				}

				$this->condition_met = ( $this->has_tag_by_name( $previous_data, $tag ) && ! $this->has_tag_by_name( $contact, $tag ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;

			case 'has_tag':
				$this->condition_met = $this->has_tag_by_name( $contact, $tag );
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
	 * Get the title for the contact tag condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title.
	 */
	public static function get_title(): string {
		return __( 'Contact Tag', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the contact tag condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug 'jpcrm/condition/contact_tag'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_tag';
	}

	/**
	 * Get the description for the contact tag condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact tag matches a specified condition', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the contact tag condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The translated string for 'Contact'.
	 */
	public static function get_category(): string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Contact_Data::class;
	}
}
