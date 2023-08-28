<?php
/**
 * Jetpack CRM Automation Update_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;
use Automattic\Jetpack\CRM\Automation\Step_Exception;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Adds the Update_Contact class.
 *
 * @since $$next-version$$
 */
class Update_Contact extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/update_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return 'Update Contact Action';
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return 'Action to update the contact';
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
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string {
		return 'actions';
	}

	/**
	 * Get the allowed triggers.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[]|null The allowed triggers.
	 */
	public static function get_allowed_triggers(): ?array {
		return array();
	}

	/**
	 * Update the DAL with the new contact data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 *
	 * @throws Step_Exception If the data passed is not a Contact object.
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		// Check if the data is a Contact object.
		if ( ! $data instanceof Contact ) {
			throw new Step_Exception( 'The data passed to the Update_Contact action is not a Contact object.', Step_Exception::STEP_TYPE_NOT_ALLOWED );
		}

		$contact         = $data->get_contact_array_for_db();
		$contact['data'] = array_replace( $contact['data'], $this->attributes['data'] );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$zbs->DAL->contacts->addUpdateContact( $contact );
	}
}
