<?php
/**
 * Jetpack CRM Automation Add_Contact_Log action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Adds the Add_Contact_Log class.
 *
 * @since $$next-version$$
 */
class Add_Contact_Log extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/add_contact_log';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): ?string {
		return 'Add Contact Log Action';
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): ?string {
		return 'Action to add a log to a contact';
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
	 * @return string The category of the step.
	 */
	public static function get_category(): ?string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Add the log to the contact via the DAL.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		/** @var Contact $contact */
		$contact = $data->get_data();

		$zbs->DAL->logs->addUpdateLog( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'data' => array(
					'objtype'   => ZBS_TYPE_CONTACT,
					'objid'     => $contact->id,
					'type'      => $this->get_attributes()['type'],
					'shortdesc' => $this->get_attributes()['short-description'],
					'longdesc'  => $this->get_attributes()['long-description'],
				),
			)
		);
	}
}
