<?php
/**
 * Tag Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Tag class.
 */
class Tag {
	/**
	 * The ID of the tag as found in the database.
	 *
	 * @var int
	 */
	public $id = -1;

	/**
	 * The object type of the tag.
	 *
	 * @var int
	 */
	public $obj_type_id = -1;

	/**
	 * The user-friendly label of the tag.
	 *
	 * @var string
	 */
	public $label = '';

	/**
	 * The tag slug.
	 *
	 * @var string
	 */
	public $slug = '';
}
