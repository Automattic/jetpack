<?php
/**
 * Invoice Factory.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Invoice Factory class.
 *
 * @since 6.2.0
 */
class Invoice_Factory extends Entity_Factory {

	/**
	 * Invoice DB field name mapping. db_field => model_field.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                       => 'id',
		'zbs_owner'                => 'owner',
		'zbsi_status'              => 'status',
		'zbsi_id_override'         => 'id_override',
		'zbsi_parent'              => 'parent',
		'zbsi_hash'                => 'hash',
		'zbsi_send_attachments'    => 'send_attachments',
		'zbsi_pdf_template'        => 'pdf_template',
		'zbsi_portal_template'     => 'portal_template',
		'zbsi_email_template'      => 'email_template',
		'zbsi_invoice_frequency'   => 'invoice_frequency',
		'zbsi_currency'            => 'currency',
		'zbsi_pay_via'             => 'pay_via',
		'zbsi_logo_url'            => 'logo_url',
		'zbsi_address_to_objtype'  => 'address_to_objtype',
		'zbsi_addressed_from'      => 'addressed_from',
		'zbsi_addressed_to'        => 'addressed_to',
		'zbsi_allow_partial'       => 'allow_partial',
		'zbsi_allow_tip'           => 'allow_tip',
		'zbsi_hours_or_quantity'   => 'hours_or_quantity',
		'zbsi_date'                => 'date',
		'zbsi_due_date'            => 'due_date',
		'zbsi_paid_date'           => 'paid_date',
		'zbsi_hash_viewed'         => 'hash_viewed',
		'zbsi_hash_viewed_count'   => 'hash_viewed_count',
		'zbsi_portal_viewed'       => 'portal_viewed',
		'zbsi_portal_viewed_count' => 'portal_viewed_count',
		'zbsi_net'                 => 'net',
		'zbsi_discount'            => 'discount',
		'zbsi_discount_type'       => 'discount_type',
		'zbsi_shipping'            => 'shipping',
		'zbsi_shipping_taxes'      => 'shipping_taxes',
		'zbsi_shipping_tax'        => 'shipping_tax',
		'zbsi_taxes'               => 'taxes',
		'zbsi_tax'                 => 'tax',
		'zbsi_total'               => 'total',
		'zbsi_created'             => 'created',
		'zbsi_lastupdated'         => 'lastupdated',
	);

	/**
	 * Associative field map.
	 *
	 * For tags, invoices, transactions, quotes, tasks...
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $associative_field_map = array(
		'tags',
	);

	/**
	 * Get the invoice instance based on the $data array.
	 *
	 * @since 6.2.0
	 *
	 * @param array $data The invoice data from the DAL.
	 * @return mixed The invoice instance.
	 *
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db invoice or a generic invoice
		if ( array_key_exists( 'zbsi_status', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_invoice( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid invoice data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @since 6.2.0
	 *
	 * @param array $tidy_invoice The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_invoice( array $tidy_invoice ): bool {

		if ( empty( $tidy_invoice ) ) {
			return false;
		}

		$valid_fields = array( 'parent', 'hash', 'id_override' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_invoice ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Invoice::class;
	}
}
