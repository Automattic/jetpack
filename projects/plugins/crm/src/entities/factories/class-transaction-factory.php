<?php
/**
 * Transaction Factory.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Transaction;

/**
 * Transaction Factory class.
 *
 * @since 6.2.0
 */
class Transaction_Factory extends Entity_Factory {

	/**
	 * Transaction DB field name mapping. db_field => model_field.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                  => 'id',
		'zbs_owner'           => 'owner',
		'zbst_status'         => 'status',
		'zbst_type'           => 'type',
		'zbst_ref'            => 'ref',
		'zbst_origin'         => 'origin',
		'zbst_parent'         => 'parent',
		'zbst_hash'           => 'hash',
		'zbst_title'          => 'title',
		'zbst_desc'           => 'desc',
		'zbst_date'           => 'date',
		'zbst_customer_ip'    => 'customer_ip',
		'zbst_currency'       => 'currency',
		'zbst_net'            => 'net',
		'zbst_fee'            => 'fee',
		'zbst_discount'       => 'discount',
		'zbst_shipping'       => 'shipping',
		'zbst_shipping_taxes' => 'shipping_taxes',
		'zbst_shipping_tax'   => 'shipping_tax',
		'zbst_taxes'          => 'taxes',
		'zbst_tax'            => 'tax',
		'zbst_total'          => 'total',
		'zbst_date_paid'      => 'date_paid',
		'zbst_date_completed' => 'date_completed',
		'zbst_created'        => 'created',
		'zbst_lastupdated'    => 'lastupdated',
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
	 * Get the transaction instance based on the $data array.
	 *
	 * @since 6.2.0
	 *
	 * @param array $data The transaction data from the DAL.
	 * @return mixed The transaction instance.
	 *
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db transaction or a generic transaction
		if ( array_key_exists( 'zbst_status', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_transaction( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid transaction data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @since 6.2.0
	 *
	 * @param array $tidy_transaction The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_transaction( array $tidy_transaction ): bool {

		if ( empty( $tidy_transaction ) ) {
			return false;
		}

		$valid_fields = array( 'type', 'ref', 'currency' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_transaction ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Transaction::class;
	}
}
