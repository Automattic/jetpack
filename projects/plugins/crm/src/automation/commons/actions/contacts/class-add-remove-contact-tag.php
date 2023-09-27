<?php
/**
 * Jetpack CRM Automation Add_Remove_Contact_Tag action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

/**
 * Adds the Add_Remove_Contact_Tag class.
 *
 * @since $$next-version$$
 */
class Add_Remove_Contact_Tag extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/add_remove_contact_tag';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): ?string {
		return 'Add / Remove Contact Tag Action';
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return 'Action to add or remove the contact tag';
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Contact_Data::class;
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Add / remove the tag to / from the contact via the DAL.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 *
	 * @throws Data_Type_Exception When the data type is not supported.
	 */
	protected function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		/** @var Contact $contact */
		$contact = $data->get_data();

		global $zbs;
		$zbs->DAL->contacts->addUpdateContactTags( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'id'        => $contact->id,
				'mode'      => $this->attributes['mode'],
				'tag_input' => $this->attributes['tag_input'],
			)
		);
	}
}
