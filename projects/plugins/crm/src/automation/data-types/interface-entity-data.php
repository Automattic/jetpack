<?php
/**
 * Entity Data Interface.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Entity Data Interface.
 *
 * This interface is to be able to identify the JPCRM entities Data_Type classes.
 *
 * @since 6.2.0
 */
interface Entity_Data {
	/**
	 * Get the tags from the entity instance.
	 *
	 * @since 6.2.0
	 *
	 * @return array The tags from the entity instance as an array.
	 */
	public function get_tags(): array;
}
