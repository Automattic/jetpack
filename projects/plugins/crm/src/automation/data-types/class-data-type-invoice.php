<?php
/**
 * Invoice Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Invoice Data Type
 *
 * @since $$next-version$$
 */
class Data_Type_Invoice extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'invoice';
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_invoice_data" method.
	 *
	 * @see Data_Type_Invoice::unify_data()
	 *
	 * @param mixed $entity The invoice entity data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity ) {
		$entity = $this->unify_data( $entity );

		parent::__construct( $entity );
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * Validate the invoice entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity Invoice entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		// We do not have a model/object class for invoices, so as the very
		// minimum we need to make sure we received an array since that's
		// the response the CRM DAL returns.
		if ( ! is_array( $entity ) ) {
			return false;
		}

		// We could look for even more fields, but this should ensure we have
		// received a data array that looks valid enough.
		$required_fields = array(
			'id',
			'status',
			'due_date',
			'lineitems',
		);

		foreach ( $required_fields as $field ) {
			if ( ! isset( $entity[ $field ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Unify how CRM invoice data is formatted.
	 *
	 * zbsDAL_invoices::getInvoice() formats the data when it returns results
	 * but some hooks like "invoice.update" provides a different format which
	 * means we have two different types of formats being passed around.
	 *
	 * This method attempts to unify the formatting, so we only have to work
	 * with a single version of the formatting (the most recent one).
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity The data we want to potentially prepare.
	 * @return array The unified data.
	 */
	public function unify_data( $entity ): array {
		if ( ! is_array( $entity ) ) {
			return $entity;
		}

		if ( ! isset( $entity['data'] ) ) {
			return $entity;
		}

		$new_entity       = $entity['data'];
		$new_entity['id'] = $entity['id'];

		return $new_entity;
	}

}
