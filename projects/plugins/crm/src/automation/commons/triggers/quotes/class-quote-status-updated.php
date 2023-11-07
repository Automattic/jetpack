<?php
/**
 * Jetpack CRM Automation Quote_Status_Updated trigger.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Quote_Data;

/**
 * Adds the Quote_Status_Updated class.
 *
 * @since 6.2.0
 */
class Quote_Status_Updated extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/quote_status_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): ?string {
		return __( 'Quote Status Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a quote status is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): ?string {
		return __( 'Quote', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Quote_Data::class;
	}

	/**
	 * Listen to this trigger's target event.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	protected function listen_to_event(): void {
		$this->listen_to_wp_action( 'jpcrm_quote_status_update' );
	}
}
