<?php
/**
 * Jetpack CRM Automation Delete_Contact action.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Adds the Delete_Contact class.
 */
class Delete_Contact extends Base_Action {

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/delete_contact';
	}

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Delete Contact Action', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Action to delete the contact', 'zero-bs-crm' );
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
		return __( 'Contacts', 'zero-bs-crm' );
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
	 * Update the DAL - deleting the given contact.
	 *
	 * @param Data_Type_Base $data An instance of the contact data type.
	 */
	public function execute( Data_Type_Base $data ) {
		global $zbs;

		$contact_data              = $data->get_entity();
		$contact_data_for_deletion = array(
			'id'          => (int) $contact_data['id'],
			'saveOrphans' => (bool) $this->attributes['keep_orphans'],

		);
		$zbs->DAL->contacts->deleteContact( $contact_data_for_deletion ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
