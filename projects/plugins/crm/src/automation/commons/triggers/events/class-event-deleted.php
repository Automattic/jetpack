<?php
/**
 * Jetpack CRM Automation Event_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Event_Deleted class.
 */
class Event_Deleted extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/event_deleted';
	}

	/**
	 * Get the title of the trigger.
	 * @return string
	 */
	public static function get_title(): string {
		return __( 'Event Deleted', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 * @return string
	 */
	public static function get_description(): string {
		return __( 'Triggered when a event is deleted', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'event', 'zero-bs-crm' );
	}

	/**
	 * Listen to this trigger's target event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_event_delete',
			array( $this, 'execute_workflow' )
		);
	}
}
