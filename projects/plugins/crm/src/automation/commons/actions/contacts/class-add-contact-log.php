<?php
/**
 * Jetpack CRM Automation Add_Contact_Log action.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Adds the Add_Contact_Log class.
 */
class Add_Contact_Log extends Base_Action {

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/add_contact_log';
	}

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return 'Add Contact Log Action';
	}

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return 'Action to add a log to a contact';
	}

	/**
	 * Get the data type
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return Data_Type_Contact::get_slug();
	}

	/**
	 * Get the category of the step
	 *
	 * @return string
	 */
	public static function get_category(): ?string {
		return 'actions';
	}

	/**
	 * Get the allowed triggers
	 *
	 * @return array
	 */
	public static function get_allowed_triggers(): ?array {
		return array();
	}

	/**
	 * Add the log to the contact via the DAL.
	 *
	 * @param Data_Type_Base $data An instance of the contact data type.
	 */
	public function execute( Data_Type_Base $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		$zbs->DAL->contacts->zeroBS_addUpdateObjLog( $this->attributes ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
