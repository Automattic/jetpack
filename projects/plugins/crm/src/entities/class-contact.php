<?php

/**
 * Contact Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

use ArrayAccess;

/**
 * Contact Entity class.
 *
 * @since $$next-version$$
 */
class Contact implements ArrayAccess {

	/**
	 * This is the DB ID of the object.
	 *
	 * @var int
	 */
	public $id = -1;

	/**
	 * The owner of the object.
	 *
	 * @var int
	 */
	public $owner = -1;

	/**
	 * The contact status.
	 *
	 * @var string
	 */
	public $status = 'Lead';

	/**
	 * The contact email.
	 *
	 * @var string
	 */
	public $email = '';

	/**
	 * The contact prefix.
	 *
	 * @var string
	 */
	public $prefix = '';

	/**
	 * The contact first name.
	 *
	 * @var string
	 */
	public $fname = '';

	/**
	 * The contact last name.
	 *
	 * @var string
	 */
	public $lname = '';

	/**
	 * The contact address line 1.
	 *
	 * @var string
	 */
	public $addr1 = '';

	/**
	 * The contact address line 2.
	 *
	 * @var string
	 */
	public $addr2 = '';

	/**
	 * The contact city.
	 *
	 * @var string
	 */
	public $city = '';

	/**
	 * The contact county.
	 *
	 * @var string
	 */
	public $county = '';

	/**
	 * The contact postcode.
	 *
	 * @var string
	 */
	public $postcode = '';

	/**
	 * The contact country.
	 *
	 * @var string
	 */
	public $country = '';

	/**
	 * The contact second address line 1.
	 *
	 * @var string
	 */
	public $secaddr_addr1 = '';

	/**
	 * The contact second address line 2.
	 *
	 * @var string
	 */
	public $secaddr_addr2 = '';

	/**
	 * The contact second city.
	 *
	 * @var string
	 */
	public $secaddr_city = '';

	/**
	 * The contact second county.
	 *
	 * @var string
	 */
	public $secaddr_county = '';

	/**
	 * The contact second postcode.
	 *
	 * @var string
	 */
	public $secaddr_postcode = '';

	/**
	 * The contact second country.
	 *
	 * @var string
	 */
	public $secaddr_country = '';

	/**
	 * The contact home telephone.
	 *
	 * @var string
	 */
	public $hometel = '';

	/**
	 * The contact work telephone.
	 *
	 * @var string
	 */
	public $worktel = '';

	/**
	 * The contact mobile telephone.
	 *
	 * @var string
	 */
	public $mobtel = '';

	/**
	 * The contact wordpress ID.
	 *
	 * @var int
	 */
	public $wpid = -1;

	/**
	 * The contact avatar.
	 *
	 * @var string
	 */
	public $avatar = '';

	/**
	 * The contact twitter.
	 *
	 * @var string
	 */
	public $tw = '';

	/**
	 * The contact linkedin.
	 *
	 * @var string
	 */
	public $li = '';

	/**
	 * The contact facebook.
	 *
	 * @var string
	 */
	public $fb = '';

	/**
	 * The contact created timestamp.
	 *
	 * @var int
	 */
	public $created = -1;

	/**
	 * The contact last updated timestamp.
	 *
	 * @var int
	 */
	public $lastupdated = -1;

	/**
	 * The contact last contacted timestamp.
	 *
	 * @var int
	 */
	public $lastcontacted = -1;

	/**
	 * The contact meta.
	 *
	 * @var array
	 */
	public $meta = array();

	/**
	 * The contact tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The contact companies.
	 *
	 * @var array
	 */
	public $companies = array();

	/**
	 * The contact quotes.
	 *
	 * @var array
	 */
	public $quotes = array();

	/**
	 * The contact invoices.
	 *
	 * @var array
	 */
	public $invoices = array();

	/**
	 * The contact transactions.
	 *
	 * @var array
	 */
	public $transactions = array();

	/**
	 * The contact events.
	 *
	 * @var array
	 */
	public $events = array();

	/**
	 * The contact files.
	 *
	 * @var array
	 */
	public $files = array();

	/**
	 * The contact notes.
	 *
	 * @var array
	 */
	public $notes = array();

	/**
	 * DB field name mapping. db_field => model_field.
	 *
	 * @var array
	 */
	private $field_map = array(
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

	private $custom_fields = array();

	/**
	 * Contact constructor.
	 *
	 * @param ?array $contact_data Associative array of contact data. From DB or generic.
	 */
	public function __construct( ?array $contact_data = array() ) {

		// Detect if this is a db contact or a generic contact
		if ( array_key_exists( 'zbsc_status', $contact_data ) ) {
			$this->set_db_contact_data( $contact_data );
		} else {
			$this->set_generic_contact_data( $contact_data );
		}
	}
	// Set the contact data from a generic/tidy contact array. The fields from $tidy_contact are not prefixed by zbsc_ or zbs_ so it doesn't need the mapping
	public function set_generic_contact_data( array $tidy_contact ) {
		foreach ( $tidy_contact as $key => $value ) {
			if ( in_array( $key, $this->field_map ) ) {
				$this->{ $key } = $value;
			}
		}
	}

	/**
	 * Set the contact data with including the database column prefix.
	 *
	 * @param array $db_contact Associative array of contact data from the database
	 */
	public function set_db_contact_data( array $db_contact ) {
		foreach ( $db_contact as $key => $value ) {
			if ( array_key_exists( $key, $this->field_map ) ) {
				$this->{ $this->field_map[ $key ] } = $value;
			}
		}
	}

	/**
	 * Get the contact data (tidy) as an array.
	 *
	 * @return array
	 */
	public function get_contact_array() {
		$contact_data = array();
		foreach ( $this->field_map as $value ) {
			$contact_data[ $value ] = $this->{ $value };
		}
		return $contact_data;
	}

	public function get_contact_array_for_db() {
		$contact_data = array(
			'id'    => $this->id,
			'owner' => $this->owner,
			'data'  => array(),
		);

		$skip_fields = array( 'id', 'owner' );

		foreach ( $this->field_map as $db_field => $model_field ) {
			if ( in_array( $model_field, $skip_fields ) ) {
				continue;
			}
			$contact_data['data'][ $model_field ] = $this->{ $model_field };
		}
		return $contact_data;
	}

	public function get_custom_fields(): array {
		return $this->custom_fields;
	}

	public function set_custom_fields( $custom_fields ) {
		$this->custom_fields = $custom_fields;
	}

	public function offsetExists( $offset ): bool {
		return in_array( $offset, $this->field_map );
	}

	public function offsetGet( $offset ): mixed {
		return in_array( $offset, $this->field_map ) ? $this->{ $offset } : null;
	}

	public function offsetSet( $offset, $value ): void {
		if ( in_array( $offset, $this->field_map ) ) {
			$this->{ $offset } = $value;
		}
	}

	public function offsetUnset( $offset ): void {
		if ( in_array( $offset, $this->field_map ) ) {
			$this->{ $offset } = null;
		}
	}
}
