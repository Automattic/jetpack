<?php
/**
 * CRM Invoice to CRM Contact Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Invoice;

/**
 * CRM Invoice to CRM Contact Transformer class.
 *
 * @since $$next-version$$
 */
class Data_Transformer_Invoice_To_Contact extends Data_Transformer_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'invoice_to_contact';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_from(): string {
		return Data_Type_Invoice::get_slug();
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_to(): string {
		return Data_Type_Contact::get_slug();
	}

	/**
	 * Transform invoice entity to a contact.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data The invoice data type we want to transform.
	 * @return Data_Type_Base Return the Data_Type_Contact of the invoice owner.
	 *
	 * @throws Data_Transformer_Exception If the invoice is not linked to a contact.
	 */
	public function transform( Data_Type_Base $data ): Data_Type_Base {
		global $zbs;

		/* @todo We should really be using getInvoiceContact() but it's broken. */
		$contact_id = $zbs->DAL->invoices->getInvoiceContactID( $data->get_id() ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$contact    = $zbs->DAL->contacts->getContact( $contact_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( ! $contact ) {
			throw new Data_Transformer_Exception(
				'Invoice is not linked to a contact.',
				Data_Transformer_Exception::MISSING_LINK
			);
		}

		return new Data_Type_Contact( $contact );
	}

}
