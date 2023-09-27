<?php
/**
 * Jetpack CRM Automation Set_Invoice_Status action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Adds the Set_Invoice_Status class.
 *
 * @since $$next-version$$
 */
class Set_Invoice_Status extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/set_invoice_status';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Set Invoice Status Action', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'Action to set the invoice status', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Invoice_Data::class;
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string {
		return __( 'Invoice', 'zero-bs-crm' );
	}

	/**
	 * Update the DAL with the invoice status.
	 *
	 * @since $$next-version$$
	 * @param Data_Type $data Data passed from the trigger.
	 *
	 * @throws Data_Type_Exception Exception when the data type is not supported.
	 */
	protected function execute( Data_Type $data ) {
		/** @var Invoice $invoice */
		$invoice = $data->get_data();

		global $zbs;
		$zbs->DAL->invoices->setInvoiceStatus( $invoice->id, $this->attributes['new_status'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
