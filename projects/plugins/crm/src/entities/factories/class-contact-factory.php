<?php
/**
 * Contact Factory.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact Factory class.
 *
 * @since 6.2.0
 */
class Contact_Factory extends Entity_Factory {

	/**
	 * Contact DB field name mapping. db_field => model_field.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                 => 'id',
		'zbs_owner'          => 'owner',
		'zbsc_status'        => 'status',
		'zbsc_email'         => 'email',
		'zbsc_prefix'        => 'prefix',
		'zbsc_fname'         => 'fname',
		'zbsc_lname'         => 'lname',
		'zbsc_addr1'         => 'addr1',
		'zbsc_addr2'         => 'addr2',
		'zbsc_city'          => 'city',
		'zbsc_county'        => 'county',
		'zbsc_postcode'      => 'postcode',
		'zbsc_country'       => 'country',
		'zbsc_secaddr1'      => 'secaddr_addr1',
		'zbsc_secaddr2'      => 'secaddr_addr2',
		'zbsc_seccity'       => 'secaddr_city',
		'zbsc_seccounty'     => 'secaddr_county',
		'zbsc_secpostcode'   => 'secaddr_postcode',
		'zbsc_seccountry'    => 'secaddr_country',
		'zbsc_hometel'       => 'hometel',
		'zbsc_worktel'       => 'worktel',
		'zbsc_mobtel'        => 'mobtel',
		'zbsc_wpid'          => 'wpid',
		'zbsc_avatar'        => 'avatar',
		'zbsc_tw'            => 'tw',
		'zbsc_li'            => 'li',
		'zbsc_fb'            => 'fb',
		'zbsc_created'       => 'created',
		'zbsc_lastupdated'   => 'lastupdated',
		'zbsc_lastcontacted' => 'lastcontacted',
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
	 * Get the contact instance based on the $data array.
	 *
	 * @since 6.2.0
	 *
	 * @param array $data The contact data from the DAL.
	 * @return mixed The contact instance.
	 *
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db contact or a generic contact
		if ( array_key_exists( 'zbsc_status', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_contact( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid contact data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @since 6.2.0
	 *
	 * @param array $tidy_contact The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_contact( array $tidy_contact ): bool {

		if ( empty( $tidy_contact ) ) {
			return false;
		}

		$valid_fields = array( 'id' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_contact ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Contact::class;
	}
}
