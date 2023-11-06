<?php
/**
 * Quote Factory.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Quote;

/**
 * Quote Factory class.
 *
 * @since 6.2.0
 */
class Quote_Factory extends Entity_Factory {

	/**
	 * Quote DB field name mapping. db_field => model_field.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                    => 'id',
		'zbs_owner'             => 'owner',
		'zbsq_id_override'      => 'id_override',
		'zbsq_title'            => 'title',
		'zbsq_currency'         => 'currency',
		'zbsq_value'            => 'value',
		'zbsq_date'             => 'date',
		'zbsq_template'         => 'template',
		'zbsq_content'          => 'content',
		'zbsq_notes'            => 'notes',
		'zbsq_hash'             => 'hash',
		'zbsq_send_attachments' => 'send_attachments',
		'zbsq_lastviewed'       => 'lastviewed',
		'zbsq_viewed_count'     => 'viewed_count',
		'zbsq_accepted'         => 'accepted',
		'zbsq_acceptedsigned'   => 'acceptedsigned',
		'zbsq_acceptedip'       => 'acceptedip',
		'zbsq_created'          => 'created',
		'zbsq_lastupdated'      => 'lastupdated',
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
	 * Get the quote instance based on the $data array.
	 *
	 * @since 6.2.0
	 *
	 * @param array $data The quote data from the DAL.
	 * @return mixed The quote instance.
	 *
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db quote or a generic quote
		if ( array_key_exists( 'zbsq_created', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_quote( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid quote data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @since 6.2.0
	 *
	 * @param array $tidy_quote The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_quote( array $tidy_quote ): bool {

		if ( empty( $tidy_quote ) ) {
			return false;
		}

		$valid_fields = array( 'title', 'currency', 'value' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_quote ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Quote::class;
	}
}
