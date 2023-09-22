<?php
/**
 * Contact Factory.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact Factory class.
 *
 * @since $$next-version$$
 */
class Contact_Factory {

	/**
	 * Contact DB field name mapping. db_field => model_field.
	 *
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
	 * @var array
	 */
	protected static $associative_field_map = array(
		'tags',
	);

	/**
	 * Get the contact instance based on the $data array.
	 *
	 * @param array $data The contact data from the DAL.
	 * @return Contact The contact instance.
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ): Contact {
		// Detect if this is a db contact or a generic contact
		if ( array_key_exists( 'zbsc_status', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_contact( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid contact data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Set the contact data from a generic/tidy contact array.
	 *
	 * @param array $tidy_contact Associative array of contact data.
	 */
	public static function create_from_tidy_data( array $tidy_contact ): Contact {
		$contact = new Contact();

		// Process primary fields
		foreach ( $tidy_contact as $field => $value ) {
			if ( in_array( $field, self::$field_map, true ) ) {
				$contact->{ $field } = $value;
			}
		}

		// Process associative fields
		foreach ( self::$associative_field_map as $field ) {
			if ( array_key_exists( $field, $tidy_contact ) ) {
				$contact->{ $field } = $tidy_contact[ $field ];
			}
		}

		return $contact;
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @param array $tidy_contact The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_contact( array $tidy_contact ): bool {

		if ( empty( $tidy_contact ) ) {
			return false;
		}

		$valid_fields = array( 'fname', 'lname', 'email' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_contact ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Set the contact data with including the database column prefix.
	 *
	 * @param array $db_contact Associative array of contact data from the database.
	 * @return Contact The contact instance.
	 */
	public static function create_from_db( array $db_contact ): Contact {
		$contact = new Contact();

		foreach ( $db_contact as $key => $value ) {
			if ( array_key_exists( $key, self::$field_map ) ) {
				$contact->{ self::$field_map[ $key ] } = $value;
			}
		}

		return $contact;
	}

	/**
	 * Get the contact data (tidy) as an array.
	 *
	 * @param Contact $contact The contact instance.
	 *
	 * @return array The tidy data array.
	 */
	public static function tidy_data( Contact $contact ): array {
		$contact_data = array();
		foreach ( self::$field_map as $value ) {
			$contact_data[ $value ] = $contact->{ $value };
		}
		return $contact_data;
	}

	/**
	 * Get the contact data as an array ready for the database.
	 *
	 * @param Contact $contact The contact object.
	 * @return array The contact data array.
	 */
	public static function data_for_db( Contact $contact ): array {
		$contact_data = array(
			'id'    => $contact->id,
			'owner' => $contact->owner,
			'data'  => array(),
		);

		$skip_fields = array( 'id', 'owner' );

		foreach ( self::$field_map as $model_field ) {
			if ( in_array( $model_field, $skip_fields, true ) ) {
				continue;
			}
			$contact_data['data'][ $model_field ] = $contact->{ $model_field };
		}
		return $contact_data;
	}

	/**
	 * Get the fields map.
	 *
	 * @return string[]
	 */
	public static function get_fields_map(): array {
		return self::$field_map;
	}
}
