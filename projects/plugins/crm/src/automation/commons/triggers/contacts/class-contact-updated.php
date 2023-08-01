<?php
/**
 * Jetpack CRM Automation Contact_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Contact_Updated class.
 *
 * @since $$next-version$$
 */
class Contact_Updated extends Base_Trigger {

	/** @var Automation_Workflow The Automation workflow object. */
	protected $workflow;

	/**
	 * Get the slug name of the trigger.
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/contact_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Contact Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM contact is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'contact', 'zero-bs-crm' );
	}

	/**
	 * Listen to the desired event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_contact_update',
			array( $this, 'execute_workflow' )
		);
	}

}
