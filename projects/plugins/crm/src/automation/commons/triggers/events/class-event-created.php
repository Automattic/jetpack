<?php
/**
 * Jetpack CRM Automation Event_Created trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Event_Created class.
 *
 * @since $$next-version$$
 */
class Event_Created extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/event_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @return string
	 */
	public static function get_title(): string {
		return __( 'New Event', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @return string
	 */
	public static function get_description(): string {
		return __( 'Triggered when a new event status is added', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @return string
	 */
	public static function get_category(): string {
		return 'event';
	}

	/**
	 * Get the date type.
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return 'event';
	}

	/**
	 * Listen to this trigger's target event.
	 */
	protected function listen_to_event(): void {
		add_action(
			'jpcrm_event_created',
			array( $this, 'execute_workflow' )
		);
	}
}
