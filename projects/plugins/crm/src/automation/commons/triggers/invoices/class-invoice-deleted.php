<?php
/**
 * Jetpack CRM Automation Invoice_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Invoice_Deleted class.
 */
class Invoice_Deleted extends Base_Trigger {

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/invoice_delete';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Delete Invoice', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when an invoice is deleted', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Get the date type
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
			'jpcrm_automation_invoice_delete',
			array( $this, 'execute_workflow' )
		);
	}
}
