<?php
/**
 * Jetpack CRM Automation Update_Contact_Status action.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;

/**
 * Adds the Update_Contact_Status class.
 */
class Update_Contact_Status extends Base_Action {

	/**
	 * @var object The action data.
	 */
	protected $action_data;

	/**
	 * @var array Step data.
	 */
	protected $attributes;

	/**
	 * Update_Contact_Status constructor.
	 *
	 * @param array $action_data An array of the action data.
	 *
	 */
	public function __construct( $action_data ) {
		Base_Action::__construct( $action_data );

		$this->action_data = $action_data;
		$this->attributes  = $action_data['attributes'];
	}

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/update_contact_status';
	}

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return 'Update Contact Status Action';
	}

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return 'Action to update the contact status';
	}

	/**
	 * Get the type of the step
	 *
	 * @return string
	 */
	public static function get_type(): string {
		return 'contacts';
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
	 * Update the DAL with the new contact status.
	 *
	 * @param array $contact_data The contact data to be updated.
	 */
	public function execute( array $contact_data ) {
		global $zbs;

		$contact_data['data']['status'] = $this->attributes['new_status'];
		$zbs->DAL->contacts->addUpdateContact( $contact_data ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
