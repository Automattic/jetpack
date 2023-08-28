<?php
/**
 * Jetpack CRM Automation Update_Contact_Status action.
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
 * Adds the Update_Contact_Status class.
 *
 * @since $$next-version$$
 */
class Update_Contact_Status extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/update_contact_status';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return 'Update Contact Status Action';
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return 'Action to update the contact status';
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
	 * Update the DAL with the new contact status.
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 * @throws Step_Exception If the data passed is not a Contact object.
	 * @since $$next-version$$
	 *
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		/** @var Contact $data */
		// Check if the data is a Contact object.
		if ( ! $data instanceof Contact ) {
			throw new Step_Exception( 'The data passed to the Update_Contact action is not a Contact object.', Step_Exception::STEP_TYPE_NOT_ALLOWED );
		}

		$data->status = $this->attributes['new_status'];

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$zbs->DAL->contacts->addUpdateContact( $data->get_contact_array_for_db() );
	}
}
