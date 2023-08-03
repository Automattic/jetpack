<?php
/**
 * Jetpack CRM Automation Contact_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Contact_Deleted class.
 */
class Contact_Deleted extends Base_Trigger {

	/**
	 * @var Automation_Workflow The Automation workflow object.
	 */
	protected $workflow;

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/contact_delete';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Contact Deleted', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM contact is deleted', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'contact', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return 'contact';
	}

	/**
	 * Listen to the desired event
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_contact_delete',
			array( $this, 'execute_workflow' )
		);
	}
}
