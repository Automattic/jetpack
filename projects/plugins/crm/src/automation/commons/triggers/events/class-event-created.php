<?php
/**
 * Jetpack CRM Automation Event_Created trigger.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Event;

/**
 * Adds the Event_Created class.
 *
 * @since $$next-version$$
 */
class Event_Created extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/event_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the trigger.
	 */
	public static function get_title(): string {
		return __( 'New Event', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the trigger.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a new event status is added', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category of the trigger.
	 */
	public static function get_category(): string {
		return Data_Type_Event::get_slug();
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return 'event';
	}

	/**
	 * Listen to this trigger's target event.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	protected function listen_to_event(): void {
		add_action(
			'jpcrm_event_created',
			array( $this, 'execute_workflow' )
		);
	}

}
