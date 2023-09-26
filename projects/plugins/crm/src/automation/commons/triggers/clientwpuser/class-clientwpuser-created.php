<?php
/**
 * Jetpack CRM Automation ClientWPUser_Created trigger.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_ClientWPUser;

/**
 * Adds the ClientWPUser_Created class.
 *
 * @since $$next-version$$
 */
class ClientWPUser_Created extends Base_Trigger {

	/**
	 * The Automation workflow object.
	 *
	 * @since $$next-version$$
	 * @var Automation_Workflow
	 */
	protected $workflow;

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/clientwpuser_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): string {
		return __( 'New WP User', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a new WP user is created', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): string {
		return __( 'WP User', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Data_Type_ClientWPUser::get_slug();
	}

	/**
	 * Listen to the desired event.
	 *
	 * @since $$next-version$$
	 */
	protected function listen_to_event(): void {
		add_action(
			'jpcrm_clientwpuser_created',
			array( $this, 'execute_workflow' )
		);
	}
}
