<?php
/**
 * Jetpack CRM Automation Update_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

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
	 * @param Data_Type_Base  $data An instance of the contact data type.
	 * @param ?Data_Type_Base $previous_data (Optional) Instance of the data before being changed.
	 */
	public function execute( Data_Type_Base $data, ?Data_Type_Base $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		$contact_data = $data->get_entity();
		unset( $contact_data['id'] );

		$zbs->DAL->contacts->addUpdateContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'id'   => $data->get_id(),
				'data' => array_replace( $contact_data, $this->attributes['data'] ),
			)
		);
	}

}
