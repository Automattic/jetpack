<?php
/**
 * Invoice Event.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

use Automattic\Jetpack\CRM\Entities\Factories\Invoice_Factory;
use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Invoice Event class.
 *
 * @since 6.2.0
 */
class Invoice_Event implements Event {

	/**
	 * The Invoice_Event instance.
	 *
	 * @since 6.2.0
	 * @var Invoice_Event
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @since 6.2.0
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
	 * @since 6.2.0
	 *
	 * @param array $invoice_data The created invoice data.
	 * @return void
	 */
	public function created( array $invoice_data ): void {

		/** @var Invoice $invoice */
		$invoice = Invoice_Factory::create( $invoice_data );

		do_action( 'jpcrm_invoice_created', $invoice );
	}

	/**
	 * The invoice was updated.
	 *
	 * @since 6.2.0
	 *
	 * @param array $invoice_data The updated invoice data.
	 * @param array $previous_invoice_data The previous invoice data.
	 * @return void
	 */
	public function updated( array $invoice_data, array $previous_invoice_data ): void {
		$invoice = Invoice_Factory::create( $invoice_data );

		$previous_invoice = Invoice_Factory::create( $previous_invoice_data );

		do_action( 'jpcrm_invoice_updated', $invoice, $previous_invoice );
	}
}
