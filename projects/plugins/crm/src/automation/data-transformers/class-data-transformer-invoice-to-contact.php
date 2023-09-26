<?php
/**
 * CRM Invoice to CRM Contact Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;

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
		return Invoice_Data::class;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_to(): string {
		return Contact_Data::class;
	}

	/**
	 * Transform invoice entity to a contact.
	 *
	 * @param Data_Type $data The invoice data type we want to transform.
	 * @return Data_Type Return the Data_Type_Contact of the invoice owner.
	 *
	 * @throws Data_Transformer_Exception If the invoice is not linked to a contact.
	 * @throws Data_Type_Exception If the Data_Type is not valid.
	 * @throws \Exception If the contact data is not valid.
	 * 
     * @since $$next-version$$
	 */
	public function transform( Data_Type $data ): Data_Type {
		
		$this->validate_from_type( $data );

		global $zbs;

		/* @todo We should really be using getInvoiceContact() but it's broken. */
		$contact_id = $zbs->DAL->invoices->getInvoiceContactID( $data->get_id() ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$contact_data    = $zbs->DAL->contacts->getContact( $contact_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( ! $contact_data ) {
			throw new Data_Transformer_Exception(
				'Invoice is not linked to a contact.',
				Data_Transformer_Exception::MISSING_LINK
			);
		}
		
		$contact = Contact_Factory::create( $contact_data );

		return ( new Contact_Data( $contact ) );
	}
}
