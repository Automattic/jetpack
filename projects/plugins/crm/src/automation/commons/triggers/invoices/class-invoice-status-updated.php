<?php
/**
 * Jetpack CRM Automation Invoice_Status_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Invoice_Status_Updated class.
 */
class Invoice_Status_Updated extends Base_Trigger {

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/invoice_status_updated';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Invoice Status Updated', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when an invoice status is updated', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return 'invoice';
	}

	/**
	 * Listen to the desired event
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_invoice_status_update',
			array( $this, 'execute_workflow' )
		);
	}
}
