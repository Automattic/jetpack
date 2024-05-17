<?php
/**
 * Jetpack CRM Automation WP_User_Created trigger.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\WP_User_Data;

/**
 * Adds the WP_User_Created class.
 *
 * @since 6.2.0
 */
class WP_User_Created extends Base_Trigger {

	/**
	 * The Automation workflow object.
	 *
	 * @since 6.2.0
	 * @var Automation_Workflow
	 */
	protected $workflow;

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/wp_user_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): string {
		return __( 'New WP User', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a new WP user is created', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
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
		return WP_User_Data::class;
	}

	/**
	 * Listen to the desired event.
	 *
	 * @since 6.2.0
	 */
	protected function listen_to_event(): void {
		add_action(
			'user_register',
			function ( $user_id ) {
				$wp_user = new \WP_User( $user_id );
				$this->execute_workflow( $wp_user );
			}
		);
	}
}
