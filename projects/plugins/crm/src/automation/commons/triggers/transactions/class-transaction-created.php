<?php
/**
 * Jetpack CRM Automation Transaction_Created trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Transaction_Data;

/**
 * Adds the Transaction_Created class.
 *
 * @since 6.2.0
 */
class Transaction_Created extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug.
	 */
	public static function get_slug(): string {
		return 'jpcrm/transaction_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title.
	 */
	public static function get_title(): string {
		return __( 'New Transaction', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a transaction is created', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category.
	 */
	public static function get_category(): string {
		return __( 'Transaction', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Transaction_Data::class;
	}

	/**
	 * Listen to this trigger's target event.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	protected function listen_to_event(): void {
		$this->listen_to_wp_action( 'jpcrm_transaction_created' );
	}
}
