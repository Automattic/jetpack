<?php
/**
 * Jetpack CRM Automation Delete_Contact action.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;

/**
 * Adds the Delete_Contact class.
 */
class Delete_Contact extends Base_Action {

	/**
	 * @var object The action data.
	 */
	protected $action_data;

	/**
	 * @var array Step data.
	 */
	protected $attributes;

		/**
		 * @var array Step data.
		 */
	protected $name;

	/**
	 * Delete_Contact constructor.
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
	 * Update the DAL - deleting the given contact.
	 *
	 * @param array $contact_data The contact data to be passed into the DAL's delete function.
	 */
	public function execute( array $contact_data ) {
		global $zbs;

		$contact_data_for_deletion = array(
			'id'          => (int) $contact_data['id'],
			'saveOrphans' => (bool) $this->attributes['keep_orphans'],

		);
		$zbs->DAL->contacts->deleteContact( $contact_data_for_deletion ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
