<?php
/**
 * Jetpack CRM Automation Invoice_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Invoice_Updated class.
 *
 * @since $$next-version$$
 */
class Invoice_Updated extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/invoice_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @return string The title of the trigger.
	 */
	public static function get_title(): ?string {
		return __( 'Invoice Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @return string The description of the trigger.
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when an invoice is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @return string The category of the trigger.
	 */
	public static function get_category(): ?string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Listen to the desired event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_invoice_update',
			array( $this, 'execute_workflow' )
		);
	}
}
