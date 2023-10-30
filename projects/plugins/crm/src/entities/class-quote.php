<?php
/**
 * Quote Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Quote class.
 *
 * @since 6.2.0
 */
class Quote {

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
	 * The quote meta.
	 *
	 * @var array
	 */
	public $meta = array();

	/**
	 * The quote tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The quote files.
	 *
	 * @var array
	 */
	public $files = array();

	/**
	 * The quote notes.
	 *
	 * @var string
	 */
	public $notes = '';

	/**
	 * The ID override of the quote.
	 *
	 * @var string
	 */
	public $id_override = '';

	/**
	 * The hash of the quote.
	 *
	 * @var string
	 */
	public $hash = '';

	/**
	 * The quote title.
	 *
	 * @var string
	 */
	public $title = '';

	/**
	 * The date property of the quote.
	 *
	 * @var int
	 */
	public $date = -1;

	/**
	 * The value of the quote.
	 *
	 * @var float
	 */
	public $value = 0.0;

	/**
	 * The currency of the quote.
	 *
	 * @var string ( see zeroBS_buildObjArr in ZeroBSCRM.Dal3.Helpers - currently building curr as str)
	 */
	public $currency = '';

	/**
	 * The content property of the quote.
	 *
	 * @var string
	 */
	public $content = '';

	/**
	 * The quote template property.
	 *
	 * @var string
	 */
	public $template = '';

	/**
	 * The send attachments property of the quote.
	 *
	 * @var bool
	 */
	public $send_attachments = false;

	/**
	 * The last viewed property of the quote.
	 *
	 * @var int
	 */
	public $lastviewed = -1;

	/**
	 * The viewed count property of the quote.
	 *
	 * @var int
	 */
	public $viewed_count = 0;

	/**
	 * The accepted property of the quote.
	 *
	 * @var int
	 */
	public $accepted = -1;

	/**
	 * The acceptedsigned property of the quote.
	 *
	 * @var string
	 */
	public $acceptedsigned = '';

	/**
	 * The acceptedip property of the quote.
	 *
	 * @var string
	 */
	public $acceptedip = '';

	/**
	 * The last updated property of the quote.
	 *
	 * @var int
	 */
	public $lastupdated = -1;

	/**
	 * The created property of the quote.
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
