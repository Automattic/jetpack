<?php
/**
 * Company Event.
 *
 * @package Automattic\Jetpack\CRM\Event_Manager
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Invoice Event class
 */
class Invoice_Event implements Event {

	/** @var null The Invoice_Event instance. */
	private static $instance = null;

	/** @var array The valid fields for the invoice. */
	private $valid_fields = array();

	/**
	 * Get the singleton instance of this class.
	 *
	 * @return Invoice_Event
	 */
	public static function getInstance(): Invoice_Event {
		if ( ! self::$instance ) {
			self::$instance = new Invoice_Event();
		}

		return self::$instance;
	}

	/**
	 * A new invoice was created.
	 *
	 * @param array $invoice_data The created invoice data.
	 * @return void
	 */
	public function created( array $invoice_data ) {
		do_action( 'jpcrm_invoice_created', $invoice_data );
	}

	/**
	 * The invoice was updated.
	 *
	 * @param array $invoice_data The updated invoice data.
	 * @param array $old_invoice_data The old invoice data.
	 * @return void
	 */
	public function updated( array $invoice_data, array $old_invoice_data ) {

		// Notify a general update
		do_action( 'jpcrm_invoice_updated', $invoice_data );

		// Check if the invoice was paid
		$this->is_paid( $invoice_data, $old_invoice_data );

		// Check for valid field changes for specific updates
		$changed_fields = array();
		foreach ( $invoice_data as $key => $value ) {
			if ( $value !== $old_invoice_data[ $key ] ) {
				$changed_fields[ $key ] = $value;

				if ( in_array( $key, $this->valid_fields, true ) ) {
					do_action( 'jpcrm_invoice_' . $key . '_updated', $value, $old_invoice_data[ $key ] );
				}
			}
		}
	}

	/**
	 * An invoice was deleted.
	 *
	 * @param array $invoice_data The deleted invoice data.
	 * @return void
	 */
	public function deleted( array $invoice_data ) {
		do_action( 'jpcrm_invoice_deleted', $invoice_data );
	}

	/**
	 * Check if the invoice was paid.
	 *
	 * @param array $invoice_data The updated invoice data.
	 * @param array $old_invoice_data The old invoice data.
	 * @return void
	 */
	private function is_paid( array $invoice_data, array $old_invoice_data ) {
		if ( $invoice_data['status'] === 'Paid' && $old_invoice_data['status'] !== 'Paid' ) {
			// Note: this only works if the status is not changed in the settings by the user
			do_action( 'jpcrm_invoice_paid', $invoice_data );
		}
	}
}
