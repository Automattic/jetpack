<?php
/**
 * Invoice Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Invoice class.
 *
 * @since $$next-version$$
 */
class Invoice {

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
	 * The invoice meta.
	 *
	 * @var array
	 */
	public $meta = array();

	/**
	 * The invoice tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The invoice files.
	 *
	 * @var array
	 */
	public $files = array();

	/**
	 * The invoice status.
	 *
	 * @var string
	 */
	public $status = 'Draft';

	/**
	 * The ID override of the object
	 *
	 * @var string
	 */
	public $id_override = '';

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
	 * The pdf template of the object
	 *
	 * @var string
	 */
	public $pdf_template = '';

	/**
	 * The portal template of the object
	 *
	 * @var string
	 */
	public $portal_template = '';

	/**
	 * The email template of the object
	 *
	 * @var string
	 */
	public $email_template = '';

	/**
	 * The invoice frequency of the object
	 *
	 * @var int
	 */
	public $invoice_frequency = -1;

	/**
	 * The currency of the object
	 *
	 * @var string ( see zeroBS_buildObjArr in ZeroBSCRM.Dal3.Helpers - currently building curr as str)
	 */
	public $currency = '';

	/**
	 * The pay via property of the object
	 *
	 * @var int
	 */
	public $pay_via = -1;

	/**
	 * The logo url of the object
	 *
	 * @var string
	 */
	public $logo_url = '';

	/**
	 * The address to objtype property of the object
	 *
	 * @var int
	 */
	public $address_to_objtype = -1;

	/**
	 * The addressed from property of the object
	 *
	 * @var string
	 */
	public $addressed_from = '';

	/**
	 * The addressed to property of the object
	 *
	 * @var string
	 */
	public $addressed_to = '';

	/**
	 * The allow partial property of the object
	 *
	 * @var bool
	 */
	public $allow_partial = false;

	/**
	 * The allow tip property of the object
	 *
	 * @var bool
	 */
	public $allow_tip = false;

	/**
	 * The send attachments property of the object
	 *
	 * @var bool
	 */
	public $send_attachments = false;

	/**
	 * The hours or quantity property of the object
	 *
	 * @var bool
	 */
	public $hours_or_quantity = true;

	/**
	 * The date property of the object
	 *
	 * @var int
	 */
	public $date = -1;

	/**
	 * The due date property of the object
	 *
	 * @var int
	 */
	public $due_date = -1;

	/**
	 * The paid date property of the object
	 *
	 * @var int
	 */
	public $paid_date = -1;

	/**
	 * The hash viewed property of the object
	 *
	 * @var int
	 */
	public $hash_viewed = -1;

	/**
	 * The hash viewed count property of the object
	 *
	 * @var int
	 */
	public $hash_viewed_count = 0;

	/**
	 * The portal viewed property of the object
	 *
	 * @var int
	 */
	public $portal_viewed = -1;

	/**
	 * The portal viewed count property of the object
	 *
	 * @var int
	 */
	public $portal_viewed_count = 0;

	/**
	 * The net property of the object
	 *
	 * @var float
	 */
	public $net = 0.0;

	/**
	 * The discount property of the object
	 *
	 * @var float
	 */
	public $discount = 0.0;

	/**
	 * The discount type property of the object
	 *
	 * @var string
	 */
	public $discount_type = '';

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
