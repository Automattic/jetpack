<?php
/**
 * Jetpack CRM Automation New_Contact action.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;

/**
 * Adds the New_Contact class.
 */
class New_Contact extends Base_Action {

	/**
	 * @var object The action data.
	 */
	protected $action_data;

	/**
	 * @var array Step data.
	 */
	protected $attributes;

	/**
	 * New_Contact constructor.
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
		return 'jpcrm/new_contact';
	}

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return 'New Contact Action';
	}

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return 'Action to add the new contact';
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
	 * Add the new contact to the DAL.
	 *
	 * @param array $contact_data The contact data to be added.
	 */
	public function execute( array $contact_data = array() ) {
		global $zbs;

		$contact_data = $this->attributes;
		$zbs->DAL->contacts->addUpdateContact( $contact_data ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
