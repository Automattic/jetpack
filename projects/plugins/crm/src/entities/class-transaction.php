<?php
/**
 * Transaction Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Transaction class.
 *
 * @since $$next-version$$
 */
class Transaction {

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
	 * The transaction meta.
	 *
	 * @var array
	 */
	public $meta = array();

	/**
	 * The tranaction tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The transaction status (eg. Succeeded, Completed, Failed).
	 *
	 * @var string
	 */
	public $status = 'Succeeded';

	/**
	 * The type (eg. Sale, Refund) of the object
	 *
	 * @var string
	 */
	public $type = 'Sale';

	/**
	 * The ref (transaction ID) of the object
	 *
	 * @var string
	 */
	public $ref = '';

	/**
	 * The origin of the object
	 *
	 * @var string
	 */
	public $origin = '';

	/**
	 * The parent of the object.
	 *
	 * @var int
	 */
	public $parent = -1;

	/**
	 * The hash of the object
	 *
	 * @var string
	 */
	public $hash = '';

	/**
	 * The transaction title
	 *
	 * @var string
	 */
	public $title = '';

	/**
	 * The description of the transaction
	 *
	 * @var string
	 */
	public $desc = '';

	/**
	 * The date property of the object
	 *
	 * @var int
	 */
	public $date = -1;

	/**
	 * The customer ip of the object
	 *
	 * @var string
	 */
	public $customer_ip = '';

	/**
	 * The currency of the object
	 *
	 * @var string ( see zeroBS_buildObjArr in ZeroBSCRM.Dal3.Helpers - currently building curr as str)
	 */
	public $currency = '';

	/**
	 * The net value of the object
	 *
	 * @var float
	 */
	public $net = 0.0;

	/**
	 * The fee property of the object
	 *
	 * @var float
	 */
	public $fee = 0.0;

	/**
	 * The discount property of the object
	 *
	 * @var float
	 */
	public $discount = 0.0;

	/**
	 * The shipping property of the object
	 *
	 * @var float
	 */
	public $shipping = 0.0;

	/**
	 * The shipping taxes property of the object
	 *
	 * @var string
	 */
	public $shipping_taxes = '';

	/**
	 * The shipping tax property of the object
	 *
	 * @var float
	 */
	public $shipping_tax = 0.0;

	/**
	 * The taxes property of the object
	 *
	 * @var string
	 */
	public $taxes = '';

	/**
	 * The tax property of the object
	 *
	 * @var float
	 */
	public $tax = 0.0;

	/**
	 * The total property of the object
	 *
	 * @var float
	 */
	public $total = 0.0;

	/**
	 * The date paid property of the object
	 *
	 * @var int
	 */
	public $date_paid = -1;

	/**
	 * The date completed property of the object
	 *
	 * @var int
	 */
	public $date_completed = -1;

	/**
	 * The last updated property of the object
	 *
	 * @var int
	 */
	public $lastupdated = -1;

	/**
	 * The created property of the object
	 *
	 * @var int
	 */
	public $created = -1;

	/**
	 * Custom fields.
	 *
	 * @var array Custom fields.
	 */
	private $custom_fields = array();
}
