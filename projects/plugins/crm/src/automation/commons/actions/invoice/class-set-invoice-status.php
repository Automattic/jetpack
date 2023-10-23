<?php
/**
 * Jetpack CRM Automation Set_Invoice_Status action.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Adds the Set_Invoice_Status class.
 *
 * @since 6.2.0
 */
class Set_Invoice_Status extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/set_invoice_status';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Set Invoice Status Action', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'Action to set the invoice status', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Invoice_Data::class;
	}

	/**
	 * Get the category of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string {
		return __( 'Invoice', 'zero-bs-crm' );
	}

	/**
	 * Constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		// @todo Replace with a select field to improve the user experience and prevent
		// the user from writing a status that isn't supported.
		$this->set_attribute_definitions(
			array(
				new Attribute_Definition(
					'new_status',
					__( 'New status', 'zero-bs-crm' ),
					__( 'This is the status the invoice should be updated to.', 'zero-bs-crm' ),
					Attribute_Definition::TEXT
				),
			)
		);
	}

	/**
	 * Update the DAL with the invoice status.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) {
		if ( empty( $this->get_attribute( 'new_status' ) ) ) {
			return;
		}

		/** @var Invoice $invoice */
		$invoice = $data->get_data();

		global $zbs;
		$zbs->DAL->invoices->setInvoiceStatus( $invoice->id, $this->get_attribute( 'new_status' ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
