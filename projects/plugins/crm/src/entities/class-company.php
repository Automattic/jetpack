<?php
/**
 * Company Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Company class.
 *
 * @since 6.2.0
 */
class Company {

	/**
	 * The DB ID of the object.
	 *
	 * @var int
	 */
	public $id = -1;

	/**
	 * The owner of the object
	 *
	 * @var int
	 */
	public $owner = -1;

	/**
	 * The company meta.
	 *
	 * @var array
	 */
	public $meta = array();

	/**
	 * The company tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The company files.
	 *
	 * @var array
	 */
	public $files = array();

	/**
	 * The company tasks.
	 *
	 * @var array
	 */
	public $tasks = array();

	/**
	 * The company status.
	 *
	 * @var string
	 */
	public $status = '';

	/**
	 * The company email.
	 *
	 * @var string
	 */
	public $email = '';

	/**
	 * The company name.
	 *
	 * @var string
	 */
	public $name = '';

	/**
	 * The company address line 1.
	 *
	 * @var string
	 */
	public $addr1 = '';

	/**
	 * The company address line 2.
	 *
	 * @var string
	 */
	public $addr2 = '';

	/**
	 * The company city.
	 *
	 * @var string
	 */
	public $city = '';

	/**
	 * The company county.
	 *
	 * @var string
	 */
	public $county = '';

	/**
	 * The company postcode.
	 *
	 * @var string
	 */
	public $postcode = '';

	/**
	 * The company country.
	 *
	 * @var string
	 */
	public $country = '';

	/**
	 * The company second address line 1.
	 *
	 * @var string
	 */
	public $secaddr_addr1 = '';

	/**
	 * The company second address line 2.
	 *
	 * @var string
	 */
	public $secaddr_addr2 = '';

	/**
	 * The company second city.
	 *
	 * @var string
	 */
	public $secaddr_city = '';

	/**
	 * The company second county.
	 *
	 * @var string
	 */
	public $secaddr_county = '';

	/**
	 * The company second postcode.
	 *
	 * @var string
	 */
	public $secaddr_postcode = '';

	/**
	 * The company second country.
	 *
	 * @var string
	 */
	public $secaddr_country = '';

	/**
	 * The company main telephone.
	 *
	 * @var string
	 */
	public $maintel = '';

	/**
	 * The company secondary telephone.
	 *
	 * @var string
	 */
	public $sectel = '';

	/**
	 * The company WordPress ID.
	 *
	 * @var int
	 */
	public $wpid = -1;

	/**
	 * The company avatar.
	 *
	 * @var string
	 */
	public $avatar = '';

	/**
	 * The company twitter.
	 *
	 * @var string
	 */
	public $tw = '';

	/**
	 * The company linkedin.
	 *
	 * @var string
	 */
	public $li = '';

	/**
	 * The company facebook.
	 *
	 * @var string
	 */
	public $fb = '';

	/**
	 * The company created timestamp.
	 *
	 * @var int
	 */
	public $created = -1;

	/**
	 * The company last updated timestamp.
	 *
	 * @var int
	 */
	public $lastupdated = -1;

	/**
	 * The company last contacted timestamp.
	 *
	 * @var int
	 */
	public $lastcontacted = -1;

	/**
	 * Custom fields.
	 *
	 * @var array Custom fields.
	 */
	private $custom_fields = array();
}
