<?php
/**
 * Invoice Event.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Invoice Event class.
 *
 * @since $$next-version$$
 */
class Invoice_Event implements Event {

	/**
	 * The Invoice_Event instance.
	 *
	 * @since $$next-version$$
	 * @var Invoice_Event
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @since $$next-version$$
	 *
	 * @return Invoice_Event The Invoice_Event instance.
	 */
	public static function get_instance(): Invoice_Event {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * A new invoice was created.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $invoice_data The created invoice data.
	 * @return void
	 */
	public function created( array $invoice_data ): void {
		do_action( 'jpcrm_invoice_created', $invoice_data );
	}

	/**
	 * The invoice was updated.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $invoice_data The updated invoice data.
	 * @return void
	 */
	public function updated( array $invoice_data ): void {
		do_action( 'jpcrm_invoice_updated', $invoice_data );
	}
}
