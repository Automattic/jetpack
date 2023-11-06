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
 * @since 6.2.0
 */
class Invoice {

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
	public $status = '';

	/**
	 * The ID override of the invoice.
	 *
	 * @var string
	 */
	public $id_override = '';

	/**
	 * The parent of the invoice.
	 *
	 * @var int
	 */
	public $parent = -1;

	/**
	 * The hash of the invoice.
	 *
	 * @var string
	 */
	public $hash = '';

	/**
	 * The pdf template for the invoice.
	 *
	 * @var string
	 */
	public $pdf_template = '';

	/**
	 * The portal template for the invoice.
	 *
	 * @var string
	 */
	public $portal_template = '';

	/**
	 * The email template for the invoice.
	 *
	 * @var string
	 */
	public $email_template = '';

	/**
	 * The invoice frequency.
	 *
	 * @var int
	 */
	public $invoice_frequency = -1;

	/**
	 * The currency of the invoice.
	 *
	 * @var string ( see zeroBS_buildObjArr in ZeroBSCRM.Dal3.Helpers - currently building curr as str)
	 */
	public $currency = '';

	/**
	 * The pay via property of the invoice.
	 *
	 * @var int
	 */
	public $pay_via = -1;

	/**
	 * The logo url of the invoice.
	 *
	 * @var string
	 */
	public $logo_url = '';

	/**
	 * The address to objtype property of the invoice.
	 *
	 * @var int
	 */
	public $address_to_objtype = -1;

	/**
	 * Who the invoice should be addressed from.
	 *
	 * @var string
	 */
	public $addressed_from = '';

	/**
	 * Who the invoice should be addressed to.
	 *
	 * @var string
	 */
	public $addressed_to = '';

	/**
	 * Whether partial payments are allowed.
	 *
	 * @var bool
	 */
	public $allow_partial = false;

	/**
	 * Whether a tip can be added to the invoice.
	 *
	 * @var bool
	 */
	public $allow_tip = false;

	/**
	 * Whether attachments can be sent with the invoice.
	 *
	 * @var bool
	 */
	public $send_attachments = false;

	/**
	 * Whether the invoice is measured in hours or quantity.
	 *
	 * @var bool
	 */
	public $hours_or_quantity = true;

	/**
	 * The invoice date.
	 *
	 * @var int
	 */
	public $date = -1;

	/**
	 * The due date of the invoice.
	 *
	 * @var int
	 */
	public $due_date = -1;

	/**
	 * The paid date of the invoice.
	 *
	 * @var int
	 */
	public $paid_date = -1;

	/**
	 * The hash viewed property of the invoice.
	 *
	 * @var int
	 */
	public $hash_viewed = -1;

	/**
	 * The hash viewed count property of the invoice.
	 *
	 * @var int
	 */
	public $hash_viewed_count = 0;

	/**
	 * The portal viewed property of the invoice.
	 *
	 * @var int
	 */
	public $portal_viewed = -1;

	/**
	 * The number of times the invoice has been viewed in the portal.
	 *
	 * @var int
	 */
	public $portal_viewed_count = 0;

	/**
	 * The net amount of the invoice.
	 *
	 * @var float
	 */
	public $net = 0.0;

	/**
	 * The discount amount of the invoice.
	 *
	 * @var float
	 */
	public $discount = 0.0;

	/**
	 * The discount type of the invoice.
	 *
	 * @var string
	 */
	public $discount_type = '';

	/**
	 * The shipping amount of the invoice.
	 *
	 * @var float
	 */
	public $shipping = 0.0;

	/**
	 * The shipping taxes property of the invoice.
	 *
	 * @var string
	 */
	public $shipping_taxes = '';

	/**
	 * The shipping tax amount of the invoice.
	 *
	 * @var float
	 */
	public $shipping_tax = 0.0;

	/**
	 * The taxes property of the invoice.
	 *
	 * @var string
	 */
	public $taxes = '';

	/**
	 * The invoice tax amount.
	 *
	 * @var float
	 */
	public $tax = 0.0;

	/**
	 * The invoice total.
	 *
	 * @var float
	 */
	public $total = 0.0;

	/**
	 * The invoice last updated timestamp.
	 *
	 * @var int
	 */
	public $lastupdated = -1;

	/**
	 * The invoice created timestamp.
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
