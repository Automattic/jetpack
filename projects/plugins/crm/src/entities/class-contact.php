<?php
/**
 * Contact Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Contact class.
 *
 * @since 6.2.0
 */
class Contact {

	/**
	 * The DB ID of the object.
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
	public $status = '';

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
	 * The contact WordPress ID.
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
	 * The contact Linkedin.
	 *
	 * @var string
	 */
	public $li = '';

	/**
	 * The contact Facebook.
	 *
	 * @var string
	 */
	public $fb = '';

	/**
	 * The contact created timestamp.
	 *
	 * @var int|null
	 */
	public $created = null;

	/**
	 * The contact last updated timestamp.
	 *
	 * @var int|null
	 */
	public $lastupdated = null;

	/**
	 * The contact last contacted timestamp.
	 *
	 * @var int|null
	 */
	public $lastcontacted = null;

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
	 * Custom fields.
	 *
	 * @var array Custom fields.
	 */
	public $custom_fields = array();
}
